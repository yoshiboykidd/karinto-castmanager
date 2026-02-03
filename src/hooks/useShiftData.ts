'use client';

import { useState } from 'react';
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

  const fetchInitialData = async (router: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');
    const loginId = session.user.email?.replace('@karinto-internal.com', '');
    
    const { data: profile } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
    if (profile) {
      const myShopId = profile.home_shop_id || 'main';
      const [shop, shifts, news, sync] = await Promise.all([
        supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
        supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
        supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
        supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
      ]);
      
      setData({
        shifts: shifts.data || [], 
        profile, 
        shop: shop.data, 
        news: news.data || [],
        syncAt: sync.data ? format(parseISO(sync.data.last_sync_at), 'HH:mm') : ''
      });
    }
    setLoading(false);
  };

  /**
   * 月間集計ロジック (v3.3.4)
   * 「過去かつ確定済み」のシフトを、正確な時間計算で集計します。
   */
  const getMonthlyTotals = (viewDate: Date) => {
    const today = startOfToday();
    
    return (data.shifts || [])
      .filter((s: any) => {
        const d = parseISO(s.shift_date);
        const isPastOrToday = !isAfter(d, today);
        
        // 実績としてカウントする条件:
        // 1. ステータスが 'official' である
        // 2. または、以前確定していたが現在は変更申請中 ('is_official_pre_exist' が true)
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        
        return (
          d.getMonth() === viewDate.getMonth() && 
          d.getFullYear() === viewDate.getFullYear() && 
          isPastOrToday && 
          isOfficialInfo
        );
      })
      .reduce((acc, s: any) => {
        // 精密な時間計算ロジックを復元
        let dur = 0;
        if (s.start_time && s.end_time && s.start_time !== 'OFF') {
          const [sH, sM] = s.start_time.split(':').map(Number);
          const [eH, eM] = s.end_time.split(':').map(Number);
          // 24時を跨ぐ場合も考慮
          dur = (eH < sH ? eH + 24 : eH) + eM / 60 - (sH + sM / 60);
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
  };

  return { data, loading, fetchInitialData, getMonthlyTotals, supabase };
}