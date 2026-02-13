'use client';

import React from 'react';
import { X, Calculator, Trash2, Edit3, Save, Loader2, StickyNote } from 'lucide-react';

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
  getBadgeStyle 
}: any) {
  if (!selectedRes) return null;

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
          {/* コース情報 */}
          <div className="text-center border-b border-gray-50 pb-1">
            <h3 className="text-[24px] font-black text-gray-800 leading-tight italic break-words">
              {selectedRes.course_info}
            </h3>
          </div>

          {/* 金額・ホテル */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col justify-center text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">合計金額</p>
              <div className="flex items-baseline justify-center font-black text-gray-900 leading-none">
                <span className="text-xs mr-0.5">¥</span>
                <span className="text-[32px] tracking-tighter">{(selectedRes.total_price || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col justify-center text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Hotel</p>
              <p className="text-[16px] font-black text-gray-800 truncate">{selectedRes.hotel_name || 'MR'}</p>
            </div>
          </div>

          {/* 📍 キャストメモエリア (修正：タップで編集モード切り替え & ズーム防止) */}
          <div className="bg-pink-50/50 rounded-2xl p-3 border border-pink-100/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-pink-400">
                <StickyNote size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Cast Memo</span>
              </div>
              {isEditingMemo && (
                <button onClick={() => setIsEditingMemo(false)} className="text-gray-400">
                   <X size={16} />
                </button>
              )}
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
                className="min-h-[60px] cursor-pointer group relative bg-white/50 rounded-xl p-2 border border-dashed border-pink-200/50 hover:bg-white transition-colors"
              >
                <p className="text-[14px] font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedRes.cast_memo || <span className="text-gray-300 italic text-[12px]">タップしてメモを入力...</span>}
                </p>
                <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Edit3 size={12} className="text-pink-300" />
                </div>
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