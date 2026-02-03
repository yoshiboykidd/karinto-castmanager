'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, parseISO, startOfToday, isAfter } from 'date-fns';

// --- 自作コンポーネント ---
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

  // --- 状態管理の一元化 ---
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

  // --- 1. データ取得 ---
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
      
      setData({
        shifts: shifts.data || [],
        profile: profile,
        shop: shop.data,
        news: news.data || [],
        syncAt: sync.data ? format(parseISO(sync.data.last_sync_at), 'HH:mm') : ''
      });
    }
    setLoading(false);
  }

  // --- 2. 実績入力フォームの連動 ---
  useEffect(() => {
    if (!selected.single) return;
    const dayData = data.shifts.find(s => s.shift_date === format(selected.single!, 'yyyy-MM-dd'));
    setEditReward({
      f: dayData?.f_count?.toString() || '',
      first: dayData?.first_request_count?.toString() || '',
      main: dayData?.main_request_count?.toString() || '',
      amount: dayData?.reward_amount?.toString() || ''
    });
  }, [selected.single, data.shifts]);

  // --- 3. 実績集計 ---
  const monthlyTotals = useMemo(() => {
    const today = startOfToday();
    return data.shifts
      .filter((s: any) => {
        const d = parseISO(s.shift_date);
        return d.getMonth() === viewDate.getMonth() && 
               d.getFullYear() === viewDate.getFullYear() && 
               (s.status === 'official' || s.is_official_pre_exist) &&
               !isAfter(d, today);
      })
      .reduce((acc, s: any) => {
        let dur = 0;
        if (s.start_time && s.end_time && s.start_time !== 'OFF') {
          const [sH, sM] = s.start_time.split(':').map(Number);
          const [eH, eM] = s.end_time.split(':').map(Number);
          dur = (eH < sH ? eH + 24 : eH) + eM / 60 - (sH + sM / 60);
        }
        return { 
          amount: acc.amount + (Number(s.reward_amount) || 0), 
          f: acc.f + (Number(s.f_count) || 0), 
          first: acc.first + (Number(s.first_request_count) || 0), 
          main: acc.main + (Number(s.main_request_count) || 0), 
          count: acc.count + (s.start_time !== 'OFF' ? 1 : 0), 
          hours: acc.hours + dur 
        };
      }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [data.shifts, viewDate]);

  // --- 4. イベントハンドラ ---
  const handleDateSelect = (dates: any) => {
    if (isRequestMode) {
      // ★明日以降の日付のみを選択可能にする
      const filtered = (Array.isArray(dates) ? dates : []).filter(d => isAfter(d, startOfToday()));
      setSelected(prev => ({ ...prev, multi: filtered }));
    } else {
      const d = Array.isArray(dates) ? dates[0] : dates;
      setSelected({ single: d instanceof Date ? d : undefined, multi: [] });
    }
  };

  const handleBulkSubmit = async () => {
    if (!data.profile) return;
    const finalRequests = selected.multi.map(date => {
      const key = format(date, 'yyyy-MM-dd');
      const existing = data.shifts.find(s => s.shift_date === key);
      return {
        login_id: data.profile.login_id,
        hp_display_name: data.profile.display_name || 'キャスト',
        shift_date: key,
        start_time: requestDetails[key]?.s || '11:00',
        end_time: requestDetails[key]?.e || '23:00',
        status: 'requested',
        is_official: false,
        is_official_pre_exist: existing?.is_official_pre_exist || false,
        reward_amount: existing?.reward_amount || 0,
        f_count: existing?.f_count || 0,
        first_request_count: existing?.first_request_count || 0,
        main_request_count: existing?.main_request_count || 0
      };
    });

    const { error } = await supabase.from('shifts').upsert(finalRequests as any, { onConflict: 'login_id,shift_date' });
    if (!error) {
      await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `🔔 **シフト申請がありました**\nキャスト: **${data.profile.display_name}** さん` }) });
      alert('申請を送信しました🚀'); setSelected(p => ({ ...p, multi: [] })); fetchInitialData();
    }
  };

  const handleSaveReward = async () => {
    if (!selected.single || !data.profile) return;
    const dateStr = format(selected.single, 'yyyy-MM-dd');
    const { error } = await supabase.from('shifts').update({ 
      f_count: Number(editReward.f) || 0, 
      first_request_count: Number(editReward.first) || 0, 
      main_request_count: Number(editReward.main) || 0, 
      reward_amount: Number(editReward.amount) || 0 
    }).eq('login_id', data.profile.login_id).eq('shift_date', dateStr);
    
    if (!error) { fetchInitialData(); alert('実績を保存しました💰'); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black italic text-5xl text-pink-300 animate-pulse">KARINTO...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-36 font-sans overflow-x-hidden">
      
      <CastHeader shopName={data.shop?.shop_name || 'Karinto'} syncTime={data.syncAt} displayName={data.profile?.display_name || 'キャスト'} version="v2.9.9.26" />

      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200">
        <button onClick={() => { setIsRequestMode(false); setSelected(p => ({ ...p, multi: [] })); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSelected(p => ({ ...p, single: undefined })); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
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

        {!isRequestMode && selected.single ? (
          <DailyDetail 
            date={selected.single} 
            dayNum={selected.single.getDate()} 
            dayOfficial={data.shifts.find(s => s.shift_date === format(selected.single!, 'yyyy-MM-dd') && s.status === 'official')} 
            dayRequested={data.shifts.find(s => s.shift_date === format(selected.single!, 'yyyy-MM-dd') && s.status === 'requested')} 
            editReward={editReward} 
            setEditReward={setEditReward} 
            onSave={handleSaveReward} 
            activeTab="achievement" 
          />
        ) : isRequestMode && (
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