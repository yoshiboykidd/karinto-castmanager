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

  const fetchInitialData = async (router: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      const loginId = session.user.email?.replace('@karinto-internal.com', '');
      
      const { data: profile } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
      
      if (profile) {
        const myShopId = profile.home_shop_id || 'main'; // ここで店舗IDを特定
        
        // Promise.all 内の各クエリ
        const [shopRes, shiftsRes, newsRes, syncRes] = await Promise.all([
          supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
          supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
          supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
          
          // ★修正箇所はここだけ！ id:1 固定をやめて、myShopId で検索するように変更
          supabase.from('sync_logs').select('last_sync_at').eq('shop_id', myShopId).single()
        ]);
        
        setData({
          shifts: shiftsRes.data || [], 
          profile, 
          shop: shopRes.data || null, 
          news: newsRes.data || [],
          // syncRes.data が null の場合のガード
          syncAt: (syncRes.data && syncRes.data.last_sync_at) 
            ? format(parseISO(syncRes.data.last_sync_at), 'HH:mm') 
            : '--:--'
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 月間集計ロジック（完全に元のコードに戻しました）
   */
  const getMonthlyTotals = useCallback((viewDate: Date) => {
    if (!mounted || !viewDate) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    
    const today = startOfToday();
    
    return (data.shifts || [])
      .filter((s: any) => {
        if (!s.shift_date) return false;
        const d = parseISO(s.shift_date);
        const isPastOrToday = !isAfter(d, today);
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        
        return (
          d.getMonth() === viewDate.getMonth() && 
          d.getFullYear() === viewDate.getFullYear() && 
          isPastOrToday && 
          isOfficialInfo
        );
      })
      .reduce((acc, s: any) => {
        let dur = 0;
        if (s.start_time && s.end_time && s.start_time.includes(':') && s.start_time !== 'OFF') {
          try {
            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            if (!isNaN(sH) && !isNaN(eH)) {
              dur = (eH < sH ? eH + 24 : eH) + (eM || 0) / 60 - (sH + (sM || 0) / 60);
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