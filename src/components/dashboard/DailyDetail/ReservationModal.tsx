'use client';

import React, { useState } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo
}: any) {
  const [showToast, setShowToast] = useState(false);

  // 1. データガード
  if (!selectedRes) return null;

  // 2. 保存処理（トーストを確実に見せるための小細工）
  const handleSave = async () => {
    if (typeof onSaveMemo !== 'function') return;

    try {
      // A. まず、入力欄（キャストメモ）だけを閉じる
      setIsEditingMemo?.(false);
      
      // B. トーストを表示する
      setShowToast(true);

      // C. 【重要】親に「保存して！」と頼む（ここで親が画面を閉じる命令を出す）
      await onSaveMemo();

      // D. トーストを3秒見せてから消す
      setTimeout(() => setShowToast(false), 3000);

    } catch (e) {
      setShowToast(false);
      alert("保存エラー");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {/* 📍 トースト通知：モーダルの外側ではなく、モーダルの「中」の一番上に出す */}
      {showToast && (
        <div className="absolute top-0 left-0 right-0 z-[50] bg-pink-600 text-white p-4 text-center font-black text-[14px] shadow-lg">
          ✅ メモを保存しました
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col shadow-2xl overflow-hidden text-gray-800">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Reservation Info</p>
            <p className="text-[18px] font-black leading-none">{(selectedRes.reservation_date || "").replace(/-/g, '/')}</p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 font-bold text-2xl">×</button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          
          <div className="p-5 border-2 border-pink-100 rounded-[24px]">
            <p className="text-[10px] font-black text-pink-400 uppercase mb-1">★ CUSTOMER</p>
            <span className="text-[22px] font-black">{selectedRes.customer_name || '不明'} 様</span>
          </div>

          {/* キャストメモエリア */}
          <div className="bg-gray-50 rounded-[24px] overflow-hidden">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  className="w-full h-24 p-4 bg-white rounded-xl text-[16px] font-bold focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-4 bg-white text-gray-400 rounded-xl font-black text-[14px]">
                    閉じる
                  </button>
                  <button onClick={handleSave} className="flex-[2] py-4 bg-pink-500 text-white rounded-xl font-black text-[15px]">
                    💾 保存する
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-6 flex items-center justify-center gap-2 text-pink-400 font-black italic active:bg-pink-50">
                <span>📝</span>
                <span className="text-[14px] tracking-widest uppercase">【 キャストメモを書く 】</span>
              </button>
            )}
          </div>

          <button onClick={() => onDelete?.()} className="w-full py-2 text-gray-300 font-bold text-[12px]">
            🗑️ 予約を取り消す
          </button>
        </div>
      </div>
    </div>
  );
}