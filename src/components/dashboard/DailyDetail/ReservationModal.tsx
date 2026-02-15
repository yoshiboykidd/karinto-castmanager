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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[250] bg-pink-600 text-white px-7 py-5 rounded-[24px] shadow-2xl font-black text-center border-2 border-pink-400 whitespace-nowrap animate-bounce flex flex-col items-center gap-1">
          <div className="text-[16px]">✅ 保存されました</div>
          <div className="text-[11px] opacity-90 leading-tight text-center">
            同じお客様の情報は<br />1つのメモで更新されてます
          </div>
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[32px] flex flex-col max-h-[96vh] overflow-hidden text-gray-800 shadow-2xl">
        
        {/* ヘッダー：高さを極限まで圧縮 */}
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
          <div className="flex items-baseline gap-2">
            <p className="text-[18px] font-black leading-none">
              {String(selectedRes.reservation_date || "").replace(/-/g, '/')}
            </p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reservation</p>
          </div>
          <button onClick={() => onClose?.()} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 font-bold text-lg">×</button>
        </div>

        {/* コンテンツ：垂直の間隔をspace-y-2に短縮 */}
        <div className="overflow-y-auto px-4 pt-3 pb-16 space-y-2 flex-1 overscroll-contain">
          
          {/* ブロック1: 予約基本情報 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex gap-1">
                <span className={`px-2 py-0.5 rounded-md text-[12px] font-black ${getBadgeStyle?.(selectedRes.service_type) || 'bg-pink-500 text-white'}`}>
                  {selectedRes.service_type || 'か'}
                </span>
                {selectedRes.nomination_category && (
                  <span className={`px-2 py-0.5 rounded-md text-[12px] font-black ${getBadgeStyle?.(selectedRes.nomination_category) || 'bg-gray-100 text-gray-400'}`}>
                    {selectedRes.nomination_category}
                  </span>
                )}
              </div>
              <div className="text-[24px] font-black tracking-tighter text-gray-700 leading-none">
                {String(selectedRes.start_time || "").substring(0, 5)}<span className="text-[14px] opacity-20 mx-1">〜</span>{String(selectedRes.end_time || "").substring(0, 5)}
              </div>
            </div>

            {/* コース料金：内側のパディングを p-3 に削減 */}
            <div className="bg-pink-50/50 rounded-[20px] p-3 border border-pink-100/30">
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex-1">
                  <p className="text-[16px] font-black text-gray-700 leading-tight">{selectedRes.course_info || 'コース未設定'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[22px] font-black text-pink-500 leading-none">¥{Number(selectedRes.total_price || 0).toLocaleString()}</p>
                  {selectedRes.discount && (
                    <p className="text-[11px] font-bold text-rose-400 mt-1">{selectedRes.discount}</p>
                  )}
                </div>
              </div>

              {/* オプション：行間を詰める */}
              {(selectedRes.options || selectedRes.options_memo) && (
                <div className="pt-2 border-t border-pink-100/30">
                  <div className="flex flex-wrap gap-1">
                     {Array.isArray(selectedRes.options) ? selectedRes.options.map((opt: string, i: number) => (
                       <span key={i} className="px-2 py-0.5 bg-white text-pink-500 text-[11px] font-black rounded-md border border-pink-100">{opt}</span>
                     )) : selectedRes.options && (
                       <span className="px-2 py-0.5 bg-white text-pink-500 text-[11px] font-black rounded-md border border-pink-100">{selectedRes.options}</span>
                     )}
                  </div>
                  {selectedRes.options_memo && (
                    <p className="mt-1 text-[12px] font-bold text-gray-500 leading-snug">{selectedRes.options_memo}</p>
                  )}
                </div>
              )}
            </div>

            {selectedRes.customer_memo && (
              <div className="px-1 py-1">
                <p className="text-[13px] font-bold text-gray-400 italic leading-tight">「{selectedRes.customer_memo}」</p>
              </div>
            )}
          </div>

          {/* ブロック2: 顧客情報（高さを抑えつつ文字サイズを維持） */}
          <div className="p-3 bg-white border border-gray-100 rounded-[20px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gray-100"></div>
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-black text-gray-800 leading-none">{selectedRes.customer_name || '不明'} 様</span>
              <span className={`px-2 py-0.5 rounded-md text-[12px] font-black ${customerInfo.count === 1 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {customerInfo.count === 1 ? '初' : `${customerInfo.count}回目`}
              </span>
            </div>
            {customerInfo.lastDate && (
              <p className="text-[11px] font-bold text-gray-400 mt-1">⌛ 前回: {String(customerInfo.lastDate).replace(/-/g, '/')}</p>
            )}
          </div>

          {/* ブロック3: キャストメモ */}
          <div className="bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
            {isEditingMemo ? (
              <div className="p-3 space-y-2">
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  className="w-full h-24 p-3 bg-white rounded-xl text-[16px] font-bold focus:outline-none border-none shadow-inner"
                  autoFocus
                  placeholder="メモを入力..."
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-3 bg-white text-gray-400 rounded-xl font-black text-[14px] border border-gray-100">閉じる</button>
                  <button onClick={handleSave} className="flex-[2] py-3 bg-pink-500 text-white rounded-xl font-black text-[15px] shadow-lg">💾 保存</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-4 flex flex-col items-center justify-center gap-1 text-pink-400 font-black">
                <div className="flex items-center gap-2 text-[14px] italic">
                  📝 <span>【 キャストメモを書く 】</span>
                </div>
              </button>
            )}
          </div>

          {/* 削除ボタン周りの余白を調整 */}
          <div className="pt-1">
            <button onClick={() => onDelete?.()} className="w-full py-2 text-gray-300 font-bold text-[12px] active:text-rose-400">
              {isDeleting ? '削除中...' : '🗑️ この予約を取り消す'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}