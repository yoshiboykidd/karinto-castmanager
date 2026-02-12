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
  CheckCircle2
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

  // データの取得
  const fetchShifts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          cast_members (
            display_name,
            hp_display_name,
            home_shop_id
          )
        `)
        .eq('shift_date', selectedDate)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setShifts(data || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      alert('データ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [selectedDate]);

  // 当欠（Status更新）処理
  const handleAbsent = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'absent' ? 'official' : 'absent';
    const confirmMsg = newStatus === 'absent' ? '当欠として処理しますか？' : '出勤（確定）に戻しますか？';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setShifts(shifts.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (err) {
      alert('更新に失敗しました');
    }
  };

  const onDutyCount = shifts.filter(s => s.status !== 'absent').length;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-24 font-sans text-gray-800">
      
      {/* 📍 KCM ADMIN ヘッダー（黒グラデーションで統一） */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-10 pb-16 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors mb-4 text-xs font-black uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-white text-3xl font-black italic tracking-tighter flex items-center gap-2">
                ATTENDANCE
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-60">
                Shift & Status Management
              </p>
            </div>
            
            {/* 日付選択ボタンをヘッダー内に配置 */}
            <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-white font-black text-sm px-2 cursor-pointer"
              />
              <button onClick={fetchShifts} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 -mt-8 relative z-20 space-y-4">
        
        {/* サマリーカード（KARINTO風丸みデザイン） */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-[32px] shadow-xl shadow-gray-200/40 border border-gray-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Total</p>
              <p className="text-2xl font-black text-gray-800 leading-none">{shifts.length}<span className="text-xs ml-0.5">名</span></p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[32px] shadow-xl shadow-pink-100/20 border border-pink-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-pink-300 uppercase leading-none mb-1">Present</p>
              <p className="text-2xl font-black text-pink-500 leading-none">{onDutyCount}<span className="text-xs ml-0.5">名</span></p>
            </div>
          </div>
        </div>

        {/* 出勤リスト */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-20">
              <RefreshCw className="animate-spin mb-4" size={32} />
              <p className="font-black italic tracking-tighter text-xl">LOADING...</p>
            </div>
          ) : shifts.length > 0 ? (
            shifts.map((shift) => (
              <div 
                key={shift.id} 
                className={`bg-white rounded-[32px] p-5 shadow-lg border-2 transition-all duration-300 flex items-center justify-between ${
                  shift.status === 'absent' 
                  ? 'border-gray-100 bg-gray-50/50 opacity-60' 
                  : 'border-white hover:border-pink-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-sm ${
                    shift.status === 'absent' ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-br from-pink-400 to-rose-400 text-white'
                  }`}>
                    {shift.status === 'absent' ? <AlertCircle size={28} /> : <UserCheck size={28} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800 leading-tight">
                      {shift.cast_members?.hp_display_name || 'キャスト未設定'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[12px] mt-0.5">
                      <Clock size={12} className="opacity-50" />
                      <span>{shift.start_time?.slice(0, 5)}</span>
                      <span className="opacity-30">〜</span>
                      <span>{shift.end_time?.slice(0, 5)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleAbsent(shift.id, shift.status)}
                  className={`px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all active:scale-95 shadow-md ${
                    shift.status === 'absent' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-white border border-gray-100 text-rose-500'
                  }`}
                >
                  {shift.status === 'absent' ? 'Restore' : 'Absent'}
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-4 border-dashed border-gray-100 rounded-[40px]">
              <Calendar className="mx-auto text-gray-100 mb-4" size={48} />
              <p className="text-gray-300 font-black italic tracking-tighter text-xl uppercase">No Shifts Found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}