'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import DashboardCalendar from '@/components/DashboardCalendar';

export default function Page() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [shifts, setShifts] = useState<any[]>([]);
  const [castProfile, setCastProfile] = useState<any>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [loading, setLoading] = useState(true);

  // ✨ モードと選択日の管理
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [multiDates, setMultiDates] = useState<Date[]>([]);
  
  const [editReward, setEditReward] = useState<any>({ f: '', first: '', main: '', amount: '' });

  useEffect(() => { fetchInitialData(); }, [supabase, router]);

  async function fetchInitialData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const loginId = session.user.email?.replace('@karinto-internal.com', '');
    const [castRes, shiftRes] = await Promise.all([
      supabase.from('cast_members').select('*').eq('login_id', loginId).single(),
      supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
    ]);
    setCastProfile(castRes.data);
    setShifts(shiftRes.data || []);
    if (castRes.data) {
      const myShopId = castRes.data.HOME_shop_ID || 'main';
      const { data: newsData } = await supabase.from('news').select('*').or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3);
      setNewsList(newsData || []);
    }
    setLoading(false);
  }

  // 実績入力の読み込み
  useEffect(() => {
    if (isRequestMode || !singleDate) return;
    const dateStr = format(singleDate, 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    const v = (val: any) => (val === null || val === undefined) ? '' : val;
    setEditReward({ f: v(shift?.f_count), first: v(shift?.first_request_count), main: v(shift?.main_request_count), amount: v(shift?.reward_amount) });
  }, [singleDate, shifts, isRequestMode]);

  // ✨ 波線を解消する日付選択ハンドラ
  const handleDateSelect = (val: any) => {
    if (isRequestMode) {
      setMultiDates(val || []);
    } else {
      setSingleDate(val);
    }
  };

  // ✨ まとめ申請の処理
  const handleBulkRequest = async (startTime: string, endTime: string) => {
    if (multiDates.length === 0) return;
    const requests = multiDates.map(date => ({
      login_id: castProfile.login_id,
      shift_date: format(date, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      status: 'requested',
      is_official: false
    }));

    const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
    if (error) alert('申請に失敗しました');
    else {
      alert(`${multiDates.length}日分の申請を送信しました！🚀`);
      setMultiDates([]);
      fetchInitialData();
    }
  };

  const handleSaveReward = async () => {
    if (!singleDate) return;
    if (editReward.f === '' || editReward.first === '' || editReward.main === '') {
      alert('「フリー」「初指名」「本指名」をすべて入力してください');
      return;
    }
    await supabase.from('shifts').update({ 
      f_count: Number(editReward.f), 
      first_request_count: Number(editReward.first), 
      main_request_count: Number(editReward.main), 
      reward_amount: Number(editReward.amount) || 0 
    }).eq('login_id', castProfile.login_id).eq('shift_date', format(singleDate, 'yyyy-MM-dd'));
    fetchInitialData();
    alert('保存しました💰');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center">
      <div className="text-pink-300 tracking-tighter text-5xl italic animate-pulse" style={{ fontWeight: 900, textShadow: '2px 2px 0px rgba(249, 168, 212, 0.3)' }}>KARINTO...</div>
    </div>
  );

  const selectedShift = !isRequestMode && singleDate ? shifts.find(s => s.shift_date === format(singleDate, 'yyyy-MM-dd')) : null;

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-800 pb-40 font-sans overflow-x-hidden">
      
      <header className="bg-white px-5 pt-12 pb-6 rounded-b-[30px] shadow-sm border-b border-pink-100">
        <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1">KarintoCastManager ver 2.0.1</p>
        <h1 className="text-3xl font-black flex items-baseline gap-1.5 leading-none">
          {castProfile?.display_name || 'Cast'}
          <span className="text-[24px] text-pink-400 font-bold italic translate-y-[1px]">さん⛄️</span>
        </h1>
        <p className="text-[13px] font-bold text-gray-500 mt-1 ml-0.5 tracking-tighter leading-none">お疲れ様です🍵</p>
      </header>

      {/* 🔄 モード切替タブ */}
      <div className="flex p-1 bg-gray-100 mx-5 mt-4 rounded-xl border border-gray-200 shadow-inner">
        <button onClick={() => { setIsRequestMode(false); setMultiDates([]); }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${!isRequestMode ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}>実績入力</button>
        <button onClick={() => { setIsRequestMode(true); setSingleDate(undefined); }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${isRequestMode ? 'bg-white text-purple-500 shadow-sm' : 'text-gray-400'}`}>シフト申請</button>
      </div>

      <main className="px-3 mt-4 space-y-4">
        
        {/* カレンダー */}
        <section className="bg-white p-2 rounded-[22px] border border-pink-200 shadow-sm overflow-hidden text-center">
          <DashboardCalendar 
            shifts={shifts} 
            selectedDates={isRequestMode ? multiDates : singleDate} 
            onSelect={handleDateSelect}
            month={viewDate} onMonthChange={setViewDate}
            isRequestMode={isRequestMode}
          />
        </section>

        {/* 💜 申請モードパネル */}
        {isRequestMode ? (
          <section className="bg-white rounded-[24px] border border-purple-200 p-4 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-center font-black text-purple-600 mb-3">{multiDates.length}日分を選択中</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { label: '朝 (10-18)', s: '10:00', e: '18:00' },
                { label: '昼 (12-21)', s: '12:00', e: '21:00' },
                { label: '夜 (18-24)', s: '18:00', e: '24:00' },
                { label: '休み希望', s: 'OFF', e: 'OFF' }
              ].map(p => (
                <button key={p.label} onClick={() => handleBulkRequest(p.s, p.e)} className="bg-purple-50 border border-purple-100 py-3 rounded-xl font-black text-purple-600 text-sm active:scale-95 transition-all shadow-sm">
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-center text-purple-300 font-bold">※時間を押すと、選択中の全日程が申請されます</p>
          </section>
        ) : (
          /* ✍️ 実績入力フォーム */
          <section className="bg-white rounded-[24px] border border-pink-300 shadow-xl overflow-hidden text-center">
            <div className="bg-[#FFF5F6] p-3 px-4 flex justify-center items-center h-[42px] border-b border-pink-100 relative">
              <h3 className="text-[17px] font-black text-gray-800">{singleDate ? format(singleDate, 'M/d (eee)', { locale: ja }) : ''}</h3>
              <span className="absolute right-4 text-pink-500 font-black text-lg">{selectedShift ? `${selectedShift.start_time}~${selectedShift.end_time}` : <span className="text-xs text-gray-300 font-bold uppercase">OFF</span>}</span>
            </div>
            {selectedShift && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {['f', 'first', 'main'].map((key) => (
                    <div key={key} className="text-center space-y-1">
                      <label className="text-[13px] font-black block text-gray-900">{key==='f'?'フリー':key==='first'?'初指名':'本指名'}</label>
                      <input type="number" inputMode="numeric" placeholder="0" value={editReward[key]} onFocus={e=>e.target.select()} onChange={e=>setEditReward({...editReward,[key]:e.target.value})} className={`w-full text-center py-2 bg-[#FAFAFA] rounded-lg font-black text-2xl border border-gray-100 focus:ring-0 focus:border-pink-300 transition-colors ${editReward[key]===''?'text-gray-200':'text-pink-500'}`} />
                    </div>
                  ))}
                </div>
                <div className="bg-pink-50/30 p-3 rounded-xl border border-pink-100 flex items-center justify-between h-[64px]">
                  <label className="text-[13px] font-black shrink-0 text-gray-900 uppercase tracking-widest leading-none">本日の報酬</label>
                  <div className="flex items-center flex-1 justify-end pl-4">
                    <span className="text-pink-200 text-2xl font-black mr-1 translate-y-[2px] leading-none">¥</span>
                    <input type="text" inputMode="numeric" placeholder="0" value={editReward.amount!==''?Number(editReward.amount).toLocaleString():''} onFocus={e=>e.target.select()} onChange={e=>{const v=e.target.value.replace(/,/g,''); if(/^\d*$/.test(v))setEditReward({...editReward,amount:v});}} className={`w-full text-right bg-transparent font-black text-[32px] focus:ring-0 border-none ${editReward.amount===''?'text-gray-200':'text-pink-500'}`} />
                  </div>
                </div>
                <button onClick={handleSaveReward} className="w-full bg-pink-500 text-white font-black py-5 rounded-xl text-2xl shadow-lg active:scale-95 transition-all tracking-widest uppercase leading-none">実績を保存 💾</button>
              </div>
            )}
          </section>
        )}

        {/* ショップニュース */}
        <section className="bg-white rounded-[22px] border border-pink-100 shadow-sm overflow-hidden opacity-90">
          <div className="bg-gray-50 p-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-left">Shop News</div>
          {newsList.map((n) => (
            <div key={n.id} className="p-3 px-4 border-b border-gray-50 last:border-0 flex gap-3 items-start text-left">
              <span className="text-[9px] text-pink-200 font-bold mt-0.5 shrink-0">{format(parseISO(n.created_at), 'MM/dd')}</span>
              <p className="text-xs font-bold text-gray-900 leading-tight">{n.content}</p>
            </div>
          ))}
        </section>

        <p className="text-center text-[10px] font-bold text-gray-200 tracking-widest pb-8 uppercase">Karinto Cast Manager ver 2.0.1</p>
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