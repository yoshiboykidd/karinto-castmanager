'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
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
        .or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(5);
      setNewsList(newsData || []);
    }
    setLoading(false);
  }

  // 日付選択時の実績データセット
  useEffect(() => {
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    setEditReward({
      f: shift?.f_count || '',
      first: shift?.first_request_count || '',
      main: shift?.main_request_count || '',
      amount: shift?.reward_amount || ''
    });
  }, [selectedDate, shifts]);

  // 今月の合計計算
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
    const { error } = await supabase.from('shifts').update({
      f_count: Number(editReward.f) || 0,
      first_request_count: Number(editReward.first) || 0,
      main_request_count: Number(editReward.main) || 0,
      reward_amount: Number(editReward.amount) || 0
    }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr);

    if (error) {
      alert('保存に失敗しました');
    } else {
      fetchInitialData();
      alert('保存しました！💰');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center text-pink-300 font-black">
      LOADING...
    </div>
  );

  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-800 pb-32 font-sans overflow-x-hidden">
      
      {/* 🚀 ヘッダー */}
      <header className="bg-white px-5 pt-10 pb-4 rounded-b-[25px] shadow-sm flex justify-between items-end border-b border-pink-100">
        <div>
          <p className="text-pink-300 text-[9px] font-black tracking-[0.2em] mb-0.5 uppercase">Welcome Back🌸</p>
          <h1 className="text-xl font-black text-gray-800 leading-none">
            {castProfile?.display_name || 'キャスト'}
            <span className="text-xs font-bold ml-1 text-gray-400">さん</span>
          </h1>
        </div>
        {castProfile?.login_id === "admin" && (
          <button onClick={() => router.push('/admin')} className="bg-gray-800 text-white text-[9px] px-3 py-1.5 rounded-full font-bold shadow-sm">⚙️ 管理</button>
        )}
      </header>

      <main className="px-3 mt-4 space-y-4">
        
        {/* 1. 💰 今月の合計枠（最上部） */}
        <section className="bg-[#FFE9ED] rounded-[22px] p-4 border border-pink-300 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] font-black text-pink-400 uppercase tracking-tighter">Earnings Report</p>
            <span className="bg-pink-400 text-[8px] text-white px-2 py-0.5 rounded-full font-bold">今月合計</span>
          </div>
          <p className="text-[44px] font-black text-pink-500 tracking-tighter mb-3 text-center leading-none">
            <span className="text-lg mr-0.5 font-bold">¥</span>{monthlyTotals.amount.toLocaleString()}
          </p>
          <div className="flex justify-between items-center bg-white/70 rounded-xl py-3 border border-pink-200">
            <div className="text-center flex-1 border-r border-pink-200">
              <p className="text-[11px] font-bold text-pink-400 mb-0.5">フリー</p>
              <p className="text-[28px] font-black text-pink-600 leading-none">{monthlyTotals.f}<span className="text-xs ml-0.5">本</span></p>
            </div>
            <div className="text-center flex-1 border-r border-pink-200">
              <p className="text-[11px] font-bold text-pink-400 mb-0.5">初指名</p>
              <p className="text-[28px] font-black text-pink-600 leading-none">{monthlyTotals.first}<span className="text-xs ml-0.5">本</span></p>
            </div>
            <div className="text-center flex-1">
              <p className="text-[11px] font-bold text-pink-400 mb-0.5">本指名</p>
              <p className="text-[28px] font-black text-pink-600 leading-none">{monthlyTotals.main}<span className="text-xs ml-0.5">本</span></p>
            </div>
          </div>
        </section>

        {/* 2. 📅 カレンダー（中央） */}
        <section className="bg-white p-2 rounded-[22px] border border-pink-200 shadow-sm overflow-hidden">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </section>

        {/* 3. ✍️ 実績入力フォーム（統合枠） */}
        <section className="bg-white rounded-[24px] border border-pink-300 shadow-xl overflow-hidden">
          <div className="bg-[#FFF5F6] p-3 px-4 border-b border-pink-200 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-700">
              {selectedDate ? format(selectedDate, 'M/d (eee)', { locale: ja }) : '選択中'}
            </h3>
            {selectedShift ? (
              <p className="text-xl font-black text-pink-500 tracking-tighter">
                {selectedShift.start_time}<span className="text-xs mx-1 opacity-30">~</span>{selectedShift.end_time}
              </p>
            ) : (
              <span className="text-[9px] font-bold text-gray-400 uppercase px-2 py-1 bg-gray-100 rounded-md">Off</span>
            )}
          </div>

          {selectedShift ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'フリー', key: 'f' },
                  { label: '初指名', key: 'first' },
                  { label: '本指名', key: 'main' }
                ].map((item) => (
                  <div key={item.key} className="space-y-1 text-center">
                    <label className="text-[11px] font-bold text-gray-300 block tracking-tighter">{item.label}</label>
                    <input
                      type="number" inputMode="numeric" placeholder="0"
                      value={editReward[item.key as keyof typeof editReward]}
                      onChange={e => setEditReward({...editReward, [item.key]: e.target.value})}
                      className="w-full text-center py-2.5 bg-[#FAFAFA] rounded-lg font-black text-[26px] text-pink-500 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 bg-pink-50/50 p-2.5 px-4 rounded-xl border border-pink-200">
                <label className="text-[11px] font-black text-pink-300 shrink-0 uppercase tracking-widest">給料</label>
                <div className="relative flex-1 text-right">
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 text-pink-200 text-xl font-black">¥</span>
                  <input
                    type="number" inputMode="numeric" placeholder="0"
                    value={editReward.amount}
                    onChange={e => setEditReward({...editReward, amount: e.target.value})}
                    className="w-full text-right pr-1 py-1 bg-transparent font-black text-[34px] text-pink-500 focus:outline-none placeholder:text-pink-100"
                  />
                </div>
              </div>

              <button onClick={handleSaveReward} className="w-full bg-pink-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-xs tracking-[0.2em] uppercase">
                実績を保存 💾
              </button>
            </div>
          ) : (
            <div className="p-8 text-center bg-white italic text-gray-300 text-xs">
              お休みの日です 🌙
            </div>
          )}
        </section>

        {/* 4. 📢 NEWS（最下部へ移動） */}
        <section className="bg-white rounded-xl overflow-hidden border border-pink-100 shadow-sm opacity-90">
          <div className="bg-gray-50 p-2 border-b border-pink-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop News</p>
          </div>
          {newsList.map((news) => (
            <div key={news.id} className="p-3 px-4 text-left flex items-start space-x-3 border-b border-gray-50 last:border-0">
              <span className="text-[9px] text-pink-200 font-bold shrink-0 mt-0.5">{format(parseISO(news.created_at), 'MM/dd')}</span>
              <p className="text-xs font-bold text-gray-500 leading-tight">{news.content}</p>
            </div>
          ))}
        </section>

      </main>

      {/* 📱 フッター */}
      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-pink-100 pb-6 pt-3 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <nav className="flex justify-around items-center max-w-sm mx-auto px-4">
          <button className="flex flex-col items-center text-pink-500" onClick={() => router.push('/')}>
            <span className="text-xl mb-0.5">🏠</span>
            <span className="text-[9px] font-black tracking-tighter">HOME</span>
          </button>
          <button className="flex flex-col items-center text-gray-300">
            <span className="text-xl mb-0.5">💰</span>
            <span className="text-[9px] font-black tracking-tighter">SALARY</span>
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-300">
            <span className="text-xl mb-0.5">🚪</span>
            <span className="text-[9px] font-black tracking-tighter">LOGOUT</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}