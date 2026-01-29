'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import DashboardCalendar from '../components/DashboardCalendar';

/**
 * 型定義セクション
 * プロジェクトの厳格なデータ構造を維持
 */
interface Shift {
  id: string;
  login_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  is_important: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 状態管理
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState<'home' | 'news' | 'profile'>('home');
  const [castName, setCastName] = useState<string>('');

  // お知らせデータ（本来実装されていたはずのモックまたは取得データ）
  const [news, setNews] = useState<NewsItem[]>([
    { id: '1', title: '2月のシフト提出について', content: '20日までにお願いします。', date: '2026.01.29', is_important: true },
    { id: '2', title: 'システムメンテナンスのお知らせ', content: '深夜2時から4時まで停止します。', date: '2026.01.28', is_important: false },
  ]);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // キャストIDの抽出と名前の設定
      const castId = session.user.email?.split('@')[0] || '';
      setCastName(castId);

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('login_id', castId)
        .order('shift_date', { ascending: true });

      if (!error && data) {
        setShifts(data as Shift[]);
      }
      setLoading(false);
    }
    fetchData();
  }, [router, supabase]);

  // 今日のシフト抽出
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const todayShift = shifts.find(s => s.shift_date === todayStr);

  // 稼働集計ロジック（深夜・日またぎ対応の完全版）
  const summary = shifts.reduce((acc, shift) => {
    acc.totalCount += 1;
    if (shift.start_time && shift.end_time) {
      const [sH, sM] = shift.start_time.split(':').map(Number);
      const [eH, eM] = shift.end_time.split(':').map(Number);
      let adjustedEH = eH;
      if (eH < sH) adjustedEH += 24;
      const duration = (adjustedEH + eM / 60) - (sH + sM / 60);
      acc.totalHours += duration;
    }
    return acc;
  }, { totalCount: 0, totalHours: 0 });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF85A2] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#FF85A2] font-bold">データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F7] pb-32 font-sans text-[#4A4A4A]">
      
      {/* 固定ヘッダー */}
      <header className="bg-white px-6 pt-8 pb-6 rounded-b-[40px] shadow-[0_4px_20px_rgba(255,182,193,0.2)] mb-6 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#FF85A2] tracking-tight">Karinto</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Cast Manager</p>
          </div>
          <div className="bg-[#FFE4E9] px-4 py-2 rounded-2xl text-[#FF85A2] font-bold text-sm">
            ID: {castName}
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6">
        
        {activeTab === 'home' && (
          <>
            {/* 本日の予定セクション */}
            <section className="relative overflow-hidden bg-white p-6 rounded-[35px] border-2 border-[#FFE4E9] shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-6xl">✨</span>
              </div>
              <h2 className="text-xs font-black text-[#FF85A2] mb-4 uppercase tracking-widest">Today's Schedule</h2>
              {todayShift ? (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-800">{todayShift.start_time}</span>
                    <span className="text-xl font-bold text-gray-300">-</span>
                    <span className="text-4xl font-black text-gray-800">{todayShift.end_time}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-400">本日の勤務予定時間です</p>
                </div>
              ) : (
                <p className="text-lg font-bold text-gray-300">本日の予定はありません</p>
              )}
            </section>

            {/* 集計グリッド */}
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[30px] border-2 border-[#FFE4E9] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🗓️</span>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Attendance</p>
                </div>
                <p className="text-3xl font-black text-gray-800">{summary.totalCount}<span className="text-sm ml-1 text-[#FF85A2]">days</span></p>
              </div>
              <div className="bg-white p-5 rounded-[30px] border-2 border-[#FFE4E9] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⏱️</span>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Work Hours</p>
                </div>
                <p className="text-3xl font-black text-gray-800">{Math.round(summary.totalHours * 10) / 10}<span className="text-sm ml-1 text-[#FF85A2]">hours</span></p>
              </div>
            </section>

            {/* カレンダーセクション */}
            <section className="bg-white p-3 rounded-[35px] border-2 border-[#FFE4E9] shadow-sm overflow-hidden">
              <DashboardCalendar 
                shifts={shifts} 
                selectedDate={selectedDate} 
                onSelect={setSelectedDate} 
              />
            </section>
          </>
        )}

        {activeTab === 'news' && (
          <section className="space-y-4">
            <h2 className="text-xl font-black px-2">お知らせ</h2>
            {news.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-3xl border-2 border-[#FFE4E9] relative">
                {item.is_important && <span className="absolute top-4 right-4 bg-red-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">重要</span>}
                <p className="text-[10px] text-gray-400 font-bold mb-1">{item.date}</p>
                <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="bg-white p-8 rounded-[35px] border-2 border-[#FFE4E9] text-center">
            <div className="w-24 h-24 bg-[#FFE4E9] rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">👤</div>
            <h2 className="text-2xl font-black text-gray-800">{castName}</h2>
            <p className="text-sm text-gray-400 mb-6 uppercase tracking-widest font-bold italic">Official Cast Member</p>
            <div className="space-y-3">
              <button className="w-full py-4 bg-gray-50 rounded-2xl font-bold text-gray-600 text-sm">プロフィール編集</button>
              <button 
                onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                className="w-full py-4 bg-red-50 text-red-400 rounded-2xl font-bold text-sm"
              >
                ログアウト
              </button>
            </div>
          </section>
        )}
      </main>

      {/* フッター固定ナビゲーション */}
      <nav className="fixed bottom-6 left-5 right-5 max-w-md mx-auto z-50">
        <div className="bg-white/90 backdrop-blur-xl border-2 border-[#FFE4E9] px-8 py-4 rounded-[40px] shadow-[0_10px_30px_rgba(255,182,193,0.3)] flex justify-between items-center">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-[#FF85A2] scale-110' : 'text-gray-300'}`}>
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-black uppercase">Home</span>
          </button>
          <button onClick={() => setActiveTab('news')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'news' ? 'text-[#FF85A2] scale-110' : 'text-gray-300'}`}>
            <span className="text-2xl">📢</span>
            <span className="text-[10px] font-black uppercase">News</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-[#FF85A2] scale-110' : 'text-gray-300'}`}>
            <span className="text-2xl">👤</span>
            <span className="text-[10px] font-black uppercase">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}