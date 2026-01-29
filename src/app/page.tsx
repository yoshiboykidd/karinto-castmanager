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

  // 🚀 【修正1】選択された日付を管理する「箱」を用意します
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

  const summary = shifts.reduce((acc, shift) => {
    acc.totalCount += 1;
    if (shift.start_time && shift.end_time) {
      const [sH, sM] = shift.start_time.split(':').map(Number);
      const [eH, eM] = shift.end_time.split(':').map(Number);
      let adjustedEH = eH;
      if (eH < sH) adjustedEH += 24;
      const hours = (adjustedEH + eM / 60) - (sH + sM / 60);
      acc.totalHours += hours;
    }
    return acc;
  }, { totalCount: 0, totalHours: 0 });

  const displayHours = Math.round(summary.totalHours * 10) / 10;

  if (loading) return <div className="p-10 text-center text-pink-400 font-bold italic">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#fff5f8] pb-24 p-4 text-gray-800 font-sans">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* 集計ヘッダー */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
          <p className="text-2xl font-black mb-4 tracking-tight">マイページ</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 text-center">
              <p className="text-[10px] text-pink-400 font-bold mb-1 uppercase tracking-widest text-left">Shifts</p>
              <p className="text-2xl font-black text-pink-600">{summary.totalCount}<span className="text-sm ml-1">日</span></p>
            </div>
            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 text-center">
              <p className="text-[10px] text-pink-400 font-bold mb-1 uppercase tracking-widest text-left">Hours</p>
              <p className="text-2xl font-black text-pink-600">{displayHours}<span className="text-sm ml-1">h</span></p>
            </div>
          </div>
        </div>

        {/* カレンダー本体 */}
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
          {/* 🚀 【修正2】エラーが出ていた場所に、必要なデータを全て渡します */}
          <DashboardCalendar 
            shifts={shifts} 
            selectedDate={selectedDate} 
            onSelect={setSelectedDate} 
          />
        </div>

      </div>
    </div>
  );
}