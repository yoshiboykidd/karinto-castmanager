'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 📍 既に成功している店舗ID辞書
const SHOP_DICT: { [key: string]: number } = {
  '池東': 11, '池袋東口': 11, '池西': 6, '池袋西口': 6, '大久保': 10,
  '神田': 1, '赤坂': 2, '秋葉原': 3, '上野': 4, '渋谷': 5, '五反田': 7, '大宮': 8, '吉祥寺': 9, '小岩': 12
};

const KARINTO_OPS = [
  { label: '¥500 Op', price: 500, items: [{ n: '10', t: '上ラン' }, { n: '11', t: '抱きつき' }, { n: '12', t: '足なで' }, { n: '13', t: 'つば垂らし' }, { n: '14', t: '匂い嗅ぎ' }, { n: '15', t: '踏付け' }, { n: '16', t: '足こき' }, { n: '17', t: 'チラっとパンツ見せ' }, { n: '18', t: '拘束テープ' }, { n: '19', t: '+500' }]},
  { label: '¥1,000 Op', price: 1000, items: [{ n: '20', t: '乳もみ' }, { n: '21', t: 'お尻触り' }, { n: '22', t: '下ラン' }, { n: '23', t: 'スク水' }, { n: '24', t: '指アナル' }, { n: '25', t: 'ストッキング責め' }, { n: '26', t: '+1000' }, { n: '27', t: '+1000' }]},
  { label: '¥1,500 Op', price: 1500, items: [{ n: '30', t: '乳舐め' }, { n: '31', t: 'オーラン' }, { n: '32', t: 'ハッピーセット' }, { n: '33', t: 'いやら尻触り' }, { n: '34', t: '美脚三昧' }, { n: '35', t: 'ノーブラTシャツ' }, { n: '36', t: '顔面騎乗' }, { n: '37', t: '+1500' }]},
  { label: '¥2,000 Op', price: 2000, items: [{ n: '40', t: 'ノーブラTシャツ乳もみ' }, { n: '41', t: '+2000' }, { n: '42', t: '+2000' }]},
  { label: '¥2,500 Op', price: 2500, items: [{ n: '50', t: '上ラン生乳もみ' }, { n: '51', t: '+2500' }, { n: '52', t: '+2500' }]},
  { label: '¥3,000 Op', price: 3000, items: [{ n: '60', t: 'トップレス' }, { n: '61', t: 'バリューセット' }, { n: '62', t: 'ノーブラ生乳もみ' }, { n: '63', t: '+3000' }, { n: '64', t: '+3000' }]},
  { label: '¥3,500 Op', price: 3500, items: [{ n: '71', t: 'トップレス生乳もみ' }]},
];

const SOINE_OPS = [
  { label: '45分価格', items: [{ n: '3-1', t: '3点セット 45分1', p: 2500 }, { n: '3-2', t: '3点セット 45分2', p: 2500 }, { n: '3-3', t: '3点セット 45分3', p: 2500 }, { n: '3-4', t: '3点セット 45分4', p: 2500 }, { n: '3-5', t: '3点セット 45分5', p: 2500 }, { n: '1', t: '単品 45分1', p: 1000 }, { n: '2', t: '単品 45分2', p: 1000 }, { n: '3', t: '単品 45分3', p: 1000 }, { n: '4', t: '単品 45分4', p: 1000 }, { n: '5', t: '単品 45分5', p: 1000 }]},
  { label: '60分価格', items: [{ n: '3-1', t: '3点セット 60分1', p: 2000 }, { n: '3-2', t: '3点セット 60分2', p: 2000 }, { n: '3-3', t: '3点セット 60分3', p: 2000 }, { n: '3-4', t: '3点セット 60分4', p: 2000 }, { n: '3-5', t: '3点セット 60分5', p: 2000 }, { n: '1', t: '単品 60分1', p: 1000 }, { n: '2', t: '単品 60分2', p: 1000 }, { n: '3', t: '単品 60分3', p: 1000 }, { n: '4', t: '単品 60分4', p: 1000 }, { n: '5', t: '単品 60分5', p: 1000 }]},
  { label: '90分価格', items: [{ n: '3-1', t: '3点セット 90分1', p: 1500 }, { n: '3-2', t: '3点セット 90分2', p: 1500 }, { n: '3-3', t: '3点セット 90分3', p: 1500 }, { n: '3-4', t: '3点セット 90分4', p: 1500 }, { n: '3-5', t: '3点セット 90分5', p: 1500 }, { n: '1', t: '単品 90分1', p: 500 }, { n: '2', t: '単品 90分2', p: 500 }, { n: '3', t: '単品 90分3', p: 500 }, { n: '4', t: '単品 90分4', p: 500 }, { n: '5', t: '単品 90分5', p: 500 }]},
  { label: '120分価格', items: [{ n: '3-1', t: '3点セット 120分1', p: 1000 }, { n: '3-2', t: '3点セット 120分2', p: 1000 }, { n: '3-3', t: '3点セット 120分3', p: 1000 }, { n: '3-4', t: '3点セット 120分4', p: 1000 }, { n: '3-5', t: '3点セット 120分5', p: 1000 }, { n: '1', t: '単品 120分1', p: 500 }, { n: '2', t: '単品 120分2', p: 500 }, { n: '3', t: '単品 120分3', p: 500 }, { n: '4', t: '単品 120分4', p: 500 }, { n: '5', t: '単品 120分5', p: 500 }]},
];

