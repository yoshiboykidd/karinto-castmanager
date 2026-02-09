'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, isValid } from 'date-fns';

// ★ カスタムフック
import { useShiftData } from '@/hooks/useShiftData';
import { useAchievement } from '@/hooks/useAchievement';
import { useRequestManager } from '@/hooks/useRequestManager';
import { useNavigation } from '@/hooks/useNavigation';

// ★ コンポーネント
import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';
import DailyDetail from '@/components/dashboard/DailyDetail';
import NewsSection from '@/components/dashboard/NewsSection';

// @ts-ignore
import FixedFooter from '@/components/dashboard/FixedFooter';

const THEME_CONFIG: any = {
  pink:   { header: 'bg-pink-400',   calendar: 'bg-[#FFF9FA] border-pink-100',   text: 'text-pink-500' },
  blue:   { header: 'bg-cyan-300',   calendar: 'bg-cyan-50 border-cyan-100',   text: 'text-cyan-400' },
  yellow: { header: 'bg-yellow-300', calendar: 'bg-yellow-50 border-yellow-100', text: 'text-yellow-500' },
  white:  { header: 'bg-gray-400',   calendar: 'bg-gray-50 border-gray-200',   text: 'text-gray-400' },
  black:  { header: 'bg-gray-800',   calendar: 'bg-gray-100 border-gray-300',  text: 'text-gray-800' },
  red:    { header: 'bg-red-500',    calendar: 'bg-red-50 border-red-100',     text: 'text-red-500' },
};

export default function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();
  const nav = useNavigation() as any;

  const safeProfile = data?.profile || {};
  const targetAmount = safeProfile.monthly_target_amount || 0;
  const themeKey = safeProfile.theme_color || 'pink';
  const currentTheme = THEME_CONFIG[themeKey] || THEME_CONFIG.pink;
  const safeShifts = Array.isArray(data?.shifts) ? data.shifts : [];

  // 実績入力ロジック
  const achievementData: any = useAchievement(
    supabase, safeProfile, safeShifts, nav.selected?.single, () => fetchInitialData(router)
  );
  
  const { selectedShift = null } = achievementData || {};
  const currentReservations = selectedShift?.reservations || [];

  // シフト削除・申請取り消しロジック
  const handleDeleteShift = async () => {
    if (!safeProfile?.login_id || !nav.selected?.single) return;
    try {
      const dateStr = format(nav.selected.single, 'yyyy-MM-dd');
      const targetShift = safeShifts.find((s: any) => s.shift_date === dateStr);
      if (!targetShift) return;
      const hasOriginalShift = targetShift.hp_start_time && targetShift.hp_start_time !== 'OFF';

      if (hasOriginalShift) {
        await supabase.from('shifts').update({
          status: 'official',
          start_time: targetShift.hp_start_time,
          end_time: targetShift.hp_end_time
        }).eq('login_id', safeProfile.login_id).eq('shift_date', dateStr);
      } else {
        await supabase.from('shifts').delete().eq('login_id', safeProfile.login_id).eq('shift_date', dateStr);
      }
      nav.setSelected({ single: undefined, multi: [] });
      fetchInitialData(router); 
      alert('正常に更新されました');
    } catch (e) {
      console.error(e);
      alert('エラーが発生しました');
    }
  };

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

  const safeViewDate = nav.viewDate || new Date();

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      <div className="pb-4">
        <CastHeader 
          shopName={data?.shop?.shop_name || "かりんと"} 
          syncTime={data?.syncAt} 
          displayName={safeProfile.display_name} 
          version="v3.7.1"
          bgColor={currentTheme.header}
        />
      </div>
      
      <main className="px-4 -mt-8 relative z-10 space-y-4">
        {isValid(safeViewDate) && (
          <MonthlySummary 
            month={format(safeViewDate, 'M月')} 
            totals={monthlyTotals} 
            targetAmount={targetAmount}
            theme={themeKey}
          />
        )}

        <section className={`p-4 rounded-[32px] border shadow-sm text-center transition-all duration-500 ${currentTheme.calendar}`}>
          <DashboardCalendar 
            shifts={safeShifts as any} 
            selectedDates={nav.selected?.single} 
            onSelect={nav.handleDateSelect} 
            month={safeViewDate} 
            onMonthChange={nav.setViewDate} 
            isRequestMode={false} 
          />
        </section>

        {(nav.selected?.single instanceof Date && isValid(nav.selected.single)) && (
          /* @ts-ignore: reservations prop type mismatch workaround */
          <DailyDetail 
            date={nav.selected.single} 
            dayNum={nav.selected.single.getDate()} 
            shift={selectedShift} 
            reservations={currentReservations}
            onDelete={handleDeleteShift}
          />
        )}
        
        <NewsSection newsList={data?.news || []} />
      </main>

      {/* @ts-ignore */}
      <FixedFooter 
        pathname={pathname} 
        onHome={() => router.push('/')} 
        onSalary={() => router.push('/salary')} 
        onProfile={() => router.push('/mypage')}
        onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} 
      />
    </div>
  );
}