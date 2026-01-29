import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardCalendar from '@/components/DashboardCalendar';

export default async function DashboardPage() {
  const supabase = createClient();

  // 1. セッション確認
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // 2. シフトデータの取得
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('login_id', session.user.email?.split('@')[0]) // キャストIDで絞り込み
    .order('shift_date', { ascending: true });

  // 3. 【新機能】出勤数と稼働時間の計算
  const summary = (shifts || []).reduce((acc, shift) => {
    // 出勤数をカウント
    acc.totalCount += 1;

    // 時間の計算 (例: "19:00" - "24:00")
    const [sH, sM] = shift.start_time.split(':').map(Number);
    const [eH, eM] = shift.end_time.split(':').map(Number);
    
    let adjustedEH = eH;
    if (eH < sH) adjustedEH += 24; // 日またぎ（例：深夜2時まで）の対応

    const hours = (adjustedEH + eM / 60) - (sH + sM / 60);
    acc.totalHours += hours;
    
    return acc;
  }, { totalCount: 0, totalHours: 0 });

  const displayHours = Math.round(summary.totalHours * 10) / 10;

  return (
    <div className="min-h-screen bg-[#fff5f8] pb-20 p-4">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* プロフィール・ヘッダー（既存のものがあれば差し替えてください） */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
          <h2 className="text-gray-400 text-xs font-bold mb-1">HELLO, CAST!</h2>
          <p className="text-2xl font-black text-gray-800 mb-4">マイページ</p>

          {/* 🚀 集計パネル */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100">
              <p className="text-[10px] text-pink-400 font-bold mb-1">今月の出勤数</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-pink-600">{summary.totalCount}</span>
                <span className="text-xs text-pink-400 font-bold">日</span>
              </div>
            </div>
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100">
              <p className="text-[10px] text-pink-400 font-bold mb-1">総稼働時間</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-pink-600">{displayHours}</span>
                <span className="text-xs text-pink-400 font-bold">h</span>
              </div>
            </div>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
          <DashboardCalendar shifts={shifts || []} />
        </div>

      </div>
    </div>
  );
}