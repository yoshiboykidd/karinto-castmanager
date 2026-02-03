'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, parseISO, startOfToday, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';

// --- 自作コンポーネントのインポート ---
import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar'; // ※ここが dashboard/ 内なら追加
import DailyDetail from '@/components/dashboard/DailyDetail';
import NewsSection from '@/components/dashboard/NewsSection';
import FixedFooter from '@/components/dashboard/FixedFooter';

// --- 定数設定 ---
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1467395577829523487/oQUEYdVA4oSbkAb53WYNMCnVIiOa0Tsi25WRPVWDtxF2UsnJFGrsU_gb-qG37gdyTQaQ";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  // --- 状態管理 ---
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

  // 【波線対策：型を明示的に指定】
  const activeTab: 'achievement' | 'request' = isRequestMode ? 'request' : 'achievement';

  useEffect(() => { fetchInitialData(); }, []);

  // --- 1. データ取得ロジック ---
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
      if (syncRes.data) {
        setLastSync(format(parseISO(syncRes.data.last_sync_at), 'HH:mm'));
      }
    }
    setLoading(false);
  }

  // --- 2. 実績計算ロジック（昨日まで） ---
  const monthlyTotals = useMemo(() => {
    const today = startOfToday();
    return (shifts || [])
      .filter((s: any) => {
        const d = parseISO(s.shift_date);
        return d.getMonth() === viewDate.getMonth() && 
               d.getFullYear() === viewDate.getFullYear() && 
               s.status === 'official' &&
               isBefore(d, today); 
      })
      .reduce((acc, s: any) => {
        let dur = 0; let isWorking = 0;
        if (s.start_time && s.end_time && s.start_time !== 'OFF') {
          const [sH, sM] = s.start_time.split(':').map(Number);
          const [eH, eM] = s.end_time.split(':').map(Number);
          dur = (eH < sH ? eH + 24 : eH) + eM / 60 - (sH + sM / 60);
          isWorking = 1; 
        }
        return { 
          amount: acc.amount + (Number(s.reward_amount) || 0), 
          f: acc.f + (Number(s.f_count) || 0), 
          first: acc.first + (Number(s.first_request_count) || 0), 
          main: acc.main + (Number(s.main_request_count) || 0), 
          count: acc.count + isWorking, 
          hours: acc.hours + dur 
        };
      }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [shifts, viewDate]);

  // --- 3. イベントハンドラ ---
  const handleDateSelect = (dates: any) => {
    if (isRequestMode) {
      const tomorrow = startOfToday(); tomorrow.setDate(tomorrow.getDate() + 1);
      const validDates = (Array.isArray(dates) ? dates : []).filter(d => d >= tomorrow);
      setMultiDates(validDates);
    } else { setSingleDate(dates as Date); }
  };

  const handleSaveReward = async () => {
    if (!singleDate) return;
    const dateStr = format(singleDate, 'yyyy-MM-dd');
    const { error } = await supabase.from('shifts').update({ 
      f_count: Number(editReward.f) || 0, 
      first_request_count: Number(editReward.first) || 0, 
      main_request_count: Number(editReward.main) || 0, 
      reward_amount: Number(editReward.amount) || 0 
    }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr);

    if (!error) { fetchInitialData(); alert('実績を保存しました💰'); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black italic text-5xl text-pink-300 animate-pulse">KARINTO...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-36 font-sans overflow-x-hidden">
      
      <CastHeader 
        shopName={shopInfo?.shop_name || 'Karinto'} 
        syncTime={lastSync} 
        displayName={castProfile?.display_name || 'キャスト'} 
        version="KarintoCastManager v2.9.9.19" 
      />

      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-3 space-y-2">
        {!isRequestMode && (
          <MonthlySummary month={format(viewDate, 'M月')} totals={monthlyTotals} />
        )}

        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar shifts={shifts} selectedDates={isRequestMode ? multiDates : singleDate} onSelect={handleDateSelect} month={viewDate} onMonthChange={setViewDate} isRequestMode={isRequestMode} />
        </section>

        {!isRequestMode && singleDate && (
          <DailyDetail 
            date={singleDate}
            dayNum={singleDate.getDate()}
            dayOfficial={(shifts || []).find(s => s.shift_date === format(singleDate, 'yyyy-MM-dd') && s.status === 'official')}
            dayRequested={(shifts || []).find(s => s.shift_date === format(singleDate, 'yyyy-MM-dd') && s.status === 'requested')}
            editReward={editReward}
            setEditReward={setEditReward}
            onSave={handleSaveReward}
            activeTab={activeTab}
          />
        )}

        <NewsSection newsList={newsList} />
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