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

  const handleToggle = async (shiftId: string, type: 'absent' | 'late', current: any, name: string) => {
    // 📍 2段構えの確認
    const actionName = type === 'late' ? '遅刻' : '当欠';
    const confirmMsg = `${name}さんの状態を「${actionName}」に変更します。本当によろしいですか？`;
    
    if (!window.confirm(confirmMsg)) return;

    const res = await updateShiftAction(shiftId, type, current);
    if (res.success) {
      setShifts(shifts.map(s => s.id === shiftId ? { ...s, [type === 'absent' ? 'status' : 'is_late']: res.newValue } : s));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10 text-slate-900">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => router.push('/admin')} className="p-2 bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-900 text-white font-black p-2 rounded-xl text-sm outline-none" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-2 mt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-400" size={30} /></div>
        ) : (
          shifts.map((shift) => (
            <div key={shift.id} className={`flex flex-col p-3 rounded-[20px] border-2 transition-all bg-white ${shift.status === 'absent' ? 'bg-slate-200 opacity-60' : 'border-white shadow-sm'}`}>
              
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-400 font-mono">ID:{shift.login_id}</span>
                   {shift.is_late && <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded font-black animate-pulse tracking-tighter">LATE</span>}
                </div>
                <div className={`flex items-center gap-1 font-black font-mono ${shift.status === 'absent' ? 'text-slate-400' : 'text-blue-600'}`}>
                  <Clock size={16} strokeWidth={3} />
                  <span className="text-2xl tracking-tighter">{shift.start_time}-{shift.end_time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-900 truncate flex-1 tracking-tighter">
                  {shift.hp_display_name}
                </h3>

                <div className="flex gap-2">
                  {/* 📍 遅刻ボタン: 常時色がつくように背景を設定 */}
                  <button 
                    onClick={() => handleToggle(shift.id, 'late', shift.is_late, shift.hp_display_name)}
                    className={`flex items-center gap-1 px-3 py-3 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 ${
                      shift.is_late 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    <AlertCircle size={16} strokeWidth={3} />
                    <span>遅刻</span>
                  </button>

                  {/* 📍 当欠ボタン: 常時色がつくように背景を設定 */}
                  <button 
                    onClick={() => handleToggle(shift.id, 'absent', shift.status, shift.hp_display_name)}
                    className={`flex items-center gap-1 px-3 py-3 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 ${
                      shift.status === 'absent' 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {shift.status === 'absent' ? <RotateCcw size={16} strokeWidth={3} /> : <Ban size={16} strokeWidth={3} />}
                    <span>{shift.status === 'absent' ? '復旧' : '当欠'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}