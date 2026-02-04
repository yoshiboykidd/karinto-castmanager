'use client';

import { useEffect, useMemo, useState } from 'react'; // useStateを追加
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
  
  // 0. ハイドレーションエラーを物理的に防ぐためのステート
  const [mounted, setMounted] = useState(false);

  // 1. データ基盤
  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();

  // 2. ナビゲーション
  const { isRequestMode, toggleMode, viewDate, setViewDate, selected, handleDateSelect, setSelected } = useNavigation();

  // 3. 実績入力ロジック
  const { editReward, setEditReward, handleSaveAchievement, isEditable, selectedShift } = useAchievement(
    supabase, data.profile, data.shifts, selected.single, () => fetchInitialData(router)
  );

  // 4. シフト申請ロジック
  const { requestDetails, setRequestDetails, handleBulkSubmit } = useRequestManager(
    supabase, data.profile, data.shifts, selected.multi, 
    () => fetchInitialData(router), 
    () => setSelected({ single: undefined, multi: [] })
  );

  // 初回マウント時に実行
  useEffect(() => { 
    setMounted(true); // マウント完了を通知
    fetchInitialData(router); 
  }, []);

  // 今月の集計データ（viewDate が確実にある時だけ計算）
  const monthlyTotals = useMemo(() => {
    if (!viewDate) return { total_points: 0, total_reward: 0, count: 0 };
    return getMonthlyTotals(viewDate);
  }, [data.shifts, viewDate]);

  // ローディング中、またはマウント前は「KARINTO...」画面で待機
  // これによりサーバーとクライアントの不一致によるクラッシュを防ぐ
  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse text-5xl italic tracking-tighter">
      KARINTO...
    </div>
  );

  // viewDate が万が一 undefined の場合の安全策
  const safeViewDate = viewDate || new Date();

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      
      <CastHeader 
        shopName={data.shop?.shop_name || "かりんと 池袋東口店"} 
        syncTime={data.syncAt} 
        displayName={data.profile?.display_name} 
        version="v3.4.2" 
      />
      
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button 
          onClick={() => toggleMode(false)} 
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
        >
          実績入力
        </button>
        <button 
          onClick={() => toggleMode(true)} 
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
        >
          シフト申請
        </button>
      </div>

      <main className="px-4 mt-3 space-y-2">
        {/* 実績サマリー */}
        {!isRequestMode && <MonthlySummary month={format(safeViewDate, 'M月')} totals={monthlyTotals} />}
        
        {/* インタラクティブ・カレンダー */}
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar 
            shifts={data.shifts as any} 
            selectedDates={isRequestMode ? selected.multi : selected.single} 
            onSelect={handleDateSelect} 
            month={safeViewDate} 
            onMonthChange={setViewDate} 
            isRequestMode={isRequestMode} 
          />
        </section>

        {/* 詳細エリア */}
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

      <FixedFooter 
        pathname={pathname} 
        onHome={() => router.push('/')} 
        onSalary={() => router.push('/salary')} 
        onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} 
      />
    </div>
  );
}