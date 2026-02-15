'use client';

import React, { useMemo, useEffect } from 'react';
import { 
  X, Calculator, Trash2, Edit3, Save, Loader2, StickyNote, 
  History, Star, CreditCard, Layers, MessageSquare, AlertTriangle 
} from 'lucide-react';

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, onSaveMemo, getBadgeStyle, allPastReservations = [] 
}: any) {
  if (!selectedRes) return null;

  // 顧客の過去履歴と最新メモの計算
  const customerInfo = useMemo(() => {
    if (!selectedRes.customer_no) return { count: 1, lastDate: null, latestMemo: "" };
    const history = [...allPastReservations]
      .filter((r: any) => r.customer_no === selectedRes.customer_no)
      .sort((a: any, b: any) => (b.reservation_date || "").localeCompare(a.reservation_date || ""));
    
    const count = history.length;
    const lastMet = history.find((r: any) => r.id !== selectedRes.id);
    const latestMemo = history.find((r: any) => r.cast_memo && r.cast_memo.trim() !== "")?.cast_memo || "";
    
    return { count, lastDate: lastMet ? lastMet.reservation_date : null, latestMemo };
  }, [selectedRes, allPastReservations]);

  // 編集モードに入った時、既存メモがなければ過去のメモをドラフトに入れる
  useEffect(() => {
    if (isEditingMemo && !memoDraft && customerInfo.latestMemo && !selectedRes.cast_memo) {
      setMemoDraft(customerInfo.latestMemo);
    } else if (isEditingMemo && !memoDraft && selectedRes.cast_memo) {
      setMemoDraft(selectedRes.cast_memo);
    }
  }, [isEditingMemo, memoDraft, customerInfo.latestMemo, selectedRes.cast_memo, setMemoDraft]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* モーダル本体 */}
      <div className="relative w-full max-w-md bg-gray-50 rounded-[32px] overflow-hidden shadow-2xl">
        
        {/* ヘッダー部分 */}
        <div className="bg-white p-6 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-400 text-[12px] font-black tracking-widest">RESERVATION</span>
                {/* 📍 重複・最新バッジの表示 */}
                {selectedRes.isDuplicate && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 ${
                    selectedRes.isLatest ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <AlertTriangle size={10} />
                    {selectedRes.isLatest ? '最新の修正' : '古い内容'}
                  </span>
                )}
              </div>
              <h2 className="text-[28px] font-black text-gray-800 leading-none">
                {selectedRes.start_time?.substring(0, 5)}
                <span className="text-[16px] mx-1 text-gray-300">~</span>
                {selectedRes.end_time?.substring(0, 5)}
              </h2>
              <p className="text-gray-400 text-[13px] font-bold mt-1">
                {selectedRes.reservation_date.replace(/-/g, '/')}
              </p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2">
            <span className={`px-4 py-1.5 rounded-xl text-[12px] font-black ${getBadgeStyle(selectedRes.service_type)}`}>
              {selectedRes.service_type === 'か' ? 'かw' : '添い寝'}
            </span>
            <span className={`px-4 py-1.5 rounded-xl text-[12px] font-black ${getBadgeStyle(selectedRes.nomination_category)}`}>
              {selectedRes.nomination_category}
            </span>
          </div>
        </div>

        {/* 📍 重複警告メッセージ */}
        {selectedRes.isDuplicate && !selectedRes.isLatest && (
          <div className="mx-4 mt-2 p-3 bg-gray-200/50 rounded-2xl flex items-center gap-3 text-gray-500 text-[11px] font-black">
            <History size={16} className="shrink-0" />
            <p>この予約には新しい修正版メールが届いています。<br/>内容が古い可能性があるため、確認してください。</p>
          </div>
        )}

        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {/* メイン情報カード */}
          <div className="bg-white rounded-[24px] p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="flex items-center gap-1.5 text-pink-400 mb-1">
                  <Star size={14} fill="currentColor" />
                  <span className="text-[10px] font-black tracking-wider uppercase">Customer</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[22px] font-black text-gray-800">{selectedRes.customer_name}</span>
                  <span className="text-[12px] font-bold text-gray-400">様</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-gray-300 mb-1 tracking-wider uppercase">Visit Count</div>
                <div className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  <span className="text-[14px] font-black text-gray-700">{customerInfo.count}</span>
                  <span className="text-[10px] font-bold text-gray-400">回目</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
              <div>
                <div className="text-[10px] font-black text-gray-300 mb-1 uppercase tracking-wider">Course</div>
                <div className="flex items-center gap-1.5 text-gray-700 font-black">
                  <Layers size={14} className="text-gray-400" />
                  <span className="text-[15px]">{selectedRes.course_info}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-300 mb-1 uppercase tracking-wider">Price</div>
                <div className="flex items-center gap-1.5 text-gray-700 font-black">
                  <CreditCard size={14} className="text-gray-400" />
                  <span className="text-[15px]">{selectedRes.total_price?.toLocaleString()}円</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-50 space-y-2">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold text-gray-400">ホテル</span>
                <span className="text-[12px] font-black text-gray-600">{selectedRes.hotel_name || '未設定'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold text-gray-400">スタッフ</span>
                <span className="text-[12px] font-black text-gray-600">{selectedRes.staff_name || '-'}</span>
              </div>
              {selectedRes.memo && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <MessageSquare size={12} />
                    <span className="text-[10px] font-black">店舗からの連絡事項</span>
                  </div>
                  <p className="text-[12px] text-gray-600 font-bold whitespace-pre-wrap">{selectedRes.memo}</p>
                </div>
              )}
            </div>
          </div>

          {/* キャストメモセクション */}
          <div className="bg-white rounded-[24px] shadow-sm overflow-hidden border-2 border-transparent focus-within:border-pink-200 transition-all">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-pink-400 mb-2">
                  <Edit3 size={16} />
                  <span className="text-[12px] font-black tracking-widest uppercase">Edit Memo</span>
                </div>
                <textarea
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  placeholder="お客様の特徴や会話内容をメモ..."
                  className="w-full h-32 p-4 bg-gray-50 rounded-2xl text-[14px] font-bold text-gray-700 focus:outline-none focus:bg-pink-50/30 transition-all border-none"
                  autoFocus
                />
                <button
                  onClick={onSaveMemo}
                  disabled={isDeleting}
                  className="w-full py-4 bg-pink-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[15px] shadow-lg shadow-pink-200"
                >
                  <Save size={18} /> 保存して閉じる
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditingMemo(true)} 
                className="w-full py-5 flex flex-col items-center justify-center gap-1.5 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-2 text-pink-400">
                  <StickyNote size={18} />
                  <span className="text-[14px] font-black tracking-[0.2em]">【 キャストメモ 】</span>
                </div>
                {/* メモがある場合のドット表示 */}
                {(selectedRes.cast_memo || customerInfo.latestMemo) && (
                  <div className="flex gap-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse" />
                  </div>
                )}
              </button>
            )}
          </div>

          <div className="space-y-2 pt-2 pb-4">
            {/* OP計算君ボタン */}
            <button 
              onClick={() => alert("OP計算君起動")} 
              className="w-full h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-blue-100"
            >
              <Calculator size={20} /> OP計算君
            </button>
            
            {/* 📍 予約取り消し（削除）ボタン */}
            <button 
              onClick={onDelete} 
              disabled={isDeleting} 
              className="w-full h-10 rounded-xl text-gray-300 hover:text-red-400 flex items-center justify-center gap-1 font-bold text-[12px] transition-colors"
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Trash2 size={14} /> 
                  <span>この予約データを削除する</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}