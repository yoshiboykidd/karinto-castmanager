'use client';

import React, { useState, useMemo } from 'react';

// 📍 オプションデータ（変更なし）
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

export default function OpCalculator({ selectedRes, initialTotal, supabase, onToast, onClose, isInCall, setIsInCall }: any) {
  const [selectedOps, setSelectedOps] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  // 📍 ロジック：プレイ状況の判定
  const isActuallyPlaying = useMemo(() => isInCall || selectedRes.status === 'playing', [isInCall, selectedRes.status]);
  const isCompleted = useMemo(() => selectedRes.status === 'completed', [selectedRes.status]);

  const currentCategories = useMemo(() => {
    return selectedRes.service_type === '添' ? SOINE_OPS : KARINTO_OPS;
  }, [selectedRes.service_type]);

  const savedOpsActive = useMemo(() => {
    return (selectedRes.op_details || []).filter((op: any) => op.status !== 'canceled');
  }, [selectedRes.op_details]);

  const opsTotal = useMemo(() => {
    const savedSum = savedOpsActive.reduce((sum: number, op: any) => sum + op.price, 0);
    const newSum = selectedOps.reduce((sum, op) => sum + op.price, 0);
    return savedSum + newSum;
  }, [selectedOps, savedOpsActive]);

  const displayTotal = initialTotal + opsTotal;

  const courseText = useMemo(() => {
    return selectedRes.course_info || (selectedRes.service_type === '添' ? '添い寝' : 'かりんと');
  }, [selectedRes]);

  const toggleOp = (no: string, text: string, price: number, catLabel: string) => {
    if (isCompleted) return;
    setSelectedOps((prev) => {
      const opId = selectedRes.service_type === '添' ? `${catLabel}-${no}` : no;
      const isAlreadySelected = prev.some(op => (selectedRes.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) === opId);
      if (isAlreadySelected) return prev.filter(op => (selectedRes.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) !== opId);
      return [...prev, { no, name: text, price, catLabel, timing: 'additional', status: 'active' }];
    });
  };

  const toggleSavedStatus = async (item: any) => {
    if (!supabase || !selectedRes?.id || isCompleted) return;
    const newDetails = selectedRes.op_details.map((op: any) => {
      if (op.no === item.no && op.name === item.name) {
        return { ...op, status: op.status === 'canceled' ? 'active' : 'canceled', updatedAt: new Date().toISOString() };
      }
      return op;
    });
    const newActualTotal = initialTotal + newDetails.filter((o: any) => o.status === 'active').reduce((s: number, o: any) => s + o.price, 0);
    await supabase.from('reservations').update({ op_details: newDetails, actual_total_price: newActualTotal }).eq('id', selectedRes.id);
  };

  const sendNotification = async (type: 'START' | 'ADD' | 'HELP' | 'FINISH') => {
    if (!supabase || !selectedRes?.id) return;
    setIsSending(true);
    const prefix = selectedRes.service_type === '添' ? '【添】' : '【か】';

    try {
      if (type === 'START' || type === 'ADD' || type === 'FINISH') {
        const newOpDetails = [...(selectedRes.op_details || [])];
        if (selectedOps.length > 0) {
          const taggedOps = selectedOps.map(op => ({ ...op, timing: type === 'START' ? 'initial' : 'additional', updatedAt: new Date().toISOString() }));
          newOpDetails.push(...taggedOps);
        }

        const updateData: any = { actual_total_price: displayTotal, op_details: newOpDetails, updated_at: new Date().toISOString() };
        if (type === 'START') { updateData.status = 'playing'; updateData.in_call_at = new Date().toISOString(); }
        if (type === 'FINISH') { updateData.status = 'completed'; updateData.end_time = new Date().toISOString(); }
        
        await supabase.from('reservations').update(updateData).eq('id', selectedRes.id);
      }

      let message = "";
      const opNames = selectedOps.map(o => `${o.no}.${o.name}`).join('/');
      
      if (type === 'HELP') message = `${prefix}【呼出】${selectedRes.customer_name}様：スタッフ至急！`;
      else if (type === 'START') message = `${prefix}【入室】${selectedRes.customer_name}様：¥${displayTotal.toLocaleString()}（内訳:${opNames || '無'}）`;
      else if (type === 'ADD') message = `${prefix}【追加】${selectedRes.customer_name}様：追加OP（${opNames}）計¥${(displayTotal - (selectedRes.actual_total_price || initialTotal)).toLocaleString()}UP`;
      else if (type === 'FINISH') {
        const diffText = selectedRes.op_details?.filter((o: any) => o.status === 'canceled' && o.updatedAt > selectedRes.in_call_at).map((o: any) => `取:${o.name}`).join('/') || "";
        message = `${prefix}【精算】${selectedRes.customer_name}様：最終¥${displayTotal.toLocaleString()}${diffText ? `（${diffText}）` : ""}`;
      }

      await supabase.from('notifications').insert({ shop_id: selectedRes.shop_id, cast_id: selectedRes.login_id, type: type.toLowerCase(), message, is_read: false });
      
      if (type === 'START') setIsInCall(true);
      if (type === 'FINISH') { setIsInCall(false); onClose(); }
      setSelectedOps([]); 
      onToast(type === 'HELP' ? "スタッフを呼びました" : "店舗へ通知・保存しました");
      if (type === 'START') onClose();
    } catch (err) { alert("エラーが発生しました"); } finally { setIsSending(false); }
  };

  return (
    // 📍 親要素：fixed inset-0 かつ h-[100dvh] で画面全体を固定
    <div className="fixed inset-0 h-[100dvh] z-[300] flex flex-col bg-gray-900 text-white animate-in fade-in duration-200 overflow-hidden font-sans">
      
      {/* 1. ヘッダー (縮ませない) */}
      <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0 z-10">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-black shrink-0 ${selectedRes.service_type === '添' ? 'bg-pink-500' : 'bg-blue-500'}`}>{selectedRes.service_type || 'か'}</span>
            <p className="font-black tracking-tighter leading-tight text-gray-100 text-[12px] truncate">{courseText}</p>
          </div>
          <p className="text-[28px] font-black text-green-400 tabular-nums leading-none">¥{displayTotal.toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-full text-2xl font-bold active:scale-90 shrink-0">×</button>
      </div>

      {/* 2. 選択済みOP (縮ませない) */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-2.5 min-h-[54px] flex flex-wrap gap-1.5 shrink-0 items-center overflow-y-auto max-h-[120px]">
        {savedOpsActive.map((op: any, i: number) => (
          <button key={`saved-${i}`} onClick={() => toggleSavedStatus(op)} className="bg-blue-600 border border-blue-400 text-white px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1">
            <span className="opacity-70 text-[10px]">{op.no}.</span>{op.name}<span className="opacity-50 ml-0.5">×</span>
          </button>
        ))}
        {selectedOps.map((op, i) => (
          <button key={`new-${i}`} onClick={() => toggleOp(op.no, op.name, op.price, op.catLabel || "")} className="bg-pink-600 border border-pink-400 text-white px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1">
            <span className="opacity-70 text-[10px]">{op.no}.</span>{op.name}<span className="opacity-50 ml-0.5">×</span>
          </button>
        ))}
        {savedOpsActive.length === 0 && selectedOps.length === 0 && <p className="text-[11px] text-gray-500 font-black italic opacity-60 pl-1">※ オプションを選択してください</p>}
      </div>

      {/* 3. メイン選択リスト (ここだけをスクロールさせる。min-h-0 が重要) */}
      <div className="flex-1 overflow-y-auto px-2 pt-3 pb-4 space-y-6 scrollbar-hide overscroll-contain min-h-0">
        {currentCategories.map((cat: any) => (
          <div key={cat.label} className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-500 px-1 uppercase tracking-[0.2em] border-l-2 border-pink-500/50 ml-1">{cat.label}</h3>
            <div className="grid grid-cols-3 gap-2">
              {cat.items.map((item: any) => {
                const isSelected = selectedOps.some(op => op.no === item.n && (selectedRes.service_type !== '添' || op.catLabel === cat.label));
                const isSaved = savedOpsActive.some((op: any) => op.no === item.n && (selectedRes.service_type !== '添' || op.catLabel === cat.label));
                return (
                  <button key={`${cat.label}-${item.n}`} onClick={() => toggleOp(item.n, item.t, item.p || (cat as any).price || 0, cat.label)} className={`min-h-[80px] rounded-[24px] flex flex-col items-center justify-center transition-all border px-1 ${isSelected || isSaved ? 'bg-pink-500 border-pink-300 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-95' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    <span className={`text-[22px] font-black mb-1 ${isSelected || isSaved ? 'text-white' : 'text-gray-100'}`}>{item.n}</span>
                    <span className={`text-[12px] font-black leading-[1.1] text-center line-clamp-2 px-1 ${isSelected || isSaved ? 'text-white' : 'text-gray-400'}`}>{item.t}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. フッターボタン (shrink-0 で押し出しを防ぎ、stickyで最下部に固定) */}
      <div className="shrink-0 sticky bottom-0 left-0 right-0 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 z-50 flex gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {isCompleted ? (
          <div className="flex-1 py-4 bg-gray-800 text-gray-500 rounded-2xl font-black text-center text-[16px]">✅ この予約は精算済みです</div>
        ) : (
          <>
            <button onClick={() => sendNotification('HELP')} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-black text-[14px] active:scale-95 transition-transform">✋ 呼出</button>
            {isActuallyPlaying && (
              <button onClick={() => sendNotification('FINISH')} disabled={isSending} className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-xl font-black text-[14px] active:scale-95 transition-transform">🏁 精算完了</button>
            )}
            <button 
              onClick={() => sendNotification(isActuallyPlaying ? 'ADD' : 'START')} 
              disabled={isSending || (isActuallyPlaying && selectedOps.length === 0)} 
              className={`flex-[2.5] py-4 rounded-2xl font-black text-[18px] active:scale-95 transition-all ${isActuallyPlaying ? 'bg-orange-500' : 'bg-green-500'} text-white ${isSending ? 'opacity-50' : ''}`}
            >
              {isSending ? '...' : isActuallyPlaying ? '🔥 追加通知' : '🚀 スタート'}
            </button>
          </>
        )}
      </div>

    </div>
  );
}