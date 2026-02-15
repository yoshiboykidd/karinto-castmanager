'use client';

import React, { useMemo, useEffect, useState } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = [] 
}: any) {
  const [showToast, setShowToast] = useState(false);

  // 1. 根本的なガード：これがないと落ちる
  if (!selectedRes) return null;

  // 2. 過去履歴の安全な計算（エラーが起きても画面を止めない）
  const customerInfo = useMemo(() => {
    try {
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
    } catch (e) {
      return { count: 1, lastDate: null, latestMemo: "" };
    }
  }, [selectedRes, allPastReservations]);

  // 3. メモの初期セット
  useEffect(() => {
    if (isEditingMemo && !memoDraft && typeof setMemoDraft === 'function') {
      setMemoDraft(selectedRes?.cast_memo || customerInfo.latestMemo || "");
    }
  }, [isEditingMemo, memoDraft, customerInfo.latestMemo, selectedRes, setMemoDraft]);

  // 4. 保存処理
  const handleSave = async () => {
    if (typeof onSaveMemo === 'function') {
      await onSaveMemo();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // 5. バッジスタイルの安全取得
  const safeBadge = (val: string) => {
    if (typeof getBadgeStyle === 'function') return getBadgeStyle(val);
    return "bg-gray-100 text-gray-500";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {/* 📍 トースト通知（シンプルな背景と文字） */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] bg-pink-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-[13px] border border-pink-400">
          ✅ 保存しました。同じお客様のメモとして残ります
        </div>
      )}

      {/* 本体：検証版のデザインを継承 */}
      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col max-h-[90vh] overflow-hidden text-gray-800 shadow-2xl">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Reservation Date</p>
            <p className="text-[20px] font-black leading-none">📅 {(selectedRes.reservation_date || "").replace(/-/g, '/')}</p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 font-bold text-2xl">
            ×
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1 overscroll-contain">
          
          {/* 時間・区分 */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-[13px] font-black ${safeBadge(selectedRes.service_type)}`}>
              {selectedRes.service_type || 'か'}
            </span>
            <span className={`px-3 py-1 rounded-lg text-[12px] font-black ${safeBadge(selectedRes.nomination_category)}`}>
              {selectedRes.nomination_category || 'FREE'}
            </span>
            <div className="ml-auto text-[26px] font-black tracking-tighter leading-none">
              ⏰ {(selectedRes.start_time || "").substring(0, 5)} ～ {(selectedRes.end_time || "").substring(0, 5)}
            </div>
          </div>

          {/* 予約内容ブロック */}
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-[20px]">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">【コース / 料金】</p>
              <p className="text-[18px] font-black leading-tight">
                {selectedRes.course_info} / <span className="text-pink-600 font-black">{Number(selectedRes.total_price || 0).toLocaleString()}円</span>
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-[20px]">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">【場所 / スタッフ】</p>
              <p className="text-[15px] font-black text-gray-700">
                🏨 {selectedRes.hotel_name || '-'} / 👤 {selectedRes.staff_name || '-'}
              </p>
            </div>
          </div>

          {/* 顧客情報ブロック */}
          <div className="p-5 border-2 border-pink-100 rounded-[24px] relative bg-white">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-400"></div>
            <p className="text-[11px] font-black text-pink-400 uppercase mb-1 flex items-center gap-1">⭐ CUSTOMER</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-black">【{selectedRes.customer_name} 様】</span>
              <span className="text-[16px] font-black text-gray-400">〈{customerInfo.count}回目〉</span>
            </div>
            {customerInfo.count > 1 && customerInfo.lastDate && (
              <p className="text-[11px] font-bold text-gray-400 mt-1 pl-1">⌛ 前回：{(customerInfo.lastDate || "").replace(/-/g, '/')}</p>
            )}
          </div>

          {/* キャストメモ */}
          <div className="bg-gray-50 rounded-[24px] overflow-hidden border-2 border-transparent focus-within:border-pink-200 transition-all">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-pink-500 font-black text-[12px]">📝 CAST MEMO</span>
                  <span className="text-[9px] text-gray-400 font-bold italic">※次回の履歴にも表示されます</span>
                </div>
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
                  <button onClick={handleSave} className="flex-[2] py-4 bg-pink-500 text-white rounded-xl font-black text-[15px] shadow-lg">
                    💾 メモを保存
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-6 flex items-center justify-center gap-2 text-pink-400 font-black italic active:bg-pink-50 transition-all">
                <span>📝</span>
                <span className="text-[15px] tracking-widest uppercase">【 キャストメモを書く 】</span>
                {(selectedRes.cast_memo || customerInfo.latestMemo) && <div className="w-2.5 h-2.5 bg-pink-400 rounded-full" />}
              </button>
            )}
          </div>

          {/* 下部ボタン */}
          <div className="pt-2 pb-10 space-y-4">
            <button onClick={() => alert("OP計算君起動")} className="w-full h-16 rounded-[22px] bg-blue-500 text-white font-black text-[18px] shadow-lg active:scale-95 transition-all">
              🧮 OP計算君を開く
            </button>
            
            <button onClick={() => onDelete?.()} className="w-full text-gray-300 font-bold text-[12px] flex items-center justify-center gap-1 active:text-red-400 transition-colors">
              🗑️ {isDeleting ? '削除中...' : 'この予約データを取り消す'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}