'use client';

import React, { useState, useMemo } from 'react';
import OpCalculator from './OpCalculator';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = [], supabase 
}: any) {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isOpOpen, setIsOpOpen] = useState(false);
  const [isInCall, setIsInCall] = useState(false);

  const handleToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // 📍 顧客情報と過去の最新メモを特定する
  const customerContext = useMemo(() => {
    if (!selectedRes) return { count: 1, lastDate: null, lastMemo: "" };
    try {
      const history = Array.isArray(allPastReservations) ? allPastReservations : [];
      const cNo = selectedRes.customer_no;
      if (!cNo) return { count: 1, lastDate: null, lastMemo: "" };

      // このお客さまの全履歴を日付順（新しい順）にソート
      const myHistory = history
        .filter(r => r && r.customer_no === cNo && r.id !== selectedRes.id)
        .sort((a, b) => String(b.reservation_date || "").localeCompare(String(a.reservation_date || "")));

      // 過去の予約の中で、メモが空でない最新のものを探す
      const recordWithMemo = myHistory.find(r => r.cast_mem && r.cast_mem.trim() !== "");

      return { 
        count: (history.filter(r => r.customer_no === cNo).length) || 1, 
        lastDate: myHistory[0]?.reservation_date || null,
        lastMemo: recordWithMemo?.cast_mem || "" 
      };
    } catch (e) { return { count: 1, lastDate: null, lastMemo: "" }; }
  }, [selectedRes, allPastReservations]);

  if (!selectedRes) return null;

  // 📍 メモ編集を開始する時の処理（引き継ぎロジック）
  const handleEditMemoStart = () => {
    // 1. 今回のメモが既に書いてあればそれを使う
    if (selectedRes.cast_mem && selectedRes.cast_mem.trim() !== "") {
      setMemoDraft(selectedRes.cast_mem);
    } 
    // 2. 今回が空なら、過去の最新メモを引き継ぐ
    else {
      setMemoDraft(customerContext.lastMemo);
    }
    setIsEditingMemo(true);
  };

  const handleSave = async () => {
    if (typeof onSaveMemo !== 'function') return;
    try {
      await onSaveMemo();
      handleToast("メモを保存しました");
      setTimeout(() => { if (typeof setIsEditingMemo === 'function') setIsEditingMemo(false); }, 1500);
    } catch (e) { alert("保存エラー"); }
  };

  const badgeBaseClass = "px-2 py-0.5 rounded text-[11px] font-black leading-none flex items-center justify-center";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-1">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => onClose?.()} />
      
      {isOpOpen && (
        <OpCalculator 
          selectedRes={selectedRes} 
          initialTotal={Number(selectedRes.total_price || 0)} 
          supabase={supabase} 
          onToast={handleToast}
          onClose={() => setIsOpOpen(false)}
          isInCall={isInCall}
          setIsInCall={setIsInCall}
        />
      )}

      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[250] bg-pink-600 text-white px-8 py-5 rounded-[24px] shadow-2xl font-black text-center border-2 border-pink-400 whitespace-nowrap flex flex-col items-center gap-1 animate-bounce">
          <div className="text-[17px]">✅ {toastMsg}</div>
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[24px] flex flex-col max-h-[98vh] overflow-hidden text-gray-800 shadow-2xl">
        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center shrink-0">
          <p className="text-[18px] font-black">{String(selectedRes.reservation_date || "").replace(/-/g, '/')}</p>
          <button onClick={() => onClose?.()} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 text-xl font-bold">×</button>
        </div>

        <div className="overflow-y-auto px-2 pt-2 pb-12 space-y-1.5 flex-1 overscroll-contain">
          
          <button onClick={() => setIsOpOpen(true)} className="w-full bg-gray-900 rounded-[20px] p-4 text-left shadow-lg active:scale-[0.98] transition-all relative overflow-hidden group">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">To Receive</p>
                <p className="text-[24px] font-black text-green-400 leading-none tabular-nums">¥{Number(selectedRes.total_price || 0).toLocaleString()} <span className="text-[11px] text-white/40 ml-1 font-bold">~</span></p>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl text-[12px] font-black text-white">
                {isInCall ? '追加OP通知 ⚡' : 'OP計算・開始 🚀'}
              </div>
            </div>
          </button>

          <div className="bg-pink-50/40 rounded-[18px] p-2.5 border border-pink-100/30">
            <div className="flex justify-between items-center mb-1.5 px-0.5">
              <div className="flex gap-1">
                <span className={`${badgeBaseClass} ${getBadgeStyle?.(selectedRes.service_type) || 'bg-pink-500 text-white'}`}>{selectedRes.service_type || 'か'}</span>
                {selectedRes.nomination_category && <span className={`${badgeBaseClass} ${getBadgeStyle?.(selectedRes.nomination_category) || 'bg-gray-100 text-gray-400'}`}>{selectedRes.nomination_category}</span>}
              </div>
              <div className="text-[20px] font-black text-gray-700 leading-none tabular-nums">
                {String(selectedRes.start_time || "").substring(0, 5)}<span className="text-[12px] opacity-20 mx-0.5">〜</span>{String(selectedRes.end_time || "").substring(0, 5)}
              </div>
            </div>
            <p className="text-[15px] font-black text-gray-700 leading-tight mb-1">{selectedRes.course_info || 'コース未設定'}</p>
          </div>

          <div className="p-3 bg-white border border-gray-100 rounded-[18px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-100"></div>
            <div className="flex items-center gap-2 leading-none">
              <span className="text-[20px] font-black text-gray-800 leading-none">{selectedRes.customer_name || '不明'} 様</span>
              <span className={`${badgeBaseClass} ${customerContext.count === 1 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{customerContext.count === 1 ? '初' : `${customerContext.count}回目`}</span>
            </div>
            {customerContext.lastDate && <p className="text-[11px] font-bold text-gray-400 mt-2 leading-none">⌛ 前回: {String(customerContext.lastDate).replace(/-/g, '/')}</p>}
          </div>

          {/* 📍 キャストメモ（表示・入力エリア） */}
          <div className="bg-gray-50 rounded-[18px] border-2 border-dashed border-gray-200 overflow-hidden">
            {isEditingMemo ? (
              <div className="p-2 space-y-1.5">
                <textarea 
                  value={memoDraft || ""} 
                  onChange={(e) => setMemoDraft?.(e.target.value)} 
                  className="w-full min-h-[120px] p-3 bg-white rounded-xl text-[15px] font-bold focus:outline-none resize-none border-none shadow-inner leading-relaxed" 
                  placeholder="過去のメモを引き継いでいます。新しく気づいたことなどを追記してください..."
                  autoFocus 
                />
                <div className="flex gap-1">
                  <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-3 bg-white text-gray-400 rounded-xl font-black text-[13px] border border-gray-100">閉じる</button>
                  <button onClick={handleSave} className="flex-[2] py-3 bg-pink-500 text-white rounded-xl font-black text-[14px]">💾 メモを上書き保存</button>
                </div>
              </div>
            ) : (
              <button onClick={handleEditMemoStart} className="w-full p-4 text-left group active:bg-pink-50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black text-pink-400 uppercase tracking-widest italic">Cast Memo</span>
                  <span className="text-[10px] text-gray-300 font-bold group-hover:text-pink-300 transition-colors">編集する ✎</span>
                </div>
                <div className="text-[13px] font-bold text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                  {selectedRes.cast_mem && selectedRes.cast_mem.trim() !== "" 
                    ? selectedRes.cast_mem 
                    : (customerContext.lastMemo ? `(前回からの引き継ぎ)\n${customerContext.lastMemo}` : "タップしてメモを入力...")}
                </div>
              </button>
            )}
          </div>

          <button onClick={() => onDelete?.()} className="w-full py-2 text-gray-300 font-bold text-[10px]">
            {isDeleting ? '削除中...' : '🗑️ 予約を取り消す'}
          </button>
        </div>
      </div>
    </div>
  );
}