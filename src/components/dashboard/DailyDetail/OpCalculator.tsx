'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const KARINTO_OPS = [
  { label: '¥500 Op', price: 500, items: [
    { n: '10', t: '上ラン' }, { n: '11', t: '抱きつき' }, { n: '12', t: '足なで' }, 
    { n: '13', t: 'つば垂らし' }, { n: '14', t: '匂い嗅ぎ' }, { n: '15', t: '踏付け' }, 
    { n: '16', t: '足こき' }, { n: '17', t: 'チラっとパンツ見せ' }, { n: '18', t: '拘束テープ' }, 
    { n: '19', t: '+500' }
  ]},
  { label: '¥1,000 Op', price: 1000, items: [
    { n: '20', t: '乳もみ' }, { n: '21', t: 'お尻触り' }, { n: '22', t: '下ラン' }, 
    { n: '23', t: 'スク水' }, { n: '24', t: '指アナル' }, { n: '25', t: 'ストッキング責め' }, 
    { n: '26', t: '+1000' }, { n: '27', t: '+1000' }
  ]},
  { label: '¥1,500 Op', price: 1500, items: [
    { n: '30', t: '乳舐め' }, { n: '31', t: 'オーラン' }, { n: '32', t: 'ハッピーセット' }, 
    { n: '33', t: 'いやら尻触り' }, { n: '34', t: '美脚三昧' }, { n: '35', t: 'ノーブラTシャツ' }, 
    { n: '36', t: '顔面騎乗' }, { n: '37', t: '+1500' }
  ]},
  { label: '¥2,000 Op', price: 2000, items: [
    { n: '40', t: 'ノーブラTシャツ乳もみ' }, { n: '41', t: '+2000' }, { n: '42', t: '+2000' }
  ]},
  { label: '¥2,500 Op', price: 2500, items: [
    { n: '50', t: '上ラン生乳もみ' }, { n: '51', t: '+2500' }, { n: '52', t: '+2500' }
  ]},
  { label: '¥3,000 Op', price: 3000, items: [
    { n: '60', t: 'トップレス' }, { n: '61', t: 'バリューセット' }, { n: '62', t: 'ノーブラ生乳もみ' }, 
    { n: '63', t: '+3000' }, { n: '64', t: '+3000' }
  ]},
  { label: '¥3,500 Op', price: 3500, items: [
    { n: '71', t: 'トップレス生乳もみ' }
  ]},
];

const SOINE_OPS = [
  { label: '45分価格', items: [
    { n: '3-1', t: '3点セット 45分1', p: 2500 }, { n: '3-2', t: '3点セット 45分2', p: 2500 }, { n: '3-3', t: '3点セット 45分3', p: 2500 }, { n: '3-4', t: '3点セット 45分4', p: 2500 }, { n: '3-5', t: '3点セット 45分5', p: 2500 },
    { n: '1', t: '単品 45分1', p: 1000 }, { n: '2', t: '単品 45分2', p: 1000 }, { n: '3', t: '単品 45分3', p: 1000 }, { n: '4', t: '単品 45分4', p: 1000 }, { n: '5', t: '単品 45分5', p: 1000 }
  ]},
  { label: '60分価格', items: [
    { n: '3-1', t: '3点セット 60分1', p: 2000 }, { n: '3-2', t: '3点セット 60分2', p: 2000 }, { n: '3-3', t: '3点セット 60分3', p: 2000 }, { n: '3-4', t: '3点セット 60分4', p: 2000 }, { n: '3-5', t: '3点セット 60分5', p: 2000 },
    { n: '1', t: '単品 60分1', p: 1000 }, { n: '2', t: '単品 60分2', p: 1000 }, { n: '3', t: '単品 60分3', p: 1000 }, { n: '4', t: '単品 60分4', p: 1000 }, { n: '5', t: '単品 60分5', p: 1000 }
  ]},
  { label: '90分価格', items: [
    { n: '3-1', t: '3点セット 90分1', p: 1500 }, { n: '3-2', t: '3点セット 90分2', p: 1500 }, { n: '3-3', t: '3点セット 90分3', p: 1500 }, { n: '3-4', t: '3点セット 90分4', p: 1500 }, { n: '3-5', t: '3点セット 90分5', p: 1500 },
    { n: '1', t: '単品 90分1', p: 500 }, { n: '2', t: '単品 90分2', p: 500 }, { n: '3', t: '単品 90分3', p: 500 }, { n: '4', t: '単品 90分4', p: 500 }, { n: '5', t: '単品 90分5', p: 500 }
  ]},
  { label: '120分価格', items: [
    { n: '3-1', t: '3点セット 120分1', p: 1000 }, { n: '3-2', t: '3点セット 120分2', p: 1000 }, { n: '3-3', t: '3点セット 120分3', p: 1000 }, { n: '3-4', t: '3点セット 120分4', p: 1000 }, { n: '3-5', t: '3点セット 120分5', p: 1000 },
    { n: '1', t: '単品 120分1', p: 500 }, { n: '2', t: '単品 120分2', p: 500 }, { n: '3', t: '単品 120分3', p: 500 }, { n: '4', t: '単品 120分4', p: 500 }, { n: '5', t: '単品 120分5', p: 500 }
  ]},
];

