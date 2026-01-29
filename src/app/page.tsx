'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import DashboardCalendar from '@/components/DashboardCalendar';

export default function Page() {
  const router = useRouter();
  // Supabaseクライアントの初期化
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [shifts, setShifts] = useState<any[]>([]);
  const [castProfile, setCastProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserAndFetchData() {
      // 1. セッション（ログイン状態）の確認
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // ログインしてなければログイン画面へ飛ばす
        router.push('/login');
        return;
      }

      // 2. メールアドレスからドメインを除去して ID を特定
      // 例: 00600005@karinto-internal.com -> 00600005
      const loginId = session.user.email?.replace('@karinto-internal.com', '');

      // 3. ログインしているキャストのデータとシフトを取得
      const [castRes, shiftRes] = await Promise.all([
        supabase.from('cast_members').select('*').eq('login_id', loginId).single(),
        supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true })
      ]);
      
      setCastProfile(castRes.data);
      setShifts(shiftRes.data || []);
      setLoading(false);
    }
    checkUserAndFetchData();
  }, [supabase, router]);

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // ローディング中の画面
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center">
        <div className="text-pink-400 font-bold animate-pulse">データを読み込み中...</div>
      </div>
    );
  }

  // カレンダーとスケジュールの計算ロジック
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
<p className="text-pink-400 text-[10px] font-bold tracking-[0.2em] mb-1">お疲れ様です</p>
        <h1 className="text-3xl font-black text-gray-800">
          {castProfile?.display_name || 'キャスト'} さん
        </h1>
      </header>

      <main className="px-4 mt-6 space-y-6">
        {/* --- ここから貼り付け --- */}
{/* ============================================================
    【追加】お知らせ（News）セクション
    カレンダーより先に目に入るよう、一番上に配置します。
    ============================================================ */}
<section className="px-2">
  <div className="bg-white border border-pink-100 rounded-[25px] p-4 flex items-start space-x-3 shadow-sm">
    <span className="text-xl mt-1">📢</span>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">News</p>
        <p className="text-[9px] text-gray-400">2026.01.29</p>
      </div>
      <p className="text-sm font-bold text-gray-700 leading-relaxed">
        システム名を「Karinto Cast Manager」に変更しました。今後こちらでシフトを確認してください！
      </p>
    </div>
  </div>
</section>
{/* --- ここまで貼り付け --- */}
        {/* カレンダーセクション */}
        <section className="bg-white p-2 rounded-[32px] shadow-sm border border-pink-50">
          <DashboardCalendar shifts={shifts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </section>
        
        {/* 選択日の詳細表示 */}
        <section className="bg-gradient-to-br from-pink-400 to-rose-400 p-6 rounded-[30px] text-white shadow-xl shadow-pink-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {selectedDate ? format(selectedDate, 'M月d日 (eee)', { locale: ja }) : '日付を選択'}
            </h3>
            <span className="bg-white/30 px-3 py-1 rounded-full text-[10px] font-bold">DETAIL</span>
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
                <div className="flex flex-col">
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

      {/* 固定フッターメニュー */}
      <footer className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <nav className="flex justify-around items-center py-4 max-w-md mx-auto">
          <button className="flex flex-col items-center text-pink-500">
            <span className="text-2xl">🏠</span>
            <span className="text-[10px] font-bold">ホーム</span>
          </button>
          <button className="flex flex-col items-center text-gray-300">
            <span className="text-2xl">💰</span>
            <span className="text-[10px] font-bold">給与</span>
          </button>
          <div className="w-px h-8 bg-gray-100"></div>
          <button 
            onClick={handleLogout} 
            className="flex flex-col items-center text-gray-400 hover:text-rose-500 transition-colors"
          >
            <span className="text-2xl">🚪</span>
            <span className="text-[10px] font-bold">Logout</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}