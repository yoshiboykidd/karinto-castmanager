'use client';

import React from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo
}: any) {
  
  // これが動かないなら親側の呼び出し方に問題があります
  if (!selectedRes) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-gray-800">
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black">予約詳細 (検証モード)</h2>
          <button onClick={() => onClose?.()} className="p-2 bg-gray-100 rounded-full">×</button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-bold text-gray-400">お名前</p>
            <p className="text-lg font-black">{selectedRes.customer_name || '名前なし'} 様</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-bold text-gray-400">コース / 料金</p>
            <p className="font-black">{selectedRes.course_info} / {selectedRes.total_price}円</p>
          </div>

          <button 
            onClick={() => {
              onSaveMemo?.();
              alert("保存ボタンが押されました");
            }}
            className="w-full py-4 bg-pink-500 text-white rounded-xl font-black"
          >
            保存テスト (トーストなし)
          </button>

          <button 
            onClick={() => onDelete?.()}
            className="w-full py-2 text-gray-400 text-xs font-bold"
          >
            {isDeleting ? '削除中...' : 'データを削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}