'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { RefreshCw, ChevronLeft, Clock, AlertCircle, Ban } from 'lucide-react';
import { getFilteredAttendance, updateShiftAction } from './actions';

export default function AttendancePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetShopId, setTargetShopId] = useState('all');
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    const result = await getFilteredAttendance(selectedDate, targetShopId);
    if (result) {
      setShifts(result.shifts || []);
      setMyProfile(result.myProfile);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [selectedDate, targetShopId]);

  const handleToggle = async (shiftId: string, type: 'absent' | 'late', current: any) => {
    const res = await updateShiftAction(shiftId, type, current);
    if (res.success) {
      setShifts(shifts.map(s => s.id === shiftId ? { ...s, [type === 'absent' ? 'status' : 'is_late']: res.newValue } : s));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-white px-6 pt-10 pb-4 shadow-sm border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-800 tracking-tighter">ATTENDANCE</h1>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-100 font-bold p-2 rounded-xl text-sm outline-none" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-2 mt-4 space-y-1">
        {loading ? <RefreshCw className="animate-spin mx-auto mt-10 text-slate-300" /> : 
          shifts.map((shift) => (
            <div key={shift.id} className={`flex items-center justify-between p-2 pl-4 rounded-xl border bg-white transition-all ${shift.status === 'absent' ? 'bg-slate-100 opacity-60' : 'shadow-sm'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{shift.login_id}</span>
                  {shift.is_late && <span className="bg-amber-500 text-white text-[8px] px-1.5 rounded-full font-black uppercase italic animate-pulse">Late</span>}
                </div>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-lg font-black text-slate-900 truncate leading-tight">{shift.hp_display_name}</h3>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Clock size={12} strokeWidth={3} />
                    <span className="text-sm font-black font-mono">{shift.start_time}-{shift.end_time}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 ml-2">
                {/* 遅刻ボタン */}
                <button 
                  onClick={() => handleToggle(shift.id, 'late', shift.is_late)}
                  className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg border-2 transition-all ${shift.is_late ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-100 text-slate-300'}`}
                >
                  <AlertCircle size={16} strokeWidth={3} />
                  <span className="text-[8px] font-black mt-0.5">遅刻</span>
                </button>

                {/* 当欠ボタン */}
                <button 
                  onClick={() => handleToggle(shift.id, 'absent', shift.status)}
                  className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg border-2 transition-all ${shift.status === 'absent' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-slate-100 text-slate-300'}`}
                >
                  <Ban size={16} strokeWidth={3} />
                  <span className="text-[8px] font-black mt-0.5">当欠</span>
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}