'use client';

import { useEffect, useState } from 'react';
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
        start_time: requestDetails[key].s, 
        end_time: requestDetails[key].e, 
        status: 'requested', 
        is_official: false,
        is_official_pre_exist: (shifts || []).some(s => s.shift_date === key && s.status === 'official')
      };
    });
    const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
    if (!error) {
      alert('申請を送信しました！🚀');
      setMultiDates([]); fetchInitialData();
    } else { alert(`エラー: ${error.message}`); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black italic text-5xl text-pink-300 animate-pulse">KARINTO...</div>
  );

  const targetDateStr = singleDate ? format(singleDate, 'yyyy-MM-dd') : '';
  const dayOfficial = (shifts || []).find(s => s.shift_date === targetDateStr && s.status === 'official');

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-32 font-sans overflow-x-hidden">
      
      {/* 🏔️ ヘッダー (極限まで高さを圧縮) */}
      <header className="bg-white px-6 pt-10 pb-2 rounded-b-[30px] shadow-sm border-b border-pink-50">
        <p className="text-[9px] font-black text-pink-300 uppercase tracking-widest leading-none mb-1">KarintoCastManager v2.6.7</p>
        <h1 className="text-2xl font-black flex items-baseline gap-1 leading-none">
          {castProfile?.display_name || 'キャスト'}
          <span className="text-[18px] text-pink-400 font-bold italic translate-y-[1px]">さん⛄️</span>
        </h1>
        <p className="text-[12px] font-bold text-gray-400 mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
          {shopInfo?.shop_name || 'Karinto'} お疲れ様です
        </p>
      </header>

      {/* 📱 タブ (マージンを最小化) */}
      <div className="flex p-1 bg-gray-100/80 mx-5 mt-2 rounded-xl border border-gray-200">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-3 mt-2 space-y-2">
        
        {/* 実績サマリー (高さを抑える) */}
        {!isRequestMode && ( monthlyTotals.amount > 0 && (
          <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[24px] p-3 border border-pink-200 text-center">
             <p className="text-[44px] font-black text-pink-600 leading-none tracking-tighter">
              <span className="text-xl mr-0.5 opacity-60">¥</span>{monthlyTotals.amount.toLocaleString()}
            </p>
          </section>
        ))}

        {/* 📅 カレンダー */}
        <section className="bg-white p-1 rounded-[24px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar shifts={shifts} selectedDates={isRequestMode ? multiDates : singleDate} onSelect={handleDateSelect} month={viewDate} onMonthChange={setViewDate} isRequestMode={isRequestMode} />
        </section>

        {isRequestMode ? (
          /* 💜 シフト申請パネル (申請リストの隙間をギリギリまで詰める) */
          <section className="bg-white rounded-[24px] border border-gray-100 p-3 shadow-xl space-y-3">
            <h3 className="font-black text-purple-600 text-[12px] uppercase tracking-widest flex items-center gap-2 ml-1">
              <span className="w-1 h-3 bg-purple-500 rounded-full"></span>
              申請リスト ({multiDates.length})
            </h3>
            
            <div className="max-h-[450px] overflow-y-auto space-y-5 pr-1 custom-scrollbar">
              {multiDates.length === 0 ? (
                <div className="py-8 text-center text-gray-300 font-bold italic text-xs leading-relaxed">カレンダーから選択 🗓️</div>
              ) : (
                multiDates.sort((a,b)=>a.getTime()-b.getTime()).map(d => {
                  const key = format(d, 'yyyy-MM-dd');
                  const offS = (shifts || []).find(s => s.shift_date === key && s.status === 'official');
                  const isOff = requestDetails[key]?.s === 'OFF';

                  return (
                    <div key={key} className="space-y-1.5 pb-1 border-b border-gray-50 last:border-0">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[15px] font-black text-gray-800">
                          {format(d, 'M/d', {locale: ja})}<span className="text-gray-400 ml-1 font-bold">({format(d, 'E', {locale: ja})})</span>
                        </span>
                        {offS && (
                          <span className="text-[12px] font-black text-blue-500">
                            確定：{offS.start_time}〜{offS.end_time}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <div className={`shrink-0 w-16 h-11 flex items-center justify-center text-[12px] font-black rounded-xl leading-none ${offS ? 'bg-blue-500 text-white' : 'bg-pink-400 text-white'}`}>
                          {offS ? '変更' : '新規'}
                        </div>

                        <div className={`flex-1 h-11 relative ${isOff ? 'opacity-20' : ''}`}>
                          <select 
                            disabled={isOff}
                            value={requestDetails[key]?.s} 
                            onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],s:e.target.value}})} 
                            style={{ textAlignLast: 'center' }}
                            className="w-full h-full bg-gray-50 border border-gray-100 text-[18px] font-black rounded-xl text-center appearance-none focus:outline-none focus:border-purple-300 transition-all"
                          >
                            {requestDetails[key]?.s === 'OFF' && <option value="OFF">OFF</option>}
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        <span className={`text-gray-300 font-bold ${isOff ? 'opacity-20' : ''}`}>-</span>

                        <div className={`flex-1 h-11 relative ${isOff ? 'opacity-20' : ''}`}>
                          <select 
                            disabled={isOff}
                            value={requestDetails[key]?.e} 
                            onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],e:e.target.value}})} 
                            style={{ textAlignLast: 'center' }}
                            className="w-full h-full bg-gray-50 border border-gray-100 text-[18px] font-black rounded-xl text-center appearance-none focus:outline-none focus:border-purple-300 transition-all"
                          >
                            {requestDetails[key]?.e === 'OFF' && <option value="OFF">OFF</option>}
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        <button 
                          onClick={() => {
                            const nextVal = isOff ? {s: '11:00', e: '23:00'} : {s: 'OFF', e: 'OFF'};
                            setRequestDetails({...requestDetails, [key]: nextVal});
                          }} 
                          className={`shrink-0 w-10 h-11 rounded-xl text-[11px] font-black transition-all ${isOff ? 'bg-gray-800 text-white shadow-inner' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                        >
                          休
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button disabled={multiDates.length === 0} onClick={handleBulkSubmit} className="w-full bg-purple-600 text-white font-black py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all tracking-[0.2em]">申請を確定 🚀</button>
          </section>
        ) : (
          /* 💖 実績入力 (パディングを圧縮) */
          <section className="bg-white rounded-[24px] border border-pink-100 shadow-xl p-4 space-y-4">
            <h3 className="text-lg font-black text-gray-800 leading-none">{singleDate ? format(singleDate, 'M/d (E)', { locale: ja }) : ''}</h3>
            {dayOfficial ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {(['f', 'first', 'main'] as const).map((key) => (
                    <div key={key} className="space-y-1 text-center">
                      <label className="text-[11px] font-black text-gray-400">{key==='f'?'フリー':key==='first'?'初指名':'本指名'}</label>
                      <input type="number" inputMode="numeric" value={editReward[key]} onFocus={e=>e.target.select()} onChange={e=>setEditReward({...editReward,[key]:e.target.value})} className="w-full text-center py-3 bg-white rounded-xl font-black text-2xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none caret-pink-500 text-pink-500" />
                    </div>
                  ))}
                </div>
                <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100 flex items-center justify-between shadow-inner">
                  <label className="text-[12px] font-black text-gray-900">報酬額</label>
                  <div className="flex items-center text-pink-500">
                    <span className="text-lg font-black mr-1 opacity-40">¥</span>
                    <input type="text" inputMode="numeric" value={editReward.amount!==''?Number(editReward.amount).toLocaleString():''} onFocus={e=>e.target.select()} onChange={e=>{const v=e.target.value.replace(/,/g,''); if(/^\d*$/.test(v))setEditReward({...editReward,amount:v});}} className="w-32 text-right bg-transparent font-black text-[28px] border-none focus:ring-0 caret-pink-500 tracking-tighter" />
                  </div>
                </div>
                <button onClick={() => {
                  if ((Number(editReward.f)+Number(editReward.first)+Number(editReward.main)) < 1) { alert('本数を入力してください'); return; }
                  const dateStr = format(singleDate!, 'yyyy-MM-dd');
                  supabase.from('shifts').update({ f_count: Number(editReward.f), first_request_count: Number(editReward.first), main_request_count: Number(editReward.main), reward_amount: Number(editReward.amount) || 0 }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr).then(() => { fetchInitialData(); alert('保存完了💰'); });
                }} className="w-full bg-pink-500 text-white font-black py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all">実績を保存 💾</button>
              </>
            ) : ( <p className="py-8 text-center text-gray-300 font-bold italic text-sm">確定シフトなし⛄️</p> )}
          </section>
        )}

        {/* お知らせ (高さを最小限に) */}
        <section className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="bg-gray-50 p-2 px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">News</div>
          <div className="divide-y divide-gray-50">
            {newsList.map((n) => (
              <div key={n.id} className="p-3 px-4 flex gap-3 items-start">
                <span className="text-[9px] text-pink-300 font-black shrink-0 bg-pink-50 px-1 rounded">{format(parseISO(n.created_at), 'MM/dd')}</span>
                <p className="text-[11px] font-bold text-gray-700 leading-tight line-clamp-1">{n.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* フッターメニュー */}
      <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-gray-100 pb-6 pt-3">
        <nav className="flex justify-around items-center max-md mx-auto px-6">
          <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1"><span className={`text-xl ${!isRequestMode ? 'opacity-100' : 'opacity-30'}`}>🏠</span><span className={`text-[8px] font-black uppercase ${!isRequestMode ? 'text-pink-500' : 'text-gray-300'}`}>HOME</span></button>
          <button onClick={() => router.push('/salary')} className="flex flex-col items-center gap-1 text-gray-300"><span className="text-xl opacity-30">💰</span><span className="text-[8px] font-black uppercase">SALARY</span></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center gap-1 text-gray-300"><span className="text-xl opacity-30">🚪</span><span className="text-[8px] font-black uppercase">EXIT</span></button>
        </nav>
      </footer>
    </div>
  );
}