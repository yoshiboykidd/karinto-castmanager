'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { format } from 'date-fns';

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
import FixedFooter from '@/components/dashboard/FixedFooter';

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  
  // 1. マウント状態を管理（最重要）
  const [isMounted, setIsMounted] = useState(false);

  // 2. データ基盤
  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();

  // 3. ナビゲーション（※内部で new Date() していても isMounted でガードする）
  const nav = useNavigation();

  // 4. 実績・申請ロジック
  const { editReward, setEditReward, handleSaveAchievement, isEditable, selectedShift } = useAchievement(
    supabase, data.profile, data.shifts, nav.selected.single, () => fetchInitialData(router)
  );

  const { requestDetails, setRequestDetails, handleBulkSubmit } = useRequestManager(
    supabase, data.profile, data.shifts, nav.selected.multi, 
    () => fetchInitialData(router), 
    () => nav.setSelected({ single: undefined, multi: [] })
  );

  // 初回マウント
  useEffect(() => { 
    setIsMounted(true); // ここで初めて「ブラウザ環境である」と確定させる
    fetchInitialData(router); 
  }, []);

  // 今月の集計データ（マウント前は計算しない）
  const monthlyTotals = useMemo(() => {
    if (!isMounted || !nav.viewDate) return { total_points: 0, total_reward: 0, count: 0 };
    return getMonthlyTotals(nav.viewDate);
  }, [isMounted, data.shifts, nav.viewDate]);

  // 【最重要】マウントされる前は「真っ白な画面」または「Loading」を返す
  // これにより、サーバーとクライアントの不一致を物理的にゼロにします
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
        <div className="font-black text-pink-200 animate-pulse text-4xl italic">KARINTO...</div>
      </div>
    );
  }

  // 以降はブラウザ確定後の処理
  const safeViewDate = nav.viewDate || new Date();

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      <CastHeader 
        shopName={data.shop?.shop_name || "かりんと 池袋東口店"} 
        syncTime={data.syncAt} 
        displayName={data.profile?.display_name} 
        version="v3.4.3" 
      />
      
      {/* モード切替 */}
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button 
          onClick={() => nav.toggleMode(false)} 
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!nav.isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
        >
          実績入力
        </button>
        <button 
          onClick={() => nav.toggleMode(true)} 
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${nav.isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
        >
          シフト申請
        </button>
      </div>

      <main className="px-4 mt-3 space-y-2">
        {!nav.isRequestMode && <MonthlySummary month={format(safeViewDate, 'M月')} totals={monthlyTotals} />}
        
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar 
            shifts={data.shifts as any} 
            selectedDates={nav.isRequestMode ? nav.selected.multi : nav.selected.single} 
            onSelect={nav.handleDateSelect} 
            month={safeViewDate} 
            onMonthChange={nav.setViewDate} 
            isRequestMode={nav.isRequestMode} 
          />
        </section>

        {!nav.isRequestMode ? (
          nav.selected.single && (
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