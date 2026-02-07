'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format, parseISO, startOfToday, isAfter, isValid } from 'date-fns';

export function useShiftData() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [data, setData] = useState<{shifts: any[], profile: any, shop: any, news: any[], syncAt: string}>({
    shifts: [], profile: null, shop: null, news: [], syncAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchInitialData = useCallback(async (router: any) => {
    setLoading(true);
    try {
      // 1. セッション取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      // 2. IDの抽出と「数値化」 (★重要: DBが数値型の場合、文字だとヒットしません)
      const rawId = session.user.email?.replace('@karinto-internal.com', '');
      const loginId = Number(rawId); 

      console.log(`🔍 検索開始: ID=${loginId} (元=${rawId})`);

      // 3. プロフィール取得
      const { data: profile, error: profileError } = await supabase
        .from('cast_members')
        .select('*')
        .eq('login_id', loginId)
        .single();
      
      if (profileError) {
        console.error("❌ プロフィール取得失敗 (RLSかID違い):", profileError);
      }

      if (profile) {
        console.log("✅ プロフィール発見:", profile.hp_display_name);
        const myShopId = profile.home_shop_id || 'main';
        
        // 4. 一括取得
        const [shopRes, shiftsRes, newsRes, syncRes] = await Promise.all([
          supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
          
          // ★シフト取得: 数値化したIDで検索
          supabase.from('shifts')
            .select('*')
            .eq('login_id', loginId)
            .order('shift_date', { ascending: true }),

          supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
          
          // 最終更新時間 (id=1)
          supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
        ]);
        
        // ★デバッグログ: ここで何件取れたか確認してください
        console.log(`📊 シフト取得数: ${shiftsRes.data?.length}件`);
        if (shiftsRes.error) console.error("❌ シフト取得エラー:", shiftsRes.error);

        setData({
          shifts: shiftsRes.data || [], 
          profile, 
          shop: shopRes.data || null, 
          news: newsRes.data || [],
          // 時間はそのまま渡してHeader側で整形させる
          syncAt: (syncRes.data && syncRes.data.last_sync_at) ? syncRes.data.last_sync_at : ''
        });
      } else {
        console.warn("⚠️ プロフィールが見つからないため、シフト取得をスキップしました");
      }

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]); 

  // --- 集計ロジック ---
  const getMonthlyTotals = useCallback((viewDate: Date) => {
    if (!mounted || !viewDate || !data.shifts) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    
    const today = startOfToday();
    
    // フィルタリング
    const filtered = (data.shifts || [])
      .filter((s: any) => {
        if (!s.shift_date) return false;
        const d = parseISO(s.shift_date);
        if (!isValid(d)) return false;

        const isPastOrToday = !isAfter(d, today);
        // ★official または 申請中でも「既存確定(is_official_pre_exist)」なら計算対象
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        
        return (
          d.getMonth() === viewDate.getMonth() && 
          d.getFullYear() === viewDate.getFullYear() && 
          isPastOrToday && 
          isOfficialInfo
        );
      });

      // 集計
      return filtered.reduce((acc: any, s: any) => {
        let dur = 0;
        if (s.start_time && s.end_time && s.start_time.includes(':') && s.start_time !== 'OFF') {
          try {
            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            if (!isNaN(sH) && !isNaN(eH)) {
              const endH = eH < sH ? eH + 24 : eH;
              dur = endH + (eM || 0) / 60 - (sH + (sM || 0) / 60);
            }
          } catch (e) { dur = 0; }
        }

        return { 
          amount: acc.amount + (Number(s.reward_amount) || 0), 
          f: acc.f + (Number(s.f_count) || 0), 
          first: acc.first + (Number(s.first_request_count) || 0), 
          main: acc.main + (Number(s.main_request_count) || 0), 
          count: acc.count + 1, 
          hours: acc.hours + dur 
        };
      }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [mounted, data.shifts]);

  return { data, loading, fetchInitialData, getMonthlyTotals, supabase };
}