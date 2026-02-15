'use client';

import React, { useState } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo
}: any) {
  const [showToast, setShowToast] = useState(false);

  // ガード：これがないと絶対に落ちる
  if (!selectedRes) return null;

  // 保存ボタンの処理
  const handleSave = async () => {
    if (typeof onSaveMemo === 'function') {
      await onSaveMemo();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/70" onClick={() => onClose?.()} />
      
      {/* トースト（シンプルな文字だけ） */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] bg-pink-600 text-white px-6 py-3 rounded-full font-black shadow-xl">
          ✅ 保存しました
        </div>
      )}

      {/* 本体：検証版で見やすかったサイズ感を採用 */}
      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col shadow-2xl overflow-hidden text-gray-800">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
            <p className="text-[18px] font-black">{selectedRes.reservation_date || '----/--/--'}</p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 text-2xl font-bold">
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          
          {/* 時間・区分：検証版ベースの大きな文字 */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-pink-50 text-pink-500 rounded-lg text-[12px] font-black">
              {selectedRes.service_type || 'か'}
            </span>
            <div className="ml-auto text-[26px] font-black tracking-tighter">
              {selectedRes.start_time} ～ {selectedRes.end_time}
            </div>
          </div>

          {/* 予約情報ブロック：検証版で「見やすかった」グレーの箱 */}
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-[20px]">
              <p className="text-[10px] font-black text-gray-400 mb-1">【コース / 料金】</p>
              <p className="text-[18px] font-black">
                {selectedRes.course_info} / <span className="text-pink-600">{selectedRes.total_price}円</span>
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-[20px]">
              <p className="text-[10px] font-black text-gray-400 mb-1">【場所 / スタッフ】</p>
              <p className="text-[15px] font-black text-gray-700">
                🏨 {selectedRes.hotel_name || '-'} / 👤 {selectedRes.staff_name || '-'}
              </p>
            </div>
          </div>

          {/* 顧客情報：ハッキリした大きな名前 */}
          <div className="p-5 border-2 border-pink-100 rounded-[24px]">
            <p className="text-[10px] font-black text-pink-400 uppercase mb-1">★ Customer</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-black">{selectedRes.customer_name || '名前なし'} 様</span>
            </div>
          </div>

          {/* キャストメモ：シンプルに */}
          <div className="bg-gray-50 rounded-[24px] overflow-hidden">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  className="w-full h-32 p-4 bg-white rounded-xl text-[16px] font-bold focus:outline-none"
                  placeholder="メモを入力..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-4 bg-white text-gray-400 rounded-xl font-black text-[14px]">
                    閉じる
                  </button>
                  <button onClick={handleSave} className="flex-[2] py-4 bg-pink-500 text-white rounded-xl font-black text-[15px] shadow-lg">
                    保存する
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-6 flex items-center justify-center gap-2 text-pink-400 font-black italic">
                📝 <span className="text-[14px] tracking-widest uppercase">【 キャストメモを書く 】</span>
              </button>
            )}
          </div>

          {/* 下部ボタン */}
          <div className="pt-2 pb-6 space-y-4">
            <button onClick={() => alert("起動")} className="w-full h-16 rounded-[20px] bg-blue-500 text-white font-black text-[18px] shadow-lg shadow-blue-100">
              🧮 OP計算君を開く
            </button>
            
            <button onClick={() => onDelete?.()} className="w-full text-gray-300 font-bold text-[12px]">
              {isDeleting ? '削除中...' : '🗑️ この予約データを取り消す'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}