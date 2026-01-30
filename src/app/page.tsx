'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO, getDate } from 'date-fns'; // ✨ getDateを追加
import { ja } from 'date-fns/locale';
import DashboardCalendar from '@/components/DashboardCalendar';

export default function Page() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  // --- States ---
  const [shifts, setShifts] = useState<any[]>([]);
  const [castProfile, setCastProfile] = useState<any>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewDate, setViewDate] = useState(new Date()); 
  const [loading, setLoading] = useState(true);
  
  const [editReward, setEditReward] = useState<{f:any, first:any, main:any, amount:any}>({ 
    f: '', first: '', main: '', amount: '' 
  });

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
      const { data: newsData } = await supabase.from('news').select('*')
        .or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3);
      setNewsList(newsData || []);
    }
    setLoading(false);
  }

  // 日付選択時の実績セット
  useEffect(() => {
    if (!selectedDate) {
      setEditReward({ f: '', first: '', main: '', amount: '' });
      return;
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    setEditReward({
      f: shift?.f_count ?? '',
      first: shift?.first_request_count ?? '',
      main: shift?.main_request_count ?? '',
      amount: shift?.reward_amount ?? ''
    });
  }, [selectedDate, shifts]);

  // --- 月移動時の処理 ---
  const handleMonthChange = (newMonth: Date) => {
    setViewDate(newMonth);      
    setSelectedDate(undefined); 
  };

  // --- 合計金額の計算ロジック (表示月に連動) ---
  const monthlyTotals = shifts
    .filter(s => {
      const date = parseISO(s.shift_date);
      return date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear();
    })
    .reduce((acc, s) => {
      let duration = 0;
      if (s.start_time && s.end_time) {
        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        let adjustedEH = eH < sH ? eH + 24 : eH;
        duration = (adjustedEH + eM / 60) - (sH + sM / 60);
      }
      return {
        amount: acc.amount + (s.reward_amount || 0),
        f: acc.f + (s.f_count || 0),
        first: acc.first + (s.first_request_count || 0),
        main: acc.main + (s.main_request_count || 0),
        count: acc.count + 1,
        hours: acc.hours + duration,
      };
    }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });

  const handleSaveReward = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { error } = await supabase.from('shifts').update({
      f_count: Number(editReward.f) || 0,
      first_request_count: Number(editReward.first) || 0,
      main_request_count: Number(editReward.main) || 0,
      reward_amount: Number(editReward.amount) || 0
    }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr);

    if (error) { alert('保存に失敗しました'); } 
    else { fetchInitialData(); alert('保存しました！💰'); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center text-pink-300 font-black tracking-tighter text-2xl italic">KARINTO...</div>;

  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-800 pb-40 font-sans overflow-x-hidden">
      
      {/* 🚀 ヘッダー：キャスト名 */}
      <header className="bg-white px-5 pt-12 pb-6 rounded-b-[30px] shadow-sm border-b border-pink-100">
        <h1 className="text-3xl font-black text-gray-800 tracking-tighter flex items-baseline gap-1">
          {castProfile?.display_name || 'Cast'}
          <span className="text-sm text-pink-400 font-bold italic">さん🌸</span>
        </h1>
        <p className="text-pink-300 text-[9px] font-black tracking-[0.2em] mt-1 uppercase">Cast My Page</p>
      </header>

      <main className="px-3 mt-4 space-y-4">
        
        {/* 1. 💰 合計金額枠 */}
        <section className="bg-[#FFE9ED] rounded-[22px] p-4 border border-pink-300 shadow-sm relative overflow-hidden">
          <span className="absolute -right-2 -top-4 text-[80px] font-black text-pink-200/20 italic select-none leading-none">
            {format(viewDate, 'M')}
          </span>

          <div className="flex justify-between items-center mb-1 relative z-10">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-black text-pink-400 uppercase tracking-tighter">Performance Totals</p>
              <span className="text-[9px] bg-pink-400 text-white px-1.5 py-0.5 rounded font-black">{format(viewDate, 'M月')}</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-white/50 text-[8px] text-pink-400 px-2 py-0.5 rounded-full font-bold">出勤: {monthlyTotals.count}日</span>
              <span className="bg-white/50 text-[8px] text-pink-400 px-2 py-0.5 rounded-full font-bold">稼働: {Math.round(monthlyTotals.hours * 10) / 10}h</span>
            </div>
          </div>
          
          <p className="text-[44px] font-black text-pink-500 tracking-tighter mb-3 text-center leading-none relative z-10">
            <span className="text-lg mr-0.5 font-bold">¥</span>{monthlyTotals.amount.toLocaleString()}
          </p>

          <div className="flex justify-between items-center bg-white/70 rounded-xl py-3 border border-pink-200 relative z-10">
            {[
              { label: 'フリー', value: monthlyTotals.f },
              { label: '初指名', value: monthlyTotals.first },
              { label: '本指名', value: monthlyTotals.main }
            ].map((item, idx) => (
              <div key={idx} className={`text-center flex-1 ${idx !== 2 ? 'border-r border-pink-200' : ''}`}>
                <p className="text-[11px] font-bold text-pink-400 mb-0.5">{item.label}</p>
                <p className="text-[28px] font-black text-pink-600 leading-none">{item.value}<span className="text-xs ml-0.5">本</span></p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. 📅 カレンダー (viewDate と同期) */}
        <section className="bg-white p-2 rounded-[22px] border border-pink-200 shadow-sm overflow-hidden">
          <DashboardCalendar 
            shifts={shifts} 
            selectedDate={selectedDate} 
            onSelect={setSelectedDate}
            month={viewDate}
            onMonthChange={handleMonthChange} 
          />
        </section>

        {/* 3. ✍️ 実績入力フォーム (イベント名の表示追加) */}
        <section className="bg-white rounded-[24px] border border-pink-300 shadow-xl overflow-hidden">
          <div className="bg-[#FFF5F6] p-3 px-4 border-b border-pink-200 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-700">
              {selectedDate ? (
                <>
                  {format(selectedDate, 'M/d (eee)', { locale: ja })}
                  {/* ✨ イベント名の表示 */}
                  {getDate(selectedDate) === 10 && <span className="ml-2 text-pink-500 text-[10px] bg-white px-2 py-0.5 rounded-full border border-pink-200 font-bold">かりんとの日</span>}
                  {(getDate(selectedDate) === 11 || getDate(selectedDate) === 22) && <span className="ml-2 text-blue-500 text-[10px] bg-white px-2 py-0.5 rounded-full border border-blue-200 font-bold">添い寝の日</span>}
                </>
              ) : '日付を選択してください'}
            </h3>
            <p className="text-xl font-black text-pink-500 tracking-tighter">
              {selectedShift ? `${selectedShift.start_time}~${selectedShift.end_time}` : <span className="text-[9px] font-bold text-gray-400 uppercase px-2 py-1 bg-gray-100 rounded-md">Off / No Select</span>}
            </p>
          </div>
          {selectedShift ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['f', 'first', 'main'].map((key) => (
                  <div key={key} className="space-y-1 text-center">
                    <label className="text-[11px] font-bold text-gray-300 block tracking-tighter">{key === 'f' ? 'フリー' : key === 'first' ? '初指名' : '本指名'}</label>
                    <input type="number" inputMode="numeric" value={editReward[key as keyof typeof editReward]} onChange={e => setEditReward({...editReward, [key]: e.target.value})} className="w-full text-center py-2.5 bg-[#FAFAFA] rounded-lg font-black text-[26px] text-pink-500 border border-gray-100 focus:outline-none" />
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 bg-pink-50/50 p-2.5 px-4 rounded-xl border border-pink-200">
                <label className="text-[11px] font-black text-pink-300 shrink-0 uppercase tracking-widest">給料</label>
                <div className="relative flex-1 text-right">
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 text-pink-200 text-xl font-black">¥</span>
                  <input type="text" inputMode="numeric" value={editReward.amount ? Number(editReward.amount).toLocaleString() : ''} onChange={e => { const val = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(val)) setEditReward({...editReward, amount: val}); }} className="w-full text-right pr-1 py-1 bg-transparent font-black text-[34px] text-pink-500 focus:outline-none" />
                </div>
              </div>
              <button onClick={handleSaveReward} className="w-full bg-pink-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-xs tracking-[0.2em] uppercase">実績を保存 💾</button>
            </div>
          ) : <div className="p-8 text-center bg-white italic text-gray-300 text-xs">カレンダーの日付を選択すると実績を入力できます 🌙</div>}
        </section>

        {/* 🏷️ ver 1.13.4 ラベル */}
        <div className="pt-4 pb-2 text-center">
          <p className="text-[10px] font-bold text-gray-200 tracking-widest uppercase">Karinto Cast Manager ver 1.13.4</p>
        </div>

      </main>

      {/* 📱 フッターナビゲーション */}
      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-pink-100 pb-6 pt-3 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <nav className="flex justify-around items-center max-w-sm mx-auto px-4">
          <button className="flex flex-col items-center text-pink-500" onClick={() => router.push('/')}><span className="text-xl mb-0.5">🏠</span><span className="text-[9px] font-black tracking-tighter uppercase">Home</span></button>
          <button className="flex flex-col items-center text-gray-300" onClick={() => router.push('/salary')}><span className="text-xl mb-0.5">💰</span><span className="text-[9px] font-black tracking-tighter uppercase">Salary</span></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-300"><span className="text-xl mb-0.5">🚪</span><span className="text-[9px] font-black tracking-tighter uppercase">Logout</span></button>
        </nav>
      </footer>
    </div>
  );
}