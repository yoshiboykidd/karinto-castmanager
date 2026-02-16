'use client';

import React, { useState, useMemo } from 'react';

const OP_CATEGORIES = [
  { label: '¥500 Op', price: 500, items: [
    { n: '10', t: '上ラン' }, { n: '11', t: '抱きつき' }, { n: '12', t: '足なで' }, 
    { n: '13', t: 'つば' }, { n: '14', t: '匂い' }, { n: '15', t: '踏付け' }, 
    { n: '16', t: '足こき' }, { n: '17', t: 'チラ見' }, { n: '18', t: '拘束' }
  ]},
  { label: '¥1,000 Op', price: 1000, items: [
    { n: '20', t: '乳もみ' }, { n: '21', t: '尻触り' }, { n: '22', t: '下ラン' }, 
    { n: '23', t: 'スク水' }, { n: '24', t: '指穴' }, { n: '25', t: 'スト責' }
  ]},
  { label: '¥1,500 Op', price: 1500, items: [
    { n: '30', t: '乳舐め' }, { n: '31', t: '全ラン' }, { n: '32', t: 'ハピセ' }, 
    { n: '33', t: '尻(い)' }, { n: '34', t: '美脚' }, { n: '35', t: 'NB-T' }, { n: '36', t: '顔面' }
  ]},
  { label: '¥2,000 Op', price: 2000, items: [{ n: '40', t: 'NB乳も' }] },
  { label: '¥2,500 Op', price: 2500, items: [{ n: '50', t: '上生乳' }] },
  { label: '¥3,000 Op', price: 3000, items: [
    { n: '60', t: 'Tレス' }, { n: '61', t: 'バリュ' }, { n: '62', t: 'NB生乳' }
  ]},
  { label: '¥3,500 Op', price: 3500, items: [{ n: '71', t: 'T生乳も' }] },
];

export default function OpCalculator({ selectedRes, initialTotal, supabase, onToast, onClose }: any) {
  const [selectedOps, setSelectedOps] = useState<{name: string, price: number, no: string}[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const opsTotal = useMemo(() => selectedOps.reduce((sum, op) => sum + op.price, 0), [selectedOps]);
  const displayTotal = initialTotal + opsTotal;

  // 📍 選択/解除のトグル関数
  const toggleOp = (no: string, text: string, price: number) => {
    setSelectedOps((prev) => {
      const isAlreadySelected = prev.some(op => op.no === no);
      if (isAlreadySelected) {
        return prev.filter(op => op.no !== no);
      } else {
        return [...prev, { no, name: text, price }];
      }
    });
  };

  const sendNotification = async (type: 'START' | 'ADD') => {
    if (!supabase) return;
    setIsSending(true);
    const opNames = selectedOps.map(o => o.name).join('/');
    const message = type === 'START' 
      ? `【入室】${selectedRes.customer_name}様: ¥${displayTotal.toLocaleString()} (${opNames || '無'})`
      : `【追】${selectedRes.customer_name}様: 追加(${opNames}) 計¥${opsTotal.toLocaleString()}`;

    try {
      await supabase.from('notifications').insert({
        shop_id: selectedRes.shop_id,
        cast_id: selectedRes.login_id,
        message,
        total_amount: displayTotal
      });
      if (type === 'START') setIsInCall(true);
      setSelectedOps([]); 
      onToast(type === 'START' ? "スタート通知完了" : "追加通知完了");
      if (type === 'START') onClose();
    } catch (err) {
      alert("通信エラー");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-gray-900 text-white animate-in fade-in duration-200 overflow-hidden">
      
      {/* 1. 金額ヘッダー */}
      <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 shrink-0">
        <div>
          <p className="text-[9px] text-gray-500 font-black uppercase mb-0.5 tracking-widest">To Receive</p>
          <p className="text-[26px] font-black text-green-400 tabular-nums leading-none">¥{displayTotal.toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-xl font-bold">×</button>
      </div>

      {/* 2. 📍 選択済みOP一覧エリア (確実に表示されるよう高さを確保) */}
      <div className="bg-gray-800/80 border-b border-gray-700 px-4 py-2 min-h-[50px] flex flex-wrap gap-2 shrink-0 items-center overflow-y-auto max-h-[120px]">
        {selectedOps.length === 0 ? (
          <p className="text-[11px] text-gray-500 font-bold italic">オプションを選択してください...</p>
        ) : (
          selectedOps.map((op) => (
            <button 
              key={op.no} 
              onClick={() => toggleOp(op.no, op.name, op.price)}
              className="bg-pink-600 border border-pink-400 text-white px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 active:scale-90 transition-all animate-in zoom-in-95"
            >
              {op.name} <span className="text-[13px] leading-none opacity-60">×</span>
            </button>
          ))
        )}
      </div>

      {/* 3. メイン：グリッド（スクロール可能） */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-32 space-y-6 scrollbar-hide overscroll-contain">
        {OP_CATEGORIES.map((cat) => (
          <div key={cat.label} className="space-y-2">
            <h3 className="text-[11px] font-black text-gray-500 px-1 uppercase tracking-widest border-l-2 border-pink-500/50 ml-1">
              {cat.label}
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {cat.items.map((item) => {
                const isSelected = selectedOps.some(op => op.no === item.n);
                return (
                  <button 
                    key={item.n} 
                    onClick={() => toggleOp(item.n, item.t, cat.price)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-150 border
                      ${isSelected 
                        ? 'bg-pink-500 border-pink-300 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] scale-95' 
                        : 'bg-white/5 border-white/5 text-gray-400 active:bg-white/10'
                      }`}
                  >
                    <span className={`text-[15px] font-black leading-none mb-0.5 ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                      {item.n}
                    </span>
                    <span className={`text-[8px] font-bold leading-none truncate w-full px-0.5 text-center ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                      {item.t}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. 固定フッター */}
      <div className="p-4 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 fixed bottom-0 left-0 right-0 z-40">
        <button 
          onClick={() => sendNotification(isInCall ? 'ADD' : 'START')}
          disabled={isSending}
          className={`w-full py-4 rounded-2xl font-black text-[18px] shadow-2xl transition-all active:scale-[0.98]
            ${isInCall ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}
            ${isSending ? 'opacity-50' : ''}
          `}
        >
          {isSending ? 'SENDING...' : isInCall ? '🔥 追加OPを店に通知' : '🚀 精算完了・スタート'}
        </button>
      </div>
    </div>
  );
}