'use client';

import React, { useMemo, useEffect } from 'react';
import { 
  X, Calculator, Trash2, Edit3, Save, Loader2, 
  StickyNote, History, Star, CreditCard, Layers, Quote 
} from 'lucide-react';

export default function ReservationModal({ 
  selectedRes, 
  onClose, 
  onDelete, 
  isDeleting, 
  isEditingMemo, 
  setIsEditingMemo, 
  memoDraft, 
  setMemoDraft, 
  onSaveMemo, 
  getBadgeStyle,
  allPastReservations = [] 
}: any) {
  if (!selectedRes) return null;

  // 1. お客様の履歴と最新メモの特定
  const customerInfo = useMemo(() => {
    if (!selectedRes.customer_no) return { count: 1, lastDate: null, latestMemo: "" };

    const history = allPastReservations
      .filter((r: any) => r.customer_no === selectedRes.customer_no)
      .sort((a: any, b: any) => (b.reservation_date || "").localeCompare(a.reservation_date || ""));

    const count = history.length;
    const lastMet = history.find((r: any) => r.id !== selectedRes.id);
    
    // 過去の予約から中身がある最新メモを検索
    const latestMemo = history.find((r: any) => r.cast_memo && r.cast_memo.trim() !== "")?.cast_memo || "";
    
    return { count, lastDate: lastMet ? lastMet.reservation_date : null, latestMemo };
  }, [selectedRes, allPastReservations]);

  // 2. 編集開始時の自動セット（依存関係を整理）
  useEffect(() => {
    if (isEditingMemo && !memoDraft && customerInfo.latestMemo && !selectedRes.cast_memo) {
      setMemoDraft(customerInfo.latestMemo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingMemo]);

  const handleSaveMemo = async () => {
    await onSaveMemo();
    setIsEditingMemo(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 overflow-y-auto bg-black/90 backdrop-blur-sm pt-4 pb-24">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl animate-in zoom-in duration-150 flex flex-col text-gray-800">
        
        {/* ヘッダー */}
        <div className="p-2 px-4 flex items-center justify-center gap-3 relative border-b border-gray-50">
          <button onClick={onClose} className="absolute top-2 right-3 text-gray-300 hover:text-gray-500">
            <X size={20} />
          </button>
          <div className="flex gap-1 shrink-0">
            <span className={`w-10 h-6 flex items-center justify-center rounded text-[11px] font-black ${getBadgeStyle(selectedRes.service_type)}`}>
              {selectedRes.service_type || 'か'}
            </span>
            <span className={`w-10 h-6 flex items-center justify-center rounded text-[11px] font-black ${getBadgeStyle(selectedRes.nomination_category)}`}>
              {selectedRes.nomination_category || 'FREE'}
            </span>
          </div>
          <div className="flex items-baseline gap-0.5 font-black text-gray-900 leading-none">
            <span className="text-[28px] tracking-tighter">{selectedRes.start_time?.substring(0, 5)}</span>
            <span className="text-[18px] opacity-20 mx-0.5">/</span>
            <span className="text-[28px] tracking-tighter">{selectedRes.end_time?.substring(0, 5)}</span>
          </div>
        </div>
        
        <div className="px-4 py-4 space-y-5">
          {/* お客様情報 */}
          <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[20px] font-black text-gray-800 truncate">
                {selectedRes.customer_name}<span className="text-[12px] ml-1 font-bold text-gray-400">様</span>
              </h3>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                <History size={12} className="text-pink-400" />
                <span className="text-[11px] font-black text-gray-600">
                  {customerInfo.count === 1 ? '初対面' : `${customerInfo.count}回目`}
                </span>
              </div>
            </div>
            {customerInfo.lastDate ? (
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Star size={10} className="text-yellow-500 fill-yellow-500" />
                <span>直近: {customerInfo.lastDate.replace(/-/g, '/')}</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-gray-300 italic">履歴なし</div>
            )}
          </div>

          {/* コース & 料金 */}
          <div className="space-y-4 px-1">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg shrink-0 border border-gray-200 mt-0.5">
                <Layers size={12} className="text-gray-600" />
                <span className="text-[11px] font-black text-gray-600">コース</span>
              </div>
              <p className={`font-black text-gray-700 leading-[1.2] break-all ${
                (selectedRes.course_info?.length || 0) > 15 ? 'text-[15px]' : 'text-[18px]'
              }`}>
                {selectedRes.course_info}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg shrink-0 border border-blue-100">
                <CreditCard size={12} className="text-blue-500" />
                <span className="text-[11px] font-black text-blue-500">料金</span>
              </div>
              <div className="flex items-baseline gap-0.5 text-blue-600 font-black">
                <span className="text-[14px]">¥</span>
                <span className="text-[24px] tracking-tighter">
                  {selectedRes.total_price?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>

          {/* キャストメモ */}
          <div className="bg-pink-50/50 rounded-2xl border border-pink-100/50 overflow-hidden">
            {isEditingMemo ? (
              <div className="p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-pink-500">
                    <Edit3 size={14} />
                    <span className="text-[11px] font-black">メモを入力・確認</span>
                  </div>
                  <button onClick={() => setIsEditingMemo(false)} className="p-1 text-pink-300 hover:text-pink-500">
                    <X size={20} />
                  </button>
                </div>
                
                {!selectedRes.cast_memo && customerInfo.latestMemo && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 rounded-xl border border-pink-100 text-[10px] font-black text-pink-400 italic">
                    <Quote size={12} /> 前回のメモを引き継いでいます
                  </div>
                )}

                <textarea 
                  className="w-full p-4 rounded-2xl border-2 border-pink-200 bg-white text-[16px] font-bold focus:outline-none focus:border-pink-400 min-h-[160px] shadow-inner leading-relaxed"
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  placeholder="特徴、NG、会話内容など..."
                  autoFocus
                />
                <button 
                  onClick={handleSaveMemo}
                  className="w-full h-14 bg-pink-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[15px] shadow-lg shadow-pink-200 active:scale-95 transition-transform"
                >
                  <Save size={18} /> 保存して閉じる
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditingMemo(true)} 
                className="w-full py-5 flex flex-col items-center justify-center gap-1.5 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-2 text-pink-400 group-active:scale-95 transition-transform">
                  <StickyNote size={18} />
                  <span className="text-[14px] font-black tracking-[0.2em]">【 キャストメモ 】</span>
                </div>
                {(selectedRes.cast_memo || customerInfo.latestMemo) && (
                  <div className="flex gap-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-pink-200 rounded-full" />
                  </div>
                )}
              </button>
            )}
          </div>

          {/* 下部アクション */}
          <div className="space-y-2 pt-2">
            <button 
              onClick={() => alert("OP計算君起動")} 
              className="w-full h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-100 active:scale-95 transition-transform"
            >
              <Calculator size={20} /> OP計算君
            </button>
            <button 
              onClick={onDelete} 
              disabled={isDeleting}
              className="w-full h-10 rounded-xl text-gray-300 flex items-center justify-center gap-1 font-bold text-[11px] disabled:opacity-50 hover:text-red-400 transition-colors"
            >
              {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              予約を取り消す
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}