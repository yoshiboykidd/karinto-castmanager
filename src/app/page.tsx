import { createClient } from '@/utils/supabase/server'; // ← ここで赤線ならフォルダ名を再確認！
import { redirect } from 'next/navigation';
import DashboardCalendar from '@/components/DashboardCalendar'; // ← ここで赤線なら場所を再確認！

// データの種類を定義（これで acc, shift のエラーが消えます）
interface Shift {
  start_time: string;
  end_time: string;
  shift_date: string;
}

export default async function HomePage() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const castId = session.user.email?.split('@')[0];

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('login_id', castId)
    .order('shift_date', { ascending: true });

  // 🚀 acc と shift に型をつけて赤線を消します
  const summary = (shifts as Shift[] || []).reduce((acc, shift) => {
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
  }, { totalCount: 0, totalHours: 0 }); // ← ここで acc の初期値を設定

  const displayHours = Math.round(summary.totalHours * 10) / 10;

  return (
    <div className="min-h-screen bg-[#fff5f8] pb-24 p-4 text-gray-800">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
          <p className="text-2xl font-black mb-4 tracking-tight">マイページ</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100 text-center">
              <p className="text-[10px] text-pink-400 font-bold mb-1 text-left uppercase">Shifts</p>
              <p className="text-2xl font-black text-pink-600">{summary.totalCount}<span className="text-xs ml-1 font-bold text-pink-400">日</span></p>
            </div>
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100 text-center">
              <p className="text-[10px] text-pink-400 font-bold mb-1 text-left uppercase">Hours</p>
              <p className="text-2xl font-black text-pink-600">{displayHours}<span className="text-xs ml-1 font-bold text-pink-400">h</span></p>
            </div>
          </div>
        </div>
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-pink-100">
          <DashboardCalendar shifts={shifts || []} />
        </div>
      </div>
    </div>
  );
}