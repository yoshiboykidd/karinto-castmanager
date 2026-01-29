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

  if (loading) return <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center text-pink-400 font-bold animate-pulse">読み込み中...</div>;

  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF6F8] text-gray-800 pb-32 font-sans">
      {/* ヘッダー：余白を調整しスッキリと */}
      <header className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex justify-between items-end">
        <div>
          <p className="text-pink-400 text-xs font-bold tracking-wider mb-1">Cast Home</p>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {castProfile?.display_name || 'キャスト'}
            <span className="text-sm font-bold ml-2 text-gray-400">さん</span>
          </h1>
        </div>
        {castProfile?.login_id === "admin" && (
          <button onClick={() => router.push('/admin')} className="bg-gray-800 text-white text-[10px] px-4 py-2 rounded-full font-bold shadow-sm active:scale-95 transition-all">⚙️ 管理画面</button>
        )}
      </header>

      <main className="px-5 mt-6 space-y-5">
        
        {/* 💰 今月の報酬サマリー：バランスを整え、高級感のあるグラデーションに */}
        <section className="bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 rounded-3xl p-5 text-white shadow-lg shadow-pink-200/50 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3 opacity-90">
              <p className="text-xs font-bold uppercase tracking-widest">{format(new Date(), 'MMMM')} Total</p>
              <span className="bg-white/20 text-[10px] px-3 py-0.5 rounded-full font-bold">今月の集計</span>
            </div>
            {/* 金額のフォントサイズを調整し、通貨記号とのバランスを改善 */}
            <p className="text-4xl font-extrabold tracking-tight mb-5 flex items-baseline">
              <span className="text-2xl mr-1">¥</span>
              {monthlyTotals.amount.toLocaleString()}
            </p>
            {/* 内訳の視認性を向上 */}
            <div className="flex justify-between items-center bg-white/15 rounded-2xl p-3 backdrop-blur-md">
              <div className="text-center flex-1 border-r border-white/20">
                <p className="text-[10px] font-bold opacity-80 mb-1">FREE</p>
                <p className="text-xl font-extrabold">{monthlyTotals.f}<span className="text-xs ml-1 font-bold">本</span></p>
              </div>
              <div className="text-center flex-1 border-r border-white/20">
                <p className="text-[10px] font-bold opacity-80 mb-1">初指名</p>
                <p className="text-xl font-extrabold">{monthlyTotals.first}<span className="text-xs ml-1 font-bold">本</span></p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold opacity-80 mb-1">本指名</p>
                <p className="text-xl font-extrabold">{monthlyTotals.main}<span className="text-xs ml-1 font-bold">本</span></p>
              </div>
            </div>
          </div>
          {/* 装飾的な背景円 */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </section>

        {/* お知らせ：シンプルに */}
        <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-pink-50/50">
          <div className="divide-y divide-gray-50">
            {newsList.map((news) => (
              <div key={news.id} className="p-4 text-left flex items-center space-x-3 active:bg-gray-50 transition-colors">
                <span className="text-[9px] text-gray-400 font-bold shrink-0">{format(parseISO(news.created_at), 'MM/dd')}</span>
                <p className="text-sm font-medium text-gray-600 truncate">{news.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* カレンダー */}
        <section className="bg-white p-3 rounded-3xl shadow-sm border border-pink-50/50">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </section>

        {/* 📅 日付詳細エリア */}
        <div className="space-y-5">
          {/* シフト時間表示：高さを抑えてスッキリと */}
          <section className="bg-gradient-to-r from-pink-400 to-rose-400 p-4 rounded-3xl text-white shadow-md shadow-pink-100">
            <div className="flex justify-between items-center mb-2 opacity-90">
              <h3 className="text-md font-bold">
                {selectedDate ? format(selectedDate, 'M月d日 (eee)', { locale: ja }) : '日付を選択'}
              </h3>
              <span className="text-xs font-bold tracking-wider opacity-80">SCHEDULE</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
              {selectedShift ? (
                <p className="text-2xl font-extrabold tracking-tight">
                  {selectedShift.start_time} <span className="text-sm mx-1 font-light">〜</span> {selectedShift.end_time}
                </p>
              ) : (
                <p className="text-sm font-medium opacity-90">お休み 🌙</p>
              )}
            </div>
          </section>

          {/* 実績入力フォーム：入力欄のゴツさを解消 */}
          {selectedShift && (
            <section className="bg-white p-5 rounded-3xl shadow-lg border border-pink-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center mb-4">
                <h3 className="text-sm font-bold text-gray-700">✍️ 本日の実績を入力</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'FREE', key: 'f' },
                    { label: '初指名', key: 'first' },
                    { label: '本指名', key: 'main' }
                  ].map((item) => (
                    <div key={item.key} className="space-y-2 text-center">
                      <label className="text-[10px] font-bold text-gray-400 block">{item.label}</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={editReward[item.key as keyof typeof editReward]}
                        onChange={e => setEditReward({...editReward, [item.key]: e.target.value})}
                        className="w-full text-center py-2 bg-pink-50/30 rounded-xl font-bold text-lg text-pink-600 border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-bold text-gray-400 text-center block mb-2">本日のお給料 (円)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 font-bold">¥</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={editReward.amount}
                      onChange={e => setEditReward({...editReward, amount: e.target.value})}
                      className="w-full text-center py-3 pl-8 bg-pink-50/50 rounded-2xl font-extrabold text-2xl text-pink-600 border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all placeholder:text-pink-200"
                    />
                  </div>
                </div>

                <button onClick={handleSaveReward} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-95 transition-all text-sm">
                  実績を保存する
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/80 backdrop-blur-lg border-t border-gray-50 pb-5 pt-3">
        <nav className="flex justify-around items-center max-w-sm mx-auto">
          <button className="flex flex-col items-center text-pink-500 transition-transform active:scale-90" onClick={() => router.push('/')}>
            <span className="text-xl mb-0.5">🏠</span>
            <span className="text-[9px] font-bold">ホーム</span>
          </button>
          <button className="flex flex-col items-center text-gray-300 transition-transform active:scale-90">
            <span className="text-xl mb-0.5">💰</span>
            <span className="text-[9px] font-bold">給与</span>
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex flex-col items-center text-gray-300 transition-transform active:scale-90">
            <span className="text-xl mb-0.5">🚪</span>
            <span className="text-[9px] font-bold">ログアウト</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}