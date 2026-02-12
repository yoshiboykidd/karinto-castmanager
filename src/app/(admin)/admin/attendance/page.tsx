'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  RefreshCw, 
  ChevronLeft, 
  Clock, 
  AlertCircle, 
  UserCheck 
} from 'lucide-react';
import { getFilteredAttendance, updateShiftStatus } from './actions';

export default function AttendancePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetShopId, setTargetShopId] = useState('all');
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<{role: string, home_shop_id: string | null} | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getFilteredAttendance(selectedDate, targetShopId);
      if (result) {
        setShifts(result.shifts || []);
        setMyProfile(result.myProfile || null);
      }
    } catch (error) {
      console.error(error);
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
      {/* ヘッダーエリア */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-slate-400 mb-2 text-[10px] font-black uppercase tracking-[0.2em]">
                <ChevronLeft size={14} /> Back to Dashboard
              </button>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                ATTENDANCE
                <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                  {shifts.length}
                </span>
              </h1>
            </div>
            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="bg-transparent font-black text-slate-700 outline-none text-sm" 
              />
            </div>
          </div>

          {/* 開発者用店舗フィルター */}
          {myProfile?.role === 'developer' && (
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              {['all', '001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012'].map((id) => (
                <button
                  key={id}
                  onClick={() => setTargetShopId(id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${
                    targetShopId === id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  {id === 'all' ? 'ALL SHOPS' : id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* リスト部分：帯デザイン */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <RefreshCw className="animate-spin mb-2" size={24} />
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Loading Shifts</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {shifts.map((shift) => (
              <div 
                key={shift.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  shift.status === 'absent' 
                  ? 'bg-slate-50 border-slate-200 opacity-60 grayscale' 
                  : 'bg-white border-white shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-6">
                  {/* ID：メンバー一覧と同じスタイル */}
                  <div className="flex flex-col leading-none">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mb-1">Cast ID</span>
                    <span className="text-xl font-mono font-black text-slate-900 tracking-tighter">
                      {shift.cast_members?.login_id}
                    </span>
                  </div>

                  <div className="h-8 w-[2px] bg-slate-100 mx-1" />

                  {/* 名前と時間 */}
                  <div>
                    <h3 className="font-black text-slate-800 text-base">{shift.cast_members?.display_name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-blue-500 font-bold">
                      <Clock size={12} />
                      <span className="text-[11px] font-mono tracking-tight">
                        {shift.start_time?.slice(0, 5)} — {shift.end_time?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <button 
                  onClick={() => handleStatusToggle(shift.id, shift.status)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    shift.status === 'absent' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100'
                  }`}
                >
                  {shift.status === 'absent' ? '復旧' : '当欠'}
                </button>
              </div>
            ))}
            {shifts.length === 0 && (
              <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white rounded-[30px] border border-dashed border-slate-200">
                No Shifts Scheduled
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}