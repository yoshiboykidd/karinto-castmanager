'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; 
import { format } from 'date-fns';
import { AlertTriangle, ArrowRight } from 'lucide-react';

// ★ 四種の神器（カスタムフック）
import { useShiftData } from '@/hooks/useShiftData';
import { useAchievement } from '@/hooks/useAchievement';
import { useRequestManager } from '@/hooks/useRequestManager';
import { useNavigation } from '@/hooks/useNavigation';

// ★ コンポーネント群（波線を消すために @/components/dashboard/ に統一）
import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';
import DailyDetail from '@/components/dashboard/DailyDetail';
import RequestList from '@/components/dashboard/RequestList';
import NewsSection from '@/components/dashboard/NewsSection';
import FixedFooter from '@/components/dashboard/FixedFooter';

/**
 * パスワード警告コンポーネント
 * useSearchParamsを使うため、個別のSuspenseで保護します
 */
function PasswordAlertChecker() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (searchParams && searchParams.get('alert_password') === 'true') {
      setShowAlert(true);
    }
  }, [searchParams]);

  if (!showAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-pink-100 animate-in zoom-in-95 duration-300">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 mx-auto text-rose-500">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-center mb-6">
          <h2 className="text-lg font-black text-gray-800 mb-2">パスワードを変更してください</h2>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            現在のパスワードは初期設定の<span className="font-bold text-rose-500 mx-1">0000</span>のままです。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => router.push('/profile')} 
            className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>今すぐ変更する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowAlert(false)} 
            className="w-full bg-gray-50 text-gray-400 font-bold py-3 rounded-xl text-xs"
          >
            あとでする
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * メインのダッシュボードシェル
 */
function DashboardShell() {
  const router = useRouter();
  const pathname = usePathname();

  // 1. データ取得
  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();

  // 2. ナビゲーション管理（ここで viewDate を確実に受け取ります）
  const { 
    isRequestMode, 
    toggleMode, 
    viewDate, // ← ここに波線が出る場合、useNavigationにこれが含まれているか確認
    setViewDate, 
    selected, 
    handleDateSelect, 
    setSelected 
  } = useNavigation();

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

  useEffect(() => { 
    fetchInitialData(router); 
  }, [router, fetchInitialData]);

  // viewDate を使った今月の集計
  const monthlyTotals = useMemo(() => {
    return getMonthlyTotals(viewDate);
  }, [data.shifts, viewDate, getMonthlyTotals]);

  // ローディング画面
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
      
      {/* モード切替 */}
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
        {/* viewDate を使用するセクション */}
        {!isRequestMode && (
          <MonthlySummary 
            month={format(viewDate, 'M月')} 
            totals={monthlyTotals} 
          />
        )}
        
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar 
            shifts={data.shifts as any} 
            selectedDates={isRequestMode ? selected.multi : selected.single} 
            onSelect={handleDateSelect} 
            month={viewDate} 
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

      {/* フッター：パスが通っていれば波線が消えます */}
      <FixedFooter 
        pathname={pathname} 
        onHome={() => {}} 
        onSalary={() => router.push('/salary')} 
        onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} 
      />
    </div>
  );
}

/**
 * エクスポートPage：Suspenseで全体を保護
 */
export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <DashboardShell />
      <Suspense fallback={null}>
        <PasswordAlertChecker />
      </Suspense>
    </Suspense>
  );
}