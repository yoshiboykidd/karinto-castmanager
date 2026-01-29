import { createClient } from '@/utils/supabase/server'; // ←ここのパス、フォルダ名と合っていますか？
import { redirect } from 'next/navigation';
import DashboardCalendar from '@/components/DashboardCalendar';

export default async function HomePage() {
  const supabase = createClient();

  // 1. セッションチェック
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const castId = session.user.email?.split('@')[0];

  // 2. シフトデータ取得
  const { data: shifts, error: fetchError } = await supabase
    .from('shifts')
    .select('*')
    .eq('login_id', castId)
    .order('shift_date', { ascending: true });

  if (fetchError) {
    console.error('Fetch error:', fetchError);
  }

  // 3. 安全な計算ロジック（データが変でもエラーにしない）
  const summary = (shifts || []).reduce((acc, shift) => {
    // start_time や end_time が空の場合は計算を飛ばす
    if (!shift.start_time || !shift.end_time) {
      acc.totalCount += 1;
      return acc;
    }

    try {
      acc.totalCount += 1;
      const [sH, sM] = shift.start_time.split(':').map(Number);
      const [eH, eM] = shift.end_time.split(':').map(Number);
      
      let adjustedEH = eH;
      if (eH < sH) adjustedEH += 24;

      const hours = (adjustedEH + eM / 60) - (sH + sM / 60);
      acc.totalHours += hours;
    } catch (e) {
      console.error('Calculation error for shift:', shift);
    }
    return acc;
  }, { totalCount: 0, totalHours: 0 });

  const displayHours = Math.round(summary.totalHours * 10) / 10;

  return (
    <div className="min-h-screen bg-[#fff5f8] pb-24 p-4">
      <div className="max-w-md mx-auto space-y-4">
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
          <p className="text-2xl font-black text-gray-800 mb-4">マイページ</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100 text-center">
              <p className="text-[10px] text-pink-400 font-bold mb-1 text-left">今月の出勤数</p>
              <p className="text-2xl font-black text-pink-600">{summary.totalCount}<span className="text-xs ml-1">日</span></p>
            </div>
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100 text-center">
              <p className="text-[10px] text-pink-400 font-bold mb-1 text-left">総稼働時間</p>
              <p className="text-2xl font-black text-pink-600">{displayHours}<span className="text-xs ml-1">h</span></p>
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