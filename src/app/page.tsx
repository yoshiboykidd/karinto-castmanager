'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import DashboardCalendar from '../components/DashboardCalendar';

export default function HomePage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // 【修正点】ビルドエラー回避のために必要なState
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const castId = session.user.email?.split('@')[0];
      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('login_id', castId)
        .order('shift_date', { ascending: true });

      setShifts(data || []);
      setLoading(false);
    }
    fetchData();
  }, [router, supabase.auth]);

  // 【機能復元】今夜の予定の抽出
  const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD形式
  const todayShift = shifts.find(s => s.shift_date === todayStr);

  // 【機能復元】稼働集計ロジック
  const summary = shifts.reduce((acc, shift) => {
    acc.totalCount += 1;
    if (shift.start_time && shift.end_time) {
      const [sH, sM] = shift.start_time.split(':').map(Number);
      const [eH, eM] = shift.end_time.split(':').map(Number);
      let adjustedEH = eH;
      if (eH < sH) adjustedEH += 24; // 深夜2時などの日またぎ対応
      acc.totalHours += (adjustedEH + eM / 60) - (sH + sM / 60);
    }
    return acc;
  }, { totalCount: 0, totalHours: 0 });

  if (loading) return <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center text-[#FF85A2] font-bold">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-[#FFF5F7] pb-24 font-sans text-gray-700">
      
      {/* ヘッダー：Karinto Cast Manager仕様 */}
      <div className="bg-white p-6 rounded-b-[40px] shadow-sm mb-4">
        <h1 className="text-xl font-black text-[#FF85A2]">Karinto Cast Manager</h1>
        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">My Dashboard</p>
      </div>

      <div className="px-4 space-y-4">
        
        {/* 【復元】今夜の予定パネル */}
        <div className="bg-[#FFD1DC] p-6 rounded-[30px] shadow-sm text-white">
          <p className="text-[10px] font-bold mb-2 uppercase tracking-widest opacity-80">Tonight's Plan</p>
          {todayShift ? (
            <div className="flex justify-between items-center">
              <p className="text-3xl font-black">{todayShift.start_time} - {todayShift.end_time}</p>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">出勤</span>
            </div>
          ) : (
            <p className="text-xl font-bold">今日はお休みです 🌸</p>
          )}
        </div>

        {/* 【復元】集計パネル */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-[25px] border-2 border-[#FFE4E9]">
            <p className="text-[10px] text-[#FF85A2] font-bold mb-1 uppercase">Shifts</p>
            <p className="text-2xl font-black">{summary.totalCount}<span className="text-xs ml-1 font-bold">日</span></p>
          </div>
          <div className="bg-white p-4 rounded-[25px] border-2 border-[#FFE4E9]">
            <p className="text-[10px] text-[#FF85A2] font-bold mb-1 uppercase">Hours</p>
            <p className="text-2xl font-black">{Math.round(summary.totalHours * 10) / 10}<span className="text-xs ml-1 font-bold">h</span></p>
          </div>
        </div>

        {/* カレンダーエリア：ビルドエラーを修正済みの呼び出し */}
        <div className="bg-white p-2 rounded-[30px] border-2 border-[#FFE4E9] overflow-hidden">
          <DashboardCalendar 
            shifts={shifts} 
            selectedDate={selectedDate} 
            onSelect={setSelectedDate} 
          />
        </div>

      </div>

      {/* 【復元】決定済みのフッターナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#FFE4E9] px-8 py-3 flex justify-between items-center max-w-md mx-auto z-50">
        <button className="flex flex-col items-center gap-1 text-[#FF85A2]">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <span className="text-xl">📢</span>
          <span className="text-[10px] font-bold">News</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-bold">Profile</span>
        </button>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <span className="text-xl">🚪</span>
          <span className="text-[10px] font-bold">Logout</span>
        </button>
      </nav>
    </div>
  );
}