'use client';

import React, { useState, useMemo } from 'react';

// 📍 カテゴリーデータ（変更なし）
const OP_CATEGORIES = [
  { label: '¥500 Op', items: ['10. 上ラン', '11. 抱きつき', '12. 足なで', '13. つばたらし', '14. 匂いかぎ', '15. 踏みつけ', '16. 足こき', '17. チラ見せ', '18. 拘束'], price: 500 },
  { label: '¥1,000 Op', items: ['20. 乳もみ', '21. 尻さわり', '22. 下ラン', '23. スク水', '24. 指アナル', '25. スト責め'], price: 1000 },
  { label: '¥1,500 Op', items: ['30. 乳舐め', '31. 全ラン', '32. ハピセ', '33. 尻(い)', '34. 美脚', '35. NB-T', '36. 顔面'], price: 1500 },
  { label: '¥2,000+ Op', items: [
    { name: '40. NB-乳もみ', price: 2000 }, { name: '50. 上生乳もみ', price: 2500 }, 
    { name: '60. トップレス', price: 3000 }, { name: '61. バリュセ', price: 3000 }, 
    { name: '62. NB-生乳', price: 3000 }, { name: '71. Ｔ生乳もみ', price: 3500 },
  ]}
];

export default function OpCalculator({ selectedRes, initialTotal, supabase, onToast, onClose }: any) {
  // 📍 タブ管理の state を削除
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
      ? `【入室】${selectedRes.customer_name}様: ¥${displayTotal.toLocaleString()} (内訳:${opNames || '無'})`
      : `【追】${selectedRes.customer_name}様: 追加OP(${opNames}) 計¥${opsTotal.toLocaleString()}`;

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
    <div className="fixed inset-0 z-[300] flex flex-col bg-gray-900 text-white animate-in fade-in zoom-in-95 duration-200">
      {/* ヘッダー：金額表示 */}
      <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Total to Receive</p>
          <p className="text-[26px] font-black text-green-400">¥{displayTotal.toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-xl font-bold">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28 scrollbar-hide">
        {/* 選択済リスト */}
        {selectedOps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-3 bg-white/5 rounded-2xl border border-white/5 sticky top-0 z-10 backdrop-blur-md">
            {selectedOps.map((op, i) => (
              <button key={i} onClick={() => setSelectedOps(prev => prev.filter((_, idx) => idx !== i))}
                className="bg-pink-600 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-sm animate-in fade-in scale-95">
                {op.name} <span className="opacity-50 text-sm">×</span>
              </button>
            ))}
          </div>
        )}

        {/* 📍 全カテゴリーをループして表示 */}
        {OP_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            {/* カテゴリー見出し */}
            <h3 className="text-[13px] font-black text-gray-400 mb-2 sticky top-0 bg-gray-900/90 py-1 backdrop-blur z-0 pl-1">
              {cat.label}
            </h3>
            {/* 📍 4列グリッドのタイル配置 */}
            <div className="grid grid-cols-4 gap-2">
              {cat.items.map((item: any, i) => {
                const name = typeof item === 'string' ? item : item.name;
                const price = typeof item === 'string' ? (cat.price || 0) : item.price;
                return (
                  <button key={i} onClick={() => setSelectedOps([...selectedOps, { name, price }])}
                    // 📍 aspect-square で正方形にし、テキストを中央揃え
                    className="aspect-square bg-white/10 rounded-xl flex flex-col items-center justify-center text-center p-1 active:bg-pink-500 active:scale-95 transition-all border border-white/5 shadow-sm overflow-hidden"
                  >
                    {/* 文字サイズを調整し、折り返しを許可 */}
                    <span className="text-[10px] font-black leading-tight break-words">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="p-4 bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 fixed bottom-0 left-0 right-0 z-30">
        <button 
          onClick={() => sendNotification(isInCall ? 'ADD' : 'START')}
          disabled={isSending}
          className={`w-full py-4 rounded-2xl font-black text-[18px] shadow-2xl transition-all active:scale-[0.98]
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