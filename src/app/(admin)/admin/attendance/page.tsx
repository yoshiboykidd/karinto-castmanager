'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { RefreshCw, ChevronLeft, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { getFilteredAttendance, updateShiftStatus } from './actions';

export default function AttendancePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetShopId, setTargetShopId] = useState('all');
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getFilteredAttendance(selectedDate, targetShopId);
      if (result) {
        setShifts(result.shifts || []);
        setMyProfile(result.myProfile);
      }
    } catch (error) {
      console.error('Attendance Load Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, targetShopId]);

  const handleStatusToggle = async (shiftId: string, currentStatus: string) => {
    const result = await updateShiftStatus(shiftId, currentStatus);
    if (result.success) {
      setShifts(shifts.map(s => s.id === shiftId ? { ...s, status: result.newStatus } : s));
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-slate-400 mb-2 text-[10px] font-black uppercase tracking-[0.2em]">
                <ChevronLeft size={14} /> Back
              </button>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                ATTENDANCE
                <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                  {shifts.length}
                </span>
              </h1>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg border border-slate-800">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="bg-transparent font-mono font-black outline-none text-sm cursor-pointer" 
              />
            </div>
          </div>

          {/* DEVELOPER FILTER */}
          {myProfile?.role === 'developer' && (
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              {['all', '001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012'].map((id) => (
                <button
                  key={id}
                  onClick={() => setTargetShopId(id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap shadow-sm border ${
                    targetShopId === id ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {id === 'all' ? 'ALL' : id}
                </button>
              ))}
            </div>
          )}

          {/* ADMIN SHOP INDICATOR */}
          {myProfile?.role === 'admin' && (
            <div className="inline-block px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
              SHOP: {myProfile.home_shop_id || 'NOT ASSIGNED'}
            </div>
          )}
        </div>
      </div>

      {/* LIST AREA */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <RefreshCw className="animate-spin mb-2" size={24} />
            <span className="text-[10px] font-black tracking-widest uppercase">Syncing</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {shifts.length > 0 ? (
              shifts.map((shift) => (
                <div 
                  key={shift.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all bg-white shadow-sm border-white ${
                    shift.status === 'absent' ? 'opacity-50 grayscale bg-slate-50' : 'hover:border-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col leading-none">
                      <span className="text-[9px] font-black text-slate-300 uppercase mb-1">ID</span>
                      <span className="text-xl font-mono font-black text-slate-900 tracking-tighter">
                        {shift.login_id || '--------'}
                      </span>
                    </div>

                    <div className="h-8 w-[2px] bg-slate-50" />

                    <div>
                      <h3 className="font-black text-slate-800 text-base">
                        {shift.hp_display_name || shift.cast_members?.display_name || 'Unknown'}
                      </h3>
                      <div className={`flex items-center gap-1.5 mt-0.5 font-bold ${
                        shift.status === 'absent' ? 'text-slate-400' : 'text-blue-500'
                      }`}>
                        <Clock size={12} />
                        <span className="text-[11px] font-mono tracking-tighter">
                          {shift.start_time} — {shift.end_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleStatusToggle(shift.id, shift.status)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${
                      shift.status === 'absent' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100'
                    }`}
                  >
                    {shift.status === 'absent' ? (
                      <span className="flex items-center gap-1.5"><RotateCcw size={12}/> 復旧</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><AlertTriangle size={12}/> 当欠</span>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-white rounded-[30px] border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Shifts Found</p>
                <p className="text-[9px] text-slate-400 mt-2 tracking-tighter italic">Please check if the date is correct.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}