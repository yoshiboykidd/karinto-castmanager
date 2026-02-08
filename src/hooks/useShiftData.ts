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
    setLoading(true); // リロード開始
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      // メールアドレスからID部分を抽出 (例: "00600037")
      const rawId = session.user.email?.replace('@karinto-internal.com', '');
      
      // ★修正ポイント: IDの「0あり」と「0なし」の両方を用意する
      // DBに "00600037" で入っている場合と "600037" で入っている場合の両方をカバーします
      const idList = [rawId];
      if (rawId && !isNaN(Number(rawId))) {
        idList.push(String(Number(rawId))); // "600037" を追加
      }
      // 重複を削除 (元々0がないIDなら1つになる)
      const uniqueIds = Array.from(new Set(idList));

      console.log(`🔍 検索ID候補: ${uniqueIds.join(', ')}`);

      // プロフィール取得（ID候補のどれかにヒットすればOK）
      const { data: profile } = await supabase
        .from('cast_members')
        .select('*')
        .in('login_id', uniqueIds) // .eq ではなく .in を使う
        .maybeSingle(); // 複数ヒットしても1つだけ取得

      if (profile) {
        console.log("✅ プロフィール発見:", profile.hp_display_name);
        const myShopId = profile.home_shop_id || 'main';
        
        const [shopRes, shiftsRes, newsRes, syncRes] = await Promise.all([
          supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
          
          // ★修正ポイント: シフトも「0あり」「0なし」両方で検索して合算する
          supabase.from('shifts')
            .select('*')
            .in('login_id', uniqueIds) // .eq ではなく .in を使う
            .order('shift_date', { ascending: true }),

          supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
          
          supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
        ]);
        
        console.log(`📊 シフト取得成功: ${shiftsRes.data?.length}件`);

        setData({
          shifts: shiftsRes.data || [], 
          profile, 
          shop: shopRes.data || null, 
          news: newsRes.data || [],
          syncAt: (syncRes.data && syncRes.data.last_sync_at) 
            ? syncRes.data.last_sync_at // 文字列のまま渡す（Header側で整形）
            : ''
        });
      } else {
        console.warn("⚠️ プロフィールが見つかりません");
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // --- 集計ロジック (日付チェックを厳密化) ---
  const getMonthlyTotals = useCallback((viewDate: Date) => {
    if (!mounted || !viewDate || !data.shifts) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    
    const today = startOfToday();
    
    return (data.shifts || [])
      .filter((s: any) => {
        if (!s.shift_date) return false;
        const d = parseISO(s.shift_date);
        if (!isValid(d)) return false; // 日付が無効ならスキップ

        const isPastOrToday = !isAfter(d, today);
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        
        return (
          d.getMonth() === viewDate.getMonth() && 
          d.getFullYear() === viewDate.getFullYear() && 
          isPastOrToday && 
          isOfficialInfo
        );
      })
      .reduce((acc: any, s: any) => {
        let dur = 0;
        if (s.start_time && s.end_time && s.start_time.includes(':') && s.start_time !== 'OFF') {
          try {
            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            if (!isNaN(sH) && !isNaN(eH)) {
              const endH = eH < sH ? eH + 24 : eH;
              dur = endH + (eM || 0) / 60 - (sH + (sM || 0) / 60);
            }
          } catch (e) {
            dur = 0;
          }
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