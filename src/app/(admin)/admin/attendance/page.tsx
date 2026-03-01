'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { RefreshCw, ChevronLeft, Clock, AlertCircle, Ban, RotateCcw, Calendar } from 'lucide-react';
import { getFilteredAttendance, updateShiftAction } from './actions';

export default function AttendancePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    // 📍 常に最新の選択日付で取得
    const result = await getFilteredAttendance(selectedDate);
    if (result) setShifts(result.shifts || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [selectedDate]);

  const handleToggle = async (shiftId: string, type: 'absent' | 'late', current: any, name: string) => {
    const label = type === 'late' ? '遅刻' : '当欠';
    if (!window.confirm(`${name}さんを「${label}」として記録しますか？`)) return;

    const res = await updateShiftAction(shiftId, type, current);
    if (res.success) {
      setShifts(shifts.map(s => s.id === shiftId ? { ...s, [type === 'absent' ? 'status' : 'is_late']: res.newValue } : s));
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] pb-10 text-slate-900"> {/* 📍 背景色変更 */}
      {/* ヘッダー */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-pink-50 sticky top-0 z-50 rounded-b-[40px]">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button onClick={() => router.push('/admin')} className="p-3 bg-pink-50 text-pink-500 rounded-2xl hover:bg-pink-100 transition-colors">
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-black tracking-tighter text-slate-800 flex items-center gap-2">
              ATTENDANCE
              <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full">{shifts.length}</span>
            </h1>
          </div>

          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" size={14} />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="bg-slate-50 border-none text-slate-800 font-black pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200 transition-all shadow-inner" 
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-pink-200">
            <RefreshCw className="animate-spin mb-3" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest">Loading Shifts</span>
          </div>
        ) : (
          shifts.length > 0 ? (
            shifts.map((s) => (
              <div key={s.id} className={`flex items-center gap-4 p-3.5 bg-white rounded-[28px] border-2 transition-all ${s.status === 'absent' ? 'border-transparent bg-slate-100 opacity-60' : 'border-white shadow-md shadow-pink-100/50'}`}>
                <div className="flex-1 flex items-center gap-4 min-w-0 pl-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-pink-300 uppercase leading-none mb-1">Cast Name</span>
                    <h3 className="text-lg font-black text-slate-800 truncate">{s.hp_display_name}</h3>
                  </div>
                  
                  <div className="h-8 w-[1px] bg-pink-50" />

                  <div className={`flex flex-col font-mono font-black ${s.status === 'absent' ? 'text-slate-400' : 'text-pink-600'}`}>
                    <span className="text-[9px] uppercase leading-none mb-1">Shift Time</span>
                    <div className="flex items-center gap-1">
                      <Clock size={14} strokeWidth={3} />
                      <span className="text-lg italic tracking-tighter">{s.start_time}-{s.end_time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* 遅刻ボタン */}
                  <button onClick={() => handleToggle(s.id, 'late', s.is_late, s.hp_display_name)}
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all shadow-sm active:scale-90 ${s.is_late ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-amber-50 text-amber-500 border border-amber-100 hover:bg-amber-100'}`}
                  >
                    <AlertCircle size={20} strokeWidth={3} />
                    <span className="text-[8px] mt-1 uppercase">Late</span>
                  </button>
                  
                  {/* 当欠・復旧ボタン */}
                  <button onClick={() => handleToggle(s.id, 'absent', s.status, s.hp_display_name)}
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all shadow-sm active:scale-90 ${s.status === 'absent' ? 'bg-pink-600 text-white shadow-pink-200' : 'bg-pink-50 text-pink-500 border border-pink-100 hover:bg-pink-100'}`}
                  >
                    {s.status === 'absent' ? <RotateCcw size={20} strokeWidth={3} /> : <Ban size={20} strokeWidth={3} />}
                    <span className="text-[8px] mt-1 uppercase">{s.status === 'absent' ? 'Back' : 'Skip'}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-pink-100">
              <span className="text-[10px] font-black text-pink-200 uppercase tracking-[0.2em]">No Shifts Found for this date</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}