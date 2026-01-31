'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO, getDate } from 'date-fns';
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

  useEffect(() => {
    if (!selectedDate) {
      setEditReward({ f: '', first: '', main: '', amount: '' });
      return;
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    
    // ✨ 全くデータがない（null/undefined）なら ''、0が保存されていれば 0 をセット
    setEditReward({
      f: (shift?.f_count === undefined || shift?.f_count === null) ? '' : shift.f_count,
      first: (shift?.first_request_count === undefined || shift?.first_request_count === null) ? '' : shift.first_request_count,
      main: (shift?.main_request_count === undefined || shift?.main_request_count === null) ? '' : shift.main_request_count,
      amount: (shift?.reward_amount === undefined || shift?.reward_amount === null) ? '' : shift.reward_amount
    });
  }, [selectedDate, shifts]);

  const handleMonthChange = (newMonth: Date) => {
    setViewDate(newMonth);      
    setSelectedDate(undefined); 
  };

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
    if (editReward.f === '' || editReward.first === '' || editReward.main === '') {
      alert('「フリー」「初指名」「本指名」の全てを入力してください（無い場合は 0 を入力）');
      return;
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { error } = await supabase.from('shifts').update({
      f_count: Number(editReward.f),
      first_request_count: Number(editReward.first),
      main_request_count: Number(editReward.main),
      reward_amount: Number(editReward.amount) || 0
    }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr);
    if (error) { alert('保存に失敗しました'); } 
    else { fetchInitialData(); alert('保存しました！💰'); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center text-pink-300 font-black tracking-tighter text-2xl italic">KARINTO...</div>;

  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-800 pb-40 font-sans overflow-x-hidden">
      
      <header className="bg-white px-5 pt-12 pb-6 rounded-b-[30px] shadow-sm border-b border-pink-100">
        <h1 className="text-3xl font-black text-gray-800 tracking-tighter flex items-baseline gap-1">
          {castProfile?.display_name || 'Cast'}
          <span className="text-[13px] text-pink-400 font-bold italic translate-y-[-2px]">さん🌸</span>
        </h1>
        <p className="text-pink-300 text-[9px] font-black tracking-[0.2em] mt-1 uppercase">Cast Dashboard</p>
      </header>

      <main className="px-3 mt-4 space-y-4">
        
        {/* 1. 💰 合計金額枠 */}
        <section className="bg-[#FFE9ED] rounded-[22px] p-4 border border-pink-300 shadow-sm relative overflow-hidden">
          <span className="absolute -right-2 -top-4 text-[80px] font-black text-pink-200/20 italic select-none leading-none">
            {format(viewDate, 'M')}
          </span>
          <div className="relative z-10 mb-2">
            <h2 className="text-[18px] font-black text-pink-500 flex items-center gap-1.5 leading-none">
              <span className="bg-pink-500 text-white px-2 py-1 rounded-lg text-sm">{format(viewDate, 'M月')}</span>
              の合計実績
            </h2>
            <div className="flex gap-2 mt-2.5">
              <div className="bg-white/60 px-3 py-1.5 rounded-xl border border-pink-200 flex items-baseline gap-1 shadow-sm">
                <span className="text-[9px] font-black text-pink-300 uppercase tracking-tighter">出勤</span>
                <span className="text-xl font-black text-pink-600 leading-none">{monthlyTotals.count}</span>
                <span className="text-[10px] font-bold text-pink-400">日</span>
              </div>
              <div className="bg-white/60 px-3 py-1.5 rounded-xl border border-pink-200 flex items-baseline gap-1 shadow-sm">
                <span className="text-[9px] font-black text-pink-300 uppercase tracking-tighter">稼働</span>
                <span className="text-xl font-black text-pink-600 leading-none">{Math.round(monthlyTotals.hours * 10) / 10}</span>
                <span className="text-[10px] font-bold text-pink-400">h</span>
              </div>
            </div>
          </div>
          <p className="text-[44px] font-black text-pink-500 tracking-tighter mb-3 text-center leading-none relative z-10">
            <span className="text-lg mr-0.5 font-bold">¥</span>{monthlyTotals.amount.toLocaleString()}
          </p>
          <div className="flex justify-between items-center bg-white/80 rounded-xl py-1.5 border border-pink-200 relative z-10">
            {[
              { label: 'フリー', value: monthlyTotals.f },
              { label: '初指名', value: monthlyTotals.first },
              { label: '本指名', value: monthlyTotals.main }
            ].map((item, idx) => (
              <div key={idx} className={`text-center flex-1 ${idx !== 2 ? 'border-r border-pink-100' : ''}`}>
                <p className="text-[10px] font-bold text-pink-400 leading-tight">{item.label}</p>
                <p className="text-[22px] font-black text-pink-600 leading-none">{item.value}<span className="text-[9px] ml-0.5">本</span></p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. 📅 カレンダー */}
        <section className="bg-white p-2 rounded-[22px] border border-pink-200 shadow-sm overflow-hidden">
          <DashboardCalendar 
            shifts={shifts} 
            selectedDate={selectedDate} 
            onSelect={setSelectedDate}
            month={viewDate}
            onMonthChange={handleMonthChange} 
          />
        </section>

        {/* 3. ✍️ 実績入力フォーム */}
        <section className="bg-white rounded-[24px] border border-pink-300 shadow-xl overflow-hidden">
          <div className="bg-[#FFF5F6] p-3 px-4 border-b border-pink-100 flex justify-between items-center">
            <h3 className="text-[17px] font-black text-gray-800 leading-none">
              {selectedDate ? (
                <div className="flex items-center gap-2">
                  {format(selectedDate, 'M/d (eee)', { locale: ja })}
                  {getDate(selectedDate) === 10 && <span className="text-pink-500 text-[10px] bg-white px-2 py-0.5 rounded border border-pink-200 font-bold italic">かりんとの日</span>}
                  {(getDate(selectedDate) === 11 || getDate(selectedDate) === 22) && <span className="text-blue-500 text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 font-bold italic">添い寝の日</span>}
                </div>
              ) : '日付を選択してください'}
            </h3>
            <div className="text-lg font-black text-pink-500 tracking-tighter leading-none">
              {selectedShift ? `${selectedShift.start_time}~${selectedShift.end_time}` : <span className="text-[9px] font-bold text-gray-400 uppercase px-1.5 py-0.5 bg-gray-50 rounded">OFF</span>}
            </div>
          </div>
          {selectedShift ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['f', 'first', 'main'].map((key) => (
                  <div key={key} className="space-y-1.5 text-center">
                    <label className="text-[13px] font-black text-gray-900 block tracking-tighter leading-none">
                      {key === 'f' ? 'フリー' : key === 'first' ? '初指名' : '本指名'}
                    </label>
                    {/* ✨ editReward[key] が '' なら text-gray-200、数字が入れば text-pink-500 */}
                    <input 
                      type="number" 
                      inputMode="numeric" 
                      placeholder="0"
                      value={editReward[key as keyof typeof editReward]} 
                      onFocus={(e) => e.target.select()}
                      onChange={e => setEditReward({...editReward, [key]: e.target.value})} 
                      className={`w-full text-center py-2 bg-[#FAFAFA] rounded-lg font-black text-[24px] border border-gray-100 focus:outline-none focus:ring-0 focus:border-pink-300 transition-colors placeholder:text-gray-200 ${editReward[key as keyof typeof editReward] === '' ? 'text-gray-200' : 'text-pink-500'}`} 
                    />
                  </div>
                ))}
              </div>
              
              <div className="bg-pink-50/30 p-3 rounded-xl border border-pink-100 flex items-center justify-between h-[64px]">
                <label className="text-[13px] font-black text-gray-900 uppercase tracking-widest shrink-0">本日の報酬</label>
                <div className="flex items-center justify-end flex-1 pl-4">
                  <span className="text-pink-200 text-2xl font-black mr-1 translate-y-[2px]">¥</span>
                  {/* ✨ 金額欄も同様の色の出し分け */}
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    placeholder="0"
                    value={editReward.amount ? Number(editReward.amount).toLocaleString() : ''} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => { const val = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(val)) setEditReward({...editReward, amount: val}); }} 
                    className={`w-full text-right bg-transparent font-black text-[32px] focus:outline-none focus:ring-0 border-none placeholder:text-gray-200 ${editReward.amount === '' ? 'text-gray-200' : 'text-pink-500'}`} 
                  />
                </div>
              </div>

              <button onClick={handleSaveReward} className="w-full bg-pink-500 text-white font-black py-5 rounded-xl shadow-lg active:scale-95 transition-all text-lg tracking-[0.2em] uppercase">実績を保存 💾</button>
            </div>
          ) : <div className="p-8 text-center bg-white italic text-gray-300 text-[10px]">カレンダーの日付を選択すると入力できます</div>}
        </section>

        <div className="pt-4 pb-2 text-center">
          <p className="text-[10px] font-bold text-gray-200 tracking-widest uppercase">Karinto Cast Manager ver 1.14.8</p>
        </div>
      </main>

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