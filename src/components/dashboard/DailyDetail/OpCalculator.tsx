'use client';

import React, { useState, useMemo } from 'react';

const OP_CATEGORIES = [
  { label: '500', price: 500, items: ['10. 上ラン', '11. 抱きつき', '12. 足なで', '13. つばたらし', '14. 匂いかぎ', '15. 踏みつけ', '16. 足こき', '17. チラ見せ', '18. 拘束'] },
  { label: '1000', price: 1000, items: ['20. 乳もみ', '21. 尻さわり', '22. 下ラン', '23. スク水', '24. 指アナル', '25. スト責め'] },
  { label: '1500', price: 1500, items: ['30. 乳舐め', '31. 全ラン', '32. ハピセ', '33. 尻(い)', '34. 美脚', '35. NB-T', '36. 顔面'] },
  { label: '2000+', items: [
    { name: '40. NB-乳も', price: 2000 }, { name: '50. 上生乳', price: 2500 }, { name: '60. Ｔレス', price: 3000 },
    { name: '61. バリュセ', price: 3000 }, { name: '62. NB-生乳', price: 3000 }, { name: '71. Ｔ生乳も', price: 3500 },
  ]}
];

export default function OpCalculator({ selectedRes, initialTotal, supabase, onToast, onClose }: any) {
  const [activeTab, setActiveTab] = useState('500');
  const [selectedOps, setSelectedOps] = useState<{name: string, price: number}[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const opsTotal = useMemo(() => selectedOps.reduce((sum, op) => sum + op.price, 0), [selectedOps]);
  const displayTotal = initialTotal + opsTotal;

  const sendNotification = async (type: 'START' | 'ADD') => {
    if (!supabase) return;
    setIsSending(true);
    const opNames = selectedOps.map(o => o.name).join('/');
    const message = type === 'START' 
      ? `【入室】${selectedRes.customer_name}様: ¥${displayTotal} (内訳:${opNames || '無'})`
      : `【追】${selectedRes.customer_name}様: 追加OP(${opNames}) 計¥${opsTotal}`;

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
      if (type === 'START') onClose(); // スタート時は自動で閉じる
    } catch (err) {
      alert("通信エラー");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-gray-900 text-white animate-in fade-in zoom-in-95 duration-200">
      {/* 📍 ヘッダー：金額表示 (20px) */}
      <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-md sticky top-0">
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Total to Receive</p>
          <p className="text-[26px] font-black text-green-400">¥{displayTotal.toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-xl font-bold">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* 選択済リスト (11px) */}
        <div className="flex flex-wrap gap-1.5 min-h-[30px] p-3 bg-white/5 rounded-2xl border border-white/5">
          {selectedOps.length === 0 && <p className="text-[11px] text-gray-500 font-bold italic">オプションを選択してください</p>}
          {selectedOps.map((op, i) => (
            <button key={i} onClick={() => setSelectedOps(prev => prev.filter((_, idx) => idx !== i))}
              className="bg-pink-600 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-lg">
              {op.name} <span className="opacity-50 text-sm">×</span>
            </button>
          ))}
        </div>

        {/* 価格タブ (11px) */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl sticky top-0 z-10">
          {OP_CATEGORIES.map(cat => (
            <button key={cat.label} onClick={() => setActiveTab(cat.label)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-black transition-all ${activeTab === cat.label ? 'bg-white text-gray-900 shadow-xl scale-105' : 'text-gray-400'}`}>
              ¥{cat.label}
            </button>
          ))}
        </div>

        {/* OPボタン集 (11px) */}
        <div className="grid grid-cols-2 gap-2">
          {OP_CATEGORIES.find(c => c.label === activeTab)?.items.map((item: any, i) => {
            const name = typeof item === 'string' ? item : item.name;
            const price = typeof item === 'string' ? (OP_CATEGORIES.find(c => c.label === activeTab)?.price || 0) : item.price;
            return (
              <button key={i} onClick={() => setSelectedOps([...selectedOps, { name, price }])}
                className="py-4 bg-white/10 rounded-2xl text-[13px] font-black active:bg-pink-500 active:scale-95 transition-all border border-white/5 shadow-sm">
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 📍 アクションボタン (16px) */}
      <div className="p-4 bg-gray-900/80 backdrop-blur-xl border-t border-gray-800 fixed bottom-0 left-0 right-0">
        <button 
          onClick={() => sendNotification(isInCall ? 'ADD' : 'START')}
          disabled={isSending}
          className={`w-full py-4 rounded-2xl font-black text-[18px] shadow-2xl transition-all active:scale-95
            ${isInCall ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}
            ${isSending ? 'opacity-50' : ''}
          `}
        >
          {isSending ? '送信中...' : isInCall ? '🔥 追加OPを店に通知' : '🚀 精算完了・スタート'}
        </button>
      </div>
    </div>
  );
}