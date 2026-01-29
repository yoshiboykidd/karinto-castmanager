'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
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
  const [loading, setLoading] = useState(true);
  
  const [editReward, setEditReward] = useState<{f:any, first:any, main:any, amount:any}>({ 
    f: '', first: '', main: '', amount: '' 
  });

  useEffect(() => {
    fetchInitialData();
  }, [supabase, router]);

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
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    if (shift) {
      setEditReward({
        f: shift.f_count || '',
        first: shift.first_request_count || '',
        main: shift.main_request_count || '',
        amount: shift.reward_amount || ''
      });
    } else {
      setEditReward({ f: '', first: '', main: '', amount: '' });
    }
  }, [selectedDate, shifts]);

  const monthlyTotals = shifts
    .filter(s => {
      const date = parseISO(s.shift_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((acc, s) => ({
      amount: acc.amount + (s.reward_amount || 0),
      f: acc.f + (s.f_count || 0),
      first: acc.first + (s.first_request_count || 0),
      main: acc.main + (s.main_request_count || 0),
    }), { amount: 0, f: 0, first: 0, main: 0 });

  const handleSaveReward = async () => {
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const { error } = await supabase
      .from('shifts')
      .update({
        f_count: Number(editReward.f) || 0,
        first_request_count: Number(editReward.first) || 0,
        main_request_count: Number(editReward.main) || 0,
        reward_amount: Number(editReward.amount) || 0
      })
      .eq('login_id', castProfile.login_id)
      .eq('shift_date', dateStr);

    if (error) {
      alert('保存に失敗しました');
    } else {
      fetchInitialData();
      alert('保存しました！💰');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center text-pink-300 font-bold">読み込み中...</div>;

  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-700 pb-32 font-sans">
      {/* ヘッダー：さらに高さを抑えてコンパクトに */}
      <header className="bg-white px-6 pt-10 pb-4 rounded-b-[30px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex justify-between items-end">
        <div>
          <p className="text-pink-300 text-[10px] font-black tracking-widest mb-0.5 uppercase">Welcome back🌸</p>
          <h1 className="text-xl font-black text-gray-800">
            {castProfile?.display_name || 'キャスト'}
            <span className="text-xs font-bold ml-1 text-gray-400">さん</span>
          </h1>
        </div>
        {castProfile?.login_id === "admin" && (
          <button onClick={() => router.push('/admin')} className="bg-gray-100 text-gray-400 text-[9px] px-3 py-1.5 rounded-full font-bold">⚙️ 管理</button>
        )}
      </header>

      <main className="px-4 mt-4 space-y-4">
        
        {/* 💰 合計枠：淡いピンク＋枠線を濃くしてハッキリと */}
        <section className="bg-[#FFE9ED] rounded-[24px] p-4 border border-pink-200">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Monthly Totals</p>
            <span className="bg-white text-[9px] text-pink-400 px-2.5 py-0.5 rounded-full font-bold border border-pink-100">今月</span>
          </div>
          
          <p className="text-4xl font-black text-pink-500 tracking-tighter mb-3 text-center">
            <span className="text-xl mr-1 font-bold">¥</span>{monthlyTotals.amount.toLocaleString()}
          </p>

          <div className="flex justify-between items-center bg-white/60 rounded-xl py-2 border border-pink-100">
            <div className="text-center flex-1 border-r border-pink-200/50">
              <p className="text-[10px] font-bold text-pink-300 mb-0.5">フリー</p>
              <p className="text-xl font-black text-pink-500 leading-none">{monthlyTotals.f}<span className="text-xs ml-0.5">本</span></p>
            </div>
            <div className="text-center flex-1 border-r border-pink-200/50">
              <p className="text-[10px] font-bold text-pink-300 mb-0.5">初指名</p>
              <p className="text-xl font-black text-pink-500 leading-none">{monthlyTotals.first}<span className="text-xs ml-0.5">本</span></p>
            </div>
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-pink-300 mb-0.5">本指名</p>
              <p className="text-xl font-black text-pink-500 leading-none">{monthlyTotals.main}<span className="text-xs ml-0.5">本</span></p>
            </div>
          </div>
        </section>

        {/* お知らせ */}
        <section className="bg-white rounded-xl overflow-hidden border border-pink-100 shadow-sm">
          <div className="divide-y divide-pink-50">
            {newsList.map((news) => (
              <div key={news.id} className="p-2.5 text-left flex items-center space-x-3">
                <span className="text-[9px] text-pink-200 font-bold">{format(parseISO(news.created_at), 'MM/dd')}</span>
                <p className="text-xs font-bold text-gray-400 truncate">{news.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* カレンダー */}
        <section className="bg-white p-2 rounded-[24px] border border-pink-100 shadow-sm">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </section>

        {/* 📅 日付詳細 ＆ 入力：ギュッと詰めました */}
        <section className="bg-white rounded-[24px] border border-pink-200 shadow-lg overflow-hidden">
          <div className="bg-[#FFF5F6] p-3 border-b border-pink-100 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-700">
              {selectedDate ? format(selectedDate, 'M/d (eee)', { locale: ja }) : '日付を選択'}
            </h3>
            {selectedShift ? (
              <p className="text-lg font-black text-pink-400 tracking-tighter">
                {selectedShift.start_time} <span className="text-xs font-normal text-pink-200">〜</span> {selectedShift.end_time}
              </p>
            ) : (
              <span className="text-[10px] font-bold text-gray-300 uppercase italic px-2 py-0.5 bg-gray-100 rounded-md">Off</span>
            )}
          </div>

          {selectedShift ? (
            <div className="p-4 space-y-4 bg-white">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'フリー', key: 'f' },
                  { label: '初指名', key: 'first' },
                  { label: '本指名', key: 'main' }
                ].map((item) => (
                  <div key={item.key} className="space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-300 block">{item.label}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={editReward[item.key as keyof typeof editReward]}
                      onChange={e => setEditReward({...editReward, [item.key]: e.target.value})}
                      className="w-full text-center py-2 bg-[#FAFAFA] rounded-lg font-black text-pink-400 border border-gray-100 focus:outline-none focus:ring-1 focus:ring-pink-200 placeholder:text-gray-200"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-3 bg-pink-50/30 p-3 rounded-xl border border-pink-100">
                <label className="text-[10px] font-black text-pink-200 uppercase tracking-widest shrink-0">給料(円)</label>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-pink-200 text-lg font-black">¥</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={editReward.amount}
                    onChange={e => setEditReward({...editReward, amount: e.target.value})}
                    className="w-full text-right pr-4 py-2 bg-transparent font-black text-2xl text-pink-500 focus:outline-none placeholder:text-pink-100"
                  />
                </div>
              </div>

              <button onClick={handleSaveReward} className="w-full bg-pink-400 hover:bg-pink-500 text-white font-black py-3.5 rounded-xl shadow-md active:scale-95 transition-all text-xs tracking-widest">
                実績を保存
              </button>
            </div>
          ) : (
            <div className="p-6 text-center bg-white italic text-gray-300 text-xs">
              お休みの日です 🌙
            </div>
          )}
        </section>
      </main>

      {/* フッター */}
      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/90 backdrop-blur-md border-t border-pink-100 pb-5 pt-3">
        <nav className="flex justify-around items-center max-w-sm mx-auto px-4">
          <button className="flex flex-col items-center text-pink-400" onClick={() => router.push('/')}>
            <span className="text-xl mb-1">🏠</span>
            <span className="text-[9px] font-black uppercase">Home</span>
          </button>
          <button className="flex flex-col items-center text-gray-300">
            <span className="text-xl mb-1">💰</span>
            <span className="text-[9px] font-black uppercase">Salary</span>
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-300">
            <span className="text-xl mb-1">🚪</span>
            <span className="text-[9px] font-black uppercase">Logout</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}