'use client';

import React, { useState, useMemo } from 'react';

// 📍 ご提示いただいた全OPデータを価格帯別に整理
const OP_CATEGORIES = [
  { label: '500', price: 500, items: [
    '10. 上ラン', '11. 抱きつき', '12. 足なで', '13. つばたらし', 
    '14. 匂いかぎ', '15. 踏みつけ', '16. 足こき', '17. チラ見せ', '18. 拘束'
  ]},
  { label: '1000', price: 1000, items: [
    '20. 乳もみ', '21. 尻さわり', '22. 下ラン', '23. スク水', '24. 指アナル', '25. スト責め'
  ]},
  { label: '1500', price: 1500, items: [
    '30. 乳舐め', '31. 全ラン', '32. ハピセ', '33. 尻(い)', '34. 美脚', '35. NB-T', '36. 顔面'
  ]},
  { label: '2000+', items: [
    { name: '40. NB-乳も', price: 2000 },
    { name: '50. 上生乳', price: 2500 },
    { name: '60. Ｔレス', price: 3000 },
    { name: '61. バリュセ', price: 3000 },
    { name: '62. NB-生乳', price: 3000 },
    { name: '71. Ｔ生乳も', price: 3500 },
  ]}
];

export default function OpCalculator({ selectedRes, initialTotal, supabase, onToast }: any) {
  const [activeTab, setActiveTab] = useState('500');
  const [selectedOps, setSelectedOps] = useState<{name: string, price: number}[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 合計計算
  const opsTotal = useMemo(() => selectedOps.reduce((sum, op) => sum + op.price, 0), [selectedOps]);
  const displayTotal = initialTotal + opsTotal;

  // 通知送信
  const sendNotification = async (type: 'START' | 'ADD') => {
    if (!supabase) return;
    setIsSending(true);
    const opNames = selectedOps.map(o => o.name).join('/');
    const message = type === 'START' 
      ? `【入室】${selectedRes.customer_name}様: $${displayTotal}$円 (内訳:${opNames || '無'})`
      : `【追】${selectedRes.customer_name}様: 追加OP(${opNames}) 計$${opsTotal}$円`;

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
    } catch (err) {
      alert("通信エラーが発生しました");
    } finally {
      setIsSending(false);
    }
  };

  const addOp = (name: string, price: number) => {
    setSelectedOps([...selectedOps, { name, price }]);
  };

  return (
    <div className="bg-gray-900 rounded-[20px] p-2 text-white shadow-2xl border border-gray-800">
      {/* 📍 金額表示エリア (20px) */}
      <div className="flex justify-between items-end mb-2 px-1">
        <div>
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">Current Total</p>
          <p className="text-[24px] font-black leading-none text-green-400 font-mono tracking-tighter">
            ¥{displayTotal.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isInCall ? 'bg-orange-500' : 'bg-gray-700'} text-white`}>
            {isInCall ? '追加モード' : '精算モード'}
          </span>
        </div>
      </div>

      {/* 選択済リスト (11px) */}
      <div className="flex flex-wrap gap-1 mb-2 min-h-[24px] px-1">
        {selectedOps.map((op, i) => (
          <button key={i} onClick={() => setSelectedOps(prev => prev.filter((_, idx) => idx !== i))}
            className="bg-pink-600/30 border border-pink-500/50 px-1.5 py-0.5 rounded text-[10px] font-bold text-pink-300">
            {op.name} ×
          </button>
        ))}
      </div>

      {/* 📍 価格タブ切り替え (11px) */}
      <div className="flex gap-1 mb-2 bg-white/5 p-1 rounded-xl">
        {OP_CATEGORIES.map(cat => (
          <button key={cat.label} onClick={() => setActiveTab(cat.label)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${activeTab === cat.label ? 'bg-white text-gray-900' : 'text-gray-400'}`}>
            ¥{cat.label}
          </button>
        ))}
      </div>

      {/* 📍 OPボタン集 (11px / 凝縮グリッド) */}
      <div className="grid grid-cols-3 gap-1 mb-3 max-h-[140px] overflow-y-auto pr-1">
        {OP_CATEGORIES.find(c => c.label === activeTab)?.items.map((item: any, i) => {
          const name = typeof item === 'string' ? item : item.name;
          const price = typeof item === 'string' ? (OP_CATEGORIES.find(c => c.label === activeTab)?.price || 0) : item.price;
          return (
            <button key={i} onClick={() => addOp(name, price)}
              className="py-2.5 bg-white/10 rounded-lg text-[11px] font-bold active:bg-pink-500 active:scale-95 transition-all leading-none px-1">
              {name}
            </button>
          );
        })}
      </div>

      {/* 📍 アクションボタン (16px) */}
      <button 
        onClick={() => sendNotification(isInCall ? 'ADD' : 'START')}
        disabled={isSending}
        className={`w-full py-3.5 rounded-[14px] font-black text-[16px] shadow-lg active:scale-95 transition-all
          ${isInCall ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}
          ${isSending ? 'opacity-50 animate-pulse' : ''}
        `}
      >
        {isSending ? '送信中...' : isInCall ? '🔥 追加OPを店に通知' : '🚀 精算完了・スタート'}
      </button>
    </div>
  );
}