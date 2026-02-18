'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import OpCalculator from './OpCalculator';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ReservationModal({ 
  selectedRes, onClose, onDelete, isDeleting, isEditingMemo, setIsEditingMemo, 
  memoDraft, setMemoDraft, getBadgeStyle, allPastReservations = []
}: any) {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isOpOpen, setIsOpOpen] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // 保存中状態
  
  // 📍 修正：内部ステートで最新データを管理
  const [dbRes, setDbRes] = useState(selectedRes);

  // DBから最新情報を取得する関数（金額とメモの同期用）
  const fetchLatest = async () => {
    if (!selectedRes?.id) return;
    try {
      const { data } = await supabase.from('reservations').select('*').eq('id', selectedRes.id).single();
      if (data) setDbRes(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    setIsInCall(dbRes?.status === 'playing');
  }, [dbRes?.status]);

  // OP計算画面から戻った時に金額を更新
  useEffect(() => {
    if (!isOpOpen) fetchLatest();
  }, [isOpOpen, selectedRes?.id]);

  // 最新データを基に金額を表示
  const displayAmount = useMemo(() => {
    const actual = Number(dbRes?.actual_total_price || 0);
    const initial = Number(dbRes?.total_price || 0);
    return actual > 0 ? actual : initial;
  }, [dbRes?.actual_total_price, dbRes?.total_price]);

  const handleToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 📍 修正：過去の同じユーザーのメモを検索するロジック
  const customerContext = useMemo(() => {
    if (!dbRes?.customer_no) return { count: 1, lastDate: null, lastMemo: "" };
    try {
      const history = Array.isArray(allPastReservations) ? allPastReservations : [];
      const cNo = dbRes.customer_no;
      const myHistory = history
        .filter(r => r && r.customer_no === cNo && r.id !== dbRes.id)
        .sort((a, b) => String(b.reservation_date || "").localeCompare(String(a.reservation_date || "")));
      // 過去の予約から最新の cast_mem を探す
      const recordWithMemo = myHistory.find(r => r.cast_mem && r.cast_mem.trim() !== "");
      return { 
        count: history.filter(r => r.customer_no === cNo).length || 1, 
        lastDate: myHistory[0]?.reservation_date || null, 
        lastMemo: recordWithMemo?.cast_mem || "" 
      };
    } catch (e) { return { count: 1, lastDate: null, lastMemo: "" }; }
  }, [dbRes?.customer_no, dbRes?.id, allPastReservations]);

  if (!dbRes) return null;

  // メモ編集開始時の処理（引き継ぎロジック）
  const handleEditMemoStart = () => {
    if (dbRes.cast_mem && dbRes.cast_mem.trim() !== "") {
      setMemoDraft(dbRes.cast_mem);
    } else {
      setMemoDraft(customerContext.lastMemo); // 過去メモを引き継ぐ
    }
    setIsEditingMemo(true);
  };

  // 📍 修正：メモの直接保存ロジック（確実に保存するためにここで実行）
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ cast_mem: memoDraft, updated_at: new Date().toISOString() })
        .eq('id', dbRes.id);
      
      if (error) throw error;
      
      handleToast("メモを保存しました");
      await fetchLatest(); // 表示を更新
      setTimeout(() => setIsEditingMemo(false), 500);
    } catch (e) { 
      alert("保存エラーが発生しました"); 
    } finally {
      setIsSaving(false);
    }
  };

  const badgeBaseClass = "px-2 py-0.5 rounded text-[11px] font-black leading-none flex items-center justify-center";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-0">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-0" onClick={() => onClose?.()} />
      
      {isOpOpen && (
        <OpCalculator 
          selectedRes={dbRes} 
          initialTotal={Number(dbRes.total_price || 0)} 
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
            <p className="text-[18px] font-black">{String(dbRes.reservation_date || "").replace(/-/g, '/')}</p>
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
                  <span className={`${badgeBaseClass} ${getBadgeStyle?.(dbRes.service_type) || 'bg-pink-500 text-white'}`}>{dbRes.service_type || 'か'}</span>
                  {dbRes.nomination_category && <span className={`${badgeBaseClass} ${getBadgeStyle?.(dbRes.nomination_category) || 'bg-gray-100 text-gray-400'}`}>{dbRes.nomination_category}</span>}
                </div>
                <div className="text-[20px] font-black text-gray-700 leading-none tabular-nums">
                  {String(dbRes.start_time || "").substring(0, 5)}〜{String(dbRes.end_time || "").substring(0, 5)}
                </div>
              </div>
              <p className="text-[15px] font-black text-gray-700 leading-tight mb-1">{dbRes.course_info || 'コース未設定'}</p>
            </div>

            <div className="p-3 bg-white border border-gray-100 rounded-[18px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-100"></div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-black text-gray-800">{dbRes.customer_name || '不明'} 様</span>
                <span className={`${badgeBaseClass} ${customerContext.count === 1 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{customerContext.count === 1 ? '初' : `${customerContext.count}回目`}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-[18px] border-2 border-dashed border-gray-200 overflow-hidden">
              {isEditingMemo ? (
                <div className="p-2 space-y-1.5">
                  <textarea 
                    value={memoDraft || ""} 
                    onChange={(e) => setMemoDraft?.(e.target.value)} 
                    className="w-full min-h-[120px] p-3 bg-white rounded-xl text-[16px] font-bold focus:outline-none resize-none" 
                    placeholder="メモを入力..." 
                    autoFocus 
                  />
                  <div className="flex gap-1">
                    <button onClick={() => setIsEditingMemo?.(false)} className="flex-1 py-3 bg-white text-gray-400 rounded-xl font-black text-[13px] border">閉じる</button>
                    <button onClick={handleSave} className="flex-[2] py-3 bg-pink-500 text-white rounded-xl font-black text-[14px]">
                      {isSaving ? '...' : '💾 保存'}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={handleEditMemoStart} className="w-full p-4 text-left group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-black text-pink-400 italic">Cast Memo</span>
                    <span className="text-[10px] text-gray-300 font-bold">編集 ✎</span>
                  </div>
                  <div className="text-[13px] font-bold text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                    {dbRes.cast_mem || (customerContext.lastMemo ? `(引き継ぎ)\n${customerContext.lastMemo}` : "タップして入力...")}
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