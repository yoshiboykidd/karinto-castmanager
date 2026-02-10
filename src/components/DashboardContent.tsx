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
  pink: { 
    header: 'bg-[#FFB7C5]', // 柔らかいサクラ
    calendar: 'bg-white/80 backdrop-blur-xl border-pink-100/50 shadow-[0_20px_50px_rgba(255,182,193,0.1)]', 
    text: 'text-pink-400' 
  }
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

  const achievementData: any = useAchievement(
    supabase, safeProfile, safeShifts, nav.selected?.single, () => fetchInitialData(router)
  );
  
  const { selectedShift = null } = achievementData || {};
  const currentReservations = selectedShift?.reservations || [];

  useEffect(() => { 
    setMounted(true);
    fetchInitialData(router); 
  }, [fetchInitialData, router]);

  const monthlyTotals = useMemo(() => {
    if (!nav.viewDate || !data?.shifts) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    return getMonthlyTotals(nav.viewDate);
  }, [data?.shifts, nav.viewDate, getMonthlyTotals]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
        <div className="font-black text-pink-300 animate-pulse text-5xl italic tracking-tighter">KARINTO...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAFB] pb-36 font-sans overflow-x-hidden text-gray-800">
      <div className="pb-6">
        <CastHeader 
          shopName={data?.shop?.shop_name || "かりんと"} 
          syncTime={data?.syncAt} 
          displayName={safeProfile.display_name} 
          version="v4.6.0"
          bgColor={currentTheme.header}
        />
      </div>
      
      <main className="px-5 -mt-12 relative z-10 space-y-6">
        {isValid(nav.viewDate) && (
          <MonthlySummary 
            month={format(nav.viewDate || new Date(), 'M月')} 
            totals={monthlyTotals} 
            targetAmount={safeProfile.monthly_target_amount || 0}
            theme={themeKey}
          />
        )}

        <section className={`p-5 rounded-[48px] border-2 transition-all duration-500 ${currentTheme.calendar}`}>
          <div className="mb-2 text-[10px] font-black text-pink-200 uppercase tracking-[0.2em] italic">Schedule</div>
          <DashboardCalendar 
            shifts={safeShifts as any} 
            selectedDates={nav.selected?.single} 
            onSelect={nav.handleDateSelect} 
            month={nav.viewDate || new Date()} 
            onMonthChange={nav.setViewDate} 
            isRequestMode={false} 
          />
        </section>

        {(nav.selected?.single instanceof Date && isValid(nav.selected.single)) && (
          <DailyDetail 
            {...({
              date: nav.selected.single,
              dayNum: nav.selected.single.getDate(),
              shift: selectedShift,
              reservations: currentReservations
            } as any)} 
          />
        )}
        
        <NewsSection newsList={data?.news || []} />
      </main>

      {/* @ts-ignore */}
      <FixedFooter 
        pathname={pathname} 
        onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} 
      />
    </div>
  );
}