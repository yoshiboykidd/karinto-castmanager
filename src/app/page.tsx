'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import DashboardCalendar from '@/components/DashboardCalendar';

const TIME_OPTIONS: string[] = [];
for (let h = 11; h <= 23; h++) {
  TIME_OPTIONS.push(`${h}:00`);
  if (h !== 23) TIME_OPTIONS.push(`${h}:30`);
}

export default function Page() {
  const router = useRouter();
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

  const [isRequestMode, setIsRequestMode] = useState(false);
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [multiDates, setMultiDates] = useState<Date[]>([]);
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});
  const [editReward, setEditReward] = useState({ f: '', first: '', main: '', amount: '' });

  useEffect(() => { fetchInitialData(); }, []);

  async function fetchInitialData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const loginId = session.user.email?.replace('@karinto-internal.com', '');
    const { data: castData } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
    setCastProfile(castData);
    if (castData) {
      const myShopId = castData.home_shop_id || 'main';
      const [shopRes, shiftRes, newsRes] = await Promise.all([
        supabase.from('shop_master').select('*').eq('shop_id', myShopId).single(),
        supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
        supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3)
      ]);
      setShopInfo(shopRes.data);
      setShifts(shiftRes.data || []);
      setNewsList(newsRes.data || []);
    }
    setLoading(false);
  }

  const monthlyTotals = (shifts || [])
    .filter((s: any) => {
      const d = parseISO(s.shift_date);
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear() && s.status === 'official';
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
        count: acc.count + 1,
        hours: acc.hours + dur,
      };
    }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });

  useEffect(() => {
    const newDetails = { ...requestDetails };
    multiDates.forEach(d => {
      const key = format(d, 'yyyy-MM-dd');
      if (!newDetails[key]) {
        const existingReq = (shifts || []).find(s => s.shift_date === key && s.status === 'requested');
        const existingOff = (shifts || []).find(s => s.shift_date === key && s.status === 'official');
        const base = existingReq || existingOff;
        newDetails[key] = base ? { s: base.start_time, e: base.end_time } : { s: '11:00', e: '23:00' };
      }
    });
    setRequestDetails(newDetails);
  }, [multiDates, shifts]);

  useEffect(() => {
    if (isRequestMode || !singleDate) return;
    const dateStr = format(singleDate, 'yyyy-MM-dd');
    const shift = (shifts || []).find(s => s.shift_date === dateStr && s.status === 'official');
    const v = (val: any) => (val === null || val === undefined) ? '' : String(val);
    setEditReward({ f: v(shift?.f_count), first: v(shift?.first_request_count), main: v(shift?.main_request_count), amount: v(shift?.reward_amount) });
  }, [singleDate, shifts, isRequestMode]);

  const sendDiscordNotification = async (requestList: any[]) => {
    const webhookUrl = shopInfo?.discord_webhook_url;
    if (!webhookUrl) return;
    const castName = castProfile?.display_name || 'Cast';
    const detailText = requestList.map(r => {
      const type = r.is_official_pre_exist ? "【変更】" : "【新規】";
      const timeStr = (r.start_time === 'OFF') ? "休み希望 😴" : `${r.start_time}〜${r.end_time}`;
      return `${type} ${r.shift_date} (${timeStr})`;
    }).join('\n');
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔔 **シフト申請を受信**`,
          embeds: [{
            title: `${castName} さん (${shopInfo.shop_name})`,
            description: `\`\`\`\n${detailText}\n\`\`\``,
            color: 0xec4899,
            timestamp: new Date().toISOString()
          }]
        })
      });
    } catch (err) { console.error(err); }
  };

  const handleBulkSubmit = async () => {
    if (!castProfile) return;
    const requests = multiDates.map(date => {
      const key = format(date, 'yyyy-MM-dd');
      return { 
        login_id: castProfile.login_id, 
        hp_display_name: castProfile.display_name || 'Cast',
        shift_date: key, 
        start_time: requestDetails[key].s, 
        end_time: requestDetails[key].e, 
        status: 'requested', 
        is_official: false,
        is_official_pre_exist: (shifts || []).some(s => s.shift_date === key && s.status === 'official')
      };
    });
    const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
    if (!error) {
      await sendDiscordNotification(requests);
      alert('申請を送信しました！🚀');
      setMultiDates([]); fetchInitialData();
    } else { alert(`エラー: ${error.message}`); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black italic text-5xl text-pink-300 animate-pulse">KARINTO...</div>
  );

  const targetDateStr = singleDate ? format(singleDate, 'yyyy-MM-dd') : '';
  const dayOfficial = (shifts || []).find(s => s.shift_date === targetDateStr && s.status === 'official');
  const dayPending = (shifts || []).find(s => s.shift_date === targetDateStr && s.status === 'requested');

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-40 font-sans overflow-x-hidden">
      
      {/* 🏔️ Header: Sanctuary Design Premium */}
      <header className="bg-white px-6 pt-14 pb-6 rounded-b-[40px] shadow-[0_4px_20px_-5px_rgba(236,72,153,0.1)] border-b border-pink-50 relative z-20">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-pink-300 uppercase tracking-[0.2em] mb-1.5">KarintoCastManager v2.5.0</p>
            <h1 className="text-3xl font-black flex items-baseline gap-1.5 leading-none tracking-tighter">
              {castProfile?.display_name || 'Cast'}
              <span className="text-[22px] text-pink-400 font-bold italic translate-y-[1px]">さん⛄️</span>
            </h1>
            <p className="text-[13px] font-bold text-gray-400 mt-2 tracking-tight flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {shopInfo?.shop_name || 'Karinto'} 入室中
            </p>
          </div>
          <div className="bg-pink-50 p-2 rounded-2xl">
             <span className="text-2xl">🍯</span>
          </div>
        </div>
      </header>

      {/* 📱 Smart Tabs */}
      <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-sm mx-6 mt-6 rounded-2xl border border-gray-200/50 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all duration-300 ${!isRequestMode ? 'bg-white text-pink-500 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-500'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all duration-300 ${isRequestMode ? 'bg-white text-purple-600 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-500'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-6 space-y-5">
        
        {/* 💎 究極の「デカバッジ」実績カード */}
        <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[32px] p-5 border border-pink-200 relative overflow-hidden shadow-sm">
          <span className="absolute -right-4 -top-8 text-[120px] font-black text-pink-200/20 italic select-none leading-none tracking-tighter">{format(viewDate, 'M')}</span>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-black text-pink-500 tracking-tighter bg-white/60 px-3 py-1 rounded-full border border-pink-100">{format(viewDate, 'M月')}の獲得実績</h2>
              <div className="flex gap-2">
                <div className="bg-white/90 px-3 py-1.5 rounded-2xl flex items-baseline gap-0.5 shadow-sm border border-pink-100">
                  <span className="text-[18px] font-black text-pink-500 leading-none">{monthlyTotals.count}</span>
                  <span className="text-[9px] font-black text-gray-500">days</span>
                </div>
                <div className="bg-white/90 px-3 py-1.5 rounded-2xl flex items-baseline gap-0.5 shadow-sm border border-pink-100">
                  <span className="text-[18px] font-black text-pink-500 leading-none">{Math.round(monthlyTotals.hours * 10) / 10}</span>
                  <span className="text-[9px] font-black text-gray-500">h</span>
                </div>
              </div>
            </div>
            
            <div className="text-center my-6">
              <p className="text-[14px] font-black text-pink-400 leading-none mb-1 uppercase tracking-widest">Est. Salary</p>
              <p className="text-[56px] font-black text-pink-600 leading-none tracking-tighter flex items-center justify-center gap-1">
                <span className="text-2xl translate-y-2">¥</span>{monthlyTotals.amount.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-white/40 p-1 rounded-[20px] border border-white/60 backdrop-blur-sm shadow-inner">
              <div className="py-3 text-center rounded-xl bg-white/60">
                <p className="text-[10px] text-pink-400 font-black mb-1">フリー</p>