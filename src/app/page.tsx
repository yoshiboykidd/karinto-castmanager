'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, startOfToday, isAfter } from 'date-fns';

// ★ ステップ1で作成したカスタムフック
import { useShiftData } from '@/hooks/useShiftData';

// --- コンポーネント群 ---
import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';
import DailyDetail from '@/components/dashboard/DailyDetail';
import RequestList from '@/components/dashboard/RequestList';
import NewsSection from '@/components/dashboard/NewsSection';
import FixedFooter from '@/components/dashboard/FixedFooter';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1467395577829523487/oQUEYdVA4oSbkAb53WYNMCnVIiOa0Tsi25WRPVWDtxF2UsnJFGrsU_gb-qG37gdyTQaQ";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  // ★ データ読み込みロジックをフックへ委託
  const { data, loading, fetchInitialData, getMonthlyTotals, supabase } = useShiftData();

  // --- 状態管理（ここは順次フックへ移行可能） ---
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selected, setSelected] = useState<{single?: Date, multi: Date[]}>({ single: new Date(), multi: [] });
  const [editReward, setEditReward] = useState({ f: '', first: '', main: '', amount: '' });
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});

  // 初期データ取得
  useEffect(() => {
    fetchInitialData(router);
  }, []);

  // 月間合計の計算（フック内のロジックを使用）
  const monthlyTotals = useMemo(() => getMonthlyTotals(viewDate), [data.shifts, viewDate]);

  // 実績入力フォームの同期
  useEffect(() => {
    if (isRequestMode || !selected.single) return;
    const dateStr = format(selected.single!, 'yyyy-MM-dd');
    const shift = data.shifts.find(s => s.shift_date === dateStr);
    setEditReward({ 
      f: String(shift?.f_count || ''), 
      first: String(shift?.first_request_count || ''), 
      main: String(shift?.main_request_count || ''), 
      amount: String(shift?.reward_amount || '') 
    });
  }, [selected.single, data.shifts, isRequestMode]);

  // 日付選択ハンドラ
  const handleDateSelect = (dates: any) => {
    if (isRequestMode) {
      const tomorrow = startOfToday();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const filtered = (Array.isArray(dates) ? dates : []).filter(d => d >= tomorrow);
      setSelected({ single: undefined, multi: filtered });
    } else {
      const d = Array.isArray(dates) ? dates[0] : dates;
      setSelected({ single: d instanceof Date ? d : undefined, multi: [] });
    }
  };

  // 実績保存ロジック（HP情報が絶対正解）
  const handleSaveAchievement = async () => {
    if (!selected.single || !data.profile) return;
    const dateStr = format(selected.single, 'yyyy-MM-dd');
    const selectedShift = data.shifts.find(s => s.shift_date === dateStr);

    if (!selectedShift || selectedShift.start_time === 'OFF') {
      return alert('HPにシフトがない日は実績を入力できません');
    }

    const { error } = await supabase.from('shifts').update({ 
      f_count: Number(editReward.f) || 0, 
      first_request_count: Number(editReward.first) || 0, 
      main_request_count: Number(editReward.main) || 0, 
      reward_amount: Number(editReward.amount) || 0,
      is_official: true 
    }).eq('login_id', data.profile.login_id).eq('shift_date', dateStr);
    
    if (!error) { fetchInitialData(router); alert('実績を保存しました💰'); }
  };

  // シフト一括申請ロジック
  const handleBulkSubmit = async () => {
    if (!data.profile || selected.multi.length === 0) return;
    const requests = selected.multi.map(date => {
      const key = format(date, 'yyyy-MM-dd');
      const existing = data.shifts.find(s => s.shift_date === key);
      return {
        login_id: data.profile.login_id,
        hp_display_name: data.profile.display_name || 'キャスト',
        shift_date: key,
        start_time: requestDetails[key]?.s || '11:00',
        end_time: requestDetails[key]?.e || '23:00',
        status: 'requested', // スクレイパー保護用
        is_official: false,
        is_official_pre_exist: existing?.is_official_pre_exist || existing?.status === 'official'
      };
    });

    const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
    if (!error) {
      await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ content: `🔔 シフト申請: **${data.profile.display_name}**` }) });
      alert('申請を送信しました！🚀');
      setSelected({ single: undefined, multi: [] });
      fetchInitialData(router);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse text-5xl italic">KARINTO...</div>;

  const today = startOfToday();
  const selectedShift = selected.single ? data.shifts.find(s => s.shift_date === format(selected.single!, 'yyyy-MM-dd')) : null;
  const isEditable = selected.single && !isAfter(selected.single, today) && selectedShift && selectedShift.start_time !== 'OFF';

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      <CastHeader shopName={data.shop?.shop_name} syncTime={data.syncAt} displayName={data.profile?.display_name} version="v2.9.9.32" />
      
      {/* モード切替 */}
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setSelected({ single: new Date(), multi: [] }); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSelected({ single: undefined, multi: [] }); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
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

        {/* --- メインコンテンツ --- */}
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