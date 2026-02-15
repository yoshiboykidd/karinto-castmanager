'use client';

import React, { useState, useMemo } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = [] 
}: any) {
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

  if (!selectedRes) return null;

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-1">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[250] bg-pink-600 text-white px-7 py-5 rounded-[24px] shadow-2xl font-black text-center border-2 border-pink-400 whitespace-nowrap animate-bounce flex flex-col items-center gap-1">
          <div className="text-[16px]">✅ 保存されました</div>
          <div className="text-[11px] opacity-90 leading-tight">
            同じお客様の情報は<br />1つのメモで更新されてます
          </div>
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[24px] flex flex-col max-h-[98vh] overflow-hidden text-gray-800 shadow-2xl">
        
        {/* ヘッダー：パディングを最小化 */}
        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <p className="text-[17px] font-black leading-none">
              {String(selectedRes.reservation_date || "").replace(/-/g, '/')}
            </p>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Detail</p>
          </div>
          <button onClick={() => onClose?.()} className="w-7 h-7 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 font-bold text-lg">×</button>
        </div>

        {/* コンテンツ：space-y-1 で要素を密着させる */}
        <div className="overflow-y-auto px-3 pt-2 pb-10 space-y-1 flex-1 overscroll-contain">
          
          {/* ブロック1: 予約内容（パディングを p-2 まで削減） */}
          <div className="bg-pink-50/40 rounded-[16px] p-2 border border-pink-100/30">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <div className="flex gap-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-black ${getBadgeStyle?.(selectedRes.service_type) || 'bg-pink-500 text-white'}`}>
                  {selectedRes.service_type || 'か'}
                </span>
                {selectedRes.nomination_category && (
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-black ${getBadgeStyle?.(selectedRes.nomination_category) || 'bg-gray-100 text-gray-400'}`}>
                    {selectedRes.nomination_category}
                  </span>
                )}
              </div>
              <div className="text-[22px] font-black tracking-tighter text-gray-700 leading-none">
                {String(selectedRes.start_time || "").substring(0, 5)}<span className="text-[12px] opacity-20 mx-0.5">〜</span>{String(selectedRes.end_time || "").substring(0, 5)}
              </div>
            </div>

            <div className="flex justify-between items-start gap-2 px-0.5">
              <p className="text-[15px] font-black text-gray-700 leading-tight flex-1">{selectedRes.course_info || 'コース未設定'}</p>
              <div className="text-right shrink-0">
                <p className="text-[20px] font-black text-pink-500 leading-none">¥{Number(selectedRes.total_price || 0).toLocaleString()}</p>
                {selectedRes.discount && (
                  <p className="text-[10px] font-bold text-rose-400 leading-none mt-0.5">{selectedRes.discount}</p>
                )}
              </div>
            </div>

            {(selectedRes.options || selectedRes.options_memo) && (
              <div className="mt-1.5 pt-1.5 border-t border-pink-100/30">
                <div className="flex flex-wrap gap-0.5">
                   {Array.isArray(selectedRes.options) ? selectedRes.options.map((opt: string, i: number) => (
                     <span key={i} className="px-1.5 py-0.5 bg-white text-pink-500 text-[10px] font-black rounded border border-pink-100">{opt}</span>
                   )) : selectedRes.options && (
                     <span className="px-1.5 py-0.5 bg-white text-pink-500 text-[10px] font-black rounded border border-pink-100">{selectedRes.options}</span>
                   )}
                </div>
                {selectedRes.options_memo && (
                  <p className="mt-1 text-[11px] font-bold text-gray-500 leading-tight">{selectedRes.options_memo}</p>
                )}
              </div>
            )}
          </div>

          {selectedRes.customer_memo && (
            <div className="px-2 py-0.5">
              <p className="text-[11px] font-bold text-gray-400 italic leading-tight">「{selectedRes.customer_memo}」</p>
            </div>
          )}

          {/* ブロック2: 顧客情報（高さを圧縮） */}
          <div className="p-2.5 bg-white border border-gray-100 rounded-[16px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gray-100"></div>
            <div className="flex items-center gap-2 leading-none">
              <span className="text-[21px] font-black text-gray-800">{selectedRes.customer_name || '不明'} 様</span>
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-black ${customerInfo.count === 1 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {customerInfo.count === 1 ? '初' : `${customerInfo.count}回目`}
              </span>
            </div>
            {customerInfo.lastDate && (
              <p className="text-[10px] font-bold text-gray-400 mt-1">⌛ 前回: {String(customerInfo.lastDate).replace(/-/g, '/')}</p>
            )}
          </div>

          {/* ブロック3: キャストメモ */}
          <div className="bg-gray-50 rounded-[16px] border border-dashed border-gray-200 overflow-hidden">
            {isEditingMemo ? (
              <div className="p-2 space-y-1.5">
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  className="w-full h-20 p-2 bg-white rounded-lg text-[15px] font-bold focus:outline-none border-none shadow-inner"
                  autoFocus
                />
                <div className="flex gap-1">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-2 bg-white text-gray-400 rounded-lg font-black text-[13px] border border-gray-100">閉じる</button>
                  <button onClick={handleSave} className="flex-[2] py-2 bg-pink-500 text-white rounded-lg font-black text-[14px]">💾 保存</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-3.5 flex items-center justify-center gap-2 text-pink-400 font-black">
                <span className="text-[13px] italic">📝 キャストメモを書く</span>
              </button>
            )}
          </div>

          {/* 削除ボタン */}
          <div className="pt-0.5">
            <button onClick={() => onDelete?.()} className="w-full py-1.5 text-gray-300 font-bold text-[10px]">
              {isDeleting ? '削除中...' : '🗑️ 予約を取り消す'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}