'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format, parseISO, startOfToday, isAfter, isValid, startOfMonth, endOfMonth } from 'date-fns';

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
    reservations: any[],
    achievements: any[], // 📍 新設した集計テーブル用
    syncAt: string
  }>({
    shifts: [], profile: null, shop: null, news: [], reservations: [], achievements: [], syncAt: ''
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
        
        const [shopRes, shiftsRes, newsRes, resData, achiRes, syncRes] = await Promise.all([
          supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
          supabase.from('shifts')
            .select('*')
            .in('login_id', uniqueIds)
            .order('shift_date', { ascending: true }),
          supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
          supabase.from('reservations')
            .select('*')
            .in('login_id', uniqueIds)
            .order('created_at', { ascending: false }),
          // 📍 集計専用テーブルから全データを取得（UUIDを使用）
          supabase.from('daily_achievements')
            .select('*')
            .eq('cast_id', profile.id),
          supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
        ]);
        
        const cleanReservations = (resData.data || []).reduce((acc: any[], current: any) => {
          const key = current.external_res_id || `${current.reservation_date}_${current.customer_name}_${current.start_time}`;
          const isExist = acc.find(item => 
            (item.external_res_id || `${item.reservation_date}_${item.customer_name}_${item.start_time}`) === key
          );
          if (!isExist) acc.push(current);
          return acc;
        }, []);

        setData({
          shifts: shiftsRes.data || [], 
          profile, 
          shop: shopRes.data || null, 
          news: newsRes.data || [],
          reservations: cleanReservations,
          achievements: achiRes.data || [], // 📍 取得データをセット
          syncAt: (syncRes.data && syncRes.data.last_sync_at) ? syncRes.data.last_sync_at : ''
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 📍 修正後の月間集計ロジック
  const getMonthlyTotals = useCallback((viewDate: Date) => {
    if (!mounted || !viewDate || !data.shifts) return { amount: 0, count: 0, hours: 0, absent: 0, late: 0, ka_f: 0, ka_first: 0, ka_main: 0, soe_f: 0, soe_first: 0, soe_main: 0 };
    
    const today = startOfToday();
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    // 1. シフトテーブルから「出勤日数・金額・当欠・遅刻」を集計
    const shiftStats = (data.shifts || []).reduce((acc: any, s: any) => {
      const d = parseISO(s.shift_date);
      if (!isValid(d) || d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return acc;
      if (isAfter(d, today)) return acc; // 未来のシフトは集計しない

      if (s.status === 'official' || s.is_official_pre_exist === true) {
        acc.count++;
        acc.amount += (Number(s.reward_amount) || 0);
        if (s.is_late) acc.late++;
        
        // 稼働時間の計算
        if (s.start_time && s.end_time && s.start_time !== 'OFF') {
          const [sH, sM] = s.start_time.split(':').map(Number);
          const [eH, eM] = s.end_time.split(':').map(Number);
          if (!isNaN(sH) && !isNaN(eH)) {
            const endH = eH < sH ? eH + 24 : eH;
            acc.hours += (endH + (eM || 0) / 60 - (sH + (sM || 0) / 60));
          }
        }
      } else if (s.status === 'absent') {
        acc.absent++;
      }
      return acc;
    }, { amount: 0, count: 0, hours: 0, absent: 0, late: 0 });

    // 2. 📍 集計テーブルから「指名内訳」をSUMする
    const achievementStats = (data.achievements || []).reduce((acc: any, cur: any) => {
      const d = parseISO(cur.date);
      if (!isValid(d) || d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return acc;
      if (isAfter(d, today)) return acc;

      return {
        ka_f: acc.ka_f + (cur.ka_f || 0),
        ka_first: acc.ka_first + (cur.ka_first || 0),
        ka_main: acc.ka_main + (cur.ka_main || 0),
        soe_f: acc.soe_f + (cur.soe_f || 0),
        soe_first: acc.soe_first + (cur.soe_first || 0),
        soe_main: acc.soe_main + (cur.soe_main || 0),
      };
    }, { ka_f: 0, ka_first: 0, ka_main: 0, soe_f: 0, soe_first: 0, soe_main: 0 });

    return { ...shiftStats, ...achievementStats };
  }, [mounted, data.shifts, data.achievements]);

  return { data, loading, fetchInitialData, getMonthlyTotals, supabase };
}