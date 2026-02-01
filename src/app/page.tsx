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
      const myShopId = castData.HOME_shop_ID || 'main';
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
      return (
        d.getMonth() === viewDate.getMonth() &&
        d.getFullYear() === viewDate.getFullYear() &&
        s.status === 'official'
      );
    })
    .reduce(
      (acc, s: any) => {
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
      },
      { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 }
    );

  useEffect(() => {
    const newDetails = { ...requestDetails };
    multiDates.forEach(d => {
      const key = format(d, 'yyyy-MM-dd');
      if (!newDetails[key]) {
        const existing = (shifts || []).find(s => s.shift_date === key && s.status === 'official');
        newDetails[key] = existing ? { s: existing.start_time, e: existing.end_time } : { s: '11:00', e: '23:00' };
      }
    });
    setRequestDetails(newDetails);
  }, [multiDates, shifts]);

  // 🔔 追跡・デバッグ機能付き通知ロジック
  const sendDiscordNotification = async (requestList: any[]) => {
    // 🔍 追跡1: shopInfoが取れているか
    if (!shopInfo) {
      alert("⚠️ デバッグ通知: shopInfo(店舗情報)が空です。キャストのHOME_shop_IDがshop_masterに存在するか確認してください。");
      return;
    }

    const webhookUrl = shopInfo.discord_webhook_url;
    
    // 🔍 追跡2: URLが取れているか
    if (!webhookUrl) {
      alert(`⚠️ デバッグ通知: 店舗「${shopInfo.shop_name}」にWebhook URLが設定されていません。shop_masterテーブルを確認してください。`);
      return;
    }

    const castName = castProfile?.display_name || 'Cast';
    const detailText = requestList.map(r => {
      const type = r.is_official_pre_exist ? "【変更申請】" : "【新規申請】";
      const timeStr = (r.start_time === 'OFF') ? "お休み希望" : `${r.start_time}〜${r.end_time}`;
      return `${type} ${r.shift_date} (${timeStr})`;
    }).join('\n');

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔔 **シフト申請を受信しました**`,
          embeds: [{
            title: `${castName} さん (${shopInfo.shop_name})`,
            description: detailText,
            color: 0xec4899,
            timestamp: new Date().toISOString(),
            footer: { text: "Karinto Cast Manager" }
          }]
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`❌ Discordが拒否しました: ${res.status} ${errorText}`);
      } else {
        console.log("Discord Success!");
      }
    } catch (err: any) {
      alert(`❌ 通信エラー: ${err.message}`);
    }
  };

  const handleBulkSubmit = async () => {
    if (!castProfile) { alert("エラー: キャスト情報がありません"); return; }

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
      // 🔍 ここで通知関数を呼び出す
      await sendDiscordNotification(requests);
      alert(`${multiDates.length}日分の申請をDBに保存しました。Discord通知を確認してください。🚀`);
      setMultiDates([]); 
      fetchInitialData();
    } else {
      alert(`DB保存エラー: ${error.message}`);
    }
  };

  // --- 以下デザイン部分は Ver 2.4.3 と同じ（聖域維持） ---
  if (loading) return (
    <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center">
      <div className="text-pink-300 tracking-tighter text-5xl italic animate-pulse" style={{ fontWeight: 900, textShadow: '2px 2px 0px rgba(249, 168, 212, 0.3)' }}>KARINTO...</div>
    </div>
  );

  const selectedShift = !isRequestMode && singleDate ? (shifts || []).find(s => s.shift_date === format(singleDate, 'yyyy-MM-dd')) : null;

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-800 pb-40 font-sans overflow-x-hidden">
      <header className="bg-white px-5 pt-12 pb-5 rounded-b-[30px] shadow-sm border-b border-pink-100">
        <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1">KarintoCastManager ver 2.4.4 (DEBUG)</p>
        <h1 className="text-3xl font-black flex items-baseline gap-1.5 leading-none">
          {castProfile?.display_name || 'Cast'}
          <span className="text-[24px] text-pink-400 font-bold italic translate-y-[1px]">さん⛄️</span>
        </h1>
        <p className="text-[13px] font-bold text-gray-500 mt-1 ml-0.5 tracking-tighter leading-none">{shopInfo?.shop_name || 'Karinto'} お疲れ様です🍵</p>
      </header>

      <div className="flex p-1 bg-gray-100 mx-5 mt-4 rounded-xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${isRequestMode ? 'bg-white text-purple-500 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-3 mt-3 space-y-3">
        {/* 実績合計 */}
        <section className="bg-[#FFE9ED] rounded-[22px] p-3 border border-pink-300 relative overflow-hidden shadow-sm">
          <span className="absolute -right-2 -top-6 text-[100px] font-black text-pink-200/20 italic select-none leading-none">{format(viewDate, 'M')}</span>
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-between gap-1 w-full leading-none mb-1.5">
              <h2 className="text-[13px] font-black text-pink-500 whitespace-nowrap tracking-tighter shrink-0">{format(viewDate, 'M月')}の実績合計</h2>
              <div className="flex gap-1.5">
                <div className="bg-white/95 border border-pink-200 px-3 py-1.5 rounded-xl flex items-baseline gap-0.5 shadow-sm shrink-0">
                  <span className="text-[10px] font-black text-gray-900 leading-none">出勤</span>
                  <span className="text-[20px] font-black text-pink-500 leading-none tracking-tighter">{monthlyTotals.count}</span>
                  <span className="text-[10px] font-black text-gray-900 leading-none italic font-bold">日</span>
                </div>
                <div className="bg-white/95 border border-pink-200 px-3 py-1.5 rounded-xl flex items-baseline gap-0.5 shadow-sm shrink-0">
                  <span className="text-[10px] font-black text-gray-900 leading-none">稼働</span>
                  <span className="text-[20px] font-black text-pink-500 leading-none tracking-tighter">{Math.round(monthlyTotals.hours * 10) / 10}</span>
                  <span className="text-[10px] font-black text-gray-900 leading-none italic font-bold">h</span>
                </div>
              </div>
            </div>
            <p className="text-[48px] font-black text-pink-500 text-center mb-2 leading-none tracking-tighter">
              <span className="text-xl mr-0.5 leading-none">¥</span>{monthlyTotals.amount.toLocaleString()}
            </p>
            <div className="grid grid-cols-3 gap-0.5 w-full bg-white/80 rounded-xl py-2 border border-pink-200 text-center shadow-inner">
              <div className="leading-none"><p className="text-[11px] text-pink-400 font-black mb-1">フリー</p><p className="text-xl font-black text-pink-600 leading-none">{monthlyTotals.f}</p></div>
              <div className="border-x border-pink-100 leading-none"><p className="text-[11px] text-pink-400 font-black mb-1 tracking-tighter">初指名</p><p className="text-xl font-black text-pink-600 leading-none">{monthlyTotals.first}</p></div>
              <div className="leading-none"><p className="text-[11px] text-pink-400 font-black mb-1 tracking-tighter">本指名</p><p className="text-xl font-black text-pink-600 leading-none">{monthlyTotals.main}</p></div>
            </div>
          </div>
        </section>

        <section className="bg-white p-1 rounded-[22px] border border-pink-200 shadow-sm overflow-hidden text-center">
          <DashboardCalendar shifts={shifts} selectedDates={isRequestMode ? multiDates : singleDate} onSelect={(v:any)=>isRequestMode?setMultiDates(v||[]):setSingleDate(v)} month={viewDate} onMonthChange={setViewDate} isRequestMode={isRequestMode} />
        </section>

        {isRequestMode ? (
          <section className="bg-white rounded-[24px] border border-purple-200 p-4 shadow-xl">
            <div className="flex justify-between items-center mb-4 leading-none">
              <h3 className="font-black text-purple-600 text-[13px] uppercase tracking-widest">選択中: {multiDates.length}日</h3>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
              {multiDates.sort((a,b)=>a.getTime()-b.getTime()).map(d => {
                const key = format(d, 'yyyy-MM-dd');
                const isModification = (shifts || []).some(s => s.shift_date === key && s.status === 'official');
                return (
                  <div key={key} className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${isModification ? 'bg-blue-50/50 border-blue-100' : 'bg-rose-50/50 border-rose-100'}`}>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-black mb-1 ${isModification ? 'text-blue-500' : 'text-rose-500'}`}>{format(d, 'M/d(ee)', {locale: ja})}</span>
                      <span className={`text-[8px] font-black px-1 py-0.5 rounded uppercase w-fit leading-none ${isModification ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>{isModification ? '変更' : '新規'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <select value={requestDetails[key]?.s} onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],s:e.target.value}})} className="bg-white text-[11px] font-black border border-gray-100 rounded-md p-1 min-w-[60px] text-center appearance-none">
                        {requestDetails[key]?.s === 'OFF' && <option value="OFF">OFF</option>}
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span>~</span>
                      <select value={requestDetails[key]?.e} onChange={e => setRequestDetails({...requestDetails,[key]:{...requestDetails[key],e:e.target.value}})} className="bg-white text-[11px] font-black border border-gray-100 rounded-md p-1 min-w-[60px] text-center appearance-none">
                        {requestDetails[key]?.e === 'OFF' && <option value="OFF">OFF</option>}
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            <button disabled={multiDates.length === 0} onClick={handleBulkSubmit} className="w-full bg-purple-600 text-white font-black py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all tracking-widest disabled:opacity-30 uppercase">申請を送信する 🚀</button>
          </section>
        ) : (
          <section className="bg-white rounded-[24px] border border-pink-300 shadow-xl overflow-hidden text-center">
            {/* 実績入力フォーム (省略なし) */}
            <div className="bg-[#FFF5F6] p-3 px-4 flex justify-center items-center h-[42px] border-b border-pink-100 relative leading-none">
              <h3 className="text-[17px] font-black text-gray-800">{singleDate ? format(singleDate, 'M/d (eee)', { locale: ja }) : ''}</h3>
              <span className="absolute right-4 text-pink-500 font-black text-lg tracking-tighter">{selectedShift ? `${selectedShift.start_time}~${selectedShift.end_time}` : <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">OFF</span>}</span>
            </div>
            {selectedShift && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(['f', 'first', 'main'] as const).map((key) => (
                    <div key={key} className="text-center space-y-1">
                      <label className="text-[13px] font-black block text-gray-900 leading-none">{key==='f'?'フリー':key==='first'?'初指名':'本指名'}</label>
                      <input type="number" inputMode="numeric" placeholder="0" value={editReward[key]} onFocus={e=>e.target.select()} onChange={e=>setEditReward({...editReward,[key]:e.target.value})} className={`w-full text-center py-2 bg-[#FAFAFA] rounded-lg font-black text-2xl border border-gray-100 focus:ring-0 focus:border-pink-300 transition-colors ${editReward[key]===''?'text-gray-200':'text-pink-500'}`} />
                    </div>
                  ))}
                </div>
                <div className="bg-pink-50/30 p-3 rounded-xl border border-pink-100 flex items-center justify-between h-[64px]">
                  <label className="text-[13px] font-black shrink-0 text-gray-900 uppercase tracking-widest leading-none text-left">本日の報酬</label>
                  <div className="flex items-center flex-1 justify-end pl-4 leading-none">
                    <span className="text-pink-200 text-2xl font-black mr-1 translate-y-[2px]">¥</span>
                    <input type="text" inputMode="numeric" placeholder="0" value={editReward.amount!==''?Number(editReward.amount).toLocaleString():''} onFocus={e=>e.target.select()} onChange={e=>{const v=e.target.value.replace(/,/g,''); if(/^\d*$/.test(v))setEditReward({...editReward,amount:v});}} className={`w-full text-right bg-transparent font-black text-[32px] focus:ring-0 border-none ${editReward.amount===''?'text-gray-200':'text-pink-500'}`} />
                  </div>
                </div>
                <button onClick={() => {
                  if (!singleDate) return;
                  const dateStr = format(singleDate, 'yyyy-MM-dd');
                  supabase.from('shifts').update({ f_count: Number(editReward.f), first_request_count: Number(editReward.first), main_request_count: Number(editReward.main), reward_amount: Number(editReward.amount) || 0 }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr).then(() => { fetchInitialData(); alert('保存完了💰'); });
                }} className="w-full bg-pink-500 text-white font-black py-5 rounded-xl text-2xl shadow-lg active:scale-95 transition-all tracking-widest uppercase leading-none tracking-widest">実績を保存 💾</button>
              </div>
            )}
          </section>
        )}

        <section className="bg-white rounded-[22px] border border-pink-100 shadow-sm overflow-hidden opacity-90 text-left pb-4">
          <div className="bg-gray-50 p-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Shop News</div>
          {newsList.map((n) => (
            <div key={n.id} className="p-3 px-4 border-b border-gray-50 last:border-0 flex gap-3 items-start leading-tight">
              <span className="text-[9px] text-pink-200 font-bold mt-0.5 shrink-0">{format(parseISO(n.created_at), 'MM/dd')}</span>
              <p className="text-xs font-bold text-gray-900">{n.content}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-pink-100 pb-6 pt-3 shadow-sm">
        <nav className="flex justify-around items-center max-w-sm mx-auto px-4">
          <button className="flex flex-col items-center text-pink-500" onClick={() => router.push('/')}><span className="text-xl mb-0.5 leading-none">🏠</span><span className="text-[9px] font-black uppercase tracking-tighter">Home</span></button>
          <button className="flex flex-col items-center text-gray-300" onClick={() => router.push('/salary')}><span className="text-xl mb-0.5 leading-none">💰</span><span className="text-[9px] font-black uppercase tracking-tighter">Salary</span></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-300"><span className="text-xl mb-0.5 leading-none">🚪</span><span className="text-[9px] font-black uppercase tracking-tighter">Logout</span></button>
        </nav>
      </footer>
    </div>
  );
}