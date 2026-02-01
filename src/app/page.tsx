'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
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
    <div className="min-h-screen bg-[#FFFDFE] text-gray-800 pb-40 font-sans overflow-x-hidden">
      
      {/* 🏔️ ヘッダー */}
      <header className="bg-white px-6 pt-14 pb-6 rounded-b-[40px] shadow-sm border-b border-pink-50">
        <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1.5">KarintoCastManager v2.6.2</p>
        <h1 className="text-3xl font-black flex items-baseline gap-1.5 leading-none">
          {castProfile?.display_name || 'キャスト'}
          <span className="text-[22px] text-pink-400 font-bold italic translate-y-[1px]">さん⛄️</span>
        </h1>
      </header>

      {/* 📱 タブ */}
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-6 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-6 space-y-5">
        
        {/* 実績サマリー (実績入力モードのみ表示) */}
        {!isRequestMode && (
          <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[32px] p-5 border border-pink-200">
            <p className="text-[52px] font-black text-pink-600 text-center mb-5 leading-none tracking-tighter">
              <span className="text-2xl mr-0.5 leading-none">¥</span>{monthlyTotals.amount.toLocaleString()}
            </p>
          </section>
        )}

        {/* 📅 カレンダー */}
        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar 
            shifts={shifts} 
            selectedDates={isRequestMode ? multiDates : singleDate} 
            onSelect={handleDateSelect}
            month={viewDate} 
            onMonthChange={setViewDate} 
            isRequestMode={isRequestMode} 
          />
        </section>

        {isRequestMode ? (
          /* 💜 シフト申請パネル (視認性大幅向上版) */
          <section className="bg-white rounded-[32px] border border-gray-100 p-5 shadow-xl space-y-4">
            <h3 className="font-black text-purple-600 text-[14px] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
              申請リスト ({multiDates.length})
            </h3>
            
            <div className="max-h-[500px] overflow-y-auto space-y-8 pr-1 custom-scrollbar">
              {multiDates.length === 0 ? (
                <div className="py-12 text-center text-gray-300 font-bold italic text-sm leading-relaxed">カレンダーから<br/>日付を選択してください 🗓️</div>
              ) : (
                multiDates.sort((a,b)=>a.getTime()-b.getTime()).map(d => {
                  const key = format(d, 'yyyy-MM-dd');
                  const offS = (shifts || []).find(s => s.shift_date === key && s.status === 'official');
                  const isOff = requestDetails[key]?.s === 'OFF';

                  return (
                    <div key={key} className="relative pl-3 border-l-4 border-gray-50 pb-1">
                      {/* 1. 日付・曜日・確定状況 */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[16px] font-black text-gray-800">
                          {format(d, 'M/d', {locale: ja})}<span className="text-gray-400 ml-1">({format(d, 'E', {locale: ja})})</span>
                        </span>
                        {offS && (
                          <span className="text-[11px] font-bold text-blue-500">
                            確定済み {offS.start_time}〜{offS.end_time}
                          </span>
                        )}
                      </div>

                      {/* 2. 入力エリア (バッジ + セパレート時間 + 休み) */}
                      <div className="flex items-center gap-2">
                        {/* バッジ */}
                        <div className={`shrink-0 w-16 text-center text-[10px] font-black py-2.5 rounded-xl leading-none ${offS ? 'bg-blue-500 text-white' : 'bg-pink-400 text-white'}`}>
                          {offS ? '変更申請' : '新規申請'}
                        </div>

                        {/* 時間：開始ボタン */}
                        <div className={`flex-1 relative ${isOff ? 'opacity-20' : ''}`}>
                          <select 
                            disabled={isOff}
                            value={requestDetails[key]?.s} 
                            onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],s:e.target.value}})} 
                            className="w-full bg-gray-100 border border-gray-200 text-[14px] font-black py-3 rounded-2xl text-center appearance-none focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                          >
                            {requestDetails[key]?.s === 'OFF' && <option value="OFF">OFF</option>}
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        <span className={`text-gray-300 font-bold text-xs ${isOff ? 'opacity-20' : ''}`}>～</span>

                        {/* 時間：終了ボタン */}
                        <div className={`flex-1 relative ${isOff ? 'opacity-20' : ''}`}>
                          <select 
                            disabled={isOff}
                            value={requestDetails[key]?.e} 
                            onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],e:e.target.value}})} 
                            className="w-full bg-gray-100 border border-gray-200 text-[14px] font-black py-3 rounded-2xl text-center appearance-none focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                          >
                            {requestDetails[key]?.e === 'OFF' && <option value="OFF">OFF</option>}
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        {/* 休みボタン */}
                        <button 
                          onClick={() => {
                            const nextVal = isOff ? {s: '11:00', e: '23:00'} : {s: 'OFF', e: 'OFF'};
                            setRequestDetails({...requestDetails, [key]: nextVal});
                          }} 
                          className={`shrink-0 w-12 py-3 rounded-2xl text-[11px] font-black transition-all ${isOff ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500'}`}
                        >
                          休み
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button disabled={multiDates.length === 0} onClick={handleBulkSubmit} className="w-full bg-purple-600 text-white font-black py-5 rounded-2xl text-lg shadow-lg active:scale-95 transition-all tracking-[0.2em]">申請を送信する 🚀</button>
          </section>
        ) : (
          /* 💖 実績入力 (v2.6.0 デザイン継承) */
          <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl p-5 space-y-6">
            <h3 className="text-xl font-black text-gray-800">{singleDate ? format(singleDate, 'M/d (E)', { locale: ja }) : ''}</h3>
            
            {dayOfficial ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {(['f', 'first', 'main'] as const).map((key) => (
                    <div key={key} className="space-y-2 text-center">
                      <label className="text-[12px] font-black text-gray-500">{key==='f'?'フリー':key==='first'?'初指名':'本指名'}</label>
                      <input type="number" inputMode="numeric" value={editReward[key]} onFocus={e=>e.target.select()} onChange={e=>setEditReward({...editReward,[key]:e.target.value})} className="w-full text-center py-4 bg-white rounded-2xl font-black text-2xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none caret-pink-500 text-pink-500" />
                    </div>
                  ))}
                </div>
                
                <div className="bg-pink-50/50 p-4 rounded-3xl border border-pink-100 flex items-center justify-between">
                  <label className="text-[13px] font-black text-gray-900">報酬合計</label>
                  <div className="flex items-center text-pink-500">
                    <span className="text-xl font-black mr-1 opacity-40">¥</span>
                    <input type="text" inputMode="numeric" value={editReward.amount!==''?Number(editReward.amount).toLocaleString():''} onFocus={e=>e.target.select()} onChange={e=>{const v=e.target.value.replace(/,/g,''); if(/^\d*$/.test(v))setEditReward({...editReward,amount:v});}} className="w-36 text-right bg-transparent font-black text-[32px] border-none focus:ring-0 caret-pink-500" />
                  </div>
                </div>
                
                <button onClick={() => {
                  if ((Number(editReward.f)+Number(editReward.first)+Number(editReward.main)) < 1) { alert('本数を入力してください'); return; }
                  const dateStr = format(singleDate!, 'yyyy-MM-dd');
                  supabase.from('shifts').update({ f_count: Number(editReward.f), first_request_count: Number(editReward.first), main_request_count: Number(editReward.main), reward_amount: Number(editReward.amount) || 0 }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr).then(() => { fetchInitialData(); alert('保存しました💰'); });
                }} className="w-full bg-pink-500 text-white font-black py-5 rounded-2xl text-xl shadow-lg active:scale-95 transition-all">実績を保存 💾</button>
              </>
            ) : (
              <p className="py-12 text-center text-gray-300 font-bold italic">確定シフトがありません</p>
            )}
          </section>
        )}
      </main>

      {/* フッター固定メニュー */}
      <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-8 pt-4">
        <nav className="flex justify-around items-center max-md mx-auto px-6">
          <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1.5 text-pink-500"><span className="text-2xl opacity-100">🏠</span><span className="text-[9px] font-black uppercase">ホーム</span></button>
          <button onClick={() => router.push('/salary')} className="flex flex-col items-center gap-1.5 text-gray-300"><span className="text-2xl opacity-30">💰</span><span className="text-[9px] font-black uppercase">給与明細</span></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center gap-1.5 text-gray-300"><span className="text-2xl opacity-30">🚪</span><span className="text-[9px] font-black uppercase">ログアウト</span></button>
        </nav>
      </footer>
    </div>
  );
}