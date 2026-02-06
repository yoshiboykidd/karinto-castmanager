'use client';

import { useState, useEffect, useCallback } from 'react';
// ★修正: 新しいライブラリではなく、既存の supabase-js を使う形に戻しました
import { createClient } from '@supabase/supabase-js';
import { format, parseISO, startOfToday, isAfter } from 'date-fns';

export function useShiftData() {
  // ★修正: createBrowserClient ではなく createClient を使用
  const [supabase] = useState(() => createClient(
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
      if (!session) {
        if (router) router.push('/login');
        return;
      }
      
      const loginId = session.user.email?.split('@')[0];
      
      const { data: profile } = await supabase
        .from('cast_members')
        .select('*')
        .eq('login_id', loginId)
        .single();
      
      if (profile) {
        // 店舗IDの特定
        const myShopId = profile.shop_id || profile.home_shop_id;

        // 並列取得
        const [shopRes, shiftsRes, newsRes, syncRes] = await Promise.all([
          supabase.from('shops').select('*').eq('id', myShopId).single(),
          supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
          supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
          // sync_logs から該当店舗のログを取得
          supabase.from('sync_logs').select('last_sync_at').eq('shop_id', myShopId).single()
        ]);
        
        // ログの時間フォーマット
        let formattedSyncTime = '--:--';
        if (syncRes.data?.last_sync_at) {
          try {
            formattedSyncTime = format(parseISO(syncRes.data.last_sync_at), 'HH:mm');
          } catch (e) {
            console.error('Time parse error', e);
          }
        }

        setData({
          shifts: shiftsRes.data || [], 
          profile, 
          shop: shopRes.data || null, 
          news: newsRes.data || [],
          syncAt: formattedSyncTime
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 月間集計ロジック
   */
  const getMonthlyTotals = useCallback((viewDate: Date) => {
    if (!mounted || !viewDate) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    
    const today = startOfToday();
    
    return (data.shifts || [])
      .filter((s: any) => {
        if (!s.shift_date) return false;
        const d = parseISO(s.shift_date);
        
        const isSameMonth = d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
        const isPastOrToday = !isAfter(d, today);
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        
        return isSameMonth && isPastOrToday && isOfficialInfo;
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

        const reward = Number(s.reward_amount) || Number(s.achievement?.reward) || 0;
        const fCount = Number(s.f_count) || Number(s.achievement?.f) || 0;
        const firstCount = Number(s.first_request_count) || Number(s.achievement?.first) || 0;
        const mainCount = Number(s.main_request_count) || Number(s.achievement?.main) || 0;

        return { 
          amount: acc.amount + reward, 
          f: acc.f + fCount, 
          first: acc.first + firstCount, 
          main: acc.main + mainCount, 
          count: acc.count + 1, 
          hours: acc.hours + dur 
        };
      }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [mounted, data.shifts]);

  return { data, loading, fetchInitialData, getMonthlyTotals, supabase };
}