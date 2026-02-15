'use client';

import React, { useMemo, useEffect, useState } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, allPastReservations = [] 
}: any) {
  const [showToast, setShowToast] = useState(false);

  if (!selectedRes) return null;

  // 1. 過去履歴の計算
  const customerInfo = useMemo(() => {
    const historyData = Array.isArray(allPastReservations) ? allPastReservations : [];
    const customerNo = selectedRes?.customer_no;
    if (!customerNo) return { count: 1, lastDate: null, latestMemo: "" };

    const history = historyData
      .filter((r: any) => r && r.customer_no === customerNo)
      .sort((a: any, b: any) => String(b?.reservation_date || "").localeCompare(String(a?.reservation_date || "")));
    
    const count = history.length;
    const lastMet = history.find((r: any) => r && r.id !== selectedRes.id && r.reservation_date <= (selectedRes.reservation_date || ""));
    const latestMemo = history.find((r: any) => r?.cast_memo && String(r.cast_memo).trim() !== "")?.cast_memo || "";
    
    return { count, lastDate: lastMet?.reservation_date || null, latestMemo };
  }, [selectedRes, allPastReservations]);

  // 2. メモの初期セット
  useEffect(() => {
    if (isEditingMemo && !memoDraft) {
      setMemoDraft(selectedRes?.cast_memo || customerInfo.latestMemo || "");
    }
  }, [isEditingMemo, memoDraft, customerInfo.latestMemo, selectedRes, setMemoDraft]);

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
      
      {/* トースト通知 */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] bg-pink-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-[13px]">
          ✅ 保存完了。同じお客様のメモとして残ります
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col max-h-[90vh] overflow-hidden text-gray-800 shadow-2xl">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservation Date</p>
            <p className="text-[18px] font-black">{selectedRes.reservation_date?.replace(/-/g, '/')}</p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 font-bold text-xl">
            ×
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          
          {/* 時間・区分 */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-pink-50 text-pink-500 rounded-lg text-[12px] font-black">
              {selectedRes.service_type || 'か'}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[12px] font-black">
              {selectedRes.nomination_category || 'FREE'}
            </span>
            <div className="ml-auto text-[24px] font-black tracking-tighter">
              {selectedRes.start_time?.substring(0, 5)} ～ {selectedRes.end_time?.substring(0, 5)}
            </div>
          </div>

          {/* 予約内容詳細ブロック */}
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-[20px]">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">【コース / 料金】</p>
              <p className="text-[18px] font-black">{selectedRes.course_info} / <span className="text-pink-600">{Number(selectedRes.total_price || 0).toLocaleString()}円</span></p>
            </div>

            <div className="p-4 bg-gray-50 rounded-[20px]">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">【場所 / スタッフ】</p>
              <p className="text-[15px] font-black text-gray-700">🏨 {selectedRes.hotel_name || '-'} / 👤 {selectedRes.staff_name || '-'}</p>
            </div>
          </div>

          {/* 顧客情報ブロック */}
          <div className="p-5 border-2 border-pink-100 rounded-[24px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-400"></div>
            <p className="text-[10px] font-black text-pink-400 uppercase mb-1">★ Customer</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-black">{selectedRes.customer_name} 様</span>
              <span className="text-[14px] font-black text-gray-400">{customerInfo.count}回目</span>
            </div>
            {customerInfo.count > 1 && customerInfo.lastDate && (
              <p className="text-[11px] font-bold text-gray-400 mt-1">前回：{customerInfo.lastDate.replace(/-/g, '/')}</p>
            )}
          </div>

          {/* キャストメモ */}
          <div className="bg-gray-50 rounded-[24px] overflow-hidden">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  placeholder="お客様の特徴などをメモ..."
                  className="w-full h-32 p-4 bg-white rounded-xl text-[16px] font-bold focus:outline-none border-none"
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
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-6 flex items-center justify-center gap-2 text-pink-400 font-black italic">
                <span>📝</span>
                <span className="text-[14px] tracking-widest uppercase">【 キャストメモを書く 】</span>
              </button>
            )}
          </div>

          {/* 下部ボタン */}
          <div className="pt-2 pb-10 space-y-4">
            <button onClick={() => alert("OP計算君起動")} className="w-full h-16 rounded-[20px] bg-blue-500 text-white font-black text-[18px] shadow-lg shadow-blue-100">
              🧮 OP計算君を開く
            </button>
            
            <button onClick={() => onDelete?.()} className="w-full text-gray-300 font-bold text-[12px] flex items-center justify-center gap-1">
              🗑️ {isDeleting ? '削除中...' : 'この予約を取り消す'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}