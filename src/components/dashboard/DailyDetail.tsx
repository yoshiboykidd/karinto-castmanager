'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Calculator, Trash2, MessageSquare, Edit3, StickyNote, Save, Calendar, Loader2, AlertCircle, Ban } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, allShifts = [], reservations = [], theme = 'pink', supabase, onRefresh, myLoginId }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  
  // 📍 ステータス判定
  const isAbsent = shift?.status === 'absent';
  const isLate = shift?.is_late === true;

  // 📍 当欠の場合、この日の予約を全削除する自動処理
  useEffect(() => {
    const autoDelete = async () => {
      if (isAbsent && reservations.length > 0 && supabase && myLoginId) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const { error } = await supabase
          .from('reservations')
          .delete()
          .eq('cast_id', myLoginId)
          .eq('visit_date', dateStr);
        
        if (!error && onRefresh) onRefresh();
      }
    };
    autoDelete();
  }, [isAbsent, reservations.length, date, myLoginId]);

  // メモの下書き初期化
  useEffect(() => {
    setMemoDraft(selectedRes?.cast_memo || '');
  }, [selectedRes]);

  if (!date) return null;

  // 個別予約の削除
  const handleDelete = async () => {
    if (!selectedRes?.id || !supabase) return;
    if (!window.confirm("この予約を完全に削除しますか？")) return;
    setIsDeleting(true);
    const { error } = await supabase.from('reservations').delete().eq('id', selectedRes.id);
    if (!error) {
      setSelectedRes(null);
      if (onRefresh) onRefresh();
    }
    setIsDeleting(false);
  };

  // メモ保存
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
      
      {/* 1. ヘッダー：日付と時間 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${isAbsent ? 'bg-slate-100 text-slate-400' : 'bg-pink-50 text-pink-500'}`}>
            {dayNum}
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic mb-1">
              {format(date, 'EEEE', { locale: ja })}
            </div>
            <div className="flex items-center gap-2">
              {isAbsent && <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center gap-0.5"><Ban size={10}/>当欠</span>}
              {isLate && !isAbsent && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center gap-0.5 animate-pulse"><AlertCircle size={10}/>遅刻</span>}
              <span className={`text-xl font-black italic tracking-tighter ${isAbsent ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                {shift?.start_time || '--:--'} - {shift?.end_time || '--:--'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => setSelectedRes(null)} className="p-2 text-slate-200 hover:text-slate-400 transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        {/* 2. 予約リストセクション */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest px-1">
            <Calendar size={12} /> Reservations
          </h4>
          
          {isAbsent ? (
            <div className="p-8 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 text-center">
              <p className="text-xs font-black text-slate-400 italic">当欠のため予約はクリアされました</p>
            </div>
          ) : reservations.length > 0 ? (
            <div className="grid gap-2">
              {reservations.map((res: any) => (
                <button
                  key={res.id}
                  onClick={() => setSelectedRes(res)}
                  className={`w-full p-4 rounded-[24px] border-2 transition-all text-left flex justify-between items-center ${
                    selectedRes?.id === res.id ? 'border-pink-400 bg-pink-50 shadow-md translate-x-1' : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono font-black text-lg text-pink-400 italic">{res.visit_time}</div>
                    <div className="font-black text-slate-800">{res.customer_name} 様</div>
                  </div>
                  <MessageSquare size={18} className={res.cast_memo ? 'text-pink-400' : 'text-slate-200'} />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center bg-slate-50/50 rounded-[30px] border-2 border-dashed border-slate-100">
              <span className="text-sm font-bold text-slate-300 italic">No Reservations</span>
            </div>
          )}
        </div>

        {/* 3. 予約詳細 & メモ編集エリア */}
        {selectedRes && !isAbsent && (
          <div className="p-6 bg-pink-50/80 rounded-[35px] border-2 border-pink-100 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote size={16} className="text-pink-400" />
                <span className="text-[11px] font-black text-pink-400 uppercase tracking-widest">Cast Memo</span>
              </div>
              {!isEditingMemo && (
                <button onClick={() => setIsEditingMemo(true)} className="p-1 text-pink-400 hover:bg-white rounded-lg transition-colors">
                  <Edit3 size={16} />
                </button>
              )}
            </div>

            {isEditingMemo ? (
              <div className="space-y-3">
                <textarea
                  autoFocus
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-pink-200 text-sm font-bold focus:outline-none min-h-[120px] bg-white shadow-inner"
                  placeholder="お客様の特徴や内容をメモ..."
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo(false)} className="flex-1 h-12 rounded-xl bg-white border-2 border-pink-100 text-slate-400 font-bold text-[13px]">戻る</button>
                  <button onClick={handleSaveMemo} className="flex-[2] h-12 rounded-xl bg-pink-500 text-white font-black text-[13px] flex items-center justify-center gap-1 shadow-lg shadow-pink-200"><Save size={16}/> 保存する</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setIsEditingMemo(true)} className="p-4 bg-white/80 rounded-2xl border-2 border-pink-100/50 text-slate-600 text-sm font-bold min-h-[60px] cursor-pointer hover:border-pink-300 transition-all">
                {selectedRes.cast_memo || "タップしてメモを追加..."}
              </div>
            )}

            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="w-full h-10 mt-2 text-rose-300 hover:text-rose-500 flex items-center justify-center gap-1 font-black text-[10px] transition-colors"
            >
              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              この予約を完全に削除
            </button>
          </div>
        )}

        {/* 4. アクションボタンエリア */}
        {!isAbsent && (
          <div className="pt-2">
            <button onClick={() => alert("OP計算君起動")} className="w-full h-16 rounded-[28px] bg-blue-500 text-white flex items-center justify-center gap-3 font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all">
              <Calculator size={22} /> OP計算君
            </button>
          </div>
        )}
      </div>
    </div>
  );
}