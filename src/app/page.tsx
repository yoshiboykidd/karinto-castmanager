'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import DashboardCalendar from '../components/DashboardCalendar';

interface Shift {
  shift_date: string;
  start_time: string;
  end_time: string;
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
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

      setShifts((data as Shift[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [router, supabase.auth]);

  // 今日の予定を抽出
  const todayStr = new Date().toISOString().split('T')[0];
  const todayShift = shifts.find(s => s.shift_date === todayStr);

  // 集計ロジック
  const summary = shifts.reduce((acc, shift) => {
    acc.totalCount += 1;
    if (shift.start_time && shift.end_time) {
      const [sH, sM] = shift.start_time.split(':').map(Number);
      const [eH, eM] = shift.end_time.split(':').map(Number);
      let adjustedEH = eH;
      if (eH < sH) adjustedEH += 24;
      acc.totalHours += (adjustedEH + eM / 60) - (sH + sM / 60);
    }
    return acc;
  }, { totalCount: 0, totalHours: 0 });

  if (loading) return <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center text-pink-400 font-bold italic">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#fff5f8] pb-32 p-4 font-sans text-gray-800">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-end px-2">
          <div>
            <h1 className="text-2xl font-black text-gray-800">My Page</h1>
            <p className="text-xs text-pink-400 font-bold tracking-widest uppercase">Karinto Cast Portal</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Today</p>
            <p className="text-sm font-black">{new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}</p>
          </div>
        </div>

        {/* 1. 今夜の予定 (復活) */}
        <div className="bg-gradient-to-br from-pink-400 to-rose-400 p-5 rounded-[2.5rem] shadow-lg shadow-pink-200 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 opacity-90">Tonight's Schedule</p>
          {todayShift ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black">{todayShift.start_time} <span className="text-lg opacity-80">-</span> {todayShift.end_time}</p>
                <p className="text-xs mt-1 font-medium opacity-90 text-pink-50">本日の出勤予定です。頑張りましょう！</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm italic font-black text-xl text-white">出勤</div>
            </div>
          ) : (
            <p className="text-xl font-bold opacity-90">本日はお休みです 🌸</p>
          )}
        </div>

        {/* 2. 今月の集計 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-pink-50 rounded-bl-[2rem] -mr-4 -mt-4 opacity-50"></div>
            <p className="text-[10px] text-pink-400 font-bold mb-1 uppercase tracking-widest">Shifts</p>
            <p className="text-3xl font-black text-gray-800">{summary.totalCount}<span className="text-sm ml-1 text-pink-300">日</span></p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-pink-50 rounded-bl-[2rem] -mr-4 -mt-4 opacity-50"></div>
            <p className="text-[10px] text-pink-400 font-bold mb-1 uppercase tracking-widest">Hours</p>
            <p className="text-3xl font-black text-gray-800">{Math.round(summary.totalHours * 10) / 10}<span className="text-sm ml-1 text-pink-300">h</span></p>
          </div>
        </div>

        {/* 3. カレンダー */}
        <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-pink-100 overflow-hidden">
          <DashboardCalendar 
            shifts={shifts} 
            selectedDate={selectedDate} 
            onSelect={setSelectedDate} 
          />
        </div>

      </div>

      {/* 4. フッターナビゲーション (復活) */}
      <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-lg border border-white/50 p-2 rounded-full shadow-2xl flex justify-between items-center px-6 py-3">
          <button className="flex flex-col items-center text-pink-500">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📢</span>
            <span className="text-[10px] font-bold">News</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}