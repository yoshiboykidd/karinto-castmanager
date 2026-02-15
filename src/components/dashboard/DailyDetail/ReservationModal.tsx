'use client';

import React, { useState, useMemo } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = [] 
}: any) {
  // 1. フックをすべて先に宣言（エラー回避）
  const [showToast, setShowToast] = useState(false);

  const customerInfo = useMemo(() => {
    if (!selectedRes) return { count: 1, lastDate: null };

    try {
      const history = Array.isArray(allPastReservations) ? allPastReservations : [];
      const cNo = selectedRes.customer_no;
      if (!cNo) return { count: 1, lastDate: null };

      const myHistory = history.filter(r => r && r.customer_no === cNo);
      const sorted = [...myHistory].sort((a, b) => 
        String(b.reservation_date || "").localeCompare(String(a.reservation_date || ""))
      );
      const lastMet = sorted.find(r => r && r.id !== selectedRes.id);
      
      return { count: myHistory.length || 1, lastDate: lastMet?.reservation_date || null };
    } catch (e) {
      return { count: 1, lastDate: null };
    }
  }, [selectedRes, allPastReservations]);

  // 2. ガード
  if (!selectedRes) return null;

  // 📍 保存処理
  const handleSave = async () => {
    if (typeof onSaveMemo !== 'function') return;
    try {
      await onSaveMemo();
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        if (typeof setIsEditingMemo === 'function') {
          setIsEditingMemo(false);
        }
      }, 1500);
    } catch (e) {
      console.error("Save error:", e);
      alert("保存エラー");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {/* 📍 トースト通知 */}
      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] bg-pink-600 text-white px-7 py-5 rounded-[24px] shadow-2xl font-black text-center border-2 border-pink-400 whitespace-nowrap animate-bounce flex flex-col items-center gap-1">
          <div className="text-[16px]">✅ 保存されました</div>
          <div className="text-[11px] opacity-90 leading-tight">
            同じお客様の情報は<br />
            1つのメモで更新されてます
          </div>
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col max-h-[90vh] overflow-hidden text-gray-800 shadow-2xl">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Reservation Info</p>
            <p className="text-[18px] font-black leading-none">
              📅 {String(selectedRes.reservation_date || "").replace(/-/g, '/')}
            </p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 font-bold text-2xl">×</button>
        </div>

        {/* コンテンツエリア */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1 overscroll-contain">
          
          {/* 📍 バッジと時間：指名種別を復活させた */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className={`px-3 py-1 rounded-lg text-[13px] font-black ${getBadgeStyle?.(selectedRes.service_type) || 'bg-pink-500 text-white'}`}>
                {selectedRes.service_type || 'か'}
              </span>
              {selectedRes.nomination_category && (
                <span className={`px-3 py-1 rounded-lg text-[13px] font-black ${getBadgeStyle?.(selectedRes.nomination_category) || 'bg-gray-100 text-gray-400'}`}>
                  {selectedRes.nomination_category}
                </span>
              )}
            </div>
            <div className="ml-auto text-[24px] font-black tracking-tighter">
              {String(selectedRes.start_time || "").substring(0, 5)} ～ {String(selectedRes.end_time || "").substring(0, 5)}
            </div>
          </div>

          {/* 顧客情報 */}
          <div className="p-5 border-2 border-pink-100 rounded-[24px] bg-white relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-400"></div>
            <p className="text-[11px] font-black text-pink-400 mb-1">★ CUSTOMER</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-black">{selectedRes.customer_name || '不明'} 様</span>
              <span className="text-[15px] font-black text-gray-400">〈{customerInfo.count}回目〉</span>
            </div>
            {customerInfo.lastDate && (
              <p className="text-[11px] font-bold text-gray-400 mt-1">⌛ 前回：{String(customerInfo.lastDate).replace(/-/g, '/')}</p>
            )}
          </div>

          {/* メモエリア */}
          <div className="bg-gray-50 rounded-[24px] overflow-hidden">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  className="w-full h-24 p-4 bg-white rounded-xl text-[16px] font-bold focus:outline-none border-none shadow-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-4 bg-white text-gray-400 rounded-xl font-black text-[14px]">閉じる</button>
                  <button onClick={handleSave} className="flex-[2] py-4 bg-pink-500 text-white rounded-xl font-black text-[15px] shadow-lg">💾 保存する</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-6 flex items-center justify-center gap-2 text-pink-400 font-black italic">
                📝 <span>【 キャストメモを書く 】</span>
              </button>
            )}
          </div>

          <button onClick={() => onDelete?.()} className="w-full py-2 text-gray-300 font-bold text-[12px]">
            {isDeleting ? '削除中...' : '🗑️ 予約を取り消す'}
          </button>
        </div>
      </div>
    </div>
  );
}