'use client';

import React, { useMemo } from 'react';
import { X, Calculator, Trash2, Edit3, Save, Loader2, StickyNote, History, Star, CreditCard, Layers } from 'lucide-react';

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

  const castVisitHistory = useMemo(() => {
    if (!selectedRes.customer_no) return { count: 1, lastDate: null };
    const history = allPastReservations
      .filter((r: any) => r.customer_no === selectedRes.customer_no)
      .sort((a: any, b: any) => b.reservation_date.localeCompare(a.reservation_date));
    const count = history.length;
    const lastMet = history.find((r: any) => r.id !== selectedRes.id);
    return { count, lastDate: lastMet ? lastMet.reservation_date : null };
  }, [selectedRes, allPastReservations]);

  const handleSaveMemo = async () => {
    await onSaveMemo();
    setIsEditingMemo(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 overflow-y-auto bg-black/90 backdrop-blur-sm pt-4 pb-24">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-150 flex flex-col text-gray-800">
        
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
          {/* お客様情報 & 履歴 */}
          <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[20px] font-black text-gray-800 truncate">
                {selectedRes.customer_name}<span className="text-[12px] ml-1 font-bold text-gray-400">様</span>
              </h3>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                <History size={12} className="text-pink-400" />
                <span className="text-[11px] font-black text-gray-600">
                  {castVisitHistory.count === 1 ? '初対面' : `${castVisitHistory.count}回目`}
                </span>
              </div>
            </div>
            {castVisitHistory.lastDate ? (
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Star size={10} className="text-yellow-500 fill-yellow-500" />
                <span>直近: {castVisitHistory.lastDate.replace(/-/g, '/')}</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-gray-300 italic">あなたとの履歴はありません</div>
            )}
          </div>

          {/* コース & 料金 (日本語表記) */}
          <div className="space-y-4 px-1">
            {/* コース */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg shrink-0 border border-gray-200">
                <Layers size={12} className="text-gray-600" />
                <span className="text-[11px] font-black text-gray-600">コース</span>
              </div>
              <p className="text-[18px] font-black text-gray-700 leading-tight truncate">
                {selectedRes.course_info}
              </p>
            </div>

            {/* 料金 */}
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

          {/* キャストメモ：デフォルトは非表示 */}
          <div className="bg-pink-50/50 rounded-2xl border border-pink-100/50 overflow-hidden">
            {isEditingMemo ? (
              <div className="p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-pink-500">
                    <Edit3 size={14} />
                    <span className="text-[11px] font-black tracking-widest">メモを編集中</span>
                  </div>
                  {/* フォームを閉じるための×ボタン */}
                  <button 
                    onClick={() => setIsEditingMemo(false)} 
                    className="p-1 text-pink-300 hover:text-pink-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <textarea 
                  className="w-full p-3 rounded-xl border-2 border-pink-200 bg-white text-[16px] font-bold focus:outline-none focus:border-pink-400 min-h-[120px] shadow-inner"
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  placeholder="ここにメモを入力..."
                  autoFocus
                />
                <button 
                  onClick={handleSaveMemo}
                  className="w-full h-12 bg-pink-500 text-white rounded-xl flex items-center justify-center gap-2 font-black text-[14px] shadow-lg shadow-pink-200 active:scale-95 transition-transform"
                >
                  <Save size={18} /> 保存して閉じる
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingMemo(true)} 
                className="w-full p-4 cursor-pointer group hover:bg-white transition-all text-center"
              >
                <div className="flex items-center justify-center gap-2 text-pink-400 mb-1">
                  <StickyNote size={14} />
                  <span className="text-[12px] font-black tracking-tighter uppercase">【 キャストメモ 】</span>
                </div>
                {/* プレビュー表示（入力済みの場合のみ2行表示） */}
                <p className="text-[14px] font-bold text-gray-500 leading-relaxed break-words whitespace-pre-wrap px-2 line-clamp-2">
                  {selectedRes.cast_memo || <span className="text-gray-300 italic text-[12px] font-medium">タップしてメモを入力する</span>}
                </p>
              </div>
            )}
          </div>

          {/* 下部アクション */}
          <div className="space-y-2">
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
              {isDeleting ? "削除中..." : "予約を取り消す"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}