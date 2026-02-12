'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { RefreshCw, ChevronLeft, Clock, AlertCircle, Ban, RotateCcw } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-100 pb-10 text-slate-900">
      <div className="bg-white px-6 pt-10 pb-4 shadow-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 bg-slate-100 rounded-full text-slate-500">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-black tracking-tighter">ATTENDANCE</h1>
          </div>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="bg-slate-900 text-white font-black p-3 rounded-2xl text-base outline-none shadow-lg" 
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-2 mt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-400" size={40} /></div>
        ) : (
          shifts.map((shift) => (
            <div 
              key={shift.id} 
              className={`flex items-center justify-between p-3 pl-5 rounded-[24px] border-2 transition-all ${
                shift.status === 'absent' 
                ? 'bg-slate-200 border-slate-300 opacity-60' 
                : 'bg-white border-white shadow-sm'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-black font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">ID:{shift.login_id}</span>
                  {shift.is_late && (
                    <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-lg font-black italic animate-pulse">LATE</span>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 truncate tracking-tighter leading-none mb-2">
                    {shift.hp_display_name}
                  </h3>
                  <div className={`flex items-center gap-2 ${shift.status === 'absent' ? 'text-slate-400' : 'text-blue-600'}`}>
                    <Clock size={20} strokeWidth={3} />
                    <span className="text-3xl font-black font-mono tracking-tighter">
                      {shift.start_time} <span className="text-lg opacity-50">-</span> {shift.end_time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                {/* 📍 遅刻ボタン: デカくてオレンジ */}
                <button 
                  onClick={() => handleToggle(shift.id, 'late', shift.is_late)}
                  className={`flex flex-col items-center justify-center w-20 h-20 rounded-[20px] border-4 transition-all shadow-lg active:scale-95 ${
                    shift.is_late 
                    ? 'bg-amber-500 border-amber-600 text-white' 
                    : 'bg-white border-slate-100 text-slate-200 hover:border-amber-200 hover:text-amber-300'
                  }`}
                >
                  <AlertCircle size={32} strokeWidth={3} />
                  <span className="text-[11px] font-black mt-1">遅刻</span>
                </button>

                {/* 📍 当欠ボタン: デカくて赤 */}
                <button 
                  onClick={() => handleToggle(shift.id, 'absent', shift.status)}
                  className={`flex flex-col items-center justify-center w-20 h-20 rounded-[20px] border-4 transition-all shadow-lg active:scale-95 ${
                    shift.status === 'absent' 
                    ? 'bg-rose-600 border-rose-700 text-white' 
                    : 'bg-white border-slate-100 text-slate-200 hover:border-rose-200 hover:text-rose-300'
                  }`}
                >
                  {shift.status === 'absent' ? <RotateCcw size={32} strokeWidth={3} /> : <Ban size={32} strokeWidth={3} />}
                  <span className="text-[11px] font-black mt-1">{shift.status === 'absent' ? '復旧' : '当欠'}</span>
                </button>
              </div>
            </div>
          ))
        )}

        {!loading && shifts.length === 0 && (
          <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest bg-white rounded-[40px] border-4 border-dashed border-slate-200">
            No Shifts Today
          </div>
        )}
      </div>
    </div>
  );
}