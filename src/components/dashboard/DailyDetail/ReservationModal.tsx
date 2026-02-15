'use client';

import React, { useMemo, useEffect, useState } from 'react';
// CheckCircle2をCheckCircleに変更（古いバージョンでも動くように）
import { 
  X, Calculator, Trash2, Edit3, Save, Loader2, StickyNote, 
  History, Star, CreditCard, Layers, MessageSquare, AlertTriangle, CheckCircle 
} from 'lucide-react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = [] 
}: any) {
  const [showToast, setShowToast] = useState(false);

  // ガード：データがない場合は即座に終了（クラッシュ防止）
  if (!selectedRes) return null;

  // 過去履歴の計算（ historyDataが配列でない場合も想定してガード）
  const customerInfo = useMemo(() => {
    const historyData = Array.isArray(allPastReservations) ? allPastReservations : [];
    const customerNo = selectedRes?.customer_no;

    if (!customerNo) return { count: 1, lastDate: null, latestMemo: "" };

    const history = historyData
      .filter((r: any) => r && r.customer_no === customerNo)
      .sort((a: any, b: any) => (String(b?.reservation_date || "")).localeCompare(String(a?.reservation_date || "")));
    
    const count = history.length;
    const lastMet = history.find((r: any) => r && r.id !== selectedRes.id && r.reservation_date <= selectedRes.reservation_date);
    const latestMemo = history.find((r: any) => r?.cast_memo && String(r.cast_memo).trim() !== "")?.cast_memo || "";
    
    return { count, lastDate: lastMet?.reservation_date || null, latestMemo };
  }, [selectedRes, allPastReservations]);

  useEffect(() => {
    if (isEditingMemo && !memoDraft && typeof setMemoDraft === 'function') {
      setMemoDraft(selectedRes?.cast_memo || customerInfo.latestMemo || "");
    }
  }, [isEditingMemo, memoDraft, customerInfo.latestMemo, selectedRes, setMemoDraft]);

  // 📍 エラーの火種になりやすい保存処理を徹底ガード
  const handleSave = async () => {
    if (typeof onSaveMemo !== 'function') {
      console.error("onSaveMemo is not a function");
      return;
    }
    try {
      await onSaveMemo();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error("保存中にエラーが発生しました:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* 📍 トースト通知：CheckCircleを使用 */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] transition-all duration-300">
          <div className="bg-pink-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-pink-400">
            <CheckCircle size={18} />
            <span className="text-[13px] font-black whitespace-nowrap">
              保存しました。同じお客様のメモとして残ります
            </span>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-sm bg-gray-50 rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden text-gray-800">
        
        {/* ヘッダー */}
        <div className="bg-white px-5 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-black">
              {(selectedRes.reservation_date || "").replace(/-/g, '/')}
            </span>
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">RESERVATION</span>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 active:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="overflow-y-auto p-3 space-y-2 flex-1 overscroll-contain">
          
          {/* 時間・区分バッジ（コンパクト・文字大） */}
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-[12px] font-black ${typeof getBadgeStyle === 'function' ? getBadgeStyle(selectedRes.service_type) : ''}`}>
              {selectedRes.service_type === 'か' ? 'か' : (selectedRes.service_type || 'か')}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-[12px] font-black ${typeof getBadgeStyle === 'function' ? getBadgeStyle(selectedRes.nomination_category) : ''}`}>
              {selectedRes.nomination_category || 'FREE'}
            </span>
            <div className="ml-auto text-[24px] font-black tracking-tighter leading-none">
              {(selectedRes.start_time || "").substring(0, 5)}
              <span className="mx-0.5 text-gray-300 text-[18px]">～</span>
              {(selectedRes.end_time || "").substring(0, 5)}
            </div>
          </div>

          {/* 予約詳細カード */}
          <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="text-[10px] font-black text-gray-400 mb-0.5 uppercase">【コース】</div>
                <div className="font-black text-[16px] leading-tight truncate">{selectedRes.course_info || '-'}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="text-[10px] font-black text-gray-400 mb-0.5 uppercase">【料金】</div>
                <div className="font-black text-[16px]">{Number(selectedRes.total_price || 0).toLocaleString()}円</div>
              </div>
            </div>
            {selectedRes.memo && (
              <div className="p-1 border-t border-gray-50 mt-1">
                <div className="text-[10px] font-black text-gray-400 mb-0.5">【店舗メモ】</div>
                <p className="text-[12px] text-gray-600 font-bold leading-snug whitespace-pre-wrap">{selectedRes.memo}</p>
              </div>
            )}
          </div>

          {/* 顧客情報カード */}
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-pink-400">
            <div className="flex items-center gap-1.5 text-pink-400 mb-1">
              <Star size={12} fill="currentColor" />
              <span className="text-[10px] font-black tracking-widest uppercase">Customer</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1 flex-wrap">
              <span className="text-[22px] font-black">【{selectedRes.customer_name || '不明'} 様】</span>
              <span className="text-[15px] font-black text-gray-400">〈{customerInfo.count}回目〉</span>
            </div>
            {customerInfo.count > 1 && customerInfo.lastDate && (
              <div className="inline-flex items-center gap-1 text-gray-400 text-[11px] font-bold bg-gray-50 px-2 py-0.5 rounded-md mt-1">
                <History size={10} />
                前回：{(customerInfo.lastDate || "").replace(/-/g, '/')}
              </div>
            )}
          </div>

          {/* キャストメモセクション */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-transparent focus-within:border-pink-200 transition-all overflow-hidden">
            {isEditingMemo ? (
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-pink-500 font-black text-[12px]">
                    <Edit3 size={14} /> CAST MEMO
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold">※次回以降も表示されます</span>
                </div>
                <textarea
                  value={memoDraft || ""}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  placeholder="特徴をメモ..."
                  className="w-full h-24 p-3 bg-gray-50 rounded-lg text-[16px] font-bold focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMemo(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-lg font-black text-[14px]">
                    閉じる
                  </button>
                  <button onClick={handleSave} className="flex-[2] py-3 bg-pink-500 text-white rounded-lg flex items-center justify-center gap-2 font-black text-[14px] shadow-lg active:scale-95 transition-all">
                    <Save size={16} /> 保存
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo(true)} className="w-full py-4 flex items-center justify-center gap-2 text-pink-400 active:bg-pink-50 transition-all font-black italic">
                <StickyNote size={18} />
                <span className="text-[14px] tracking-widest">【 キャストメモ 】</span>
                {(selectedRes.cast_memo || customerInfo.latestMemo) && <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />}
              </button>
            )}
          </div>

          {/* フッター・削除ボタンエリア */}
          <div className="pt-2 pb-32 space-y-3">
            <button onClick={() => alert("OP計算君起動")} className="w-full h-14 rounded-xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[18px] shadow-lg active:scale-95 transition-transform">
              <Calculator size={22} /> OP計算君
            </button>
            
            <button onClick={onDelete} disabled={isDeleting} className="w-full h-10 text-gray-300 flex items-center justify-center gap-1 font-bold text-[12px] active:text-red-400">
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /><span>予約データを取り消す</span></>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}