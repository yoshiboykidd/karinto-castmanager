'use client';

import React, { useState, useMemo } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, allPastReservations = [] 
}: any) {
  const [showToast, setShowToast] = useState(false);

  // 1. ガード
  if (!selectedRes) return null;

  // 2. 履歴計算（安定性を高めた書き方）
  const customerInfo = useMemo(() => {
    try {
      const historyData = Array.isArray(allPastReservations) ? allPastReservations : [];
      const customerNo = selectedRes.customer_no;
      if (!customerNo) return { count: 1, lastDate: null };

      const history = historyData.filter(r => r && r.customer_no === customerNo);
      const sorted = [...history].sort((a, b) => 
        String(b.reservation_date || "").localeCompare(String(a.reservation_date || ""))
      );
      const lastMet = sorted.find(r => r && r.id !== selectedRes.id);
      
      return { 
        count: history.length || 1, 
        lastDate: lastMet ? lastMet.reservation_date : null 
      };
    } catch (e) {
      return { count: 1, lastDate: null };
    }
  }, [selectedRes, allPastReservations]);

  // 3. 📍 保存処理の修正
  const handleSave = async () => {
    if (typeof onSaveMemo !== 'function') return;

    try {
      // データの保存を実行
      await onSaveMemo();
      
      // ✅ 編集モードだけを閉じる
      if (typeof setIsEditingMemo === 'function') {
        setIsEditingMemo(false);
      }
      
      // ✅ トーストを表示
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

    } catch (e) {
      alert("保存に失敗しました");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {/* 📍 トースト通知：モーダル内の上部に固定 */}
      {showToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[120] bg-pink-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-[13px] border border-pink-400 whitespace-nowrap">
          ✅ 保存しました
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col max-h-[90vh] overflow-hidden text-gray-800 shadow-2xl">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Reservation Info</p>
            <p className="text-[18px] font-black">📅 {String(selectedRes.reservation_date || "").replace(/-/g, '/')}</p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 text-2xl font-bold">×</button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          
          {/* 時間・区分 */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-pink-50 text-pink-500 rounded-lg text-[13px] font-black">
              {selectedRes.service_type || 'か'}
            </span>
            <div className="ml-auto text-[24px] font-black tracking-tighter">
              {String(selectedRes.start_time || "").substring(0, 5)} ～ {String(selectedRes.end_time || "").substring(0, 5)}
            </div>
          </div>

          {/* 顧客情報 */}
          <div className="p-5 border-2 border-pink-100 rounded-[24px] bg-white relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-400"></div>
            <p className="text-[10px] font-black text-pink-400 uppercase mb-1">★ CUSTOMER</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-black">{selectedRes.customer_name || '不明'} 様</span>
              <span className="text-[14px] font-black text-gray-400">〈{customerInfo.count}回目〉</span>
            </div>
            {customerInfo.lastDate && (
              <p className="text-[11px] font-bold text-gray-400 mt-1">前回：{String(customerInfo.lastDate).replace(/-/g, '/')}</p>
            )}
          </div>

          {/* キャストメモエリア */}
          <div className="bg-gray-50 rounded-[24px] overflow-hidden border-2 border-transparent focus-within:border-pink-200 transition-all">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <p className="text-pink-500 font-black text-[12px] px-1">📝 CAST MEMO</p>
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  placeholder="特徴などをメモ..."
                  className="w-full h-24 p-4 bg-white rounded-xl text-[16px] font-bold focus:outline-none border-none shadow-inner"
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
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-6 flex items-center justify-center gap-2 text-pink-400 font-black italic active:bg-pink-50">
                <span>📝</span>
                <span className="text-[14px] tracking-widest uppercase">【 キャストメモを書く 】</span>
                {selectedRes.cast_memo && <div className="w-2.5 h-2.5 bg-pink-400 rounded-full" />}
              </button>
            )}
          </div>

          <div className="pt-2 space-y-3 pb-4">
            <button onClick={() => alert("起動")} className="w-full h-14 rounded-[20px] bg-blue-500 text-white font-black text-[18px] shadow-lg">
              🧮 OP計算君
            </button>
            <button onClick={() => onDelete?.()} className="w-full text-gray-300 font-bold text-[12px]">
              {isDeleting ? '削除中...' : '🗑️ 予約を取り消す'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}