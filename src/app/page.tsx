'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; 
import { format } from 'date-fns';
import { AlertTriangle, ArrowRight } from 'lucide-react';

// ★ 四種の神器
import { useShiftData } from '@/hooks/useShiftData';
import { useAchievement } from '@/hooks/useAchievement';
import { useRequestManager } from '@/hooks/useRequestManager';
import { useNavigation } from '@/hooks/useNavigation';

// ★ コンポーネント群
import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';
import DailyDetail from '@/components/dashboard/DailyDetail';
import RequestList from '@/components/dashboard/RequestList';
import NewsSection from '@/components/dashboard/NewsSection';
import FixedFooter from '@/components/dashboard/FixedFooter';

function DashboardShell() {
  const router = useRouter();
  const pathname = usePathname();

  // 1. データ取得
  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();

  // 2. ナビゲーション
  const nav = useNavigation() as any;
  const { isRequestMode, toggleMode, viewDate, setViewDate, selected, handleDateSelect, setSelected } = nav;

  // 3. 実績入力ロジック（表示用の selectedShift だけを取得）
  const ach = useAchievement(
    supabase, data.profile, data.shifts, selected?.single, () => fetchInitialData(router)
  ) as any;
  const { selectedShift } = ach;

  // 4. 申請ロジック
  const req = useRequestManager(
    supabase, data.profile, data.shifts, selected?.multi, 
    () => fetchInitialData(router), 
    () => setSelected({ single: undefined, multi: [] })
  ) as any;
  const { requestDetails, setRequestDetails, handleBulkSubmit } = req;

  useEffect(() => { 
    fetchInitialData(router); 
  }, [router, fetchInitialData]);

  const monthlyTotals = useMemo(() => {
    const safeDate = viewDate instanceof Date ? viewDate : new Date();
    return getMonthlyTotals(safeDate);
  }, [data.shifts, viewDate, getMonthlyTotals]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
      <div className="font-black text-pink-200 animate-pulse text-5xl italic tracking-tighter">KARINTO...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      
      <CastHeader 
        shopName={data.shop?.shop_name || "かりんと 池袋東口店"} 
        syncTime={data.syncAt} 
        displayName={data.profile?.display_name} 
        version="v3.3.3" 
      />
      
      <main className="px-4 mt-3 space-y-2">
        {!isRequestMode && viewDate && (
          <MonthlySummary 
            month={`${(viewDate as Date).getMonth() + 1}月`} 
            totals={monthlyTotals} 
          />
        )}
        
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar 
            shifts={data.shifts as any} 
            selectedDates={isRequestMode ? selected?.multi : selected?.single} 
            onSelect={handleDateSelect} 
            month={viewDate instanceof Date ? viewDate : new Date()} 
            onMonthChange={setViewDate} 
            isRequestMode={isRequestMode} 
          />
        </section>

        {/* 【ここが修正のポイント！】
            エラーの元凶だった Props をすべて削除し、
            DailyDetail.tsx が求めている 3つだけを渡すようにしました。
        */}
        {!isRequestMode ? (
          selected?.single && (
            <DailyDetail 
              date={selected.single} 
              dayNum={selected.single.getDate()} 
              shift={selectedShift} 
            />
          )
        ) : (
          <RequestList 
            multiDates={selected?.multi} 
            requestDetails={requestDetails} 
            setRequestDetails={setRequestDetails} 
            shifts={data.shifts} 
            onSubmit={handleBulkSubmit} 
          />
        )}
        
        <NewsSection newsList={data.news} />
      </main>

      {/* @ts-ignore */}
      <FixedFooter 
        pathname={pathname} 
        onHome={() => router.push('/')} 
        onSalary={() => router.push('/salary')} 
        onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} 
      />
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <DashboardShell />
    </Suspense>
  );
}