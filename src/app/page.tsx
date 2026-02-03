'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation'; 
import { format, parseISO, startOfToday, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';

// --- 自作コンポーネントのインポート ---
import CastHeader from '@/components/dashboard/CastHeader';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import DashboardCalendar from '@/components/DashboardCalendar';

// --- アイコン・定数 ---
import { Calendar as CalendarIcon, DollarSign, LogOut, Megaphone } from 'lucide-react';

const TIME_OPTIONS: string[] = [];
for (let h = 11; h <= 23; h++) {
  TIME_OPTIONS.push(`${h}:00`);
  if (h !== 23) TIME_OPTIONS.push(`${h}:30`);
}

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

  useEffect(() => { fetchInitialData(); }, []);

  // --- データ取得ロジック ---
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

  // --- 実績計算ロジック（昨日までを合算） ---
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
        let dur = 0;
        let isWorking = 0;
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

  const handleDateSelect = (dates: any) => {
    if (isRequestMode) {
      const tomorrow = startOfToday(); tomorrow.setDate(tomorrow.getDate() + 1);
      const validDates = (Array.isArray(dates) ? dates : []).filter(d => d >= tomorrow);
      setMultiDates(validDates);
    } else { setSingleDate(dates as Date); }
  };

  const handleBulkSubmit = async () => {
    if (!castProfile) return;
    const checkResults = multiDates.map(date => {
      const key = format(date, 'yyyy-MM-dd');
      const reqS = requestDetails[key]?.s || '11:00';
      const reqE = requestDetails[key]?.e || '23:00';
      const official = (shifts || []).find(s => s.shift_date === key && s.status === 'official');
      const isSame = official && official.start_time === reqS && official.end_time === reqE;
      return { date, isSame, key, reqS, reqE };
    });
    if (checkResults.some(r => r.isSame)) {
      alert("エラー：確定シフトと同じ時間の申請が含まれています。");
      return;
    }
    const finalRequests = checkResults.map(r => ({
      login_id: castProfile.login_id,
      hp_display_name: castProfile.display_name || 'キャスト',
      shift_date: r.key,
      start_time: r.reqS,
      end_time: r.reqE,
      status: 'requested',
      is_official: false
    }));
    const { error } = await supabase.from('shifts').upsert(finalRequests as any, { onConflict: 'login_id,shift_date' });
    if (!error) {
      const content = `🔔 **シフト申請がありました**\nキャスト: **${castProfile.display_name}** さん`;
      await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      alert(`${finalRequests.length}件の申請を送信しました！🚀`); setMultiDates([]); fetchInitialData();
    } else { alert(`エラー: ${error.message}`); }
  };

  if (loading) return ( <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black italic text-5xl text-pink-300 animate-pulse">KARINTO...</div> );

  const targetDateStr = singleDate ? format(singleDate, 'yyyy-MM-dd') : '';
  const dayOfficial = (shifts || []).find(s => s.shift_date === targetDateStr && s.status === 'official');
  const dayRequested = (shifts || []).find(s => s.shift_date === targetDateStr && s.status === 'requested');
  const dayNum = singleDate?.getDate();

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-36 font-sans overflow-x-hidden">
      
      {/* セクション 1: ヘッダー (コンポーネント化済み) */}
      <CastHeader 
        shopName={shopInfo?.shop_name || 'Karinto'} 
        syncTime={lastSync} 
        displayName={castProfile?.display_name} 
        version="KarintoCastManager v2.9.9.19" 
      />

      {/* セクション 2: タブ切替 */}
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-3 space-y-2">
        {/* セクション 3: 実績サマリー (コンポーネント化済み) */}
        {!isRequestMode && (
          <MonthlySummary 
            month={format(viewDate, 'M月')} 
            totals={monthlyTotals} 
          />
        )}

        {/* セクション 4: カレンダー */}
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar shifts={shifts} selectedDates={isRequestMode ? multiDates : singleDate} onSelect={handleDateSelect} month={viewDate} onMonthChange={setViewDate} isRequestMode={isRequestMode} />
        </section>

        {/* セクション 5: 日付詳細・入力フォーム */}
        {!isRequestMode && (
          <section className={`rounded-[32px] border shadow-xl p-5 flex flex-col space-y-1 transition-all duration-300
            ${dayNum === 10 ? 'bg-orange-50 border-orange-200' : 
              (dayNum === 11 || dayNum === 22) ? 'bg-yellow-50 border-yellow-200' : 
              'bg-white border-pink-100'}`}
          >
            {(dayNum === 10 || dayNum === 11 || dayNum === 22) && (
              <div className={`-mt-2 mb-2 py-1.5 px-4 rounded-full text-center font-black text-[12px] tracking-[0.2em] shadow-sm
                ${dayNum === 10 ? 'bg-orange-400 text-white' : 'bg-yellow-400 text-white'}`}>
                {dayNum === 10 ? 'かりんとの日' : '添い寝の日'}
              </div>
            )}

            <div className="flex items-center justify-between px-1 gap-2">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline whitespace-nowrap">
                {singleDate ? format(singleDate, 'M/d') : ''}
                <span className="text-lg ml-1 opacity-70">({singleDate ? format(singleDate, 'E', { locale: ja }) : ''})</span>
              </h3>
              
              <div className="flex items-center gap-1 flex-nowrap shrink-0 justify-end">
                {(!dayOfficial || dayOfficial.start_time === 'OFF') && !dayRequested ? (
                  <span className="whitespace-nowrap text-[12px] font-black text-gray-400 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 leading-none">お休み</span>
                ) : dayOfficial ? (
                  <>
                    <span className="whitespace-nowrap text-[12px] font-black text-blue-500 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100 leading-none">確定シフト</span>
                    <span className="whitespace-nowrap text-[20px] font-black text-pink-500 leading-none ml-1">{dayOfficial.start_time}〜{dayOfficial.end_time}</span>
                  </>
                ) : dayRequested ? (
                  <>
                    <span className="whitespace-nowrap text-[12px] font-black text-purple-500 bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-100 leading-none">申請中</span>
                    <span className="whitespace-nowrap text-[20px] font-black text-purple-400 leading-none ml-1">{dayRequested.start_time === 'OFF' ? 'お休み' : `${dayRequested.start_time}〜${dayRequested.end_time}`}</span>
                  </>
                ) : null}
              </div>
            </div>

            {dayOfficial && dayOfficial.start_time !== 'OFF' ? (
              <>
                <div className="flex flex-col space-y-0.5 pt-1 text-center font-black text-gray-400 text-[11px] uppercase tracking-widest">
                  <div className="grid grid-cols-3 gap-2 px-1"><span>フリー</span><span>初指名</span><span>本指名</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['f', 'first', 'main'] as const).map((key) => (
                      <input key={key} type="number" inputMode="numeric" value={editReward[key]} placeholder="0" onFocus={e=>e.target.select()} onChange={e => setEditReward({...editReward, [key]: e.target.value})} className={`w-full text-center py-2 bg-white rounded-xl font-black text-3xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none transition-all ${editReward[key] === '' ? 'text-gray-200' : 'text-pink-500'}`} />
                    ))}
                  </div>
                </div>
                <div className="bg-pink-50/40 p-3 rounded-[22px] border border-pink-100 flex items-center justify-between shadow-inner">
                  <label className="text-[13px] font-black text-gray-900 uppercase">報酬合計</label>
                  <div className="flex items-center text-pink-500"><span className="text-2xl font-black mr-1 opacity-40 translate-y-[1px]">¥</span><input type="text" inputMode="numeric" value={editReward.amount!==''?Number(editReward.amount).toLocaleString():''} placeholder="0" onFocus={e=>e.target.select()} onChange={e=>{const v=e.target.value.replace(/,/g,''); if(/^\d*$/.test(v))setEditReward({...editReward,amount:v});}} className={`w-40 text-right bg-transparent font-black text-[32px] border-none focus:ring-0 caret-pink-500 tracking-tighter ${editReward.amount === '' ? 'text-gray-200' : 'text-pink-500'}`} /></div>
                </div>
                <button onClick={() => {
                  const dateStr = format(singleDate!, 'yyyy-MM-dd');
                  supabase.from('shifts').update({ f_count: Number(editReward.f) || 0, first_request_count: Number(editReward.first) || 0, main_request_count: Number(editReward.main) || 0, reward_amount: Number(editReward.amount) || 0 }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr).then(() => { fetchInitialData(); alert('実績を保存しました💰'); });
                }} className="w-full bg-pink-500 text-white font-black py-4 rounded-[20px] text-lg shadow-lg active:scale-95 transition-all mt-1">実績を保存 💾</button>
              </>
            ) : ( <div className="py-8 text-center text-gray-300 font-bold italic text-xs">{dayRequested ? "確定をお待ちください⛄️" : "お休みです☕️"}</div> )}
          </section>
        )}

        {/* セクション 6: 申請リスト (省略) */}
        {/* セクション 7: NEWS (省略) */}

      </main>

      {/* セクション 8: 固定フッター (省略) */}

    </div>
  );
}