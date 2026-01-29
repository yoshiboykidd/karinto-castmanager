import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardCalendar from '../../components/DashboardCalendar';

// データの種類を定義
interface Shift {
  start_time: string;
  end_time: string;
  shift_date: string;
}

export default async function HomePage() {
  const supabase = createClient();

  // 1. ログインチェック
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const castId = session.user.email?.split('@')[0];

  // 2. シフトデータの取得
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('login_id', castId)
    .order('shift_date', { ascending: true });

  // 3. 🚀 出勤数と稼働時間の集計（安全な計算）
  const summary = ((shifts as Shift[]) || []).reduce((acc, shift) => {
    acc.totalCount += 1;
    
    if (shift.start_time && shift.end_time) {
      try {
        const [sH, sM] = shift.start_time.split(':').map(Number);
        const [eH, eM] = shift.end_time.split(':').map(Number);
        
        let adjustedEH = eH;
        // 深夜2時などの日またぎ対応
        if (eH < sH) adjustedEH += 24;

        const hours = (adjustedEH + eM / 60) - (sH + sM / 60);
        acc.totalHours += hours;
      } catch (err) {
        console.error("Time calculation error:", err);
      }
    }
    
    return acc;
  }, { totalCount: 0, totalHours: 0 });

  const displayHours = Math.round(summary.totalHours * 10) / 10;

  return (
    <div className="min-h-screen bg-[#fff5f8] pb-24 p-4 text-gray-800">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* 集計ヘッダー */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
          <p className="text-2xl font-black mb-4 tracking-tight text-gray-800">マイページ</p>
          
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
          <DashboardCalendar shifts={shifts || []} />
        </div>

      </div>
    </div>
  );
}