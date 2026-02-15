'use client';

import React, { useState, useMemo } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, allPastReservations = [] 
}: any) {
  const [showToast, setShowToast] = useState(false);

  // 1. データがない場合は即終了
  if (!selectedRes) return null;

  // 2. 来店回数と前回日付の計算（useMemoを使って安全に計算）
  const customerInfo = useMemo(() => {
    try {
      const historyData = Array.isArray(allPastReservations) ? allPastReservations : [];
      const customerNo = selectedRes?.customer_no;

      if (!customerNo) return { count: 1, lastDate: null };

      // 同じ顧客番号の予約を抽出
      const history = historyData.filter((r: any) => r && r.customer_no === customerNo);
      
      // 日付順に並び替え
      const sorted = [...history].sort((a: any, b: any) => 
        String(b?.reservation_date || "").localeCompare(String(a?.reservation_date || ""))
      );

      const count = history.length;
      // 今回の予約ID以外の直近の予約を探す
      const lastMet = sorted.find((r: any) => r && r.id !== selectedRes.id);
      
      return { 
        count: count > 0 ? count : 1, 
        lastDate: lastMet?.reservation_date || null 
      };
    } catch (e) {
      return { count: 1, lastDate: null };
    }
  }, [selectedRes, allPastReservations]);

  // 3. 保存処理
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col shadow-2xl overflow-hidden text-gray-800 max-h-[90vh]">
        
        {/* 📍 修正版トースト：モーダルの内側・上部に出現させる */}
        {showToast && (
          <div className="absolute top-4 left-4 right-4 z-[110] bg-pink-600 text-white px-4 py-3 rounded-2xl shadow-lg font-black text-[13px] text-center">
            ✅ 保存しました。同じお客様のメモに残ります
          </div>
        )}

        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Reservation Info</p>
            <p className="text-[18px] font-black leading-none">
              {(selectedRes.reservation_date || "").replace(/-/g, '/')}
            </p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 text-2xl font-bold">
            ×
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          
          {/* 時間・区分 */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-pink-50 text-pink-500 rounded-lg text-[13px] font-black">
              {selectedRes.service_type || 'か'}
            </span>
            <div className="ml-auto text-[24px] font-black tracking-tighter leading-none">
              {(selectedRes.start_time || "").substring(0, 5)} ～ {(selectedRes.end_time || "").substring(0, 5)}
            </div>
          </div>

          {/* 📍 顧客情報：来店回数を表示 */}
          <div className="p-5 border-2 border-pink-100 rounded-[24px] bg-white relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-400"></div>
            <p className="text-[10px] font-black text-pink-400 uppercase mb-1">★ CUSTOMER</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-black">{selectedRes.customer_name || '不明'} 様</span>
              <span className="text-[14px] font-black text-gray-400">〈{customerInfo.count}回目〉</span>
            </div>
            {customerInfo.lastDate && (
              <p className="text-[11px] font-bold text-gray-400 mt-1">
                前回：{(customerInfo.lastDate || "").replace(/-/g, '/')}
              </p>
            )}
          </div>

          {/* キャストメモ */}
          <div className="bg-gray-50 rounded-[24px] overflow-hidden">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <p className="text-pink-500 font-black text-[12px] px-1">📝 CAST MEMO</p>
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  placeholder="特徴などをメモ..."
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

          {/* 下部ボタン */}
          <div className="pt-2 space-y-3 pb-4">
            <button onClick={() => alert("起動")} className="w-full h-14 rounded-[20px] bg-blue-500 text-white font-black text-[18px]">
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