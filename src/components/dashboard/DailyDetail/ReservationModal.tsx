'use client';

import React, { useMemo } from 'react';
import { X, Calculator, Trash2, Edit3, Save, Loader2, StickyNote, History, Star } from 'lucide-react';

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
  allPastReservations = [] // 📍 自分の過去の全予約データ
}: any) {
  if (!selectedRes) return null;

  // 📍 あなた（キャスト）とこのお客様の接触履歴を計算
  const castVisitHistory = useMemo(() => {
    if (!selectedRes.customer_no) return { count: 1, lastDate: null };

    // 1. 自分(allPastReservations)のデータの中から、同じcustomer_noを抽出
    // 2. 日付順（新しい順）に並び替え
    const history = allPastReservations
      .filter((r: any) => r.customer_no === selectedRes.customer_no)
      .sort((a: any, b: any) => b.reservation_date.localeCompare(a.reservation_date));

    const count = history.length;
    
    // 3. 「直近で会った日」を取得（今回の予約IDを除いた中での最新）
    const lastMet = history.find((r: any) => r.id !== selectedRes.id);
    
    return {
      count,
      lastDate: lastMet ? lastMet.reservation_date : null
    };
  }, [selectedRes, allPastReservations]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 overflow-y-auto bg-black/90 backdrop-blur-sm pt-4 pb-24">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-150 flex flex-col text-gray-800">
        
        {/* ヘッダー */}
        <div className="p-2 px-4 flex items-center justify-center gap-3 relative border-b border-gray-50">
          <button onClick={onClose} className="absolute top-2 right-3 text-gray-300">
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
        
        <div className="px-4 py-2 space-y-3">
          {/* お客様情報 & あなたとの履歴 */}
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
                <span>直近で会った日: {castVisitHistory.lastDate.replace(/-/g, '/')}</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-gray-300 italic">あなたとの履歴はありません</div>
            )}
          </div>

          {/* コース情報 */}
          <div className="text-center border-b border-gray-50 pb-1">
            <h3 className="text-[22px] font-black text-gray-700 leading-tight italic break-words">
              {selectedRes.course_info}
            </h3>
          </div>

          {/* 📍 キャストメモ：デフォルトは閉じており、タップで16pxフォームが開く */}
          <div className="bg-pink-50/50 rounded-2xl p-3 border border-pink-100/50">
            <div className="flex items-center gap-1.5 mb-2 text-pink-400">
              <StickyNote size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Cast Memo</span>
            </div>

            {isEditingMemo ? (
              <div className="space-y-2">
                <textarea 
                  className="w-full p-3 rounded-xl border-2 border-pink-200 bg-white text-[16px] font-bold focus:outline-none focus:border-pink-400 min-h-[120px] shadow-inner"
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  placeholder="メモを入力..."
                  autoFocus
                />
                <button 
                  onClick={onSaveMemo}
                  className="w-full h-12 bg-pink-500 text-white rounded-xl flex items-center justify-center gap-2 font-black text-[14px] shadow-lg shadow-pink-200"
                >
                  <Save size={18} /> 保存する
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingMemo(true)} 
                className="min-h-[50px] cursor-pointer group bg-white/40 rounded-xl p-3 border border-dashed border-pink-200 hover:bg-white transition-colors flex items-center justify-between"
              >
                <p className="text-[14px] font-bold text-gray-600 leading-relaxed truncate pr-4">
                  {selectedRes.cast_memo || <span className="text-gray-300 italic text-[12px]">タップして入力...</span>}
                </p>
                <Edit3 size={14} className="text-pink-300 shrink-0" />
              </div>
            )}
          </div>

          {/* ボタン類 */}
          <div className="space-y-1.5 pt-1">
            <button 
              onClick={() => alert("OP計算君起動")} 
              className="w-full h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-100 active:scale-95 transition-transform"
            >
              <Calculator size={20} /> OP計算君
            </button>
            <button 
              onClick={onDelete} 
              disabled={isDeleting}
              className="w-full h-10 rounded-xl text-gray-300 flex items-center justify-center gap-1 font-bold text-[11px] disabled:opacity-50"
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