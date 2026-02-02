'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import { format, parseISO, startOfToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import DashboardCalendar from '@/components/DashboardCalendar';

const TIME_OPTIONS: string[] = [];
for (let h = 11; h <= 23; h++) {
  TIME_OPTIONS.push(`${h}:00`);
  if (h !== 23) TIME_OPTIONS.push(`${h}:30`);
}

// ✅ Webhook URL 固定済み
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
      if (syncRes.data) {
        setLastSync(format(parseISO(syncRes.data.last_sync_at), 'HH:mm'));
      }
    }
    setLoading(false);
  }

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
    return (shifts || [])
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
        return { amount: acc.amount + (Number(s.reward_amount) || 0), f: acc.f + (Number(s.f_count) || 0), first: acc.first + (Number(s.first_request_count) || 0), main: acc.main + (Number(s.main_request_count) || 0), count: acc.count + 1, hours: acc.hours + dur };
      }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [shifts, viewDate]);

  const handleDateSelect = (dates: any) => {
    if (isRequestMode) {
      const tomorrow = startOfToday(); tomorrow.setDate(tomorrow.getDate() + 1);
      const validDates = (dates as Date[] || []).filter(d => d >= tomorrow);
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
      const sameDates = checkResults.filter(r => r.isSame).map(r => format(r.date, 'M/d')).join(', ');
      alert(`エラー：${sameDates} は確定シフトと同じ時間です。変更してから申請してください。🙅‍♀️`);
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
      const messageLines = finalRequests.map(r => {
        const d = parseISO(r.shift_date);
        const dateStr = format(d, 'M/d(E)', { locale: ja });
        const isOfficialExist = (shifts || []).some(s => s.shift_date === r.shift_date && s.status === 'official');
        const typeStr = isOfficialExist ? '(変更)' : '(新規)';
        const timeStr = r.start_time === 'OFF' ? 'OFF' : `${r.start_time}〜${r.end_time}`;
        return `📅 ${dateStr}: ${timeStr}${typeStr}`;
      });

      const content = `🔔 **シフト申請がありました**\nキャスト: **${castProfile.display_name}** さん\n${messageLines.join('\n')}`;

      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      alert(`${finalRequests.length}件の申請を送信しました！🚀`);
      setMultiDates([]); fetchInitialData();
    } else { alert(`エラー: ${error.message}`); }
  };

  if (loading) return ( <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black italic text-5xl text-pink-300 animate-pulse">KARINTO...</div> );

  const targetDateStr = singleDate ? format(singleDate, 'yyyy-MM-dd') : '';
  const dayOfficial = (shifts || []).find(s => s.shift_date === targetDateStr && s.status === 'official');
  const dayRequested = (shifts || []).find(s => s.shift_date === targetDateStr && s.status === 'requested');

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-36 font-sans overflow-x-hidden">
      
      {/* 1. ヘッダー */}
      <header className="bg-white px-6 pt-10 pb-4 rounded-b-[40px] shadow-sm border-b border-pink-50 relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1 leading-none underline decoration-pink-100 decoration-2 underline-offset-4">KarintoCastManager v2.9.9.7</p>
            <p className="text-[13px] font-bold text-gray-400 mb-1">{shopInfo?.shop_name || 'Karinto'}</p>
          </div>
          {lastSync && (
            <div className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1">
              <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">HP同期: {lastSync}</span>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-black flex items-baseline gap-1.5 leading-tight">{castProfile?.display_name || 'キャスト'}<span className="text-[22px] text-pink-400 font-bold italic translate-y-[1px]">さん</span></h1>
        <p className="text-[14px] font-black text-gray-500 mt-1 italic opacity-80">お疲れ様です🍵</p>
      </header>

      {/* 2. タブ */}
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-3 space-y-2">
        {/* 3. 月間実績 */}
        {!isRequestMode && (
          <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[32px] p-5 border border-pink-200 relative overflow-hidden shadow-sm flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-black text-pink-500 tracking-tighter leading-none h-8 flex items-center">{format(viewDate, 'M月')}の実績</h2>
              <div className="flex gap-1.5">
                <div className="bg-white/90 px-2.5 py-1 h-8 rounded-xl flex items-center border border-pink-50 shadow-sm gap-0.5">
                  <span className="text-[9px] font-black text-gray-400">出勤</span><span className="text-[18px] font-black text-pink-500">{monthlyTotals.count}</span><span className="text-[9px] font-black text-gray-400">日</span>
                </div>
                <div className="bg-white/90 px-2.5 py-1 h-8 rounded-xl flex items-center border border-pink-50 shadow-sm gap-0.5">
                  <span className="text-[9px] font-black text-gray-400">稼働</span><span className="text-[18px] font-black text-pink-500">{Math.round(monthlyTotals.hours * 10) / 10}</span><span className="text-[9px] font-black text-gray-400">h</span>
                </div>
              </div>
            </div>
            <div className="text-center"><p className="text-[52px] font-black text-pink-600 leading-none tracking-tighter"><span className="text-2xl mr-1 opacity-40 translate-y-[-4px] inline-block">¥</span>{monthlyTotals.amount.toLocaleString()}</p></div>
            <div className="grid grid-cols-3 gap-0.5 bg-white/40 rounded-2xl border border-white/60 text-center py-2">
              <div><p className="text-[10px] text-pink-400 font-black leading-tight">フリー</p><p className="text-xl font-black text-pink-600 leading-none">{monthlyTotals.f || 0}</p></div>
              <div className="border-x border-pink-100/50"><p className="text-[10px] text-pink-400 font-black leading-tight">初指名</p><p className="text-xl font-black text-pink-600 leading-none">{monthlyTotals.first || 0}</p></div>
              <div><p className="text-[10px] text-pink-400 font-black leading-tight">本指名</p><p className="text-xl font-black text-pink-600 leading-none">{monthlyTotals.main || 0}</p></div>
            </div>
          </section>
        )}

        {/* 4. カレンダー */}
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar shifts={shifts} selectedDates={isRequestMode ? multiDates : singleDate} onSelect={handleDateSelect} month={viewDate} onMonthChange={setViewDate} isRequestMode={isRequestMode} />
        </section>

        {/* 5. 日付詳細 (実績入力・お休み統合版) */}
        {!isRequestMode && (
          <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl p-5 flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline">{singleDate ? format(singleDate, 'M/d') : ''}<span className="text-lg ml-1 opacity-70">({singleDate ? format(singleDate, 'E', { locale: ja }) : ''})</span></h3>
              <div className="flex items-center gap-1.5">
                {/* 💡 お休み統合ロジック: 確定お休み または データなし の場合 */}
                {(!dayOfficial || dayOfficial.start_time === 'OFF') && !dayRequested ? (
                  <span className="text-[13px] font-black text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 leading-none">お休み</span>
                ) : dayOfficial ? (
                  <>
                    <span className="text-[13px] font-black text-blue-500 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 leading-none">確定シフト</span>
                    <span className="text-[22px] font-black text-pink-500 leading-none">{dayOfficial.start_time}〜{dayOfficial.end_time}</span>
                  </>
                ) : dayRequested ? (
                  <>
                    <span className="text-[13px] font-black text-purple-500 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100 leading-none">申請中</span>
                    <span className="text-[22px] font-black text-purple-400 leading-none">{dayRequested.start_time === 'OFF' ? 'お休み' : `${dayRequested.start_time}〜${dayRequested.end_time}`}</span>
                  </>
                ) : null}
              </div>
            </div>

            {/* 出勤実績の入力欄（確定シフトがある時のみ） */}
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
            ) : ( 
              <div className="py-8 text-center text-gray-300 font-bold italic text-xs">
                {dayRequested ? "確定をお待ちください⛄️" : "お休みです☕️"}
              </div> 
            )}
          </section>
        )}

        {/* 6. NEWS 等は変更なしのため省略 */}
      </main>
      
      {/* 7. フッター等は変更なし */}
    </div>
  );
}