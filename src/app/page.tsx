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
      alert('実績を保存しました！💰');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center text-pink-300 font-bold animate-pulse">読み込み中...</div>;

  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-700 pb-32 font-sans">
      {/* ヘッダー */}
      <header className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex justify-between items-end">
        <div>
          <p className="text-pink-300 text-[10px] font-black tracking-[0.2em] mb-1 uppercase">お疲れ様です🌸</p>
          <h1 className="text-2xl font-black text-gray-800">
            {castProfile?.display_name || 'キャスト'}
            <span className="text-sm font-bold ml-1 text-gray-400">さん</span>
          </h1>
        </div>
        {castProfile?.login_id === "admin" && (
          <button onClick={() => router.push('/admin')} className="bg-gray-100 text-gray-400 text-[9px] px-3 py-1.5 rounded-full font-bold active:bg-gray-200 transition-all">⚙️ 管理</button>
        )}
      </header>

      <main className="px-5 mt-6 space-y-6">
        
        {/* 💰 合計枠：淡いパステルピンクに変更 */}
        <section className="bg-[#FFE9ED] rounded-[32px] p-6 shadow-sm border border-white">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Monthly Earnings</p>
            <span className="bg-white/60 text-[9px] text-pink-400 px-3 py-1 rounded-full font-bold shadow-sm">今月の集計</span>
          </div>
          <p className="text-4xl font-black text-pink-500 tracking-tighter mb-5">
            <span className="text-xl mr-1 font-bold">¥</span>{monthlyTotals.amount.toLocaleString()}
          </p>
          <div className="flex justify-between items-center bg-white/40 rounded-2xl p-4 backdrop-blur-sm border border-white/50">
            <div className="text-center flex-1 border-r border-pink-100">
              <p className="text-[9px] font-bold text-pink-300 mb-1 tracking-tighter">F (ﾌﾘｰ)</p>
              <p className="text-lg font-black text-pink-500">{monthlyTotals.f}<span className="text-[10px] ml-0.5">本</span></p>
            </div>
            <div className="text-center flex-1 border-r border-pink-100">
              <p className="text-[9px] font-bold text-pink-300 mb-1 tracking-tighter">初指名</p>
              <p className="text-lg font-black text-pink-500">{monthlyTotals.first}<span className="text-[10px] ml-0.5">本</span></p>
            </div>
            <div className="text-center flex-1">
              <p className="text-[9px] font-bold text-pink-300 mb-1 tracking-tighter">本指名</p>
              <p className="text-lg font-black text-pink-500">{monthlyTotals.main}<span className="text-[10px] ml-0.5">本</span></p>
            </div>
          </div>
        </section>

        {/* お知らせ：より控えめに */}
        <section className="bg-white rounded-2xl overflow-hidden border border-pink-50 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
          <div className="divide-y divide-pink-50">
            {newsList.map((news) => (
              <div key={news.id} className="p-3 text-left flex items-center space-x-3">
                <span className="text-[8px] text-pink-200 font-bold">{format(parseISO(news.created_at), 'MM/dd')}</span>
                <p className="text-xs font-bold text-gray-400 truncate">{news.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* カレンダー */}
        <section className="bg-white p-3 rounded-[32px] shadow-sm border border-pink-50">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </section>

        {/* 📅 【統合枠】日付詳細 ＋ 入力フォーム */}
        <section className="bg-white rounded-[32px] shadow-lg border border-pink-50 overflow-hidden">
          {/* 枠の上部：日付とシフト時間 */}
          <div className="bg-[#FFF5F6] p-5 border-b border-pink-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-black text-gray-700">
                {selectedDate ? format(selectedDate, 'M月d日 (eee)', { locale: ja }) : '日付を選択'}
              </h3>
              <span className={`text-[10px] px-3 py-1 rounded-full font-bold shadow-sm ${selectedShift ? 'bg-pink-400 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {selectedShift ? '出勤' : '休み'}
              </span>
            </div>
            <div className="text-center py-2">
              {selectedShift ? (
                <p className="text-2xl font-black text-pink-400 tracking-tighter">
                  {selectedShift.start_time} <span className="text-sm mx-2 font-normal text-pink-200">〜</span> {selectedShift.end_time}
                </p>
              ) : (
                <p className="text-sm font-bold text-gray-300 italic">OFF 🌙</p>
              )}
            </div>
          </div>

          {/* 枠の下部：入力フォーム（出勤時のみ） */}
          {selectedShift ? (
            <div className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'F (ﾌﾘｰ)', key: 'f' },
                  { label: '初指名', key: 'first' },
                  { label: '本指名', key: 'main' }
                ].map((item) => (
                  <div key={item.key} className="space-y-1.5 text-center">
                    <label className="text-[9px] font-black text-gray-300 block tracking-tighter">{item.label}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={editReward[item.key as keyof typeof editReward]}
                      onChange={e => setEditReward({...editReward, [item.key]: e.target.value})}
                      className="w-full text-center py-3 bg-[#FAFAFA] rounded-xl font-black text-pink-400 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all placeholder:text-gray-200"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-300 text-center block mb-2 tracking-widest">本日のお給料 (円)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-pink-100 text-xl font-black">¥</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={editReward.amount}
                    onChange={e => setEditReward({...editReward, amount: e.target.value})}
                    className="w-full text-center py-5 bg-[#FAFAFA] rounded-2xl font-black text-3xl text-pink-500 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all placeholder:text-pink-100"
                  />
                </div>
              </div>

              <button onClick={handleSaveReward} className="w-full bg-pink-400 hover:bg-pink-500 text-white font-black py-4 rounded-2xl shadow-md active:scale-95 transition-all text-sm tracking-widest">
                保存する
              </button>
            </div>
          ) : (
            <div className="p-8 text-center bg-white">
              <p className="text-xs font-bold text-gray-300">本日の実績入力はありません</p>
            </div>
          )}
        </section>
      </main>

      {/* フッター */}
      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/80 backdrop-blur-md border-t border-pink-50 pb-6 pt-3">
        <nav className="flex justify-around items-center max-w-sm mx-auto">
          <button className="flex flex-col items-center text-pink-400" onClick={() => router.push('/')}>
            <span className="text-xl mb-1">🏠</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
          </button>
          <button className="flex flex-col items-center text-gray-300">
            <span className="text-xl mb-1">💰</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Salary</span>
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-300">
            <span className="text-xl mb-1">🚪</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Logout</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}