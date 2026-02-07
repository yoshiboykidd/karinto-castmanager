'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format, parseISO, startOfToday, isAfter } from 'date-fns';

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
    setLoading(true); // ★リロード中であることを明示
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      const loginId = session.user.email?.replace('@karinto-internal.com', '');
      
      // ★修正: キャッシュ回避のために、あえて .maybeSingle() に変えたり、
      // ニュース取得の .limit(3) を変えたりはできませんが、
      // App Routerの仕様上、クライアントサイドでの fetch は基本キャッシュされません。
      // 問題は「状態(state)が更新されていない」ことかもしれません。
      
      const { data: profile } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
      
      if (profile) {
        const myShopId = profile.home_shop_id || 'main';
        
        const [shopRes, shiftsRes, newsRes, syncRes] = await Promise.all([
          supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
          // ★修正: データ取得時に .order() を確実に指定
          supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
          supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
          
          // id=1 のデータ（全体の最終更新時間）を取得
          supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
        ]);
        
        setData({
          shifts: shiftsRes.data || [], 
          profile, 
          shop: shopRes.data || null, 
          news: newsRes.data || [],
          // 時間のフォーマット処理 (ここも日付オブジェクトとして保持するほうがHeaderで使いやすい)
          syncAt: (syncRes.data && syncRes.data.last_sync_at) 
            ? syncRes.data.last_sync_at // ★修正: string変換せず、ISO文字列のまま渡す（Header側でパースさせる）
            : ''
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]); // ★依存配列にsupabaseを追加

  // --- 集計ロジックは変更なし ---
  const getMonthlyTotals = useCallback((viewDate: Date) => {
    if (!mounted || !viewDate || !data.shifts) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    
    const today = startOfToday();
    
    const filtered = (data.shifts || [])
      .filter((s: any) => {
        if (!s.shift_date) return false;
        const d = parseISO(s.shift_date);
        
        // ★念のため日付オブジェクト変換の安全性を確保
        if (isNaN(d.getTime())) return false;

        const isPastOrToday = !isAfter(d, today);
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        
        return (
          d.getMonth() === viewDate.getMonth() && 
          d.getFullYear() === viewDate.getFullYear() && 
          isPastOrToday && 
          isOfficialInfo
        );
      });

      // reduce処理...
      return filtered.reduce((acc: any, s: any) => {
        let dur = 0;
        // 時間計算ロジック
        if (s.start_time && s.end_time && s.start_time.includes(':') && s.start_time !== 'OFF') {
          try {
            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            if (!isNaN(sH) && !isNaN(eH)) {
              // 24時超え計算 (eH < sH なら翌日とみなす)
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
          count: acc.count + 1, // ★単純な件数カウント
          hours: acc.hours + dur 
        };
      }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [mounted, data.shifts]);

  return { data, loading, fetchInitialData, getMonthlyTotals, supabase };
}