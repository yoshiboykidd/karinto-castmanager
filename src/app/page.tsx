'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO, startOfToday } from 'date-fns';
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
        return {
          amount: acc.amount + (Number(s.reward_amount) || 0),
          f: acc.f + (Number(s.f_count) || 0),
          first: acc.first + (Number(s.first_request_count) || 0),
          main: acc.main + (Number(s.main_request_count) || 0),
          count: acc.count + 1,
          hours: acc.hours + dur,
        };
      }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });
  }, [shifts, viewDate]);

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

  const handleDateSelect = (dates: any) => {
    if (isRequestMode) {
      const tomorrow = startOfToday();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const validDates = (dates as Date[] || []).filter(d => d >= tomorrow);
      setMultiDates(validDates);
    } else {
      setSingleDate(dates as Date);
    }
  };

  useEffect(() => {
    if (isRequestMode || !singleDate) return;
    const dateStr = format(singleDate, 'yyyy-MM-dd');
    const shift = (shifts || []).find(s => s.shift_date === dateStr && s.status === 'official');
    const v = (val: any) => (val === null || val === undefined) ? '' : String(val);
    setEditReward({ f: v(shift?.f_count), first: v(shift?.first_request_count), main: v(shift?.main_request_count), amount: v(shift?.reward_amount) });
  }, [singleDate, shifts, isRequestMode]);

  const handleBulkSubmit = async () => {
    if (!castProfile) return;
    const requests = multiDates.map(date => {
      const key = format(date, 'yyyy-MM-dd');
      return { 
        login_id: castProfile.login_id, 
        hp_display_name: castProfile.display_name || 'キャスト',
        shift_date: key, 
        start_time: requestDetails[key]?.s || '11:00', 
        end_time: requestDetails[key]?.e || '23:00', 
        status: 'requested', 
        is_official: false,
        is_official_pre_exist: (shifts || []).some(s => s.shift_date === key && s.status === 'official')
      };
    });
    const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
    if (!error) { alert('申請を送信しました！🚀'); setMultiDates([]); fetchInitialData(); }
    else { alert(`エラー: ${error.message}`); }
  };

  if (loading) return ( <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black italic text-5xl text-pink-300 animate-pulse">KARINTO...</div> );

  const targetDateStr = singleDate ? format(singleDate, 'yyyy-MM-dd') : '';
  const dayOfficial = (shifts || []).find(s => s.shift_date === targetDateStr && s.status === 'official');

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-36 font-sans overflow-x-hidden">
      
      <header className="bg-white px-6 pt-10 pb-3 rounded-b-[40px] shadow-sm border-b border-pink-50">
        <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1 leading-none underline decoration-pink-100 decoration-2 underline-offset-4">KarintoCastManager v2.7.7</p>
        <h1 className="text-3xl font-black flex items-baseline gap-1.5 leading-none">
          {castProfile?.display_name || 'キャスト'}<span className="text-[22px] text-pink-400 font-bold italic translate-y-[1px]">さん⛄️</span>
        </h1>
        <p className="text-[13px] font-bold text-gray-400 mt-2 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          {shopInfo?.shop_name || 'Karinto'} お疲れ様です🍵
        </p>
      </header>

      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-2 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-3 space-y-3">
        {!isRequestMode && (
          <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[32px] p-5 border border-pink-200 relative overflow-hidden shadow-sm">
            <span className="absolute -right-4 -top-8 text-[120px] font-black text-pink-200/20 italic leading-none pointer-events-none">{format(viewDate, 'M')}</span>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-black text-pink-500 tracking-tighter bg-white/60 px-3 py-1 rounded-full border border-pink-100">{format(viewDate, 'M月')}の実績</h2>
                <div className="flex gap-1.5">
                  <div className="bg-white/90 px-2.5 py-1 rounded-xl flex items-baseline gap-0.5 border border-pink-50">
                    <span className="text-[9px] font-black text-gray-400 mr-0.5">出勤</span>
                    <span className="text-[18px] font-black text-pink-500">{monthlyTotals.count}</span>
                    <span className="text-[9px] font-black text-gray-400">日</span>
                  </div>
                  <div className="bg-white/90 px-2.5 py-1 rounded-xl flex items-baseline gap-0.5 border border-pink-50">
                    <span className="text-[9px] font-black text-gray-400 mr-0.5">稼働</span>
                    <span className="text-[18px] font-black text-pink-500">{Math.round(monthlyTotals.hours * 10) / 10}</span>
                    <span className="text-[9px] font-black text-gray-400">h</span>
                  </div>
                </div>
              </div>
              <p className="text-[52px] font-black text-pink-600 text-center leading-none tracking-tighter mb-4">
                <span className="text-2xl mr-1 opacity-40 translate-y-[-4px] inline-block">¥</span>{monthlyTotals.amount.toLocaleString()}
              </p>
              <div className="grid grid-cols-3 gap-0.5 bg-white/40 rounded-2xl border border-white/60 text-center py-2">
                <div><p className="text-[10px] text-pink-400 font-black">フリー</p><p className="text-xl font-black text-pink-600">{monthlyTotals.f || 0}</p></div>
                <div className="border-x border-pink-100/50"><p className="text-[10px] text-pink-400 font-black">初指名</p><p className="text-xl font-black text-pink-600">{monthlyTotals.first || 0}</p></div>
                <div><p className="text-[10px] text-pink-400 font-black">本指名</p><p className="text-xl font-black text-pink-600">{monthlyTotals.main || 0}</p></div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar shifts={shifts} selectedDates={isRequestMode ? multiDates : singleDate} onSelect={handleDateSelect} month={viewDate} onMonthChange={setViewDate} isRequestMode={isRequestMode} />
        </section>

        {isRequestMode ? (
          <section className="bg-white rounded-[32px] border border-gray-100 p-4 shadow-xl space-y-3">
            <h3 className="font-black text-purple-600 text-[13px] uppercase tracking-widest flex items-center gap-2 ml-1">
              <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
              申請リスト ({multiDates.length})
            </h3>
            <div className="max-h-[500px] overflow-y-auto space-y-7 pr-1 custom-scrollbar">
              {multiDates.sort((a,b)=>a.getTime()-b.getTime()).map(d => {
                const key = format(d, 'yyyy-MM-dd');
                const offS = (shifts || []).find(s => s.shift_date === key && s.status === 'official');
                const isOff = requestDetails[key]?.s === 'OFF';
                return (
                  <div key={key} className="space-y-2 pb-1 border-b border-gray-50 last:border-0">
                    <div className="px-1 flex items-center justify-between">
                      <span className="text-[17px] font-black text-gray-800">{format(d, 'M/d', {locale: ja})}<span className="text-gray-400 ml-1 font-bold">({format(d, 'E', {locale: ja})})</span></span>
                      {offS && <span className="text-[13px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">確定：{offS.start_time} 〜 {offS.end_time}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`shrink-0 w-20 h-12 flex items-center justify-center text-[13px] font-black rounded-xl leading-none shadow-sm ${offS ? 'bg-blue-500 text-white' : 'bg-pink-400 text-white'}`}>{offS ? '変更申請' : '新規申請'}</div>
                      <div className={`flex-1 h-12 relative ${isOff ? 'opacity-20' : ''}`}>
                        <select disabled={isOff} value={requestDetails[key]?.s} onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],s:e.target.value}})} style={{ textAlignLast: 'center' }} className="w-full h-full bg-gray-50 border border-gray-100 text-[20px] font-black rounded-xl text-center appearance-none focus:outline-none focus:border-purple-300 transition-all">
                          {requestDetails[key]?.s === 'OFF' && <option value="OFF">OFF</option>}
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <span className={`text-gray-300 font-bold ${isOff ? 'opacity-20' : ''}`}>～</span>
                      <div className={`flex-1 h-12 relative ${isOff ? 'opacity-20' : ''}`}>
                        <select disabled={isOff} value={requestDetails[key]?.e} onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],e:e.target.value}})} style={{ textAlignLast: 'center' }} className="w-full h-full bg-gray-50 border border-gray-100 text-[20px] font-black rounded-xl text-center appearance-none focus:outline-none focus:border-purple-300 transition-all">
                          {requestDetails[key]?.e === 'OFF' && <option value="OFF">OFF</option>}
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <button onClick={() => { const nextVal = isOff ? {s: '11:00', e: '23:00'} : {s: 'OFF', e: 'OFF'}; setRequestDetails({...requestDetails, [key]: nextVal}); }} className={`shrink-0 w-12 h-12 rounded-xl text-[12px] font-black transition-all ${isOff ? 'bg-gray-800 text-white shadow-inner' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>休み</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => handleBulkSubmit()} className="w-full bg-purple-600 text-white font-black py-5 rounded-[22px] text-lg shadow-lg active:scale-95 transition-all tracking-[0.2em]">申請を確定する 🚀</button>
          </section>
        ) : (
          /* 💖 実績入力 (超高密度レイアウト) */
          <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl p-5 space-y-3">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{singleDate ? format(singleDate, 'M/d (E)', { locale: ja }) : ''}</h3>
              <div className="text-right">
                {dayOfficial ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 mb-0.5">確定シフト</span>
                    <span className="text-lg font-black text-pink-500 leading-none">{dayOfficial.start_time}〜{dayOfficial.end_time}</span>
                  </div>
                ) : ( <span className="text-[11px] text-gray-300 font-bold italic">シフトなし⛄️</span> )}
              </div>
            </div>

            {dayOfficial ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {(['f', 'first', 'main'] as const).map((key) => (
                    <div key={key} className="space-y-1 text-center">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key==='f'?'フリー':key==='first'?'初指名':'本指名'}</label>
                      <input 
                        type="number" 
                        inputMode="numeric" 
                        value={editReward[key]} 
                        placeholder="0"
                        onFocus={e=>e.target.select()} 
                        onChange={e => setEditReward({...editReward, [key]: e.target.value})} 
                        className={`w-full text-center py-3 bg-white rounded-xl font-black text-2xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none caret-pink-500 transition-all ${editReward[key] === '' ? 'text-gray-200' : 'text-pink-500'}`} 
                      />
                    </div>
                  ))}
                </div>
                
                <div className="bg-pink-50/40 p-3.5 rounded-[22px] border border-pink-100 flex items-center justify-between shadow-inner">
                  <label className="text-[12px] font-black text-gray-900 uppercase">報酬合計</label>
                  <div className="flex items-center text-pink-500">
                    <span className="text-xl font-black mr-1 opacity-40 translate-y-[1px]">¥</span>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={editReward.amount!==''?Number(editReward.amount).toLocaleString():''} 
                      placeholder="0"
                      onFocus={e=>e.target.select()} 
                      onChange={e=>{
                        const v=e.target.value.replace(/,/g,''); 
                        if(/^\d*$/.test(v))setEditReward({...editReward,amount:v});
                      }} 
                      className={`w-36 text-right bg-transparent font-black text-[28px] border-none focus:ring-0 caret-pink-500 tracking-tighter ${editReward.amount === '' ? 'text-gray-200' : 'text-pink-500'}`} 
                    />
                  </div>
                </div>
                
                {/* ボタン順序入れ替え： [保存] が右、[クリア] が左 */}
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => setEditReward({ f: '', first: '', main: '', amount: '' })}
                    className="flex-1 bg-gray-100 text-gray-400 font-black py-4 rounded-[18px] text-[13px] active:scale-95 transition-all shadow-sm border border-gray-200"
                  >
                    クリア 🗑️
                  </button>
                  <button 
                    onClick={() => {
                      const dateStr = format(singleDate!, 'yyyy-MM-dd');
                      supabase.from('shifts').update({ 
                        f_count: Number(editReward.f) || 0, 
                        first_request_count: Number(editReward.first) || 0, 
                        main_request_count: Number(editReward.main) || 0, 
                        reward_amount: Number(editReward.amount) || 0 
                      }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr).then(() => { 
                        fetchInitialData(); 
                        alert('実績を保存しました💰'); 
                      });
                    }} 
                    className="flex-[2.5] bg-pink-500 text-white font-black py-4 rounded-[20px] text-lg shadow-lg active:scale-95 transition-all tracking-[0.05em]"
                  >
                    実績を保存 💾
                  </button>
                </div>
              </>
            ) : null }
          </section>
        )}

        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="bg-gray-50 p-2.5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 flex justify-between items-center">
            <span>News / Shop Info</span>
            <span className="w-2 h-2 bg-pink-300 rounded-full animate-pulse"></span>
          </div>
          <div className="divide-y divide-gray-50">
            {newsList.map((n) => (
              <div key={n.id} className="p-4 px-6 flex gap-4 items-start active:bg-pink-50/30 transition-colors">
                <span className="text-[10px] text-pink-400 font-black shrink-0 bg-pink-50 px-2 py-1 rounded leading-none mt-0.5">{format(parseISO(n.created_at), 'MM/dd')}</span>
                <p className="text-[13px] font-bold text-gray-700 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-8 pt-4">
        <nav className="flex justify-around items-center max-md mx-auto px-6">
          <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1.5"><span className={`text-2xl ${!isRequestMode ? 'opacity-100' : 'opacity-30'}`}>🏠</span><span className={`text-[9px] font-black uppercase ${!isRequestMode ? 'text-pink-500' : 'text-gray-300'}`}>ホーム</span></button>
          <button onClick={() => router.push('/salary')} className="flex flex-col items-center gap-1.5 text-gray-300"><span className="text-2xl opacity-30">💰</span><span className="text-[9px] font-black uppercase">給与明細</span></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center gap-1.5 text-gray-300"><span className="text-2xl opacity-30">🚪</span><span className="text-[9px] font-black uppercase">ログアウト</span></button>
        </nav>
      </footer>
    </div>
  );
}