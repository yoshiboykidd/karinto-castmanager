'use client';

import React, { useState, useMemo, useEffect } from 'react';
import OpCalculator from './OpCalculator';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = []
}: any) {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isOpOpen, setIsOpOpen] = useState(false);
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    if (selectedRes?.status === 'playing') {
      setIsInCall(true);
    } else {
      setIsInCall(false);
    }
  }, [selectedRes?.status]);

  const displayAmount = useMemo(() => {
    const actual = Number(selectedRes?.actual_total_price || 0);
    const initial = Number(selectedRes?.total_price || 0);
    return actual > 0 ? actual : initial;
  }, [selectedRes?.actual_total_price, selectedRes?.total_price]);

  const handleToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const customerContext = useMemo(() => {
    if (!selectedRes) return { count: 1, lastDate: null, lastMemo: "" };
    try {
      const history = Array.isArray(allPastReservations) ? allPastReservations : [];
      const cNo = selectedRes.customer_no;
      if (!cNo) return { count: 1, lastDate: null, lastMemo: "" };
      const myHistory = history
        .filter(r => r && r.customer_no === cNo && r.id !== selectedRes.id)
        .sort((a, b) => String(b.reservation_date || "").localeCompare(String(a.reservation_date || "")));
      const recordWithMemo = myHistory.find(r => r.cast_mem && r.cast_mem.trim() !== "");
      return { 
        count: history.filter(r => r.customer_no === cNo).length || 1, 
        lastDate: myHistory[0]?.reservation_date || null, 
        lastMemo: recordWithMemo?.cast_mem || "" 
      };
    } catch (e) { return { count: 1, lastDate: null, lastMemo: "" }; }
  }, [selectedRes, allPastReservations]);

  if (!selectedRes) return null;

  const handleEditMemoStart = () => {
    // 💡 ロジック修正：既存メモがあればそれを、なければ過去メモをセット
    const initialMemo = (selectedRes.cast_mem && selectedRes.cast_mem.trim() !== "") 
      ? selectedRes.cast_mem 
      : customerContext.lastMemo;
    setMemoDraft(initialMemo);
    setIsEditingMemo(true);
  };

  const handleSave = async () => {
    if (typeof onSaveMemo !== 'function') return;
    try {
      await onSaveMemo();
      handleToast("メモを保存しました");
      if (typeof setIsEditingMemo === 'function') setIsEditingMemo(false);
    } catch (e) { 
      alert("保存に失敗しました"); 
    }
  };

  const badgeBaseClass = "px-2 py-0.5 rounded text-[11px] font-black leading-none flex items-center justify-center";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-0">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-0" onClick={() => onClose?.()} />
      
      {isOpOpen && (
        <OpCalculator 
          selectedRes={selectedRes} 
          initialTotal={Number(selectedRes.total_price || 0)} 
          onToast={handleToast}
          onClose={() => setIsOpOpen(false)}
          isInCall={isInCall}
          setIsInCall={setIsInCall}
        />
      )}

      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100000] bg-pink-600 text-white px-8 py-5 rounded-[24px] shadow-2xl font-black text-center border-2 border-pink-400 animate-bounce">
          <div className="text-[17px]">✅ {toastMsg}</div>
        </div>
      )}

      {!isOpOpen && (
        <div className="relative z-10 w-full max-w-sm bg-white rounded-[24px] flex flex-col max-h-[98vh] overflow-hidden text-gray-800 shadow-2xl mx-1">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center shrink-0">
            <p className="text-[18px] font-black">{String(selectedRes.reservation_date || "").replace(/-/g, '/')}</p>
            <button onClick={() => onClose?.()} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 text-xl font-bold">×</button>
          </div>

          <div className="overflow-y-auto px-2 pt-2 pb-12 space-y-1.5 flex-1 overscroll-contain">
            <button onClick={() => setIsOpOpen(true)} className="w-full bg-gray-900 rounded-[20px] p-4 text-left shadow-lg active:scale-[0.98] transition-all relative overflow-hidden group">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">To Receive</p>
                  <p className="text-[24px] font-black text-green-400 leading-none tabular-nums">¥{displayAmount.toLocaleString()} <span className="text-[11px] text-white/40 ml-1 font-bold">~</span></p>
                </div>
                <div className="bg-white/10 px-3 py-2 rounded-xl text-[12px] font-black text-white">
                  {isInCall ? '追加変更・終了 ⚡' : 'OP計算・開始 🚀'}
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
                  {String(selectedRes.start_time || "").substring(0, 5)}〜{String(selectedRes.end_time || "").substring(0, 5)}
                </div>
              </div>
              <p className="text-[15px] font-black text-gray-700 leading-tight mb-1">{selectedRes.course_info || 'コース未設定'}</p>
            </div>

            <div className="p-3 bg-white border border-gray-100 rounded-[18px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-100"></div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-black text-gray-800">{selectedRes.customer_name || '不明'} 様</span>
                <span className={`${badgeBaseClass} ${customerContext.count === 1 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{customerContext.count === 1 ? '初' : `${customerContext.count}回目`}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-[18px] border-2 border-dashed border-gray-200 overflow-hidden">
              {isEditingMemo ? (
                <div className="p-2 space-y-1.5">
                  {/* 💡 ロジック修正：style={{ fontSize: '16px' }} を追加してズームを強制停止 */}
                  <textarea 
                    value={memoDraft || ""} 
                    onChange={(e) => setMemoDraft?.(e.target.value)} 
                    className="w-full min-h-[120px] p-3 bg-white rounded-xl text-[15px] font-bold focus:outline-none resize-none" 
                    placeholder="メモを入力..." 
                    autoFocus 
                    style={{ fontSize: '16px' }}
                  />
                  <div className="flex gap-1">
                    <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-3 bg-white text-gray-400 rounded-xl font-black text-[13px] border">閉じる</button>
                    <button onClick={handleSave} className="flex-[2] py-3 bg-pink-500 text-white rounded-xl font-black text-[14px]">💾 保存</button>
                  </div>
                </div>
              ) : (
                <button onClick={handleEditMemoStart} className="w-full p-4 text-left group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-black text-pink-400 italic">Cast Memo</span>
                    <span className="text-[10px] text-gray-300 font-bold">編集 ✎</span>
                  </div>
                  <div className="text-[13px] font-bold text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                    {/* 💡 ロジック修正：評価順序を確実に */}
                    {selectedRes.cast_mem && selectedRes.cast_mem.trim() !== "" 
                      ? selectedRes.cast_mem 
                      : (customerContext.lastMemo ? `(引き継ぎ)\n${customerContext.lastMemo}` : "タップして入力...")}
                  </div>
                </button>
              )}
            </div>

            <button onClick={() => onDelete?.()} className="w-full py-2 text-gray-300 font-bold text-[10px]">
              {isDeleting ? '削除中...' : '🗑️ 予約を取り消す'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}