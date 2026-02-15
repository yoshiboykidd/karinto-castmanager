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

  const customerInfo = useMemo(() => {
    if (!selectedRes.customer_no) return { count: 1, lastDate: null, latestMemo: "" };
    const history = [...allPastReservations]
      .filter((r: any) => r.customer_no === selectedRes.customer_no)
      .sort((a: any, b: any) => (b.reservation_date || "").localeCompare(a.reservation_date || ""));
    const count = history.length;
    const lastMet = history.find((r: any) => r.id !== selectedRes.id && r.reservation_date <= selectedRes.reservation_date);
    const latestMemo = history.find((r: any) => r.cast_memo && r.cast_memo.trim() !== "")?.cast_memo || "";
    return { count, lastDate: lastMet ? lastMet.reservation_date : null, latestMemo };
  }, [selectedRes, allPastReservations]);

  useEffect(() => {
    if (isEditingMemo && !memoDraft) {
      setMemoDraft(selectedRes.cast_memo || customerInfo.latestMemo || "");
    }
  }, [isEditingMemo, memoDraft, customerInfo.latestMemo, selectedRes.cast_memo, setMemoDraft]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* 背景：タップで閉じる */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* モーダル本体：スマホのキーボード対応で高さを柔軟に */}
      <div className="relative w-full max-w-md bg-gray-50 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[94vh] transition-all overflow-hidden">
        
        {/* 固定ヘッダー：×ボタンが絶対に逃げないように分離 */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-800 text-[15px] font-black">{selectedRes.reservation_date.replace(/-/g, '/')}</span>
            <span className="text-gray-400 text-[10px] font-black tracking-tighter">RESERVATION</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 -mr-2 bg-gray-100 rounded-full text-gray-500 active:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* スクロールエリア */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 overscroll-contain">
          
          {/* 警告バッジ */}
          {selectedRes.isDuplicate && (
            <div className={`p-3 rounded-2xl flex items-start gap-3 border ${
              selectedRes.isLatest ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-gray-200/50 border-gray-200 text-gray-500'
            }`}>
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div className="text-[11px] font-black leading-relaxed">
                <div className="text-[13px] mb-0.5 font-black">{selectedRes.isLatest ? '最新の修正版' : '古い内容'}</div>
                {selectedRes.isLatest ? 'これが最新の予約内容です。' : '新しい修正版が届いています。'}
              </div>
            </div>
          )}

          {/* 基本情報 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg text-[11px] font-black ${getBadgeStyle(selectedRes.service_type)}`}>
              {selectedRes.service_type || 'か'}
            </span>
            <span className={`px-3 py-1 rounded-lg text-[11px] font-black ${getBadgeStyle(selectedRes.nomination_category)}`}>
              {selectedRes.nomination_category || 'FREE'}
            </span>
            <div className="ml-auto text-[22px] font-black text-gray-800 tracking-tighter">
              {selectedRes.start_time?.substring(0, 5)}
              <span className="mx-1 text-gray-300">～</span>
              {selectedRes.end_time?.substring(0, 5)}
            </div>
          </div>

          {/* コース・ホテル等 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-black text-gray-300 uppercase mb-0.5">【コース】</div>
                <div className="font-black text-[15px] text-gray-700">{selectedRes.course_info}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-300 uppercase mb-0.5">【料金】</div>
                <div className="font-black text-[15px] text-gray-700">{selectedRes.total_price?.toLocaleString()}円</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
              <div>
                <div className="text-[10px] font-black text-gray-300 uppercase mb-0.5">【ホテル】</div>
                <div className="font-black text-[13px] text-gray-600 truncate">{selectedRes.hotel_name || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-300 uppercase mb-0.5">【スタッフ】</div>
                <div className="font-black text-[13px] text-gray-600">{selectedRes.staff_name || '-'}</div>
              </div>
            </div>
            {selectedRes.memo && (
              <div className="pt-2 border-t border-gray-50">
                <div className="text-[10px] font-black text-gray-300 uppercase mb-1">【メモ】</div>
                <div className="p-3 bg-gray-50 rounded-xl text-[12px] text-gray-600 font-bold whitespace-pre-wrap leading-relaxed">
                  {selectedRes.memo}
                </div>
              </div>
            )}
          </div>

          {/* 顧客情報 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-pink-400 mb-3">
              <Star size={14} fill="currentColor" />
              <span className="text-[11px] font-black tracking-widest uppercase">Customer</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-[18px] font-black text-gray-800">【{selectedRes.customer_name} 様】</span>
              <span className="text-[13px] font-black text-gray-400">〈{customerInfo.count}回目〉</span>
            </div>
            {customerInfo.count > 1 && customerInfo.lastDate && (
              <div className="mt-2 flex items-center gap-1.5 text-gray-400 text-[11px] font-bold bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                <History size={12} />
                前回：{customerInfo.lastDate.replace(/-/g, '/')}
              </div>
            )}
          </div>

          {/* キャストメモ：ズーム防止のためfont-sizeを16px以上に設定 */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-transparent focus-within:border-pink-200 transition-all overflow-hidden">
            {isEditingMemo ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-pink-500">
                  <Edit3 size={16} />
                  <span className="text-[12px] font-black uppercase">Cast Memo</span>
                </div>
                <textarea
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  placeholder="メモを入力..."
                  className="w-full h-32 p-4 bg-gray-50 rounded-xl text-[16px] font-bold text-gray-700 focus:outline-none appearance-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditingMemo(false)} 
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-xl font-black text-[15px]"
                  >
                    キャンセル
                  </button>
                  <button 
                    onClick={onSaveMemo} 
                    className="flex-[2] py-4 bg-pink-500 text-white rounded-xl flex items-center justify-center gap-2 font-black text-[15px] shadow-lg shadow-pink-100"
                  >
                    <Save size={18} /> 保存する
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditingMemo(true)} className="w-full py-6 flex flex-col items-center justify-center gap-2 text-pink-400 active:bg-pink-50 transition-all">
                <div className="flex items-center gap-2">
                  <StickyNote size={18} />
                  <span className="text-[14px] font-black tracking-widest italic">【 キャストメモを書く 】</span>
                </div>
                {(selectedRes.cast_memo || customerInfo.latestMemo) && (
                  <div className="text-[10px] text-pink-300 font-bold">内容が保存されています</div>
                )}
              </button>
            )}
          </div>

          {/* 下部ボタン：さらに押しやすく、被り防止の余白 */}
          <div className="pt-4 pb-32 space-y-4">
            <button onClick={() => alert("OP計算君起動")} className="w-full h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-3 font-black text-[18px] shadow-lg shadow-blue-100 active:scale-95 transition-transform">
              <Calculator size={24} /> OP計算君
            </button>
            
            <button onClick={onDelete} disabled={isDeleting} className="w-full h-12 rounded-xl text-gray-300 flex items-center justify-center gap-2 font-bold text-[13px] active:text-red-400 transition-colors">
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /><span>予約データを削除</span></>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}