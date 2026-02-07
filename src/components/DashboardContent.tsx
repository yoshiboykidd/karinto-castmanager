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

// テーマ設定
const THEME_CONFIG: any = {
  pink:   { header: 'bg-pink-300',   calendar: 'bg-pink-50 border-pink-100',   text: 'text-pink-400' },
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
  const nav = useNavigation();

  const safeProfile = data?.profile || {};
  const targetAmount = safeProfile.monthly_target_amount || 0;
  const themeKey = safeProfile.theme_color || 'pink';
  const currentTheme = THEME_CONFIG[themeKey] || THEME_CONFIG.pink;

  const safeShifts = Array.isArray(data?.shifts) ? data.shifts : [];

  const achievementData: any = useAchievement(
    supabase, safeProfile, safeShifts, nav.selected.single, () => fetchInitialData(router)
  );
  
  const { 
    editReward = { f: '', first: '', main: '', amount: '' }, 
    setEditReward = () => {}, 
    handleSaveAchievement = () => {}, 
    isEditable = false, 
    selectedShift = null 
  } = achievementData || {};

  const requestManagerData: any = useRequestManager(
    supabase, safeProfile, safeShifts, nav.selected.multi, 
    () => fetchInitialData(router), 
    () => nav.setSelected({ single: undefined, multi: [] })
  );

  const {
    requestDetails = {}, setRequestDetails = () => {}, handleBulkSubmit = () => {}
  } = requestManagerData || {};

  // ★追加: シフト削除機能
  const handleDeleteShift = async () => {
    // ログインIDや選択中の日付がなければ中断
    if (!safeProfile?.login_id || !nav.selected.single) return;

    try {
      const dateStr = format(nav.selected.single, 'yyyy-MM-dd');

      // 削除実行
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('login_id', safeProfile.login_id)
        .eq('shift_date', dateStr)
        .eq('status', 'requested'); // 安全策：「申請中」のみ削除可

      if (error) throw error;

      alert('申請を取り消しました 🗑️');
      
      // 画面を閉じてデータを再取得
      nav.setSelected({ single: undefined, multi: [] });
      fetchInitialData(router); 

    } catch (e) {
      console.error(e);
      alert('削除に失敗しました...');
    }
  };

  useEffect(() => { 
    setMounted(true);
    fetchInitialData(router); 
  }, []);

  const monthlyTotals = useMemo(() => {
    if (!nav.viewDate || !data?.shifts) return { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 };
    return getMonthlyTotals(nav.viewDate);
  }, [data?.shifts, nav.viewDate, getMonthlyTotals]);

  const goToMyPage = () => router.push('/mypage');

  if (!mounted || loading) {
    return <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse text-5xl italic tracking-tighter">KARINTO...</div>;
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
          version="v3.6.4"
          bgColor={currentTheme.header}
        />
      </div>
      
      <main className="px-4 -mt-8 relative z-10 space-y-3">
        {isValid(safeViewDate) && (
          <MonthlySummary 
            month={format(safeViewDate, 'M月')} 
            totals={monthlyTotals} 
            targetAmount={targetAmount}
            theme={themeKey}
          />
        )}

        {/* タブ */}
        <div className="flex p-1 bg-gray-100/80 rounded-2xl border border-gray-200 shadow-inner">
          <button 
            onClick={() => nav.toggleMode(false)} 
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1
              ${!isRequest 
                ? `bg-white ${currentTheme.text} shadow-sm` 
                : 'text-gray-400 hover:text-gray-500'}`
            }
          >
            実績入力
          </button>
          <button 
            onClick={() => nav.toggleMode(true)} 
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1
              ${isRequest 
                ? 'bg-white text-cyan-500 shadow-sm' 
                : 'text-gray-400 hover:text-cyan-400'}`
            }
          >
            シフト申請
          </button>
        </div>
        
        {/* カレンダー */}
        <section className={`p-3 rounded-[32px] border shadow-sm text-center transition-colors duration-500
          ${isRequest 
            ? 'bg-cyan-50 border-cyan-100'
            : currentTheme.calendar
          }`}>
          <DashboardCalendar 
            shifts={safeShifts as any} 
            selectedDates={isRequest ? nav.selected.multi : nav.selected.single} 
            onSelect={nav.handleDateSelect} 
            month={safeViewDate} 
            onMonthChange={nav.setViewDate} 
            isRequestMode={isRequest} 
          />
        </section>

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
              
              // ★追加: ここで削除関数を渡す
              onDelete={handleDeleteShift}
            />
          )
        ) : (
          <RequestList 
            multiDates={nav.selected.multi} 
            requestDetails={requestDetails} 
            setRequestDetails={setRequestDetails} 
            shifts={safeShifts as any} 
            onSubmit={handleBulkSubmit} 
          />
        )}
        
        <NewsSection newsList={data?.news || []} />
      </main>

      <FixedFooter 
        pathname={pathname} 
        onHome={() => router.push('/')} 
        onSalary={() => router.push('/salary')} 
        onProfile={goToMyPage}
        onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} 
      />
    </div>
  );
}