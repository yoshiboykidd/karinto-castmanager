'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import OpCalculator from './OpCalculator';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ReservationModal({ selectedRes, onClose, onToast }: any) {
  const [isOpOpen, setIsOpOpen] = useState(false);
  const [memoDraft, setMemoDraft] = useState(selectedRes?.memo || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isInCall, setIsInCall] = useState(selectedRes?.status === 'playing');

  // 📍 修正：最新のDBデータを保持するためのステート
  const [dbRes, setDbRes] = useState(selectedRes);

  // 📍 修正：DBから最新の予約情報を取得する関数
  const fetchLatest = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', selectedRes.id)
        .single();
      
      if (data) {
        setDbRes(data);
        setMemoDraft(data.memo || "");
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // 📍 修正：初回表示時と、OP計算画面が閉じられた時にデータを更新
  useEffect(() => {
    if (!isOpOpen) {
      fetchLatest();
    }
  }, [isOpOpen, selectedRes.id]);

  // 📍 修正：dbRes（最新データ）を基に金額を計算
  const displayAmount = useMemo(() => {
    const actual = Number(dbRes?.actual_total_price || 0);
    const initial = Number(dbRes?.total_price || 0);
    return actual > 0 ? actual : initial;
  }, [dbRes?.actual_total_price, dbRes?.total_price]);

  const handleSaveMemo = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ memo: memoDraft, updated_at: new Date().toISOString() })
        .eq('id', dbRes.id);
      
      if (error) throw error;
      onToast("メモを保存しました");
      await fetchLatest();
    } catch (err: any) {
      alert("保存失敗: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isOpOpen) {
    return (
      <OpCalculator 
        selectedRes={dbRes} 
        initialTotal={Number(dbRes.total_price || 0)}
        onToast={onToast}
        onClose={() => setIsOpOpen(false)}
        isInCall={isInCall}
        setIsInCall={setIsInCall}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-gray-50 rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        
        {/* ヘッダーエリア */}
        <div className="relative p-6 bg-white border-b border-gray-100">
          <button onClick={onClose} className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">×</button>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-[10px] font-black tracking-wider uppercase">{dbRes.service_type || 'か'}</span>
            <span className="text-gray-400 font-bold text-sm">{dbRes.reservation_date}</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900">{dbRes.cast_name} <span className="text-sm font-normal text-gray-400 ml-1">キャスト</span></h2>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* 金額・コース情報カード */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">現在の合計金額</p>
              <p className="text-2xl font-black text-green-500">¥{displayAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">コース時間</p>
              <p className="text-2xl font-black text-gray-800">{dbRes.course_info}</p>
            </div>
          </div>

          {/* メモ入力エリア */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">キャストメモ</label>
              <button onClick={handleSaveMemo} disabled={isSaving} className="text-[11px] font-black text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest">{isSaving ? '保存中...' : '変更を保存'}</button>
            </div>
            {/* 📍 修正：text-[16px] にしてズームを防止 */}
            <textarea 
              value={memoDraft} 
              onChange={(e) => setMemoDraft(e.target.value)} 
              className="w-full min-h-[120px] p-4 bg-white border border-gray-100 rounded-2xl text-[16px] font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all resize-none shadow-sm" 
              placeholder="お客様の特徴や注意事項をメモ..." 
            />
          </div>

          {/* 基本情報リスト */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {[
              { label: 'お客様', value: dbRes.customer_name },
              { label: '予約時間', value: `${dbRes.start_time?.substring(0,5) || '--:--'} 〜` },
              { label: 'ステータス', value: dbRes.status === 'playing' ? '🟢 プレイ中' : dbRes.status === 'completed' ? '✅ 終了' : '⚪️ 待機中' },
            ].map((item, i) => (
              <div key={i} className={`flex justify-between items-center p-4 ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                <span className="text-xs font-bold text-gray-400 uppercase">{item.label}</span>
                <span className="text-sm font-black text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 下部アクションエリア */}
        <div className="p-6 bg-white border-t border-gray-100">
          <button 
            onClick={() => setIsOpOpen(true)}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[15px] shadow-xl shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            ➕ オプション計算を開く
          </button>
        </div>
      </div>
    </div>
  );
}