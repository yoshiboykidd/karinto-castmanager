'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format, parseISO, startOfToday, isAfter, isValid } from 'date-fns';

export function useShiftData() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [data, setData] = useState<{
    shifts: any[], 
    profile: any, 
    shop: any, 
    news: any[], 
    reservations: any[], // 📍 追加
    syncAt: string
  }>({
    shifts: [], profile: null, shop: null, news: [], reservations: [], syncAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchInitialData = useCallback(async (router: any) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      const rawId = session.user.email?.replace('@karinto-internal.com', '');
      const idList = [rawId];
      if (rawId && !isNaN(Number(rawId))) {
        idList.push(String(Number(rawId)));
      }
      const uniqueIds = Array.from(new Set(idList));

      const { data: profileList } = await supabase
        .from('cast_members')
        .select('*')
        .in('login_id', uniqueIds)
        .limit(1);

      const profile = profileList?.[0];

      if (profile) {
        const myShopId = profile.home_shop_id || 'main';
        
        const [shopRes, shiftsRes, newsRes, resData, syncRes] = await Promise.all([
          supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
          supabase.from('shifts')
            .select('*')
            .in('login_id', uniqueIds)
            .order('shift_date', { ascending: true }),
          supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
          // 📍 予約データを「受信が新しい順」に取得
          supabase.from('reservations')
            .select('*')
            .in('login_id', uniqueIds)
            .order('created_at', { ascending: false }),
          supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
        ]);
        
        // 📍 名寄せ（重複排除）ロジック
        // メールの「日付・名前・開始時間」が一致するものは、最新（配列の先頭）のみを採用
        const cleanReservations = (resData.data || []).reduce((acc: any[], current: any) => {
          const key = current.external_res_id || `${current.reservation_date}_${current.customer_name}_${current.start_time}`;
          const isExist = acc.find(item => 
            (item.external_res_id || `${item.reservation_date}_${item.customer_name}_${item.start_time}`) === key
          );

          if (!isExist) {
            acc.push(current);
          }
          return acc;
        }, []);

        setData({
          shifts: shiftsRes.data || [], 
          profile, 
          shop: shopRes.data || null, 
          news: newsRes.data || [],
          reservations: cleanReservations, // 📍 整理したデータをセット
          syncAt: (syncRes.data && syncRes.data.last_sync_at) ? syncRes.data.last_sync_at : ''
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 集計ロジック
  const getMonthlyTotals = useCallback((viewDate: Date) => {
    if (!mounted || !viewDate || !data.shifts) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    const today = startOfToday();
    return (data.shifts || [])
      .filter((s: any) => {
        if (!s.shift_date) return false;
        const d = parseISO(s.shift_date);
        if (!isValid(d)) return false;
        const isPastOrToday = !isAfter(d, today);
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        return (d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear() && isPastOrToday && isOfficialInfo);
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