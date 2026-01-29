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

  // 今月の集計（報酬額・本数）
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

  if (loading) return <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center text-pink-400 font-bold animate-pulse">読み込み中...</div>;

  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-gray-800 pb-32">
      {/* ヘッダー */}
      <header className="bg-white px-6 pt-10 pb-4 rounded-b-[40px] shadow-sm flex justify-between items-center">
        <div>
          <p className="text-pink-400 text-[10px] font-black tracking-widest uppercase">Cast Home</p>
          <h1 className="text-2xl font-black text-gray-800">
            {castProfile?.display_name || 'キャスト'}<span className="text-xs font-bold ml-1 text-gray-400">さん</span>
          </h1>
        </div>
        {castProfile?.login_id === "admin" && (
          <button onClick={() => router.push('/admin')} className="bg-gray-800 text-white text-[9px] px-3 py-1.5 rounded-full font-bold">⚙️ 管理画面</button>
        )}
      </header>

      <main className="px-4 mt-4 space-y-4">
        
        {/* 💰 今月の報酬サマリー（独立した大きな枠） */}
        <section className="bg-gradient-to-br from-rose-400 to-pink-400 rounded-[35px] p-6 text-white shadow-xl shadow-pink-100">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">{format(new Date(), 'MMMM')} Total</p>
            <span className="bg-white/20 text-[9px] px-2 py-0.5 rounded-full font-bold">今月の集計</span>
          </div>
          <p className="text-4xl font-black tracking-tighter mb-4">
            ¥{monthlyTotals.amount.toLocaleString()}
          </p>
          <div className="flex justify-between items-center bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
            <div className="text-center flex-1 border-r border-white/20">
              <p className="text-[8px] font-bold opacity-70 mb-0.5">F (ﾌﾘｰ)</p>
              <p className="text-lg font-black">{monthlyTotals.f}<span className="text-[10px] ml-0.5">本</span></p>
            </div>
            <div className="text-center flex-1 border-r border-white/20">
              <p className="text-[8px] font-bold opacity-70 mb-0.5">初指名</p>
              <p className="text-lg font-black">{monthlyTotals.first}<span className="text-[10px] ml-0.5">本</span></p>
            </div>
            <div className="text-center flex-1">
              <p className="text-[8px] font-bold opacity-70 mb-0.5">本指名</p>
              <p className="text-lg font-black">{monthlyTotals.main}<span className="text-[10px] ml-0.5">本</span></p>
            </div>
          </div>
        </section>

        {/* お知らせ */}
        <section className="bg-white border border-pink-50 rounded-[22px] overflow-hidden shadow-sm">
          <div className="divide-y divide-pink-50">
            {newsList.map((news) => (
              <div key={news.id} className="p-3 text-left flex items-center space-x-2">
                <span className="text-[8px] text-pink-300 font-bold px-2 py-0.5 bg-pink-50 rounded-full">{format(parseISO(news.created_at), 'MM/dd')}</span>
                <p className="text-xs font-bold text-gray-500 truncate">{news.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* カレンダー */}
        <section className="bg-white p-2 rounded-[28px] shadow-sm border border-pink-50">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </section>

        {/* 📅 日付詳細：以前のシフト表示 + 実績入力 */}
        <div className="space-y-4">
          <section className="bg-gradient-to-br from-pink-400 to-rose-400 p-5 rounded-[28px] text-white shadow-lg shadow-pink-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">
                {selectedDate ? format(selectedDate, 'M月d日 (eee)', { locale: ja }) : '日付を選択'}
              </h3>
              <span className="bg-white/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">予定</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              {selectedShift ? (
                <p className="text-3xl font-black tracking-tighter">
                  {selectedShift.start_time} <span className="text-sm font-normal mx-1">〜</span> {selectedShift.end_time}
                </p>
              ) : (
                <p className="text-sm font-medium opacity-80 italic">本日はお休みです 🌙</p>
              )}
            </div>
          </section>

          {/* 出勤予定がある日だけ実績入力フォームを表示 */}
          {selectedShift && (
            <section className="bg-white p-6 rounded-[32px] shadow-lg border border-pink-50 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center mb-5 ml-1">
                <span className="text-pink-400 mr-2">✍️</span>
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">実績を入力</h3>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'F', key: 'f' },
                    { label: '初', key: 'first' },
                    { label: '本', key: 'main' }
                  ].map((item) => (
                    <div key={item.key} className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{item.label}</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={editReward[item.key as keyof typeof editReward]}
                        onChange={e => setEditReward({...editReward, [item.key]: e.target.value})}
                        className="w-full text-center py-3 bg-gray-50 rounded-xl font-black text-pink-500 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-200"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center block">本日のお給料 (円)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={editReward.amount}
                    onChange={e => setEditReward({...editReward, amount: e.target.value})}
                    className="w-full text-center py-4 bg-pink-50 rounded-2xl font-black text-3xl text-pink-600 border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                <button onClick={handleSaveReward} className="w-full bg-gray-800 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all">
                  実績を保存する 💾
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/90 backdrop-blur-md border-t border-gray-100 pb-4 pt-2">
        <nav className="flex justify-around items-center max-w-md mx-auto">
          <button className="flex flex-col items-center text-pink-500" onClick={() => router.push('/')}>
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-bold tracking-tighter">ホーム</span>
          </button>
          <button className="flex flex-col items-center text-gray-300">
            <span className="text-2xl">💰</span>
            <span className="text-[10px] font-bold tracking-tighter">給与</span>
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-400">
            <span className="text-2xl">🚪</span>
            <span className="text-[10px] font-bold tracking-tighter">Logout</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}