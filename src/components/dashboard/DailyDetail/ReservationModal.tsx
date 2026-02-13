'use client';

import React from 'react';
import { X, Calculator, Trash2, Edit3, Save, Loader2 } from 'lucide-react';

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
      {/* 背景クリックで閉じる */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-150 flex flex-col text-gray-800">
        
        {/* ヘッダー：時間とバッジ */}
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

          {/* 金額とホテル */}
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

          {/* キャストメモエリア */}
          <div className="bg-pink-50/50 rounded-2xl p-3 border border-pink-100/50">
            <div className="flex items-center gap-1.5 mb-2 text-pink-400">
              <Edit3 size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Cast Memo</span>
            </div>
            {isEditingMemo ? (
              <div className="space-y-2">
                <textarea 
                  className="w-full p-3 rounded-xl border-2 border-pink-100 text-[14px] font-bold focus:outline-none focus:border-pink-300 min-h-[100px]"
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  autoFocus
                />
                <button 
                  onClick={onSaveMemo}
                  className="w-full h-10 bg-pink-500 text-white rounded-lg flex items-center justify-center gap-1 font-black text-[13px]"
                >
                  <Save size={16} /> 保存する
                </button>
              </div>
            ) : (
              <div onClick={() => setIsEditingMemo(true)} className="min-h-[60px] cursor-pointer">
                <p className="text-[14px] font-bold text-gray-600 leading-relaxed">
                  {selectedRes.cast_memo || <span className="text-gray-300 italic text-[12px]">タップしてメモを入力...</span>}
                </p>
              </div>
            )}
          </div>

          {/* 各種アクションボタン */}
          <div className="space-y-1.5 pt-1">
            <button 
              onClick={() => alert("OP計算君起動")} 
              className="w-full h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-100"
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