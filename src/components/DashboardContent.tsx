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
import RequestList from '@/components/dashboard/RequestList';
import NewsSection from '@/components/dashboard/NewsSection';

// 【波線対策】パスが通らない場合は強制的に認識させます
// @ts-ignore
import FixedFooter from '@/components/dashboard/FixedFooter';

// テーマ設定：サクラピンクをデフォルトに
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

  // 実績入力ロジック：editReward などの波線を as any で回避
  const achievementData: any = useAchievement(
    supabase, safeProfile, safeShifts, nav.selected?.single, () => fetchInitialData(router)
  );
  
  const { 
    editReward = { f: '', first: '', main: '', amount: '' }, 
    setEditReward = () => {}, 
    handleSaveAchievement = () => {}, 
    isEditable = false, 
    selectedShift = null 
  } = achievementData || {};

  const requestManagerData: any = useRequestManager(
    supabase, safeProfile, safeShifts, nav.selected?.multi, 
    () => fetchInitialData(router), 
    () => nav.setSelected({ single: undefined, multi: [] })
  );

  const {
    requestDetails = {}, setRequestDetails = () => {}, handleBulkSubmit = () => {}
  } = requestManagerData || {};

  // シフト削除機能
  const handleDeleteShift = async () => {
    if (!safeProfile?.login_id || !nav.selected?.single) return;
    try {
      const dateStr = format(nav.selected.single, 'yyyy-MM-dd');
      const targetShift = safeShifts.find((s: any) => s.shift_date === dateStr);
      if (!targetShift) return;
      const hasOriginalShift = targetShift.hp_start_time && targetShift.hp_start_time !== 'OFF';

      if (hasOriginalShift) {
        const { error } = await supabase.from('shifts').update({
          status: 'official',
          start_time: targetShift.hp_start_time,
          end_time: targetShift.hp_end_time,
          is_official_pre_exist: true
        }).eq('login_id', safeProfile.login_id).eq('shift_date', dateStr);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('shifts').delete().eq('login_id', safeProfile.login_id).eq('shift_date', dateStr);
        if (error) throw error;
      }
      nav.setSelected({ single: undefined, multi: [] });
      fetchInitialData(router); 
    } catch (e) {
      console.error(e);
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
  const isRequest = nav.isRequestMode;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      <div className="pb-4">
        <CastHeader 
          shopName={data?.shop?.shop_name || "かりんと"} 
          syncTime={data?.syncAt} 
          displayName={safeProfile.display_name} 
          version="v3.6.5"
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

        {/* カレンダーセクション：サクラ色デザイン */}
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

        {/* 予約詳細表示 */}
        {(nav.selected?.single instanceof Date && isValid(nav.selected.single)) && (
          <DailyDetail 
            date={nav.selected.single} 
            dayNum={nav.selected.single.getDate()} 
            shift={selectedShift} 
            reservations={selectedShift?.reservations || []}
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