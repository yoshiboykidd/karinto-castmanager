'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, isValid } from 'date-fns';

import { useShiftData } from '@/hooks/useShiftData';
import { useAchievement } from '@/hooks/useAchievement';
import { useRequestManager } from '@/hooks/useRequestManager';
import { useNavigation } from '@/hooks/useNavigation';

import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';
import DailyDetail from '@/components/dashboard/DailyDetail';
import RequestList from '@/components/dashboard/RequestList';
import NewsSection from '@/components/dashboard/NewsSection';
import FixedFooter from '@/components/dashboard/FixedFooter';

export default function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();
  const nav = useNavigation();

  // 実績入力
  const { editReward, setEditReward, handleSaveAchievement, isEditable, selectedShift } = useAchievement(
    supabase, data.profile, data.shifts, nav.selected.single, () => fetchInitialData(router)
  );

  // シフト申請
  const { requestDetails, setRequestDetails, handleBulkSubmit } = useRequestManager(
    supabase, data.profile, data.shifts, nav.selected.multi, 
    () => fetchInitialData(router), 
    () => nav.setSelected({ single: undefined, multi: [] })
  );

  useEffect(() => { 
    setMounted(true);
    fetchInitialData(router); 
  }, []);

  const monthlyTotals = useMemo(() => {
    if (!nav.viewDate) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    return getMonthlyTotals(nav.viewDate);
  }, [data.shifts, nav.viewDate, getMonthlyTotals]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse text-5xl italic tracking-tighter">
        KARINTO...
      </div>
    );
  }

  const safeViewDate = nav.viewDate || new Date();
  const isRequest = nav.isRequestMode;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      <CastHeader 
        shopName={data.shop?.shop_name || "かりんと 池袋東口店"} 
        syncTime={data.syncAt} 
        displayName={data.profile?.display_name} 
        version="v3.4.5" 
      />
      
      <main className="px-4 mt-3 space-y-3">
        {/* 1. 月間サマリー */}
        {isValid(safeViewDate) && (
          <MonthlySummary month={format(safeViewDate, 'M月')} totals={monthlyTotals} />
        )}

        {/* 2. 実績/申請の切り替えタブ（シンプルに戻す） */}
        <div className="flex p-1 bg-gray-100/80 rounded-2xl border border-gray-200 shadow-inner">
          <button 
            onClick={() => nav.toggleMode(false)} 
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1
              ${!isRequest 
                ? 'bg-white text-pink-500 shadow-sm' 
                : 'text-gray-400 hover:text-pink-300'}`
            }
          >
            {!isRequest && <span className="text-base">📝</span>} 実績入力
          </button>
          
          <button 
            onClick={() => nav.toggleMode(true)} 
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1
              ${isRequest 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-400 hover:text-purple-400'}`
            }
          >
            {isRequest && <span className="text-base">📅</span>} シフト申請
          </button>
        </div>
        
        {/* 3. カレンダー（背景白固定、枠線だけほんのり色づけ） */}
        <section className={`bg-white p-2 rounded-[32px] border shadow-sm text-center transition-colors duration-500
          ${isRequest ? 'border-purple-100' : 'border-gray-100'}`}>
          <DashboardCalendar 
            shifts={data.shifts as any} 
            selectedDates={isRequest ? nav.selected.multi : nav.selected.single} 
            onSelect={nav.handleDateSelect} 
            month={safeViewDate} 
            onMonthChange={nav.setViewDate} 
            isRequestMode={isRequest} 
          />
        </section>

        {/* 4. 詳細入力 or 申請リスト */}
        {!isRequest ? (
          (nav.selected.single instanceof Date && isValid(nav.selected.single)) && (
            <DailyDetail 
              date={nav.selected.single} 
              dayNum={nav.selected.single.getDate()} 
              shift={selectedShift} 
              editReward={editReward} 
              setEditReward={setEditReward} 
              onSave={handleSaveAchievement} 
              isEditable={!!isEditable} 
            />
          )
        ) : (
          <RequestList 
            multiDates={nav.selected.multi} 
            requestDetails={requestDetails} 
            setRequestDetails={setRequestDetails} 
            shifts={data.shifts} 
            onSubmit={handleBulkSubmit} 
          />
        )}
        
        {/* 5. お知らせ */}
        <NewsSection newsList={data.news} />
      </main>

      <FixedFooter 
        pathname={pathname} 
        onHome={() => router.push('/')} 
        onSalary={() => router.push('/salary')} 
        onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} 
      />
    </div>
  );
}