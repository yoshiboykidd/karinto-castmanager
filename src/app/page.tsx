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
  
  // 入力用の一時状態
  const [editReward, setEditReward] = useState({ f: 0, first: 0, main: 0, amount: 0 });

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
    
    const profile = castRes.data;
    setCastProfile(profile);
    setShifts(shiftRes.data || []);

    if (profile) {
      const myShopId = profile.HOME_shop_ID || 'main';
      const { data: newsData } = await supabase.from('news').select('*')
        .or(`shop_id.eq.${myShopId},shop_id.eq.all`).order('created_at', { ascending: false }).limit(3);
      setNewsList(newsData || []);
    }
    setLoading(false);
  }

  // 日付が選択されたとき、入力値をセット
  useEffect(() => {
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    if (shift) {
      setEditReward({
        f: shift.f_count || 0,
        first: shift.first_request_count || 0,
        main: shift.main_request_count || 0,
        amount: shift.reward_amount || 0
      });
    } else {
      setEditReward({ f: 0, first: 0, main: 0, amount: 0 });
    }
  }, [selectedDate, shifts]);

  // 今月の合計金額を計算
  const totalEarnings = shifts
    .filter(s => isWithinInterval(parseISO(s.shift_date), { 
      start: startOfMonth(new Date()), 
      end: endOfMonth(new Date()) 
    }))
    .reduce((sum, s) => sum + (s.reward_amount || 0), 0);

  // 報酬の保存
  const handleSaveReward = async () => {
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const { error } = await supabase
      .from('shifts')
      .update({
        f_count: editReward.f,
        first_request_count: editReward.first,
        main_request_count: editReward.main,
        reward_amount: editReward.amount
      })
      .eq('login_id', castProfile.login_id)
      .eq('shift_date', dateStr);

    if (error) {
      alert('保存に失敗しました');
    } else {
      fetchInitialData(); // 再取得して集計を更新
      alert('保存しました！✨');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center text-pink-400 font-bold animate-pulse">読み込み中...</div>;

  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-gray-800 pb-32">
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm text-center relative">
        <div className="flex justify-between items-start mb-1 px-2">
          <span className="text-[10px] font-black text-pink-300 uppercase">Karinto Manager</span>
          {castProfile?.login_id === "admin" && (
            <button onClick={() => router.push('/admin')} className="bg-gray-800 text-white text-[9px] px-3 py-1 rounded-full">⚙️ 管理</button>
          )}
        </div>
        
        <h1 className="text-2xl font-black text-gray-800">
          {castProfile?.display_name || 'キャスト'}<span className="text-xs font-bold ml-1 text-gray-400">さん</span>
        </h1>

        {/* 💰 今月の合計報酬表示 */}
        <div className="mt-4 bg-gradient-to-r from-rose-400 to-pink-400 rounded-3xl p-5 shadow-lg shadow-pink-100 mx-auto max-w-[280px]">
          <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mb-1">{format(new Date(), 'MMMM')} Earnings</p>
          <p className="text-3xl font-black text-white tracking-tighter">
            ¥{totalEarnings.toLocaleString()}<span className="text-sm ml-1 font-bold italic">total</span>
          </p>
        </div>
      </header>

      <main className="px-4 mt-6 space-y-4 text-center">
        {/* お知らせ */}
        <section className="bg-white border border-pink-100 rounded-[24px] overflow-hidden shadow-sm mx-1">
          <div className="divide-y divide-pink-50">
            {newsList.map((news) => (
              <div key={news.id} className="p-3 text-left">
                <span className="text-[8px] text-gray-300 font-bold">{format(parseISO(news.created_at), 'MM.dd')}</span>
                <p className="text-xs font-bold text-gray-600 truncate">{news.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* カレンダー */}
        <section className="bg-white p-2 rounded-[28px] shadow-sm border border-pink-50">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </section>

        {/* 報酬入力エリア */}
        <section className="bg-white p-6 rounded-[32px] shadow-lg border border-pink-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-black text-gray-700">{format(selectedDate || new Date(), 'M/d (eee)', { locale: ja })} の報酬</h3>
            <span className={`text-[10px] px-3 py-1 rounded-full font-bold ${selectedShift ? 'bg-pink-100 text-pink-500' : 'bg-gray-100 text-gray-400'}`}>
              {selectedShift ? '出勤' : '休み'}
            </span>
          </div>

          {selectedShift ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">F (ﾌﾘｰ)</label>
                  <input type="number" value={editReward.f} onChange={e => setEditReward({...editReward, f: parseInt(e.target.value) || 0})} className="w-full text-center p-2 bg-gray-50 rounded-xl font-black text-pink-500 border border-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">初 (初指)</label>
                  <input type="number" value={editReward.first} onChange={e => setEditReward({...editReward, first: parseInt(e.target.value) || 0})} className="w-full text-center p-2 bg-gray-50 rounded-xl font-black text-pink-500 border border-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">本 (本指)</label>
                  <input type="number" value={editReward.main} onChange={e => setEditReward({...editReward, main: parseInt(e.target.value) || 0})} className="w-full text-center p-2 bg-gray-50 rounded-xl font-black text-pink-500 border border-gray-100" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">本日のお給料 (円)</label>
                <input type="number" value={editReward.amount} onChange={e => setEditReward({...editReward, amount: parseInt(e.target.value) || 0})} className="w-full text-center p-4 bg-pink-50 rounded-2xl font-black text-2xl text-pink-600 border border-pink-100" />
              </div>
              <button onClick={handleSaveReward} className="w-full bg-gray-800 text-white font-black py-4 rounded-2xl shadow-md active:scale-95 transition-all">
                この内容で保存する 💾
              </button>
            </div>
          ) : (
            <p className="py-6 text-sm text-gray-300 italic">この日は出勤予定がありません 🌙</p>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/90 backdrop-blur-md border-t border-gray-100">
        <nav className="flex justify-around items-center py-4 max-w-md mx-auto">
          <button className="flex flex-col items-center text-pink-500" onClick={() => router.push('/')}>🏠<span className="text-[10px] font-bold">ホーム</span></button>
          <button className="flex flex-col items-center text-gray-300">💰<span className="text-[10px] font-bold">給与</span></button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-400">🚪<span className="text-[10px] font-bold">Logout</span></button>
        </nav>
      </footer>
    </div>
  );
}