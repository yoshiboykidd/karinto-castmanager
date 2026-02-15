'use client';

import React, { useState, useMemo } from 'react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = [] 
}: any) {
  // 1. フックをすべて先に宣言
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
      
      // count が 1 なら初回、それ以上ならリピーター
      return { count: myHistory.length || 1, lastDate: lastMet?.reservation_date || null };
    } catch (e) {
      return { count: 1, lastDate: null };
    }
  }, [selectedRes, allPastReservations]);

  // 2. ガード
  if (!selectedRes) return null;

  // 保存処理
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
      
      {/* トースト通知 */}
      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] bg-pink-600 text-white px-7 py-5 rounded-[24px] shadow-2xl font-black text-center border-2 border-pink-400 whitespace-nowrap animate-bounce flex flex-col items-center gap-1">
          <div className="text-[16px]">✅ 保存されました</div>
          <div className="text-[11px] opacity-90 leading-tight">
            同じお客様の情報は<br />
            1つのメモで更新されてます
          </div>
        </div>
      )}

      <div className="relative w-full max-sm bg-white rounded-[40px] flex flex-col max-h-[92vh] overflow-hidden text-gray-800 shadow-2xl">
        
        {/* ヘッダー：絵文字削除 */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1 tracking-widest">Reservation Details</p>
            <p className="text-[20px] font-black leading-none">
              {String(selectedRes.reservation_date || "").replace(/-/g, '/')}
            </p>
          </div>
          <button onClick={() => onClose?.()} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 font-bold text-2xl">×</button>
        </div>

        {/* コンテンツエリア */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 overscroll-contain">
          
          {/* 📍 ブロック1: 予約情報（仕事の内容） */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className={`px-3 py-1 rounded-lg text-[12px] font-black ${getBadgeStyle?.(selectedRes.service_type) || 'bg-pink-500 text-white'}`}>
                  {selectedRes.service_type || 'か'}
                </span>
                {selectedRes.nomination_category && (
                  <span className={`px-3 py-1 rounded-lg text-[12px] font-black ${getBadgeStyle?.(selectedRes.nomination_category) || 'bg-gray-100 text-gray-400'}`}>
                    {selectedRes.nomination_category}
                  </span>
                )}
              </div>
              <div className="text-[26px] font-black tracking-tighter text-gray-700">
                {String(selectedRes.start_time || "").substring(0, 5)} <span className="text-[14px] opacity-30 mx-1">〜</span> {String(selectedRes.end_time || "").substring(0, 5)}
              </div>
            </div>

            <div className="bg-pink-50/50 rounded-[24px] p-5 space-y-3 border border-pink-100/50">
              <div className="flex justify-between items-start">
                <div className="max-w-[65%]">
                  <p className="text-[10px] font-black text-pink-300 uppercase mb-1">Course</p>
                  <p className="text-[16px] font-black text-gray-700 leading-tight">{selectedRes.course_info || '未設定'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-pink-300 uppercase mb-1">Total</p>
                  <p className="text-[22px] font-black text-pink-500 leading-none">¥{Number(selectedRes.total_price || 0).toLocaleString()}</p>
                  {selectedRes.discount && (
                    <p className="text-[10px] font-bold text-rose-400 mt-1">{selectedRes.discount}</p>
                  )}
                </div>
              </div>

              {(selectedRes.options || selectedRes.options_memo) && (
                <div className="pt-2 border-t border-pink-100/50">
                  <p className="text-[10px] font-black text-pink-300 uppercase mb-1.5">Options</p>
                  <div className="flex flex-wrap gap-1.5">
                     {Array.isArray(selectedRes.options) ? selectedRes.options.map((opt: string, i: number) => (
                       <span key={i} className="px-2.5 py-1 bg-white text-pink-400 text-[11px] font-black rounded-lg border border-pink-100">{opt}</span>
                     )) : selectedRes.options && (
                       <span className="px-2.5 py-1 bg-white text-pink-400 text-[11px] font-black rounded-lg border border-pink-100">{selectedRes.options}</span>
                     )}
                  </div>
                  {selectedRes.options_memo && (
                    <p className="mt-2 text-[12px] font-bold text-gray-500 leading-relaxed">{selectedRes.options_memo}</p>
                  )}
                </div>
              )}
            </div>

            {selectedRes.customer_memo && (
              <div className="px-2">
                <p className="text-[10px] font-black text-gray-300 uppercase mb-1">Request from Shop</p>
                <p className="text-[13px] font-bold text-gray-500 italic leading-relaxed">「{selectedRes.customer_memo}」</p>
              </div>
            )}
          </div>

          {/* 📍 ブロック2: 顧客情報（お相手の情報） */}
          <div className="p-6 bg-white border-2 border-gray-100 rounded-[32px] relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-100"></div>
            <p className="text-[11px] font-black text-gray-400 mb-2 tracking-widest uppercase">Customer info</p>
            <div className="flex items-center gap-3">
              <span className="text-[24px] font-black text-gray-800">{selectedRes.customer_name || '不明'} 様</span>
              {/* 初回バッジロジック */}
              <span className={`px-2.5 py-1 rounded-md text-[13px] font-black ${customerInfo.count === 1 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {customerInfo.count === 1 ? '初' : `${customerInfo.count}回目`}
              </span>
            </div>
            {customerInfo.lastDate && (
              <p className="text-[11px] font-bold text-gray-400 mt-2 flex items-center gap-1">
                <span className="opacity-50 text-[14px]">⌛</span> 前回：{String(customerInfo.lastDate).replace(/-/g, '/')}
              </p>
            )}
          </div>

          {/* ブロック3: キャストメモ（自分の記録） */}
          <div className="bg-gray-50 rounded-[32px] overflow-hidden border-2 border-dashed border-gray-200">
            {isEditingMemo ? (
              <div className="p-5 space-y-4">
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft?.(e.target.value)}
                  className="w-full h-32 p-4 bg-white rounded-2xl text-[16px] font-bold focus:outline-none border-none shadow-inner resize-none"
                  autoFocus
                  placeholder="次回来店時に役立つ情報をメモ..."
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-4 bg-white text-gray-400 rounded-xl font-black text-[14px] border border-gray-200">閉じる</button>
                  <button onClick={handleSave} className="flex-[2] py-4 bg-pink-500 text-white rounded-xl font-black text-[15px] shadow-lg active:scale-95 transition-transform">💾 メモを保存</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo?.(true)} className="w-full py-8 flex flex-col items-center justify-center gap-1 text-pink-400 font-black hover:bg-pink-50/30 transition-colors">
                <span className="text-[11px] opacity-40 tracking-widest uppercase mb-1">Your Private Note</span>
                <div className="flex items-center gap-2 italic">
                  📝 <span>【 キャストメモを書く 】</span>
                </div>
              </button>
            )}
          </div>

          <button onClick={() => onDelete?.()} className="w-full py-4 text-gray-300 font-bold text-[12px] hover:text-rose-400 transition-colors">
            {isDeleting ? '削除中...' : '🗑️ この予約を取り消す'}
          </button>
        </div>
      </div>
    </div>
  );
}