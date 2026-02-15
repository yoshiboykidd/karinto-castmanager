'use client';

import React, { useState } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo
}: any) {
  const [showToast, setShowToast] = useState(false);

  if (!selectedRes) return null;

  // 📍 保存の流れを「トーストを見せる」ように調整
  const handleSave = async () => {
    if (typeof onSaveMemo !== 'function') return;

    try {
      // 1. まずデータを保存する
      await onSaveMemo();
      
      // 2. 画面を閉じる前に、トーストを表示する
      setShowToast(true);
      
      // 3. 1.5秒間だけ「保存完了」を見せる時間を稼ぐ
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 4. その後でトーストを消す（この後、親側で画面が更新されてTOPに戻っても自然です）
      setShowToast(false);
      
      // もし自動で閉じない設定なら、ここで編集モードを抜ける
      setIsEditingMemo?.(false);

    } catch (e) {
      alert("保存中にエラーが発生しました");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {/* 📍 トースト通知：画面の最前面、かつ少し低めの位置に出して目立たせる */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-pink-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-[15px] border-2 border-white text-center">
          ✅ 保存しました。<br/>
          <span className="text-[11px] font-bold">同じお客様のメモとして残ります</span>
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col shadow-2xl overflow-hidden text-gray-800">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Reservation Date</p>
            <p className="text-[18px] font-black leading-none">{(selectedRes.reservation_date || "").replace(/-/g, '/')}</p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 font-bold text-2xl">
            ×
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          
          <div className="p-5 border-2 border-pink-100 rounded-[24px]">
            <p className="text-[10px] font-black text-pink-400 uppercase mb-1">★ CUSTOMER</p>
            <span className="text-[22px] font-black">{selectedRes.customer_name || '不明'} 様</span>
          </div>

          <div className="bg-gray-50 rounded-[24px] overflow-hidden">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <p className="text-pink-500 font-black text-[12px] px-1">📝 CAST MEMO</p>
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  className="w-full h-24 p-4 bg-white rounded-xl text-[16px] font-bold focus:outline-none border-none shadow-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-4 bg-white text-gray-400 rounded-xl font-black text-[14px]">
                    閉じる
                  </button>
                  <button onClick={handleSave} className="flex-[2] py-4 bg-pink-500 text-white rounded-xl font-black text-[15px] shadow-lg">
                    💾 保存する
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-6 flex items-center justify-center gap-2 text-pink-400 font-black italic">
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