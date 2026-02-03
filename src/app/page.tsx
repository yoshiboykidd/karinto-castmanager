'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, parseISO, startOfToday, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';

// --- 自作コンポーネントのインポート ---
import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';
import DailyDetail from '@/components/dashboard/DailyDetail';
import RequestList from '@/components/dashboard/RequestList'; // ←復活！
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

  const [shifts, setShifts] = useState<any[]>([]);
  const [castProfile, setCastProfile] = useState<any>(null);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');

  const [isRequestMode, setIsRequestMode] = useState(false);
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [multiDates, setMultiDates] = useState<Date[]>([]);
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});
  const [editReward, setEditReward] = useState({ f: '', first: '', main: '', amount: '' });

  const activeTab: 'achievement' | 'request' = isRequestMode ? 'request' : 'achievement';

  useEffect(() => { fetchInitialData(); }, []);

  async function fetchInitialData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const loginId = session.user.email?.replace('@karinto-internal.com', '');
    const { data: castData } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
    setCastProfile(castData);
    if (castData) {
      const myShopId = castData.home_shop_id || 'main';
      const [shopRes, shiftRes, newsRes, syncRes] = await Promise.all([
        supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
        supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
        supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3),
        supabase.from('sync_logs').select('last_sync_at').eq('id', 1).single()
      ]);
      setShopInfo(shopRes.data);
      setShifts(shiftRes.data || []);
      setNewsList(newsRes.data || []);
      if (syncRes.data) setLastSync(format(parseISO(syncRes.data.last_sync_at), 'HH:mm'));
    }
    setLoading(false);
  }

  // シフト申請時の初期時間セット用
  useEffect(() => {
    const newDetails = { ...requestDetails };
    multiDates.forEach(d => {
      const key = format(d, 'yyyy-MM-dd');
      if (!newDetails[key]) {
        const existing = (shifts || []).find(s => s.shift_date === key);
        newDetails[key] = existing ? { s: existing.start_time, e: existing.end_time } : { s: '11:00', e: '23:00' };
      }
    });
    setRequestDetails(newDetails);
  }, [multiDates, shifts]);

  const monthlyTotals = useMemo(() => {
    const today = startOfToday();
    return (shifts || []).filter((s: any) => {
      const d = parseISO(s.shift_date);
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear() && s.status === 'official' && !isAfter(d, today);
    }).reduce((acc, s: any) => {
      let dur = 0; let isWorking = 0;
      if (s.start_time && s.end_time && s.start_time !== 'OFF') {
        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        dur = (eH < sH ? eH + 24 : eH) + eM / 60 - (sH + sM / 60);
        isWorking = 1; 
      }
      return { amount: acc.amount + (Number(s.reward_amount) || 0), f: acc.f + (Number(s.f_count) || 0), first: acc.first + (Number(s.first_request_count) || 0), main: acc.main + (Number(s.main_request_count) || 0), count: acc.count + isWorking, hours: acc.hours + dur };
    }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [shifts, viewDate]);

  const handleBulkSubmit = async () => {
    if (!castProfile) return;
    const finalRequests = multiDates.map(date => {
      const key = format(date, 'yyyy-MM-dd');
      return {
        login_id: castProfile.login_id,
        hp_display_name: castProfile.display_name || 'キャスト',
        shift_date: key,
        start_time: requestDetails[key]?.s || '11:00',
        end_time: requestDetails[key]?.e || '23:00',
        status: 'requested',
        is_official: false
      };
    });
    const { error } = await supabase.from('shifts').upsert(finalRequests as any, { onConflict: 'login_id,shift_date' });
    if (!error) {
      const content = `🔔 **シフト申請がありました**\nキャスト: **${castProfile.display_name}** さん`;
      await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      alert(`${finalRequests.length}件の申請を送信しました！🚀`); setMultiDates([]); fetchInitialData();
    }
  };

  const handleSaveReward = async () => {
    if (!singleDate || !castProfile) return;
    const dateStr = format(singleDate, 'yyyy-MM-dd');
    const { error } = await supabase.from('shifts').update({ f_count: Number(editReward.f) || 0, first_request_count: Number(editReward.first) || 0, main_request_count: Number(editReward.main) || 0, reward_amount: Number(editReward.amount) || 0 }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr);
    if (!error) { fetchInitialData(); alert('実績を保存しました💰'); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black italic text-5xl text-pink-300 animate-pulse">KARINTO...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-36 font-sans overflow-x-hidden">
      <CastHeader shopName={shopInfo?.shop_name || 'Karinto'} syncTime={lastSync} displayName={castProfile?.display_name} version="KarintoCastManager v2.9.9.22" />

      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-3 space-y-2">
        {!isRequestMode && <MonthlySummary month={format(viewDate, 'M月')} totals={monthlyTotals} />}

        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar shifts={shifts} selectedDates={isRequestMode ? multiDates : singleDate} onSelect={(d) => isRequestMode ? setMultiDates(Array.isArray(d) ? d : []) : setSingleDate(d)} month={viewDate} onMonthChange={setViewDate} isRequestMode={isRequestMode} />
        </section>

        {/* 条件によって実績入力か申請リストを切り替えて表示 */}
        {!isRequestMode && singleDate ? (
          <DailyDetail date={singleDate} dayNum={singleDate.getDate()} dayOfficial={shifts.find(s => s.shift_date === format(singleDate, 'yyyy-MM-dd') && s.status === 'official')} dayRequested={shifts.find(s => s.shift_date === format(singleDate, 'yyyy-MM-dd') && s.status === 'requested')} editReward={editReward} setEditReward={setEditReward} onSave={handleSaveReward} activeTab={activeTab} />
        ) : isRequestMode && (
          <RequestList multiDates={multiDates} requestDetails={requestDetails} setRequestDetails={setRequestDetails} shifts={shifts} onSubmit={handleBulkSubmit} />
        )}

        <NewsSection newsList={newsList} />
      </main>

      <FixedFooter pathname={pathname} onHome={() => router.push('/')} onSalary={() => router.push('/salary')} onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} />
    </div>
  );
}