export default function OpCalculator({ selectedRes, initialTotal, onToast, onClose, isInCall, setIsInCall }: any) {
  const router = useRouter();
  const [selectedOps, setSelectedOps] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // 📍 修正：DBから直接取得した「最新データ」を保持するステート
  const [dbRes, setDbRes] = useState(selectedRes);

  useEffect(() => {
    // 📍 修正：開いた瞬間に最新データを読み込み、前回の追加分を復元する
    const fetchLatest = async () => {
      const { data } = await supabase.from('reservations').select('*').eq('id', selectedRes.id).single();
      if (data) setDbRes(data);
    };
    fetchLatest();

    const style = document.createElement('style');
    style.id = 'hide-app-footer';
    style.innerHTML = `nav, footer { display: none !important; }`;
    document.head.appendChild(style);
    return () => { document.getElementById('hide-app-footer')?.remove(); };
  }, [selectedRes.id]);

  const isActuallyPlaying = useMemo(() => isInCall || dbRes?.status === 'playing', [isInCall, dbRes?.status]);
  const isCompleted = useMemo(() => dbRes?.status === 'completed', [dbRes?.status]);
  const currentCategories = useMemo(() => dbRes?.service_type === '添' ? SOINE_OPS : KARINTO_OPS, [dbRes?.service_type]);

  // 📍 修正：dbRes（最新）を元に、既に保存されているオプションを抽出
  const savedOpsActive = useMemo(() => {
    const details = Array.isArray(dbRes?.op_details) ? dbRes.op_details : [];
    return details.filter((op: any) => op?.status !== 'canceled');
  }, [dbRes?.op_details]);

  // 累積オプション合計
  const opsTotal = useMemo(() => {
    const savedSum = savedOpsActive.reduce((sum: number, op: any) => sum + (op?.price || 0), 0);
    const newSum = selectedOps.reduce((sum, op) => sum + (op?.price || 0), 0);
    return savedSum + newSum;
  }, [selectedOps, savedOpsActive]);

  // 常に「コース初期料金 ＋ 過去の全オプション ＋ 今選んでるオプション」を表示
  const displayTotal = initialTotal + opsTotal;
  const courseText = useMemo(() => dbRes?.course_info || (dbRes?.service_type === '添' ? '添い寝' : 'かりんと'), [dbRes]);

  const toggleOp = (no: string, text: string, price: number, catLabel: string) => {
    if (isCompleted) return;
    setSelectedOps((prev) => {
      const opId = dbRes?.service_type === '添' ? `${catLabel}-${no}` : no;
      const isAlreadySelected = prev.some(op => (dbRes?.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) === opId);
      if (isAlreadySelected) return prev.filter(op => (dbRes?.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) !== opId);
      return [...prev, { no, name: text, price, catLabel, timing: 'additional', status: 'active' }];
    });
  };

  const toggleSavedStatus = async (item: any) => {
    if (isCompleted) return;
    const details = Array.isArray(dbRes.op_details) ? dbRes.op_details : [];
    const newDetails = details.map((op: any) => {
      if (op?.no === item?.no && op?.name === item?.name) {
        return { ...op, status: op.status === 'canceled' ? 'active' : 'canceled', updatedAt: new Date().toISOString() };
      }
      return op;
    });
    const newActualTotal = initialTotal + newDetails.filter((o: any) => o?.status === 'active').reduce((s: number, o: any) => s + (o?.price || 0), 0);
    const { error } = await supabase.from('reservations').update({ op_details: newDetails, actual_total_price: newActualTotal }).eq('id', dbRes.id);
    if (error) alert("更新失敗: " + error.message);
    else {
      // ローカルの状態も更新して画面に即座に反映
      const { data } = await supabase.from('reservations').select('*').eq('id', dbRes.id).single();
      if (data) setDbRes(data);
      router.refresh();
    }
  };

  const sendNotification = async (type: 'START' | 'HELP' | 'FINISH') => {
    if (!dbRes?.id) return;
    setIsSending(true);

    try {
      const label = dbRes?.shop_label || "";
      const castId = String(dbRes?.login_id || dbRes?.cast_id || "");
      let shopNo: number | null = null;
      if (SHOP_DICT[label]) shopNo = SHOP_DICT[label];
      else if (castId.length >= 2 && SHOP_DICT[Object.keys(SHOP_DICT).find(k => SHOP_DICT[k] === Number(castId.substring(0, 2))) || ""]) {
        shopNo = Number(castId.substring(0, 2));
      }
      if (shopNo === null) shopNo = Number(dbRes?.shop_id || dbRes?.shopId || 0);

      const prefix = dbRes.service_type === '添' ? '【添】' : '【か】';
      const currentOpDetails = Array.isArray(dbRes.op_details) ? dbRes.op_details : [];
      const newOpDetails = [...currentOpDetails];
      if (selectedOps.length > 0) {
        newOpDetails.push(...selectedOps.map(op => ({ ...op, timing: type === 'START' ? 'initial' : 'additional', updatedAt: new Date().toISOString() })));
      }

      // 1. 予約DBを更新（ actual_total_price を累積総額 displayTotal に上書き ）
      const updateData: any = { actual_total_price: displayTotal, op_details: newOpDetails, updated_at: new Date().toISOString() };
      if (type === 'START') { updateData.status = 'playing'; updateData.in_call_at = new Date().toISOString(); }
      if (type === 'FINISH') { updateData.status = 'completed'; updateData.end_time = new Date().toISOString(); }
      const { error: resError } = await supabase.from('reservations').update(updateData).eq('id', dbRes.id);
      if (resError) throw resError;

      // 2. 通知メッセージ
      let message = "";
      let toastMsg = "";
      const activeOps = newOpDetails.filter(o => o.status !== 'canceled');
      
      if (type === 'HELP') { 
        message = `${prefix}【呼出】${dbRes.customer_name}様：スタッフ至急！`; 
        toastMsg = "スタッフを呼びました"; 
      }
      else if (type === 'START') { 
        const opList = activeOps.map(o => `${o.no}.${o.name}`).join('・') || '無';
        message = `${prefix}【入室】${dbRes.customer_name}様\n💰 総額：¥${displayTotal.toLocaleString()}\n(内訳: ¥${initialTotal.toLocaleString()} + Op¥${opsTotal.toLocaleString()})\nOp内訳：${opList}`;
        toastMsg = "お店にプレイスタートを通知しました";
      } else if (type === 'FINISH') {
        const addedStr = selectedOps.map(o => `${o.no}.${o.name}`).join('・');
        const canceledStr = newOpDetails.filter((o: any) => o?.status === 'canceled' && o?.updatedAt > (dbRes.in_call_at || "")).map((o: any) => `(取)${o.name}`).join('・');
        
        // 📍 終了時は「最終的にいくら払うべきか」を最優先で伝えるロジック
        message = `${prefix}【退出】${dbRes.customer_name}様\n追加料金：+¥${(displayTotal - (dbRes.actual_total_price || initialTotal)).toLocaleString()}\n━━━━━━━━━━━━━━\n💰 最終お会計額：¥${displayTotal.toLocaleString()}\n━━━━━━━━━━━━━━\nOp全内訳：${activeOps.map(o => `${o.no}.${o.name}`).join('・') || '無し'}`;
        toastMsg = "お店に退出を通知しました。お会計をお願いします。";
      }

      const finalMessage = label ? `[${label}] ${message}` : message;
      const { error: notifError } = await supabase.from('notifications').insert({ 
        shop_id: shopNo, 
        cast_id: castId, 
        type: type.toLowerCase(), 
        message: finalMessage, 
        is_read: false 
      });

      if (notifError) {
        await supabase.from('notifications').insert({ cast_id: castId, type: type.toLowerCase(), message: finalMessage, is_read: false });
      }
      
      if (type === 'START') setIsInCall(true);
      if (type === 'FINISH') setIsInCall(false);
      setSelectedOps([]); 
      onToast(toastMsg);
      router.refresh();
      if (type === 'START' || type === 'FINISH') setTimeout(() => onClose(), 500);
    } catch (err: any) { alert(`保存失敗: ${err.message}`); } finally { setIsSending(false); }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] z-[99999] flex flex-col bg-gray-900 text-white overflow-hidden font-sans">
      <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-black shrink-0 ${dbRes?.service_type === '添' ? 'bg-pink-500' : 'bg-blue-500'}`}>{dbRes?.service_type || 'か'}</span>
            <p className="font-black text-[12px] truncate text-gray-100">{courseText}</p>
          </div>
          <p className="text-[26px] font-black text-green-400 tabular-nums leading-none">
            <span className="text-[13px] align-middle opacity-60">¥</span>{initialTotal.toLocaleString()}
            <span className="text-[15px] mx-1 opacity-40">+</span>
            <span className="text-[13px] align-middle opacity-60">¥</span>{opsTotal.toLocaleString()}
            <span className="text-[15px] mx-1 opacity-40">=</span>
            <span className="text-[13px] align-middle opacity-60 mr-0.5">¥</span>{displayTotal.toLocaleString()}
          </p>
        </div>
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-full text-2xl font-bold active:scale-90 shrink-0">×</button>
      </div>

      <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex flex-wrap gap-1 shrink-0 items-center overflow-y-auto max-h-[80px]">
        {savedOpsActive.map((op: any, i: number) => (
          <button key={`s-${i}`} onClick={() => toggleSavedStatus(op)} className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 ${op?.price < 0 ? 'bg-red-600' : 'bg-blue-600'}`}>{op?.no}.{op?.name} <span className="opacity-50">×</span></button>
        ))}
        {selectedOps.map((op, i) => (
          <button key={`n-${i}`} onClick={() => toggleOp(op.no, op.name, op.price, op.catLabel)} className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 ${op.price < 0 ? 'bg-red-600' : 'bg-pink-600'}`}>{op.no}.{op.name} <span className="opacity-50">×</span></button>
        ))}
        {savedOpsActive.length === 0 && selectedOps.length === 0 && <p className="text-[11px] text-gray-500 font-black italic">※ オプションを選択してください</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-3 pb-6 space-y-6 scrollbar-hide overscroll-contain min-h-0">
        {currentCategories.map((cat: any) => (
          <div key={cat.label} className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-500 px-1 uppercase border-l-2 border-pink-500/50 ml-1 tracking-widest">{cat.label}</h3>
            <div className="grid grid-cols-3 gap-2">
              {cat.items.map((item: any) => {
                const isSelected = selectedOps.some(op => op.no === item.n && (dbRes?.service_type !== '添' || op.catLabel === cat.label));
                const isSaved = savedOpsActive.some((op: any) => op?.no === item.n && (dbRes?.service_type !== '添' || op.catLabel === cat.label));
                return (
                  <button key={`${cat.label}-${item.n}`} onClick={() => toggleOp(item.n, item.t, item.p || (cat as any).price || 0, cat.label)} className={`min-h-[75px] rounded-[20px] flex flex-col items-center justify-center border transition-all ${isSelected || isSaved ? 'bg-pink-500 border-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    <span className="text-[20px] font-black">{item.n}</span>
                    <span className="text-[11px] font-black leading-tight text-center px-1">{item.t}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {dbRes?.service_type !== '添' && (
          <div className="px-1 pt-2">
            <button onClick={() => toggleOp('割', 'Op割', -500, '特別')} className={`w-full py-4 rounded-[20px] border transition-all flex items-center justify-center gap-2 ${selectedOps.some(op => op.no === '割') || savedOpsActive.some((op: any) => op.no === '割') ? 'bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] text-white' : 'bg-white/5 border-white/5 text-gray-400'}`}>
              <span className="text-[18px] font-black">Op割 -500</span>
            </button>
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 bg-gray-900 border-t border-gray-800 flex gap-2 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        {isCompleted ? <div className="flex-1 py-4 bg-gray-800 text-gray-500 rounded-2xl font-black text-center">✅ プレイ終了済み</div> : (
          <>
            <button onClick={() => sendNotification('HELP')} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-black text-[13px] active:scale-95 transition-transform">✋ 呼出</button>
            <button onClick={() => sendNotification(isActuallyPlaying ? 'FINISH' : 'START')} disabled={isSending} className={`flex-[2.5] py-4 rounded-2xl font-black text-[18px] ${isActuallyPlaying ? 'bg-orange-600' : 'bg-green-500'} text-white shadow-xl active:scale-95 transition-all`}>
              {isSending ? '...' : isActuallyPlaying ? '🏁 プレイ終了' : '🚀 スタート'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}