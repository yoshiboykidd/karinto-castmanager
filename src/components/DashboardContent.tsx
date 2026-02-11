'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, isValid } from 'date-fns';
import { useShiftData } from '@/hooks/useShiftData';
import { useAchievement } from '@/hooks/useAchievement';
import { useNavigation } from '@/hooks/useNavigation';
import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';
import DailyDetail from '@/components/dashboard/DailyDetail';
import NewsSection from '@/components/dashboard/NewsSection';

// @ts-ignore
import FixedFooter from '@/components/dashboard/FixedFooter';

const THEME_CONFIG: any = {
  pink:   { header: 'bg-[#FFB7C5]', calendar: 'bg-[#FFF9FA] border-pink-100', accent: 'pink' },
  blue:   { header: 'bg-cyan-300',   calendar: 'bg-cyan-50 border-cyan-100',   accent: 'blue' },
  yellow: { header: 'bg-yellow-300', calendar: 'bg-yellow-50 border-yellow-100', accent: 'yellow' },
  white:  { header: 'bg-gray-400',   calendar: 'bg-white border-gray-100',     accent: 'gray' },
  black:  { header: 'bg-gray-800',   calendar: 'bg-gray-900 border-gray-700',   accent: 'black' },
  red:    { header: 'bg-red-400',    calendar: 'bg-red-50 border-red-100',     accent: 'red' },
};

export default function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();
  const nav = useNavigation() as any;

  const safeProfile = data?.profile || {};
  const themeKey = safeProfile.theme_color || 'pink';
  const currentTheme = THEME_CONFIG[themeKey] || THEME_CONFIG.pink;
  const safeShifts = Array.isArray(data?.shifts) ? data.shifts : [];

  // 📍 12店舗の正確なマッピング
  const shopName = useMemo(() => {
    const loginId = safeProfile.username || safeProfile.login_id || "";
    const prefix = loginId.substring(0, 3);

    const shopMap: Record<string, string> = {
      '001': '神田',
      '002': '赤坂',
      '003': '秋葉原',
      '004': '上野',
      '005': '渋谷',
      '006': '池袋西口',
      '007': '五反田',
      '008': '大宮',
      '009': '吉祥寺',
      '010': '大久保',
      '011': '池袋東口',
      '012': '小岩'
    };

    return shopMap[prefix] ? `${shopMap[prefix]}店` : '店舗未設定';
  }, [safeProfile]);

  const lastSyncTime = (data as any)?.last_sync_at || (data as any)?.syncAt || null;

  const achievementData: any = useAchievement(
    supabase, safeProfile, safeShifts, nav.selected?.single, () => fetchInitialData(router)
  );
  
  const { selectedShift = null } = achievementData || {};

  const currentReservations = useMemo(() => {
    if (!(nav.selected?.single instanceof Date) || !data?.reservations) return [];
    const selectedDateStr = format(nav.selected.single, 'yyyy-MM-dd');
    return data.reservations.filter((res: any) => res.reservation_date === selectedDateStr);
  }, [data?.reservations, nav.selected?.single]);

  useEffect(() => { 
    setMounted(true);
    fetchInitialData(router); 
  }, [fetchInitialData, router]);

  const monthlyTotals = useMemo(() => {
    return getMonthlyTotals(nav.viewDate || new Date());
  }, [getMonthlyTotals, nav.viewDate]);

  const displayMonth = format(nav.viewDate || new Date(), 'M月');

  if (!mounted || loading) return null;

  return (
    <div className=\"min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800\">
      <div className=\"relative\">
        <CastHeader 
          displayName={safeProfile.display_name} 
          shopName={shopName} 
          syncTime={lastSyncTime} 
          bgColor={currentTheme.header}
        />
      </div>
      
      <main className=\"px-4 -mt-6 relative z-10 space-y-5\">
        <MonthlySummary month={displayMonth} totals={monthlyTotals} targetAmount={safeProfile.monthly_target_amount || 0} theme={themeKey} />

        <section className={`p-4 rounded-[40px] border-2 shadow-xl shadow-pink-100/20 text-center transition-all duration-500 ${currentTheme.calendar}`}>
          <DashboardCalendar shifts={safeShifts as any} selectedDates={nav.selected?.single} onSelect={nav.handleDateSelect} month={nav.viewDate || new Date()} onMonthChange={nav.setViewDate} isRequestMode={false} />
        </section>

        {(nav.selected?.single instanceof Date && isValid(nav.selected.single)) && (
          <DailyDetail 
            date={nav.selected.single}
            dayNum={nav.selected.single.getDate()}
            shift={selectedShift}
            reservations={currentReservations} 
            theme={themeKey}
            supabase={supabase}
            onRefresh={() => fetchInitialData(router)}
            /* 📍 個人履歴表示のためにキャスト本人の login_id を渡す */
            myLoginId={safeProfile.username || safeProfile.login_id}
          />
        )}
        
        <NewsSection newsList={data?.news || []} />
      </main>

      <FixedFooter pathname={pathname} onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} />
    </div>
  );
}