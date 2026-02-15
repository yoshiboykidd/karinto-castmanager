'use client';

import React, { useState } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, allPastReservations = [] 
}: any) {
  const [showToast, setShowToast] = useState(false);

  // 1. 究極のガード：これがないと絶対に落ちる
  if (!selectedRes) return null;

  // 2. 履歴計算（try-catchすら使わず、もっとも原始的な方法で）
  let visitCount = 1;
  let lastDateText = "";

  const history = Array.isArray(allPastReservations) ? allPastReservations : [];
  const cNo = selectedRes.customer_no;

  if (cNo) {
    const customerHistory = history.filter(r => r && r.customer_no === cNo);
    visitCount = customerHistory.length > 0 ? customerHistory.length : 1;

    // 今回以外の予約を探す
    const otherRes = customerHistory.filter(r => r && r.id !== selectedRes.id);
    if (otherRes.length > 0) {
      // 1番新しい日付を探す
      const latest = otherRes.reduce((a, b) => 
        (a.reservation_date || "") > (b.reservation_date || "") ? a : b
      );
      lastDateText = (latest.reservation_date || "").replace(/-/g, '/');
    }
  }

  // 3. 保存処理：保存してもモーダルは閉じない設定
  const handleSave = async () => {
    if (typeof onSaveMemo !== 'function') return;

    try {
      await onSaveMemo(); // 親の保存処理を実行
      
      // ✅ ここでトーストを出し、入力欄を閉じる
      setShowToast(true);
      if (typeof setIsEditingMemo === 'function') {
        setIsEditingMemo(false);
      }

      // トーストは3秒後に自動で消える
      setTimeout(() => setShowToast(false), 3000);

    } catch (e) {
      alert("保存に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {/* 📍 トースト通知：モーダルの上部に配置 */}
      {showToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[120] bg-pink-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-[13px] border border-pink-400">
          ✅ 保存しました
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col max-h-[90vh] overflow-hidden text-gray-800 shadow-2xl">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Reservation Info</p>
            <p className="text-[18px] font-black leading-none">
              📅 {(selectedRes.reservation_date || "").replace(/-/g, '/')}
            </p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 font-bold text-2xl">
            ×
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1 overscroll-contain">
          
          {/* 時間・区分 */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-pink-50 text-pink-500 rounded-lg text-[13px] font-black">
              {selectedRes.service_type || 'か'}
            </span>
            <div className="ml-auto text-[24px] font-black tracking-tighter leading-none">
              {(selectedRes.start_time || "").substring(0, 5)} ～ {(selectedRes.end_time || "").substring(0, 5)}
            </div>
          </div>

          {/* 顧客情報ブロック */}
          <div className="p-5 border-2 border-pink-100 rounded-[24px] bg-white relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-400"></div>
            <p className="text-[11px] font-black text-pink-400 uppercase mb-1">★ CUSTOMER</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-black">{selectedRes.customer_name || '不明'} 様</span>
              <span className="text-[16px] font-black text-gray-400">〈{visitCount}回目〉</span>
            </div>
            {lastDateText && (
              <p className="text-[11px] font-bold text-gray-400 mt-1 pl-1">⌛ 前回：{lastDateText}</p>
            )}
          </div>

          {/* キャストメモ：検証版デザインのまま */}
          <div className="bg-gray-50 rounded-[24px] overflow-hidden border-2 border-transparent focus-within:border-pink-200">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <p className="text-pink-500 font-black text-[12px] px-1">📝 CAST MEMO</p>
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  placeholder="お客様の特徴などをメモ..."
                  className="w-full h-24 p-4 bg-white rounded-xl text-[16px] font-bold focus:outline-none border-none shadow-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-4 bg-white text-gray-400 rounded-xl font-black text-[14px]">
                    閉じる
                  </button>
                  <button onClick={handleSave} className="flex-[2] py-4 bg-pink-500 text-white rounded-xl font-black text-[15px] shadow-lg shadow-pink-100">
                    💾 保存する
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-6 flex items-center justify-center gap-2 text-pink-400 font-black italic active:bg-pink-50">
                <span>📝</span>
                <span className="text-[15px] tracking-widest uppercase">【 キャストメモを書く 】</span>
                {selectedRes.cast_memo && <div className="w-2.5 h-2.5 bg-pink-400 rounded-full" />}
              </button>
            )}
          </div>

          {/* 下部ボタン */}
          <div className="pt-2 pb-10 space-y-4">
            <button onClick={() => alert("起動")} className="w-full h-16 rounded-[22px] bg-blue-500 text-white font-black text-[18px] shadow-lg active:scale-95 transition-all">
              🧮 OP計算君を開く
            </button>
            
            <button onClick={() => onDelete?.()} className="w-full text-gray-300 font-bold text-[12px] flex items-center justify-center gap-1 active:text-red-400">
              🗑️ {isDeleting ? '削除中...' : 'この予約データを取り消す'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}