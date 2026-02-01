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
    const castName = castProfile?.display_name || 'キャスト';
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
          content: `🔔 **シフト申請を受信しました**`,
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
      
      {/* 🏔️ ヘッダー */}
      <header className="bg-white px-6 pt-14 pb-6 rounded-b-[40px] shadow-sm border-b border-pink-50">
        <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1.5">KarintoCastManager v2.5.2</p>
        <h1 className="text-3xl font-black flex items-baseline gap-1.5 leading-none">
          {castProfile?.display_name || 'キャスト'}
          <span className="text-[22px] text-pink-400 font-bold italic translate-y-[1px]">さん⛄️</span>
        </h1>
        <p className="text-[13px] font-bold text-gray-400 mt-2 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          {shopInfo?.shop_name || 'Karinto'} お疲れ様です🍵
        </p>
      </header>

      {/* 📱 タブ */}
      <div className="flex p-1.5 bg-gray-100/80 mx-6 mt-6 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${isRequestMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-4 mt-6 space-y-5">
        
        {/* 📊 実績カード */}
        <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[32px] p-5 border border-pink-200 relative overflow-hidden">
          <span className="absolute -right-4 -top-8 text-[120px] font-black text-pink-200/20 italic leading-none">{format(viewDate, 'M')}</span>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-black text-pink-500 tracking-tighter bg-white/60 px-3 py-1 rounded-full border border-pink-100">{format(viewDate, 'M月')}の実績合計</h2>
              <div className="flex gap-2">
                <div className="bg-white/90 px-3 py-1.5 rounded-2xl flex items-baseline gap-0.5 shadow-sm border border-pink-50">
                  <span className="text-[10px] font-black text-gray-900 leading-none mr-0.5">出勤</span>
                  <span className="text-[20px] font-black text-pink-500 leading-none">{monthlyTotals.count}</span>
                  <span className="text-[10px] font-black text-gray-900 leading-none">日</span>
                </div>
                <div className="bg-white/90 px-3 py-1.5 rounded-2xl flex items-baseline gap-0.5 shadow-sm border border-pink-50">
                  <span className="text-[10px] font-black text-gray-900 leading-none mr-0.5">稼働</span>
                  <span className="text-[20px] font-black text-pink-500 leading-none">{Math.round(monthlyTotals.hours * 10) / 10}</span>
                  <span className="text-[10px] font-black text-gray-900 leading-none">h</span>
                </div>
              </div>
            </div>
            <p className="text-[52px] font-black text-pink-600 text-center mb-5 leading-none tracking-tighter">
              <span className="text-2xl mr-0.5 leading-none">¥</span>{monthlyTotals.amount.toLocaleString()}
            </p>
            <div className="grid grid-cols-3 gap-0.5 w-full bg-white/40 rounded-[20px] border border-white/60 text-center shadow-inner">
              <div className="py-3"><p className="text-[11px] text-pink-400 font-black mb-1">フリー</p><p className="text-2xl font-black text-pink-600 leading-none">{monthlyTotals.f}</p></div>
              <div className="py-3 border-x border-pink-100/50"><p className="text-[11px] text-pink-400 font-black mb-1">初指名</p><p className="text-2xl font-black text-pink-600 leading-none">{monthlyTotals.first}</p></div>
              <div className="py-3"><p className="text-[11px] text-pink-400 font-black mb-1">本指名</p><p className="text-2xl font-black text-pink-600 leading-none">{monthlyTotals.main}</p></div>
            </div>
          </div>
        </section>

        <section className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <DashboardCalendar shifts={shifts} selectedDates={isRequestMode ? multiDates : singleDate} onSelect={(v:any)=>isRequestMode?setMultiDates(v||[]):setSingleDate(v)} month={viewDate} onMonthChange={setViewDate} isRequestMode={isRequestMode} />
        </section>

        {isRequestMode ? (
          /* 💜 シフト申請パネル */
          <section className="bg-white rounded-[32px] border-2 border-purple-50 p-5 shadow-xl space-y-4">
            <h3 className="font-black text-purple-600 text-[14px] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
              選択中の日程 ({multiDates.length})
            </h3>
            <div className="max-h-[340px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {multiDates.length === 0 ? (
                <div className="py-12 text-center text-gray-300 font-bold italic text-sm">カレンダーから日付を選んでください 🗓️</div>
              ) : (
                multiDates.sort((a,b)=>a.getTime()-b.getTime()).map(d => {
                  const key = format(d, 'yyyy-MM-dd');
                  const offS = (shifts || []).find(s => s.shift_date === key && s.status === 'official');
                  const pendS = (shifts || []).find(s => s.shift_date === key && s.status === 'requested');
                  return (
                    <div key={key} className={`p-4 rounded-[22px] border transition-all ${offS ? 'bg-blue-50/20 border-blue-100' : 'bg-rose-50/20 border-rose-100'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[14px] font-black ${offS ? 'text-blue-500' : 'text-rose-500'}`}>{format(d, 'M/d(ee)', {locale: ja})}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${offS ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>{offS ? '変更申請' : '新規申請'}</span>
                      </div>
                      <div className="flex gap-2 mb-3">
                        {offS && <div className="bg-blue-100/50 px-2 py-1 rounded-lg border border-blue-100/50"><span className="text-[8px] font-black text-blue-400 block uppercase italic leading-none mb-1">確定済み</span><span className="text-[11px] font-black text-blue-600">{offS.start_time}〜{offS.end_time}</span></div>}
                        {pendS && <div className="bg-amber-100/50 px-2 py-1 rounded-lg border border-amber-200/50"><span className="text-[8px] font-black text-amber-500 block uppercase italic leading-none mb-1">申請中</span><span className="text-[11px] font-black text-amber-600">{pendS.start_time}〜{pendS.end_time}</span></div>}
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-50">
                        <div className="flex items-center gap-1 flex-1">
                          <select value={requestDetails[key]?.s} onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],s:e.target.value}})} className="bg-gray-50 text-[13px] font-black border-none rounded-lg p-2 flex-1 text-center appearance-none">
                            {requestDetails[key]?.s === 'OFF' && <option value="OFF">OFF</option>}
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-gray-300 font-bold">~</span>
                          <select value={requestDetails[key]?.e} onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],e:e.target.value}})} className="bg-gray-50 text-[13px] font-black border-none rounded-lg p-2 flex-1 text-center appearance-none">
                            {requestDetails[key]?.e === 'OFF' && <option value="OFF">OFF</option>}
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <button onClick={()=>setRequestDetails({...requestDetails,[key]:{s:'OFF',e:'OFF'}})} className="bg-gray-100 text-[10px] font-black text-gray-400 px-3 py-2.5 rounded-xl uppercase">休み</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button disabled={multiDates.length === 0} onClick={handleBulkSubmit} className="w-full bg-purple-600 text-white font-black py-5 rounded-[22px] text-lg shadow-lg active:scale-95 transition-all tracking-[0.2em]">申請を送信する 🚀</button>
          </section>
        ) : (
          /* 💖 実績入力：バッジの配置を修正 */
          <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl overflow-hidden pb-5">
            <div className="bg-[#FFF8F9] p-5 border-b border-pink-50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-800">{singleDate ? format(singleDate, 'M/d (eee)', { locale: ja }) : ''}</h3>
                <div className="flex flex-col items-end gap-1">
                  {/* ✨ 【重要】確定シフトバッジを時間の右側に配置 */}
                  <div className="flex items-center gap-2">
                    <span className="text-pink-500 font-black text-2xl tracking-tighter leading-none">
                      {dayOfficial ? `${dayOfficial.start_time}~${dayOfficial.end_time}` : <span className="text-sm text-gray-300 font-bold italic">お休み</span>}
                    </span>
                    {dayOfficial && (
                      <span className="text-[10px] font-black px-2 py-1 bg-blue-500 text-white rounded-lg shadow-sm leading-none whitespace-nowrap">
                        確定シフト
                      </span>
                    )}
                  </div>
                  {/* ✨ 申請中バッジはすぐ下に控えめに表示 */}
                  {dayPending && (
                    <span className="text-[10px] font-black px-2 py-1 bg-amber-500 text-white rounded-lg animate-pulse shadow-sm leading-none">
                      申請中: {dayPending.start_time}〜{dayPending.end_time}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {dayOfficial ? (
              <div className="p-5 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {(['f', 'first', 'main'] as const).map((key) => (
                    <div key={key} className="space-y-2">
                      <label className="text-[12px] font-black block text-gray-900 text-center">{key==='f'?'フリー':key==='first'?'初指名':'本指名'}</label>
                      <input type="number" inputMode="numeric" value={editReward[key]} onFocus={e=>e.target.select()} onChange={e=>setEditReward({...editReward,[key]:e.target.value})} className={`w-full text-center py-3 bg-gray-50 rounded-2xl font-black text-2xl border-2 transition-all ${editReward[key]===''?'border-gray-50 text-gray-200':'border-pink-100 text-pink-500 bg-white shadow-sm'}`} />
                    </div>
                  ))}
                </div>
                <div className="bg-pink-50/50 p-4 rounded-[24px] border border-pink-100 flex items-center justify-between shadow-inner">
                  <label className="text-[13px] font-black text-gray-900">本日の報酬合計</label>
                  <div className="flex items-center text-pink-500">
                    <span className="text-2xl font-black mr-1 translate-y-[2px]">¥</span>
                    <input type="text" inputMode="numeric" value={editReward.amount!==''?Number(editReward.amount).toLocaleString():''} onFocus={e=>e.target.select()} onChange={e=>{const v=e.target.value.replace(/,/g,''); if(/^\d*$/.test(v))setEditReward({...editReward,amount:v});}} className="w-32 text-right bg-transparent font-black text-[36px] focus:ring-0 border-none tracking-tighter" />
                  </div>
                </div>
                <button onClick={() => {
                  const dateStr = format(singleDate!, 'yyyy-MM-dd');
                  supabase.from('shifts').update({ f_count: Number(editReward.f), first_request_count: Number(editReward.first), main_request_count: Number(editReward.main), reward_amount: Number(editReward.amount) || 0 }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr).then(() => { fetchInitialData(); alert('実績を保存しました💰'); });
                }} className="w-full bg-pink-500 text-white font-black py-5 rounded-[22px] text-xl shadow-lg active:scale-95 transition-all tracking-[0.2em]">実績を保存 💾</button>
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <p className="text-gray-300 font-bold italic text-sm">確定シフトがありません⛄️</p>
              </div>
            )}
          </section>
        )}

        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="bg-gray-50 p-2.5 px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">店舗からのお知らせ</div>
          <div className="divide-y divide-gray-50">
            {newsList.map((n) => (
              <div key={n.id} className="p-4 px-5 flex gap-4 items-start">
                <span className="text-[10px] text-pink-300 font-black mt-1 shrink-0 bg-pink-50 px-1.5 py-0.5 rounded leading-none">{format(parseISO(n.created_at), 'MM/dd')}</span>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-8 pt-4">
        <nav className="flex justify-around items-center max-md mx-auto px-6">
          <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1.5"><span className={`text-2xl ${!isRequestMode ? 'opacity-100' : 'opacity-30'}`}>🏠</span><span className={`text-[9px] font-black uppercase ${!isRequestMode ? 'text-pink-500' : 'text-gray-300'}`}>ホーム</span></button>
          <button onClick={() => router.push('/salary')} className="flex flex-col items-center gap-1.5"><span className="text-2xl opacity-30">💰</span><span className="text-[9px] font-black text-gray-300 uppercase">給与明細</span></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center gap-1.5"><span className="text-2xl opacity-30">🚪</span><span className="text-[9px] font-black text-gray-300 uppercase">ログアウト</span></button>
        </nav>
      </footer>
    </div>
  );
}