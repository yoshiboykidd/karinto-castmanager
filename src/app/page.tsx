'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
// ↓ ここが案①のポイント：appフォルダから1つ上のsrcフォルダに戻り、componentsを見に行く
import DashboardCalendar from '../components/DashboardCalendar';

// データの型定義（TypeScriptの赤線を防ぐため）
interface Shift {
  shift_date: string;
  start_time: string;
  end_time: string;
}

export default function HomePage() {
  const router = useRouter();
  
  // Supabaseの初期化（ログイン画面と同じ書き方）
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. セッション確認
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // 2. シフトデータの取得
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

  // 🚀 出勤数と稼働時間の計算
  const summary = shifts.reduce((acc, shift) => {
    acc.totalCount += 1;
    if (shift.start_time && shift.end_time) {
      const [sH, sM] = shift.start_time.split(':').map(Number);
      const [eH, eM] = shift.end_time.split(':').map(Number);
      let adjustedEH = eH;
      if (eH < sH) adjustedEH += 24; // 日またぎ対応
      const hours = (adjustedEH + eM / 60) - (sH + sM / 60);
      acc.totalHours += hours;
    }
    return acc;
  }, { totalCount: 0, totalHours: 0 });

  const displayHours = Math.round(summary.totalHours * 10) / 10;

  if (loading) return <div className="p-10 text-center text-pink-400 font-bold">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-[#fff5f8] pb-24 p-4 text-gray-800">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* 集計ヘッダーパネル */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
          <p className="text-2xl font-black mb-4 tracking-tight">マイページ</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100">
              <p className="text-[10px] text-pink-400 font-bold mb-1 uppercase tracking-wider">Shifts</p>
              <p className="text-2xl font-black text-pink-600">
                {summary.totalCount}<span className="text-xs ml-1 font-bold">日</span>
              </p>
            </div>
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100">
              <p className="text-[10px] text-pink-400 font-bold mb-1 uppercase tracking-wider">Hours</p>
              <p className="text-2xl font-black text-pink-600">
                {displayHours}<span className="text-xs ml-1 font-bold">h</span>
              </p>
            </div>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-pink-100">
          <DashboardCalendar shifts={shifts} />
        </div>

      </div>
    </div>
  );
}