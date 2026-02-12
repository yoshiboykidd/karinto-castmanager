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

  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`*, cast_members (hp_display_name, home_shop_id)`)
        .eq('shift_date', selectedDate)
        .order('start_time', { ascending: true });
      if (error) throw error;
      setShifts(data || []);
    } catch (err) {
      alert('データ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShifts(); }, [selectedDate]);

  const handleAbsent = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'absent' ? 'official' : 'absent';
    try {
      const { error } = await supabase.from('shifts').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setShifts(shifts.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (err) {
      alert('更新に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-24 font-sans text-gray-800">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-10 pb-16 px-6 rounded-b-[40px] shadow-2xl relative">
        <div className="relative z-10 max-w-2xl mx-auto flex justify-between items-start">
          <div>
            <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-gray-400 mb-4 text-xs font-black uppercase tracking-widest">
              <ChevronLeft size={16} /> Back
            </button>
            <h1 className="text-white text-3xl font-black italic tracking-tighter">ATTENDANCE</h1>
          </div>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <LogOut className="text-pink-400" size={18} />
            </div>
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20 space-y-4">
        <div className="bg-white p-5 rounded-[32px] shadow-xl border border-gray-50 flex items-center justify-between">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="font-black text-gray-700 outline-none" />
          <button onClick={fetchShifts} className="p-3 bg-gray-50 rounded-2xl">
            <RefreshCw size={20} className={loading ? "animate-spin" : "text-gray-400"} />
          </button>
        </div>

        <div className="space-y-2">
          {shifts.map((shift) => (
            <div key={shift.id} className={`bg-white p-4 rounded-[28px] border-2 flex items-center justify-between ${shift.status === 'absent' ? 'opacity-50 grayscale' : 'border-white shadow-md'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${shift.status === 'absent' ? 'bg-gray-100' : 'bg-pink-100 text-pink-500'}`}>
                  {shift.status === 'absent' ? <AlertCircle size={24} /> : <UserCheck size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-gray-800">{shift.cast_members?.hp_display_name}</h3>
                  <p className="text-[11px] font-bold text-gray-400">{shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}</p>
                </div>
              </div>
              <button onClick={() => handleAbsent(shift.id, shift.status)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${shift.status === 'absent' ? 'bg-gray-800 text-white' : 'border border-rose-100 text-rose-500'}`}>
                {shift.status === 'absent' ? '復旧' : '当欠'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}