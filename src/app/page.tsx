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
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    const v = (val: any) => (val === null || val === undefined) ? '' : val;
    setEditReward({ f: v(shift?.f_count), first: v(shift?.first_request_count), main: v(shift?.main_request_count), amount: v(shift?.reward_amount) });
  }, [selectedDate, shifts]);

  const monthlyTotals = shifts
    .filter(s => {
      const d = parseISO(s.shift_date);
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    })
    .reduce((acc, s) => {
      let dur = 0;
      if (s.start_time && s.end_time) {
        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        dur = ((eH < sH ? eH + 24 : eH) + eM / 60) - (sH + sM / 60);
      }
      return { amount: acc.amount + (s.reward_amount || 0), f: acc.f + (s.f_count || 0), first: acc.first + (s.first_request_count || 0), main: acc.main + (s.main_request_count || 0), count: acc.count + 1, hours: acc.hours + dur };
    }, { amount: 0, f: 0, first: 0, main: 0, count: 0, hours: 0 });

  const handleSaveReward = async () => {
    if (!selectedDate) return;
    if (editReward.f === '' || editReward.first === '' || editReward.main === '') {
      alert('「フリー」「初指名」「本指名」をすべて入力してください');
      return;
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await supabase.from('shifts').update({ f_count: Number(editReward.f), first_request_count: Number(editReward.first), main_request_count: Number(editReward.main), reward_amount: Number(editReward.amount) || 0 }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr);
    fetchInitialData();
    alert('保存しました💰');
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center text-pink-300 font-black italic text-2xl">KARINTO...</div>;
  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-800 pb-40 font-sans overflow-x-hidden">
      <header className="bg-white px-5 pt-12 pb-6 rounded-b-[30px] shadow-sm border-b border-pink-100">
        <h1 className="text-3xl font-black flex items-baseline gap-1">
          {castProfile?.display_name || 'Cast'}
          {/* ✨ さん🌸 を少し大きく調整 */}
          <span className="text-[18px] text-pink-400 font-bold italic translate-y-[-1px]">さん🌸</span>
        </h1>
      </header>

      <main className="px-3 mt-4 space-y-4">
        <section className="bg-[#FFE9ED] rounded-[22px] p-4 border border-pink-300 relative overflow-hidden shadow-sm">
          <span className="absolute -right-2 -top-4 text-[80px] font-black text-pink-200/20 italic select-none leading-none">{format(viewDate, 'M')}</span>
          <div className="relative z-10">
            <div className="flex flex-col items-center gap-3 mb-4">
              <h2 className="text-[18px] font-black text-pink-500 whitespace-nowrap">{format(viewDate, 'M月')}の実績合計</h2>
              <div className="flex gap-2">
                <div className="bg-pink-400 px-4 py-2 rounded-2xl border border-pink-300 flex items-baseline gap-1.5 shadow-md">
                  <span className="text-[11px] font-black text-white">出勤</span>
                  <span className="text-2xl font-black text-white leading-none">{monthlyTotals.count}</span>
                  <span className="text-[11px] font-black text-white">日</span>
                </div>
                <div className="bg-pink-400 px-4 py-2 rounded-2xl border border-pink-300 flex items-baseline gap-1.5 shadow-md">
                  <span className="text-[11px] font-black text-white">稼働</span>
                  <span className="text-2xl font-black text-white leading-none">{Math.round(monthlyTotals.hours * 10) / 10}</span>
                  <span className="text-[11px] font-black text-white">h</span>
                </div>
              </div>
            </div>
            
            <p className="text-[48px] font-black text-pink-500 text-center mb-4 leading-none tracking-tighter">
              <span className="text-2xl mr-1">¥</span>{monthlyTotals.amount.toLocaleString()}
            </p>

            <div className="grid grid-cols-3 gap-1 bg-white/80 rounded-xl py-3 border border-pink-200 text-center shadow-inner">
              <div><p className="text-[12px] text-pink-400 font-black mb-0.5">フリー</p><p className="text-2xl font-black text-pink-600">{monthlyTotals.f}</p></div>
              <div className="border-x border-pink-100"><p className="text-[12px] text-pink-400 font-black mb-0.5">初指名</p><p className="text-2xl font-black text-pink-600">{monthlyTotals.first}</p></div>
              <div><p className="text-[12px] text-pink-400 font-black mb-0.5">本指名</p><p className="text-2xl font-black text-pink-600">{monthlyTotals.main}</p></div>
            </div>
          </div>
        </section>

        <section className="bg-white p-2 rounded-[22px] border border-pink-200 shadow-sm overflow-hidden">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} month={viewDate} onMonthChange={setViewDate} />
        </section>

        <section className="bg-white rounded-[24px] border border-pink-300 shadow-xl overflow-hidden">
          <div className="bg-[#FFF5F6] p-3 px-4 flex justify-center items-center h-[42px] border-b border-pink-100 relative">
            <h3 className="text-[17px] font-black text-gray-800">{selectedDate ? format(selectedDate, 'M/d (eee)', { locale: ja }) : ''}</h3>
            <span className="absolute right-4 text-pink-500 font-black text-lg tracking-tighter">{selectedShift ? `${selectedShift.start_time}~${selectedShift.end_time}` : <span className="text-xs text-gray-300 font-bold uppercase">OFF</span>}</span>
          </div>
          {selectedShift && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['f', 'first', 'main'].map((key) => (
                  <div key={key} className="text-center space-y-1">
                    <label className="text-[13px] font-black block text-gray-900">{key==='f'?'フリー':key==='first'?'初指名':'本指名'}</label>
                    <input type="number" inputMode="numeric" placeholder="0" value={editReward[key as keyof typeof editReward]} onFocus={e=>e.target.select()} onChange={e=>setEditReward({...editReward,[key]:e.target.value})} className={`w-full text-center py-2 bg-[#FAFAFA] rounded-lg font-black text-2xl border border-gray-100 focus:ring-0 focus:border-pink-300 transition-colors ${editReward[key as keyof typeof editReward]===''?'text-gray-200':'text-pink-500'}`} />
                  </div>
                ))}
              </div>
              <div className="bg-pink-50/30 p-3 rounded-xl border border-pink-100 flex items-center justify-between h-[64px]">
                <label className="text-[13px] font-black shrink-0 text-gray-900 uppercase tracking-widest">本日の報酬</label>
                <div className="flex items-center flex-1 justify-end pl-4">
                  <span className="text-pink-200 text-2xl font-black mr-1 translate-y-[2px]">¥</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={editReward.amount!==''?Number(editReward.amount).toLocaleString():''} onFocus={e=>e.target.select()} onChange={e=>{const v=e.target.value.replace(/,/g,''); if(/^\d*$/.test(v))setEditReward({...editReward,amount:v});}} className={`w-full text-right bg-transparent font-black text-[32px] focus:ring-0 border-none ${editReward.amount===''?'text-gray-200':'text-pink-500'}`} />
                </div>
              </div>
              <button onClick={handleSaveReward} className="w-full bg-pink-500 text-white font-black py-5 rounded-xl text-2xl shadow-lg active:scale-95 transition-all tracking-widest uppercase">実績を保存 💾</button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-[22px] border border-pink-100 shadow-sm overflow-hidden opacity-90">
          <div className="bg-gray-50 p-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Shop News</div>
          {newsList.map((n) => (
            <div key={n.id} className="p-3 px-4 border-b border-gray-50 last:border-0 flex gap-3 items-start">
              <span className="text-[9px] text-pink-200 font-bold mt-0.5">{format(parseISO(n.created_at), 'MM/dd')}</span>
              {/* ✨ ニュース内容を黒字に修正 */}
              <p className="text-xs font-bold text-gray-900 leading-tight">{n.content}</p>
            </div>
          ))}
        </section>

        <p className="text-center text-[10px] font-bold text-gray-200 tracking-widest pb-8 uppercase">Karinto Cast Manager ver 1.4.0</p>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-pink-100 pb-6 pt-3 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <nav className="flex justify-around items-center max-w-sm mx-auto px-4">
          <button className="flex flex-col items-center text-pink-500" onClick={() => router.push('/')}><span className="text-xl mb-0.5">🏠</span><span className="text-[9px] font-black uppercase tracking-tighter">Home</span></button>
          <button className="flex flex-col items-center text-gray-300" onClick={() => router.push('/salary')}><span className="text-xl mb-0.5">💰</span><span className="text-[9px] font-black uppercase tracking-tighter">Salary</span></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-300"><span className="text-xl mb-0.5">🚪</span><span className="text-[9px] font-black uppercase tracking-tighter">Logout</span></button>
        </nav>
      </footer>
    </div>
  );
}