'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Calculator, Trash2, Copy, MessageSquare, Edit3, StickyNote, Save, Calendar, Loader2, AlertCircle, Ban } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, allShifts = [], reservations = [], theme = 'pink', supabase, onRefresh, myLoginId }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  
  // 📍 状態判定
  const isAbsent = shift?.status === 'absent';
  const isLate = shift?.is_late === true;

  // 📍 当欠の場合、自動で予約を削除する処理
  useEffect(() => {
    const autoDeleteReservations = async () => {
      if (isAbsent && reservations.length > 0 && supabase && myLoginId) {
        console.log("当欠のため予約を自動削除します...");
        const dateStr = format(date, 'yyyy-MM-dd');
        const { error } = await supabase
          .from('reservations')
          .delete()
          .eq('cast_id', myLoginId)
          .eq('visit_date', dateStr);
        
        if (!error && onRefresh) {
          onRefresh(); // 親コンポーネントを再読み込みしてリストを空にする
        }
      }
    };
    autoDeleteReservations();
  }, [isAbsent, reservations.length, date, myLoginId]);

  // メモの初期化
  useEffect(() => {
    setMemoDraft(selectedRes?.cast_memo || '');
  }, [selectedRes]);

  if (!date) return null;

  // 個別予約削除ロジック
  const handleDelete = async () => {
    if (!selectedRes?.id || !supabase) return;
    if (!window.confirm("この予約を完全に削除しますか？")) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('reservations').delete().eq('id', selectedRes.id);
      if (!error) {
        setSelectedRes(null);
        if (onRefresh) onRefresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // メモ保存ロジック
  const handleSaveMemo = async () => {
    if (!selectedRes || !supabase) return;
    const { error } = await supabase
      .from('reservations')
      .update({ cast_memo: memoDraft })
      .eq('id', selectedRes.id);
    
    if (!error) {
      setIsEditingMemo(false);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="mt-4 bg-white rounded-[40px] border-2 border-pink-50 p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${isAbsent ? 'bg-slate-100 text-slate-400' : 'bg-pink-50 text-pink-500'}`}>
            {dayNum}
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic leading-none mb-1">
              {format(date, 'EEEE', { locale: ja })}
            </div>
            {/* 時間表示エリア */}
            <div className="flex items-center gap-2">
              {isAbsent && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full">
                  <Ban size={10} /> 当欠
                </span>
              )}
              {isLate && !isAbsent && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full animate-pulse">
                  <AlertCircle size={10} /> 遅刻
                </span>
              )}
              <span className={`text-xl font-black italic tracking-tighter ${isAbsent ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                {shift?.start_time || '--:--'} - {shift?.end_time || '--:--'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => {}} className="p-2 text-slate-300 hover:text-slate-400">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {/* 予約セクション */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest px-1">
            <Calendar size={12} /> Reservations
          </h4>
          
          {isAbsent ? (
            <div className="p-6 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 text-center">
              <p className="text-xs font-black text-slate-400 italic">当欠のため予約はクリアされました</p>
            </div>
          ) : reservations.length > 0 ? (
            <div className="grid gap-2">
              {reservations.map((res: any) => (
                <button
                  key={res.id}
                  onClick={() => setSelectedRes(res)}
                  className={`w-full p-4 rounded-3xl border-2 transition-all text-left flex justify-between items-center ${
                    selectedRes?.id === res.id ? 'border-pink-400 bg-pink-50 shadow-md' : 'border-slate-50 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono font-black text-lg text-pink-400 italic">{res.visit_time}</div>
                    <div className="font-black text-slate-800 text-base">{res.customer_name} 様</div>
                  </div>
                  <MessageSquare size={18} className={res.cast_memo ? 'text-pink-400' : 'text-slate-200'} />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-300 italic text-sm font-bold bg-slate-50/30 rounded-[30px] border-2 border-dashed border-slate-100">
              No Reservations
            </div>
          )}
        </div>

        {/* 予約詳細ポップアップ的な表示 */}
        {selectedRes && !isAbsent && (
          <div className="p-5 bg-pink-50/50 rounded-[35px] border-2 border-pink-100 space-y-4 animate-in zoom-in-95 duration-300 relative">
            <button onClick={() => setSelectedRes(null)} className="absolute top-4 right-4 text-pink-300"><X size={18} /></button>
            
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={16} className="text-pink-400" />
              <span className="text-[11px] font-black text-pink-400 uppercase tracking-widest">Customer Memo</span>
            </div>

            {isEditingMemo ? (
              <div className="space-y-2">
                <textarea
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-pink-200 text-sm font-bold focus:outline-none min-h-[100px]"
                  placeholder="お客様の好みなどを入力..."
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo(false)} className="flex-1 h-10 rounded-xl bg-white border-2 border-pink-100 text-slate-400 font-bold text-xs">キャンセル</button>
                  <button onClick={handleSaveMemo} className="flex-[2] h-10 rounded-xl bg-pink-500 text-white font-black text-xs flex items-center justify-center gap-1"><Save size={14}/> 保存する</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setIsEditingMemo(true)} className="min-h-[60px] p-4 bg-white rounded-2xl border-2 border-pink-100/50 text-slate-600 text-sm font-bold cursor-pointer hover:bg-white/80 transition-colors">
                {selectedRes.cast_memo || "タップしてメモを残す..."}
              </div>
            )}

            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="w-full h-10 rounded-xl text-rose-300 flex items-center justify-center gap-1 font-bold text-[10px] hover:text-rose-500 transition-colors pt-2"
            >
              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              予約データを完全に削除
            </button>
          </div>
        )}

        {/* 下部ボタンエリア */}
        <div className="space-y-2 pt-2">
          {!isAbsent && (
             <button onClick={() => alert("OP計算君起動")} className="w-full h-14 rounded-[25px] bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-200 active:scale-95 transition-all">
               <Calculator size={20} /> OP計算君
             </button>
          )}
        </div>
      </div>
    </div>
  );
}