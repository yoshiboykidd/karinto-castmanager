'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Calendar, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  ChevronLeft,
  Users,
  CheckCircle2,
  LogOut
} from 'lucide-react';

export default function AttendancePage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ログアウト処理
  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  // シフトデータの取得
  const fetchShifts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          cast_members (
            display_name,
            hp_display_name
          )
        `)
        .eq('shift_date', selectedDate)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setShifts(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [selectedDate]);

  // 当欠ステータスの切り替え
  const handleAbsentToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'absent' ? 'official' : 'absent';
    const msg = newStatus === 'absent' ? '当欠(Absent)としてマークしますか？' : '出勤(Official)に戻しますか？';
    if (!window.confirm(msg)) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      fetchShifts(); // リロード
    } catch (err) {
      alert('更新に失敗しました');
    }
  };

  const presentCount = shifts.filter(s => s.status !== 'absent').length;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-24 font-sans text-gray-800">
      
      {/* 📍 管理画面共通ヘッダー */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-10 pb-16 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto flex justify-between items-start">
          <div className="flex-1">
            <button 
              onClick={() => router.push('/admin')}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors mb-4 text-xs font-black uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
            <h1 className="text-white text-3xl font-black italic tracking-tighter">ATTENDANCE</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Manage Daily Shifts</p>
          </div>

          <button onClick={handleLogout} className="flex flex-col items-center gap-1">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <LogOut className="text-pink-400" size={18} />
            </div>
            <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Logout</span>
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20 space-y-4">
        
        {/* 日付・サマリー */}
        <div className="bg-white p-5 rounded-[32px] shadow-xl border border-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
              <Calendar size={16} className="text-gray-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none font-black text-sm text-gray-700"
              />
            </div>
            <button onClick={fetchShifts} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
              <RefreshCw size={20} className={loading ? "animate-spin text-pink-500" : "text-gray-400"} />
            </button>
          </div>

          <div className="flex gap-4 border-t border-gray-50 pt-4">
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Cast</p>
              <p className="text-2xl font-black">{shifts.length}<span className="text-xs ml-1">名</span></p>
            </div>
            <div className="flex-1 border-l border-gray-50 pl-4">
              <p className="text-[10px] font-black text-pink-400 uppercase mb-1">On Duty</p>
              <p className="text-2xl font-black text-pink-500">{presentCount}<span className="text-xs ml-1">名</span></p>
            </div>
          </div>
        </div>

        {/* リスト表示 */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-20 text-center text-gray-300 font-black animate-pulse">LOADING...</div>
          ) : shifts.length > 0 ? (
            shifts.map((s) => (
              <div 
                key={s.id} 
                className={`bg-white p-4 rounded-[28px] shadow-md border-2 transition-all flex items-center justify-between ${
                  s.status === 'absent' ? 'border-gray-100 opacity-50 bg-gray-50/50' : 'border-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    s.status === 'absent' ? 'bg-gray-200 text-gray-400' : 'bg-pink-100 text-pink-500'
                  }`}>
                    {s.status === 'absent' ? <AlertCircle size={24} /> : <UserCheck size={24} />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800">{s.cast_members?.hp_display_name}</h3>
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[11px]">
                      <Clock size={12} />
                      <span>{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleAbsentToggle(s.id, s.status)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all active:scale-95 ${
                    s.status === 'absent' ? 'bg-gray-800 text-white' : 'bg-white border border-rose-100 text-rose-500'
                  }`}
                >
                  {s.status === 'absent' ? 'Restore' : 'Absent'}
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100">
              <p className="text-gray-300 font-black italic">NO SHIFT DATA</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}