'use client';

import React, { useMemo, useEffect, useState } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = [] 
}: any) {
  const [showToast, setShowToast] = useState(false);

  // 1. データがない場合は即座に終了（絶対ガード）
  if (!selectedRes) return null;

  // 2. 過去履歴の計算（try-catchで囲み、エラーが起きても画面を止めない）
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

  // 3. 初期メモセット
  useEffect(() => {
    if (isEditingMemo && !memoDraft && typeof setMemoDraft === 'function') {
      setMemoDraft(selectedRes?.cast_memo || customerInfo.latestMemo || "");
    }
  }, [isEditingMemo, memoDraft, customerInfo.latestMemo, selectedRes, setMemoDraft]);

  // 4. 保存処理
  const handleSave = async () => {
    if (typeof onSaveMemo === 'function') {
      try {
        await onSaveMemo();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (e) {
        alert("保存エラーが発生しました");
      }
    }
  };

  // バッジスタイルの安全な取得
  const safeBadge = (val: string) => {
    if (typeof getBadgeStyle === 'function') return getBadgeStyle(val);
    return "bg-gray-200 text-gray-600";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0">
      <div className="absolute inset-0 bg-black/70" onClick={() => onClose?.()} />
      
      {/* 📍 トースト通知（最もシンプルな実装） */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] bg-pink-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-[13px] border border-pink-400">
          ✅ 保存完了：次回以降も引き継がれます
        </div>
      )}

      <div className="relative w-full max-w-sm bg-gray-50 rounded-t-[24px] sm:rounded-[24px] flex flex-col max-h-[96vh] overflow-hidden text-gray-800">
        
        {/* ヘッダー */}
        <div className="bg-white px-5 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-black">{(selectedRes.reservation_date || "").replace(/-/g, '/')}</span>
            <span className="text-gray-400 text-[10px] font-black uppercase">RESERVATION</span>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 text-[20px]">
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-3 space-y-2 flex-1">
          
          {/* 時間・区分 */}
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-[12px] font-black ${safeBadge(selectedRes.service_type)}`}>
              {selectedRes.service_type === 'か' ? 'か' : (selectedRes.service_type || 'か')}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-[12px] font-black ${safeBadge(selectedRes.nomination_category)}`}>
              {selectedRes.nomination_category || 'FREE'}
            </span>
            <div className="ml-auto text-[24px] font-black tracking-tighter leading-none">
              {(selectedRes.start_time || "").substring(0, 5)}
              <span className="mx-0.5 text-gray-300 text-[18px]">～</span>
              {(selectedRes.end_time || "").substring(0, 5)}
            </div>
          </div>

          {/* 予約内容詳細 */}
          <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <div className="text-[10px] font-black text-gray-400 uppercase">【コース】</div>
                <div className="font-black text-[16px] leading-tight truncate">{selectedRes.course_info || '-'}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <div className="text-[10px] font-black text-gray-400 uppercase">【料金】</div>
                <div className="font-black text-[16px]">{Number(selectedRes.total_price || 0).toLocaleString()}円</div>
              </div>
            </div>
          </div>

          {/* 顧客情報 */}
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-pink-400">
            <div className="text-pink-400 text-[10px] font-black uppercase mb-1">★ CUSTOMER</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[22px] font-black">【{selectedRes.customer_name || '不明'} 様】</span>
              <span className="text-[15px] font-black text-gray-400">〈{customerInfo.count}回目〉</span>
            </div>
            {customerInfo.count > 1 && customerInfo.lastDate && (
              <div className="inline-flex items-center gap-1 text-gray-400 text-[11px] font-bold bg-gray-50 px-2 py-0.5 rounded-md">
                🕒 前回：{(customerInfo.lastDate || "").replace(/-/g, '/')}
              </div>
            )}
          </div>

          {/* キャストメモ */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-transparent focus-within:border-pink-200 transition-all overflow-hidden">
            {isEditingMemo ? (
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-pink-500 font-black text-[12px]">📝 CAST MEMO</span>
                  <span className="text-[9px] text-gray-400 font-bold">※次回の履歴に引き継がれます</span>
                </div>
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  className="w-full h-24 p-3 bg-gray-50 rounded-lg text-[16px] font-bold focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-lg font-black text-[14px]">
                    閉じる
                  </button>
                  <button onClick={handleSave} className="flex-[2] py-3 bg-pink-500 text-white rounded-lg font-black text-[14px] shadow-lg">
                    💾 保存
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-4 flex items-center justify-center gap-2 text-pink-400 font-black italic">
                <span>📝</span>
                <span className="text-[14px] tracking-widest">【 キャストメモ 】</span>
                {(selectedRes.cast_memo || customerInfo.latestMemo) && <span className="w-2 h-2 bg-pink-400 rounded-full" />}
              </button>
            )}
          </div>

          {/* 下部エリア */}
          <div className="pt-2 pb-32 space-y-3">
            <button onClick={() => alert("OP計算君")} className="w-full h-14 rounded-xl bg-blue-500 text-white font-black text-[18px] shadow-lg flex items-center justify-center gap-2">
              🧮 OP計算君
            </button>
            <button onClick={() => onDelete?.()} disabled={isDeleting} className="w-full h-10 text-gray-300 font-bold text-[12px] flex items-center justify-center gap-1">
              🗑️ {isDeleting ? '処理中...' : '予約データを取り消す'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}