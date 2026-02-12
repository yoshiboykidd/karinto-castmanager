'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { RefreshCw, ChevronLeft, Clock, AlertCircle, Ban, RotateCcw } from 'lucide-react';
import { getFilteredAttendance, updateShiftAction } from './actions';

export default function AttendancePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const result = await getFilteredAttendance(selectedDate);
    if (result) setShifts(result.shifts || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [selectedDate]);

  const handleToggle = async (shiftId: string, type: 'absent' | 'late', current: any, name: string) => {
    const label = type === 'late' ? '遅刻' : '当欠';
    if (!window.confirm(`${name}さんを「${label}」として記録します。よろしいですか？`)) return;

    const res = await updateShiftAction(shiftId, type, current);
    if (res.success) {
      setShifts(shifts.map(s => s.id === shiftId ? { ...s, [type === 'absent' ? 'status' : 'is_late']: res.newValue } : s));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10 text-slate-900">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button onClick={() => router.push('/admin')} className="p-2 bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
          <h1 className="text-xl font-black tracking-tighter italic uppercase">Attendance</h1>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-900 text-white font-black p-2 rounded-xl text-sm outline-none" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-2 mt-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-400" size={32} /></div>
        ) : (
          shifts.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 p-2 bg-white rounded-2xl border transition-all ${s.status === 'absent' ? 'bg-slate-200 opacity-60' : 'border-white shadow-sm'}`}>
              <div className="flex-1 flex items-center gap-3 min-w-0 pl-2">
                <h3 className="text-lg font-black truncate shrink-0">{s.hp_display_name}</h3>
                <div className={`flex items-center gap-1 font-mono font-black shrink-0 ${s.status === 'absent' ? 'text-slate-400' : 'text-blue-600'}`}>
                  <Clock size={16} strokeWidth={3} />
                  <span className="text-xl italic">{s.start_time}-{s.end_time}</span>
                </div>
              </div>

              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => handleToggle(s.id, 'late', s.is_late, s.hp_display_name)}
                  className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center font-black transition-all shadow-md active:scale-90 ${s.is_late ? 'bg-amber-500 text-white border-b-4 border-amber-700' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}
                >
                  <AlertCircle size={20} strokeWidth={3} /> <span className="text-[10px] mt-0.5">遅刻</span>
                </button>
                <button onClick={() => handleToggle(s.id, 'absent', s.status, s.hp_display_name)}
                  className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center font-black transition-all shadow-md active:scale-90 ${s.status === 'absent' ? 'bg-rose-600 text-white border-b-4 border-rose-800' : 'bg-rose-100 text-rose-600 border border-rose-200'}`}
                >
                  {s.status === 'absent' ? <RotateCcw size={20} strokeWidth={3} /> : <Ban size={20} strokeWidth={3} />}
                  <span className="text-[10px] mt-0.5">{s.status === 'absent' ? '復旧' : '当欠'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}