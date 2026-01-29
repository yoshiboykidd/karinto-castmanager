'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import DashboardCalendar from '@/components/DashboardCalendar';

export default function Page() {
  const router = useRouter();
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [shifts, setShifts] = useState<any[]>([]);
  const [castProfile, setCastProfile] = useState<any>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserAndFetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const loginId = session.user.email?.replace('@karinto-internal.com', '');

      const [castRes, shiftRes, newsRes] = await Promise.all([
        supabase.from('cast_members').select('*').eq('login_id', loginId).single(),
        supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(3)
      ]);
      
      setCastProfile(castRes.data);
      setShifts(shiftRes.data || []);
      setNewsList(newsRes.data || []);
      setLoading(false);
    }
    checkUserAndFetchData();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center text-pink-400 font-bold animate-pulse">
        データを読み込み中...
      </div>
    );
  }

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thisWeekShifts = shifts.filter(s => isWithinInterval(parseISO(s.shift_date), { start: weekStart, end: weekEnd }));
  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-gray-800 pb-32">
      {/* ヘッダー */}
      <header className="bg-white px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm">
        <div className="mb-2">
          <span className="text-[12px] font-black text-pink-300 tracking-tighter uppercase">Karinto Cast Manager</span>
        </div>
        <p className="text-pink-400 text-[10px] font-bold tracking-[0.2em] mb-1">WELCOME BACK</p>
        <h1 className="text-3xl font-black text-gray-800">
          {castProfile?.display_name || 'キャスト'} さん
        </h1>
      </header>

      <main className="px-4 mt-6 space-y-6">
        
        {/* 📢 お知らせセクション (ひとつにまとめた背景) */}
        <section className="px-2">
          <div className="flex items-center mb-2 ml-1">
            <span className="text-lg mr-2">📢</span>
            <p className="text-xs font-black text-pink-400 uppercase tracking-widest">News</p>
          </div>

          <div className="bg-white border border-pink-100 rounded-[28px] overflow-hidden shadow-sm">
            {newsList.length > 0 ? (
              <div className="divide-y divide-pink-50">
                {newsList.map((news) => (
                  <div key={news.id} className="p-4 hover:bg-pink-50/30 transition-colors">
                    <p className="text-[9px] text-gray-400 mb-1">
                      {format(parseISO(news.created_at), 'yyyy.MM.dd')}
                    </p>
                    <p className="text-sm font-bold text-gray-700 leading-snug">
                      {news.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center italic text-gray-400 text-sm">
                現在、新しいお知らせはありません🌸
              </div>
            )}
          </div>
        </section>

        {/* カレンダーセクション */}
        <section className="bg-white p-2 rounded-[32px] shadow-sm border border-pink-50">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </section>
        
        {/* 選択日の詳細 */}
        <section className="bg-gradient-to-br from-pink-400 to-rose-400 p-6 rounded-[30px] text-white shadow-xl shadow-pink-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {selectedDate ? format(selectedDate, 'M月d日 (eee)', { locale: ja }) : '日付を選択'}
            </h3>
            <span className="bg-white/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">DETAIL</span>
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

        {/* 今週のスケジュール */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-pink-50">
          <h3 className="text-lg font-black text-gray-700 mb-4 flex items-center">
            <span className="w-1.5 h-6 bg-pink-400 rounded-full mr-3"></span>
            今週のスケジュール
          </h3>
          <div className="space-y-3">
            {thisWeekShifts.length > 0 ? thisWeekShifts.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{format(parseISO(s.shift_date), 'MM/dd')}</span>
                  <span className="font-bold text-gray-700">{format(parseISO(s.shift_date), 'eeee', { locale: ja })}</span>
                </div>
                <div className="text-right">
                  <span className="text-pink-500 font-black text-lg">{s.start_time} - {s.end_time}</span>
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-400 py-6 text-sm">今週の予定はありません</p>
            )}
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <nav className="flex justify-around items-center py-4 max-w-md mx-auto">
          <button className="flex flex-col items-center text-pink-500" onClick={() => router.push('/')}>
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-bold">ホーム</span>
          </button>
          <button className="flex flex-col items-center text-gray-300">
            <span className="text-2xl">💰</span>
            <span className="text-[10px] font-bold">給与</span>
          </button>
          <div className="w-px h-8 bg-gray-100"></div>
          <button onClick={handleLogout} className="flex flex-col items-center text-gray-400">
            <span className="text-2xl">🚪</span>
            <span className="text-[10px] font-bold">Logout</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}