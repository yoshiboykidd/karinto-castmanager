'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Calculator, Trash2, Copy, MessageSquare, Edit3, StickyNote, Save, Calendar, Loader2 } from 'lucide-react';

export default function DailyDetail({ date, dayNum, shift, allShifts = [], reservations = [], theme = 'pink', supabase, onRefresh, myLoginId }: any) {
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false); // 📍 削除中の状態管理
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  
  const [visitInfo, setVisitInfo] = useState<{count: string | number, lastDate: string | null}>({
    count: '--', lastDate: null
  });

  // メモの下書きを初期化
  useEffect(() => {
    setMemoDraft(selectedRes?.cast_memo || '');
  }, [selectedRes]);

  if (!date) return null;

  // 📍 予約削除ロジックの実装
  const handleDelete = async () => {
    if (!selectedRes?.id || !supabase) return;
    
    if (!window.confirm("この予約を完全に削除しますか？\n（この操作は取り消せません）")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', selectedRes.id);

      if (error) {
        alert("削除に失敗しました");
      } else {
        setSelectedRes(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // メモ保存ロジック
  const handleSaveMemo = async () => {
    if (!selectedRes || !supabase) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ cast_memo: memoDraft })
        .eq('id', selectedRes.id);

      if (!error) {
        setIsEditingMemo(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-4 bg-white rounded-[40px] border-2 border-pink-50 p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center font-black text-xl text-pink-500 shadow-inner">
            {dayNum}
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic leading-none mb-1">
              {format(date, 'EEEE', { locale: ja })}
            </div>
            <div className="text-xl font-black text-slate-800 italic tracking-tighter leading-none">
              {shift?.start_time || '--:--'} - {shift?.end_time || '--:--'}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setSelectedRes(null)}
          className="p-2 text-slate-200 hover:text-slate-400 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {/* 予約リスト */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest px-1">
            <Calendar size={12} /> Reservations
          </h4>
          
          {reservations.length > 0 ? (
            <div className="grid gap-2">
              {reservations.map((res: any) => (
                <button
                  key={res.id}
                  onClick={() => setSelectedRes(res)}
                  className={`w-full p-4 rounded-3xl border-2 transition-all text-left flex justify-between items-center ${
                    selectedRes?.id === res.id 
                      ? 'border-pink-400 bg-pink-50 shadow-md translate-x-1' 
                      : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono font-black text-lg text-pink-400 italic">
                      {res.visit_time}
                    </div>
                    <div className="font-black text-slate-800 text-base">
                      {res.customer_name} 様
                    </div>
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

        {/* 予約詳細エリア */}
        {selectedRes && (
          <div className="p-5 bg-pink-50/50 rounded-[35px] border-2 border-pink-100 space-y-4 animate-in zoom-in-95 duration-300 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote size={16} className="text-pink-400" />
                <span className="text-[11px] font-black text-pink-400 uppercase tracking-widest">Cast Memo</span>
              </div>
              {!isEditingMemo && (
                <button 
                  onClick={() => setIsEditingMemo(true)}
                  className="p-1 text-pink-400 hover:bg-white rounded-lg transition-colors"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>

            {isEditingMemo ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-pink-200 text-sm font-bold focus:outline-none min-h-[100px] bg-white shadow-inner"
                  placeholder="お客様の好みなどを入力..."
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditingMemo(false)}
                    className="flex-1 h-10 rounded-xl bg-white border-2 border-pink-100 text-slate-400 font-bold text-xs"
                  >
                    キャンセル
                  </button>
                  <button 
                    onClick={handleSaveMemo}
                    className="flex-[2] h-10 rounded-xl bg-pink-500 text-white font-black text-xs flex items-center justify-center gap-1 shadow-lg shadow-pink-200"
                  >
                    <Save size={14} /> 保存する
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div 
                  onClick={() => setIsEditingMemo(true)}
                  className="min-h-[60px] p-4 bg-white rounded-2xl border-2 border-pink-100/50 text-slate-600 text-sm font-bold cursor-pointer hover:bg-white/80 transition-colors"
                >
                  {selectedRes.cast_memo || "タップしてメモを残す..."}
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              {!isEditingMemo && (
                <button 
                  onClick={() => setIsEditingMemo(true)} 
                  className="w-full h-12 rounded-xl bg-white border-2 border-pink-100 text-pink-500 flex items-center justify-center gap-2 font-black text-[14px] shadow-sm"
                >
                  <Edit3 size={18} /> キャストメモを残す
                </button>
              )}
              <button 
                onClick={() => alert("OP計算君起動")} 
                className="w-full h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-100"
              >
                <Calculator size={20} /> OP計算君
              </button>
            </div>

            <div className="pt-1 text-center">
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="text-gray-300 hover:text-rose-400 flex items-center justify-center gap-1 font-bold text-[11px] mx-auto transition-colors"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                予約を取り消す
              </button>
            </div>
          </div>
        )}

        {/* 予約が選択されていない時のデフォルトボタン */}
        {!selectedRes && (
          <div className="pt-2">
            <button 
              onClick={() => alert("OP計算君起動")} 
              className="w-full h-16 rounded-[28px] bg-blue-500 text-white flex items-center justify-center gap-3 font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all"
            >
              <Calculator size={22} /> OP計算君
            </button>
          </div>
        )}
      </div>
    </div>
  );
}