'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, parseISO, startOfToday, isAfter } from 'date-fns';

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
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [data, setData] = useState<{shifts: any[], profile: any, shop: any, news: any[], syncAt: string}>({
    shifts: [], profile: null, shop: null, news: [], syncAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selected, setSelected] = useState<{single?: Date, multi: Date[]}>({ single: new Date(), multi: [] });
  const [editReward, setEditReward] = useState({ f: '', first: '', main: '', amount: '' });
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});

  useEffect(() => { fetchInitialData(); }, []);

  async function fetchInitialData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');
    const loginId = session.user.email?.replace('@karinto-internal.com', '');
    const { data: profile } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
    
    if (profile) {
      const myShopId = profile.home_shop_id || 'main';
      const [shop, shifts, news, sync] = await Promise.all([
        supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
        supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
        supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
        supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
      ]);
      setData({ shifts: shifts.data || [], profile, shop: shop.data, news: news.data || [], syncAt: sync.data ? format(parseISO(sync.data.last_sync_at), 'HH:mm') : '' });
    }
    setLoading(false);
  }

  const monthlyTotals = useMemo(() => {
    const today = startOfToday();
    return (data.shifts || [])
      .filter((s: any) => {
        const d = parseISO(s.shift_date);
        const isPastOrToday = !isAfter(d, today);
        const isOfficialInfo = s.status === 'official' || s.is_official_pre_exist === true;
        return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear() && isPastOrToday && isOfficialInfo;
      })
      .reduce((acc, s: any) => ({ 
        amount: acc.amount + (Number(s.reward_amount) || 0), 
        f: acc.f + (Number(s.f_count) || 0), 
        first: acc.first + (Number(s.first_request_count) || 0), 
        main: acc.main + (Number(s.main_request_count) || 0), 
        count: acc.count + 1, 
        hours: acc.hours + 8 
      }), { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [data.shifts, viewDate]);

  // 日付選択ハンドラ：モードに応じて単一/複数を切り分け
  const handleDateSelect = (dates: any) => {
    if (isRequestMode) {
      // 申請モード：今日より後の日付のみ選択可能
      const tomorrow = startOfToday();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const filtered = (Array.isArray(dates) ? dates : []).filter(d => d >= tomorrow);
      setSelected({ single: undefined, multi: filtered });
    } else {
      // 実績モード：単一選択
      const d = Array.isArray(dates) ? dates[0] : dates;
      setSelected({ single: d instanceof Date ? d : undefined, multi: [] });
    }
  };

  useEffect(() => {
    if (isRequestMode || !selected.single) return;
    const dateStr = format(selected.single!, 'yyyy-MM-dd');
    const shift = data.shifts.find(s => s.shift_date === dateStr);
    setEditReward({ f: String(shift?.f_count || ''), first: String(shift?.first_request_count || ''), main: String(shift?.main_request_count || ''), amount: String(shift?.reward_amount || '') });
  }, [selected.single, data.shifts, isRequestMode]);

  const handleSaveAchievement = async () => {
    if (!selected.single || !data.profile) return;
    const dateStr = format(selected.single, 'yyyy-MM-dd');
    const selectedShift = data.shifts.find(s => s.shift_date === dateStr);
    if (!selectedShift || selectedShift.start_time === 'OFF') return alert('シフトがない日は実績を入力できません');

    const { error } = await supabase.from('shifts').update({ 
      f_count: Number(editReward.f), first_request_count: Number(editReward.first), main_request_count: Number(editReward.main), reward_amount: Number(editReward.amount), is_official: true 
    }).eq('login_id', data.profile.login_id).eq('shift_date', dateStr);
    if (!error) { fetchInitialData(); alert('実績を保存しました💰'); }
  };

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
        status: 'requested', // ★ これがスクレイパーの上書きを防ぐフラグ
        is_official: false,
        is_official_pre_exist: existing?.is_official_pre_exist || existing?.status === 'official'
      };
    });

    const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
    if (!error) {
      await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ content: `🔔 シフト申請: **${data.profile.display_name}** (${requests.length}件)` }) });
      alert('申請を送信しました！🚀');
      setSelected({ single: undefined, multi: [] });
      fetchInitialData();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse text-5xl italic">KARINTO...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans overflow-x-hidden text-gray-800">
      <CastHeader shopName={data.shop?.shop_name} syncTime={data.syncAt} displayName={data.profile?.display_name} version="v2.9.9.31" />
      
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

        {/* --- 表示エリアの切り替え --- */}
        {!isRequestMode ? (
          /* 実績入力：選択中の日の詳細を表示 */
          selected.single && (
            <DailyDetail 
              date={selected.single} 
              dayNum={selected.single.getDate()} 
              shift={data.shifts.find(s => s.shift_date === format(selected.single!, 'yyyy-MM-dd'))} 
              editReward={editReward} 
              setEditReward={setEditReward} 
              onSave={handleSaveAchievement} 
              isEditable={!isAfter(selected.single, startOfToday()) && !!data.shifts.find(s => s.shift_date === format(selected.single!, 'yyyy-MM-dd') && s.start_time !== 'OFF')} 
            />
          )
        ) : (
          /* シフト申請：カレンダーで選んだ日付のリストを表示 */
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