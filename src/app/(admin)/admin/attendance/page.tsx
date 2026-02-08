'use client';

import { useState, useEffect } from 'react';
// プロジェクト既存の共通設定を使用
import { supabase } from '@/lib/supabase'; 
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Calendar, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';

export default function AttendancePage() {
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
    // 状態を反転させる (official ↔ absent)
    const newStatus = currentStatus === 'absent' ? 'official' : 'absent';
    
    try {
      const { error } = await supabase
        .from('shifts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // ローカルの状態を更新（再フェッチせずにUIに反映）
      setShifts(shifts.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('更新に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        
        {/* パンくずナビ */}
        <div className="flex items-center gap-2 text-slate-400 mb-6 text-sm font-medium">
          <span>Admin</span>
          <ChevronRight size={14} />
          <span className="text-slate-800">Attendance</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <header>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Calendar className="text-pink-500" size={32} />
              Attendance
            </h1>
            <p className="text-slate-500 mt-2 font-medium">現場の出勤・当欠ステータスを管理します</p>
          </header>

          {/* 日付コントロール */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none p-2 font-bold text-slate-700"
            />
            <button 
              onClick={fetchShifts}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
              title="再読み込み"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Casts</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">{shifts.length}</span>
              <span className="text-sm text-slate-400">名</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">On Duty</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-pink-500">
                {shifts.filter(s => s.status !== 'absent').length}
              </span>
              <span className="text-sm text-slate-400">名</span>
            </div>
          </div>
        </div>

        {/* 出勤リスト */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <RefreshCw className="animate-spin mb-4" size={32} />
              <p className="font-bold">データを読み込み中...</p>
            </div>
          ) : shifts.length > 0 ? (
            shifts.map((shift) => (
              <div 
                key={shift.id} 
                className={`group flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-300 ${
                  shift.status === 'absent' 
                  ? 'bg-slate-100 border-transparent opacity-60' 
                  : 'bg-white border-slate-200 hover:border-pink-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                    shift.status === 'absent' ? 'bg-slate-200 text-slate-400' : 'bg-pink-100 text-pink-500'
                  }`}>
                    {shift.status === 'absent' ? <AlertCircle size={28} /> : <UserCheck size={28} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      {shift.cast_members?.hp_display_name}
                      {shift.status === 'absent' && (
                        <span className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-md uppercase font-black">Absent</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 font-mono mt-1 text-sm">
                      <Clock size={14} />
                      <span>{shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleAbsent(shift.id, shift.status)}
                    className={`px-8 py-4 rounded-2xl text-sm font-black transition-all active:scale-90 ${
                      shift.status === 'absent' 
                      ? 'bg-slate-800 text-white shadow-lg' 
                      : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-red-100 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    {shift.status === 'absent' ? '復旧させる' : '当欠にする'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center">
              <p className="text-slate-400 font-bold text-lg">出勤予定のキャストはいません</p>
              <p className="text-slate-300 text-sm mt-1">日付を変更して確認してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}