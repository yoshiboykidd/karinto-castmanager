'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, startOfToday } from 'date-fns';

// ★ 四種の神器（カスタムフック）
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

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  // 1. データ基盤（読み込み担当）
  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();

  // 2. ナビゲーション（選択・切替担当）
  const { isRequestMode, toggleMode, viewDate, setViewDate, selected, handleDateSelect, setSelected } = useNavigation();

  // 3. 実績入力ロジック（過去の保存担当）
  const { editReward, setEditReward, handleSaveAchievement, isEditable, selectedShift } = useAchievement(
    supabase, data.profile, data.shifts, selected.single, () => fetchInitialData(router)
  );

  // 4. シフト申請ロジック（未来の送信担当）
  const { requestDetails, setRequestDetails, handleBulkSubmit } = useRequestManager(
    supabase, data.profile, data.shifts, selected.multi, 
    () => fetchInitialData(router), 
    () => setSelected({ single: undefined, multi: [] })
  );

  useEffect(() => { fetchInitialData(router); }, []);

  const monthlyTotals = useMemo(() => getMonthlyTotals(viewDate), [data.shifts, viewDate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse text-5xl italic tracking-tighter">KARINTO...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      <CastHeader shopName={data.shop?.shop_name} syncTime={data.syncAt} displayName={data.profile?.display_name} version="v3.0.0" />
      
      {/* モード切替タブ */}
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => toggleMode(false)} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => toggleMode(true)} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-3 space-y-2">
        {!isRequestMode && <MonthlySummary month={format(viewDate, 'M月')} totals={monthlyTotals} />}
        
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar 
            shifts={data.shifts} 
            selectedDates={isRequestMode ? selected.multi : selected.single} 
            onSelect={handleDateSelect} 
            month={viewDate} 
            onMonthChange={setViewDate} 
            isRequestMode={isRequestMode} 
          />
        </section>

        {/* --- 条件分岐：実績入力 or 申請リスト --- */}
        {!isRequestMode ? (
          selected.single && (
            <DailyDetail 
              date={selected.single} 
              dayNum={selected.single.getDate()} 
              shift={selectedShift} 
              editReward={editReward} 
              setEditReward={setEditReward} 
              onSave={handleSaveAchievement} 
              isEditable={!!isEditable} 
            />
          )
        ) : (
          <RequestList 
            multiDates={selected.multi} 
            requestDetails={requestDetails} 
            setRequestDetails={setRequestDetails} 
            shifts={data.shifts} 
            onSubmit={handleBulkSubmit} 
          />
        )}
        
        <NewsSection newsList={data.news} />
      </main>

      <FixedFooter pathname={pathname} onHome={() => router.push('/')} onSalary={() => router.push('/salary')} onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} />
    </div>
  );
}