export default function OpCalculator({ selectedRes, initialTotal, onToast, onClose, isInCall, setIsInCall }: any) {
  const supabase = createClientComponentClient();
  const [selectedOps, setSelectedOps] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'hide-app-footer';
    style.innerHTML = `nav, footer { display: none !important; }`;
    document.head.appendChild(style);
    return () => {
      const target = document.getElementById('hide-app-footer');
      if (target) target.remove();
    };
  }, []);

  const isActuallyPlaying = useMemo(() => isInCall || selectedRes?.status === 'playing', [isInCall, selectedRes?.status]);
  const isCompleted = useMemo(() => selectedRes?.status === 'completed', [selectedRes?.status]);
  const currentCategories = useMemo(() => selectedRes?.service_type === '添' ? SOINE_OPS : KARINTO_OPS, [selectedRes?.service_type]);

  const savedOpsActive = useMemo(() => {
    const details = Array.isArray(selectedRes?.op_details) ? selectedRes.op_details : [];
    return details.filter((op: any) => op?.status !== 'canceled');
  }, [selectedRes?.op_details]);

  const opsTotal = useMemo(() => {
    const savedSum = savedOpsActive.reduce((sum: number, op: any) => sum + (op?.price || 0), 0);
    const newSum = selectedOps.reduce((sum, op) => sum + (op?.price || 0), 0);
    return savedSum + newSum;
  }, [selectedOps, savedOpsActive]);

  const displayTotal = initialTotal + opsTotal;
  const courseText = useMemo(() => selectedRes?.course_info || (selectedRes?.service_type === '添' ? '添い寝' : 'かりんと'), [selectedRes]);

  const toggleOp = (no: string, text: string, price: number, catLabel: string) => {
    if (isCompleted) return;
    setSelectedOps((prev) => {
      const opId = selectedRes?.service_type === '添' ? `${catLabel}-${no}` : no;
      const isAlreadySelected = prev.some(op => (selectedRes?.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) === opId);
      if (isAlreadySelected) return prev.filter(op => (selectedRes?.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) !== opId);
      return [...prev, { no, name: text, price, catLabel, timing: 'additional', status: 'active' }];
    });
  };

  const toggleSavedStatus = async (item: any) => {
    if (isCompleted) return;
    const details = Array.isArray(selectedRes.op_details) ? selectedRes.op_details : [];
    const newDetails = details.map((op: any) => {
      if (op?.no === item?.no && op?.name === item?.name) {
        return { ...op, status: op.status === 'canceled' ? 'active' : 'canceled', updatedAt: new Date().toISOString() };
      }
      return op;
    });
    const newActualTotal = initialTotal + newDetails.filter((o: any) => o?.status === 'active').reduce((s: number, o: any) => s + (o?.price || 0), 0);
    await supabase.from('reservations').update({ op_details: newDetails, actual_total_price: newActualTotal }).eq('id', selectedRes.id);
  };

  const sendNotification = async (type: 'START' | 'HELP' | 'FINISH') => {
    if (!selectedRes?.id) return;
    setIsSending(true);
    const prefix = selectedRes.service_type === '添' ? '【添】' : '【か】';

    try {
      const details = Array.isArray(selectedRes.op_details) ? selectedRes.op_details : [];
      const newOpDetails = [...details];
      if (selectedOps.length > 0) {
        const taggedOps = selectedOps.map(op => ({ ...op, timing: type === 'START' ? 'initial' : 'additional', updatedAt: new Date().toISOString() }));
        newOpDetails.push(...taggedOps);
      }

      if (type === 'START' || type === 'FINISH') {
        const updateData: any = { actual_total_price: displayTotal, op_details: newOpDetails, updated_at: new Date().toISOString() };
        if (type === 'START') { updateData.status = 'playing'; updateData.in_call_at = new Date().toISOString(); }
        if (type === 'FINISH') { updateData.status = 'completed'; updateData.end_time = new Date().toISOString(); }
        await supabase.from('reservations').update(updateData).eq('id', selectedRes.id);
      }

      let message = "";
      let toastMsg = "";

      if (type === 'HELP') {
        message = `${prefix}【呼出】${selectedRes.customer_name}様：スタッフ至急！`;
        toastMsg = "スタッフを呼びました";
      } 
      else if (type === 'START') {
        const opDetail = selectedOps.map(o => `${o.no}.${o.name}`).join('・') || '無';
        message = `${prefix}【入室】${selectedRes.customer_name}様\nコース：${courseText}\n金額：¥${initialTotal.toLocaleString()}+Op¥${opsTotal.toLocaleString()}＝合計¥${displayTotal.toLocaleString()}\nOp内訳：${opDetail}`;
        toastMsg = "【お店にプレイスタートを通知しました】";
      } 
      else if (type === 'FINISH') {
        const addedOpsStr = selectedOps.map(o => `${o.no}.${o.name}`).join('・');
        const canceledAtEnd = newOpDetails.filter((o: any) => o?.status === 'canceled' && o?.updatedAt > (selectedRes.in_call_at || "")).map((o: any) => `(取)${o.name}`).join('・');
        const changeDetail = [addedOpsStr, canceledAtEnd].filter(Boolean).join('・') || '無し';
        const diffTotal = displayTotal - (selectedRes.actual_total_price || initialTotal);
        message = `${prefix}【追加変更】${selectedRes.customer_name}様\n追加OP\nOp内訳：${changeDetail}\n追加合計：¥${diffTotal.toLocaleString()}`;
        toastMsg = "【お店に退出を通知しました。電話連絡もしてください】";
      }

      await supabase.from('notifications').insert({ shop_id: selectedRes.shop_id, cast_id: selectedRes.login_id, type: type.toLowerCase(), message, is_read: false });
      
      if (type === 'START') setIsInCall(true);
      if (type === 'FINISH') setIsInCall(false);
      
      setSelectedOps([]); 
      onToast(toastMsg);
      if (type === 'START' || type === 'FINISH') onClose();
    } catch (err: any) { 
      alert("エラー: " + err.message); 
    } finally { 
      setIsSending(false); 
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] z-[99999] flex flex-col bg-gray-900 text-white overflow-hidden font-sans">
      <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-black shrink-0 ${selectedRes?.service_type === '添' ? 'bg-pink-500' : 'bg-blue-500'}`}>{selectedRes?.service_type || 'か'}</span>
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
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-3 pb-6 space-y-6 scrollbar-hide overscroll-contain min-h-0">
        {currentCategories.map((cat: any) => (
          <div key={cat.label} className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-500 px-1 uppercase border-l-2 border-pink-500/50 ml-1 tracking-widest">{cat.label}</h3>
            <div className="grid grid-cols-3 gap-2">
              {cat.items.map((item: any) => {
                const isSelected = selectedOps.some(op => op.no === item.n && (selectedRes?.service_type !== '添' || op.catLabel === cat.label));
                const isSaved = savedOpsActive.some((op: any) => op?.no === item.n && (selectedRes?.service_type !== '添' || op.catLabel === cat.label));
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
        {selectedRes?.service_type !== '添' && (
          <div className="px-1 pt-2">
            <button onClick={() => toggleOp('割', 'Op割', -500, '特別')} className={`w-full py-4 rounded-[20px] border transition-all flex items-center justify-center gap-2 ${selectedOps.some(op => op.no === '割') || savedOpsActive.some((op: any) => op.no === '割') ? 'bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] text-white' : 'bg-white/5 border-white/5 text-gray-400'}`}>
              <span className="text-[18px] font-black">Op割 -500</span>
            </button>
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 bg-gray-900 border-t border-gray-800 flex gap-2 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        {isCompleted ? (
          <div className="flex-1 py-4 bg-gray-800 text-gray-500 rounded-2xl font-black text-center">✅ プレイ終了済み</div>
        ) : (
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