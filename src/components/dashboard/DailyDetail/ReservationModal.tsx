'use client';

import React, { useState, useMemo, useEffect } from 'react';
import OpCalculator from './OpCalculator';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = []
}: any) {
  const [currentRes, setCurrentRes] = useState(selectedRes);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isOpOpen, setIsOpOpen] = useState(false);
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    setCurrentRes(selectedRes);
  }, [selectedRes]);

  useEffect(() => {
    if (currentRes?.status === 'playing') setIsInCall(true);
    else setIsInCall(false);
  }, [currentRes?.status]);

  const formatTime = (t: any) => {
    const s = String(t || "");
    if (!s || s === "null") return "--:--";
    const match = s.match(/(\d{2}:\d{2})/);
    if (match) return match[1];
    return s.startsWith('20') ? "--:--" : s.substring(0, 5);
  };

  const displayAmount = useMemo(() => {
    const actual = Number(currentRes?.actual_total_price || 0);
    const initial = Number(currentRes?.total_price || 0);
    return actual > 0 ? actual : initial;
  }, [currentRes?.actual_total_price, currentRes?.total_price]);

  // 📍 修正：前回会った日付のロジック（型の違いとカラム名の揺れを吸収）
  const lastVisitDate = useMemo(() => {
    if (!currentRes?.customer_no) return null;
    const history = Array.isArray(allPastReservations) ? allPastReservations : [];
    
    const pastVisits = history
      .filter(r => {
        if (!r || r.id === currentRes?.id) return false;
        
        // 文字列にして比較することで型の不一致（数値 vs 文字列）を防ぐ
        const isSameCustomer = String(r.customer_no) === String(currentRes.customer_no);
        
        // cast_id または login_id のどちらでも一致を確認
        const rCastId = String(r.cast_id || r.login_id || "");
        const curCastId = String(currentRes.cast_id || currentRes.login_id || "");
        const isSameCast = rCastId === curCastId;

        return isSameCustomer && isSameCast && r.status === 'completed';
      })
      .sort((a, b) => String(b.reservation_date || "").localeCompare(String(a.reservation_date || "")));
    
    if (pastVisits.length > 0 && pastVisits[0].reservation_date) {
      return pastVisits[0].reservation_date.replace(/-/g, '/');
    }
    return null;
  }, [currentRes, allPastReservations]);

  // 📍 修正：来店回数の計算ロジック（型の違いとカラム名の揺れを吸収）
  const visitCountForThisCast = useMemo(() => {
    if (!currentRes?.customer_no) return 1;
    const history = Array.isArray(allPastReservations) ? allPastReservations : [];
    
    const count = history.filter(r => {
      if (!r) return false;

      const isSameCustomer = String(r.customer_no) === String(currentRes.customer_no);
      const rCastId = String(r.cast_id || r.login_id || "");
      const curCastId = String(currentRes.cast_id || currentRes.login_id || "");
      const isSameCast = rCastId === curCastId;

      // 完了した過去分、または「今まさに開いている予約」そのもの
      return isSameCustomer && isSameCast && (r.status === 'completed' || r.id === currentRes?.id);
    }).length;

    return count > 0 ? count : 1;
  }, [currentRes, allPastReservations]);

  // 📍 修正：実績(completed)データから最新のキャストメモを抽出
  const lastMemoFromHistory = useMemo(() => {
    if (!currentRes?.customer_no) return "";
    const history = Array.isArray(allPastReservations) ? allPastReservations : [];
    const record = history
      .filter(r => {
        if (!r || r.id === currentRes?.id) return false;
        const isSameCustomer = String(r.customer_no) === String(currentRes.customer_no);
        const rCastId = String(r.cast_id || r.login_id || "");
        const curCastId = String(currentRes.cast_id || currentRes.login_id || "");
        const isSameCast = rCastId === curCastId;
        return isSameCustomer && isSameCast && r.status === 'completed';
      })
      .sort((a, b) => String(b.reservation_date || "").localeCompare(String(a.reservation_date || "")))
      .find(r => r?.cast_memo && String(r.cast_memo).trim() !== "");
    return record?.cast_memo ? String(record.cast_memo).trim() : "";
  }, [currentRes, allPastReservations]);

  const currentCastMemo = useMemo(() => {
    return (currentRes?.cast_memo || "").toString().trim();
  }, [currentRes?.cast_memo]);

  if (!currentRes) return null;

  const handleToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEditMemoStart = () => {
    // 💡 今回のメモが空なら、過去の実績から引き継いだメモを下書きにする
    const initialMemo = currentCastMemo !== "" ? currentCastMemo : lastMemoFromHistory;
    if (typeof setMemoDraft === 'function') setMemoDraft(initialMemo);
    if (typeof setIsEditingMemo === 'function') setIsEditingMemo(true);
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
          selectedRes={currentRes} 
          initialTotal={Number(currentRes.total_price || 0)} 
          onToast={handleToast}
          onClose={() => setIsOpOpen(false)}
          isInCall={isInCall}
          setIsInCall={setIsInCall}
          onUpdate={(updated: any) => setCurrentRes(updated)}
        />
      )}

      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100000] bg-pink-600 text-white px-6 py-5 rounded-[24px] shadow-2xl font-black text-center border-2 border-pink-400 animate-bounce whitespace-pre-line min-w-[280px] max-w-[90%]">
          <div className="text-[16px] leading-relaxed">✅ {toastMsg}</div>
        </div>
      )}

      {!isOpOpen && (
        <div className="relative z-10 w-full max-w-sm bg-white rounded-[24px] flex flex-col max-h-[98vh] overflow-hidden text-gray-800 shadow-2xl mx-1">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center shrink-0">
            <p className="text-[18px] font-black">{String(currentRes?.reservation_date || "").replace(/-/g, '/')}</p>
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
                  <span className={`${badgeBaseClass} ${getBadgeStyle?.(currentRes?.service_type) || 'bg-pink-500 text-white'}`}>{currentRes?.service_type || 'か'}</span>
                  {currentRes?.nomination_category && <span className={`${badgeBaseClass} ${getBadgeStyle?.(currentRes?.nomination_category) || 'bg-gray-100 text-gray-400'}`}>{currentRes?.nomination_category}</span>}
                </div>
                <div className="text-[20px] font-black text-gray-700 leading-none tabular-nums">
                  {formatTime(currentRes?.start_time)}〜{formatTime(currentRes?.end_time)}
                </div>
              </div>
              <p className="text-[15px] font-black text-gray-700 leading-tight mb-1">{currentRes?.course_info || 'コース未設定'}</p>
            </div>

            <div className="p-3 bg-white border border-gray-100 rounded-[18px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-100"></div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[20px] font-black text-gray-800 leading-none">{currentRes?.customer_name || '不明'} 様</span>
                  <div className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl select-all active:bg-gray-100 transition-colors">
                    <span className="text-[11px] font-black text-gray-400 mr-1.5 italic uppercase tracking-tighter">会員No:</span>
                    <span className="text-[18px] font-black text-gray-800 tabular-nums">#{currentRes?.customer_no || '---'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`${badgeBaseClass} ${visitCountForThisCast === 1 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {visitCountForThisCast === 1 ? '初' : `${visitCountForThisCast}回目`}
                  </span>
                  {lastVisitDate && (
                    <span className="text-[10px] font-bold text-gray-400">
                      前回: {lastVisitDate}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1.5 border-t border-gray-50 pt-2">
                  {currentRes?.hotel_name && (
                    <div className="flex items-start gap-1">
                      <span className="text-[11px] font-black text-gray-400 shrink-0 mt-0.5">＜ホテル＞</span>
                      <span className="text-[14px] font-black text-gray-700 break-all">{currentRes.hotel_name}</span>
                    </div>
                  )}
                  {currentRes?.discount && Number(currentRes.discount) > 0 && (
                    <div className="flex items-start gap-1">
                      <span className="text-[11px] font-black text-gray-400 shrink-0 mt-0.5">＜割引＞</span>
                      <span className="text-[14px] font-black text-rose-500 italic">
                        ¥{Number(currentRes.discount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {currentRes?.options && (
                    <div className="flex items-start gap-1">
                      <span className="text-[11px] font-black text-gray-400 shrink-0 mt-0.5">＜ＯＰ＞</span>
                      <div className="flex-1">
                        <span className="text-[11px] font-black text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 inline-block">
                          {currentRes.options}
                        </span>
                      </div>
                    </div>
                  )}
                  {currentRes?.memo && (
                    <div className="flex items-start gap-1">
                      <span className="text-[11px] font-black text-gray-400 shrink-0 mt-0.5">＜メモ＞</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-gray-600 leading-relaxed bg-amber-50/50 p-2 rounded-lg border border-amber-100/50 break-all">
                          {currentRes.memo}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-[18px] border-2 border-dashed border-gray-200 overflow-hidden">
              {isEditingMemo ? (
                <div className="p-2 space-y-1.5">
                  <textarea 
                    value={memoDraft || ""} 
                    onChange={(e) => setMemoDraft?.(e.target.value)} 
                    className="w-full min-h-[160px] p-3 bg-white rounded-xl font-bold focus:outline-none resize-none" 
                    placeholder="メモを入力..." 
                    autoFocus 
                    style={{ fontSize: '16px', lineHeight: '1.5' }}
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
                  <div className="text-[14px] font-black text-gray-400 leading-relaxed italic">
                    タップしてメモを確認・入力
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