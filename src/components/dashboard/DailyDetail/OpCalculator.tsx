'use client';

import React, { useState, useMemo } from 'react';

// 📍 かりんと専用 OP
const KARINTO_OPS = [
  { label: '¥500 Op', items: [{ n: '10', t: '上ラン', p: 500 }, { n: '11', t: '抱きつき', p: 500 }, { n: '12', t: '足なで', p: 500 }, { n: '13', t: 'つば', p: 500 }, { n: '14', t: '匂い', p: 500 }, { n: '15', t: '踏付け', p: 500 }, { n: '16', t: '足こき', p: 500 }, { n: '17', t: 'チラ見', p: 500 }, { n: '18', t: '拘束', p: 500 }, { n: '19', t: '+500', p: 500 }] },
  { label: '¥1,000 Op', items: [{ n: '20', t: '乳もみ', p: 1000 }, { n: '21', t: '尻触り', p: 1000 }, { n: '22', t: '下ラン', p: 1000 }, { n: '23', t: 'スク水', p: 1000 }, { n: '24', t: '指穴', p: 1000 }, { n: '25', t: 'スト責', p: 1000 }, { n: '26', t: '+1000', p: 1000 }, { n: '27', t: '+1000', p: 1000 }] },
  { label: '¥1,500 Op', items: [{ n: '30', t: '乳舐め', p: 1500 }, { n: '31', t: '全ラン', p: 1500 }, { n: '32', t: 'ハピセ', p: 1500 }, { n: '33', t: '尻(い)', p: 1500 }, { n: '34', t: '美脚', p: 1500 }, { n: '35', t: 'NB-T', p: 1500 }, { n: '36', t: '顔面', p: 1500 }, { n: '37', t: '+1500', p: 1500 }] },
  { label: '¥2,000 Op', items: [{ n: '40', t: 'NB乳も', p: 2000 }, { n: '41', t: '+2000', p: 2000 }, { n: '42', t: '+2000', p: 2000 }] },
  { label: '¥2,500 Op', items: [{ n: '50', t: '上生乳', p: 2500 }, { n: '51', t: '+2500', p: 2500 }, { n: '52', t: '+2500', p: 2500 }] },
  { label: '¥3,000 Op', price: 3000, items: [{ n: '60', t: 'Tレス', p: 3000 }, { n: '61', t: 'バリュ', p: 3000 }, { n: '62', t: 'NB生乳', p: 3000 }, { n: '63', t: '+3000', p: 3000 }, { n: '64', t: '+3000', p: 3000 }] },
  { label: '¥3,500 Op', price: 3500, items: [{ n: '71', t: 'T生乳も', p: 3500 }] },
];

// 📍 添い寝専用 OP（時間によって金額が変わるため、IDを固有化）
const SOINE_OPS = [
  { label: '添い寝 45分価格', items: [
    { n: '1', t: 'OP1', p: 1000, id: '45-1' }, { n: '2', t: 'OP2', p: 1000, id: '45-2' }, { n: '3', t: 'OP3', p: 1000, id: '45-3' }, { n: '4', t: 'OP4', p: 1000, id: '45-4' }, { n: '5', t: 'OP5', p: 1000, id: '45-5' },
    { n: '3-1', t: '3点1', p: 2500, id: '45-3-1' }, { n: '3-2', t: '3点2', p: 2500, id: '45-3-2' }, { n: '3-3', t: '3点3', p: 2500, id: '45-3-3' }, { n: '3-4', t: '3点4', p: 2500, id: '45-3-4' }, { n: '3-5', t: '3点5', p: 2500, id: '45-3-5' },
  ]},
  { label: '添い寝 60分価格', items: [
    { n: '1', t: 'OP1', p: 1000, id: '60-1' }, { n: '2', t: 'OP2', p: 1000, id: '60-2' }, { n: '3', t: 'OP3', p: 1000, id: '60-3' }, { n: '4', t: 'OP4', p: 1000, id: '60-4' }, { n: '5', t: 'OP5', p: 1000, id: '60-5' },
    { n: '3-1', t: '3点1', p: 2000, id: '60-3-1' }, { n: '3-2', t: '3点2', p: 2000, id: '60-3-2' }, { n: '3-3', t: '3点3', p: 2000, id: '60-3-3' }, { n: '3-4', t: '3点4', p: 2000, id: '60-3-4' }, { n: '3-5', t: '3点5', p: 2000, id: '60-3-5' },
  ]},
  { label: '添い寝 90分価格', items: [
    { n: '1', t: 'OP1', p: 500, id: '90-1' }, { n: '2', t: 'OP2', p: 500, id: '90-2' }, { n: '3', t: 'OP3', p: 500, id: '90-3' }, { n: '4', t: 'OP4', p: 500, id: '90-4' }, { n: '5', t: 'OP5', p: 500, id: '90-5' },
    { n: '3-1', t: '3点1', p: 1500, id: '90-3-1' }, { n: '3-2', t: '3点2', p: 1500, id: '90-3-2' }, { n: '3-3', t: '3点3', p: 1500, id: '90-3-3' }, { n: '3-4', t: '3点4', p: 1500, id: '90-3-4' }, { n: '3-5', t: '3点5', p: 1500, id: '90-3-5' },
  ]},
  { label: '添い寝 120分価格', items: [
    { n: '1', t: 'OP1', p: 500, id: '120-1' }, { n: '2', t: 'OP2', p: 500, id: '120-2' }, { n: '3', t: 'OP3', p: 500, id: '120-3' }, { n: '4', t: 'OP4', p: 500, id: '120-4' }, { n: '5', t: 'OP5', p: 500, id: '120-5' },
    { n: '3-1', t: '3点1', p: 1000, id: '120-3-1' }, { n: '3-2', t: '3点2', p: 1000, id: '120-3-2' }, { n: '3-3', t: '3点3', p: 1000, id: '120-3-3' }, { n: '3-4', t: '3点4', p: 1000, id: '120-3-4' }, { n: '3-5', t: '3点5', p: 1000, id: '120-3-5' },
  ]},
];

export default function OpCalculator({ selectedRes, initialTotal, supabase, onToast, onClose, isInCall, setIsInCall }: any) {
  const [selectedOps, setSelectedOps] = useState<{name: string, price: number, id: string}[]>([]);
  const [isSending, setIsSending] = useState(false);

  // 📍 サービスタイプでリスト切り替え
  const currentCategories = useMemo(() => {
    return selectedRes.service_type === '添' ? SOINE_OPS : KARINTO_OPS;
  }, [selectedRes.service_type]);

  const opsTotal = useMemo(() => selectedOps.reduce((sum, op) => sum + op.price, 0), [selectedOps]);
  const displayTotal = initialTotal + opsTotal;

  const toggleOp = (id: string, text: string, price: number, label: string) => {
    setSelectedOps((prev) => {
      const isAlreadySelected = prev.some(op => op.id === id);
      if (isAlreadySelected) return prev.filter(op => op.id !== id);
      // 添い寝の場合は通知時にわかりやすいようラベル（時間）を付与
      const displayName = selectedRes.service_type === '添' ? `${label.split(' ')[1]}-${text}` : text;
      return [...prev, { id, name: displayName, price }];
    });
  };

  const sendNotification = async (type: 'START' | 'ADD' | 'HELP') => {
    if (!supabase) return;
    setIsSending(true);
    const opNames = selectedOps.map(o => o.name).join('/');
    const prefix = selectedRes.service_type === '添' ? '【添】' : '【か】';
    
    let message = "";
    if (type === 'HELP') message = `${prefix}【呼出】${selectedRes.customer_name}様：スタッフ至急！`;
    else if (type === 'START') message = `${prefix}【入室】${selectedRes.customer_name}様：¥${displayTotal.toLocaleString()}（${opNames || '無'}）`;
    else message = `${prefix}【追加】${selectedRes.customer_name}様：追加（${opNames}）計¥${opsTotal.toLocaleString()}`;

    try {
      await supabase.from('notifications').insert({
        shop_id: selectedRes.shop_id,
        cast_id: selectedRes.login_id,
        message,
        is_read: false
      });
      if (type === 'START') setIsInCall(true);
      setSelectedOps([]); 
      onToast("送信しました");
      if (type === 'START') onClose();
    } catch (err) {
      alert("送信失敗");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-gray-900 text-white animate-in fade-in duration-200 overflow-hidden font-sans">
      
      {/* 1. 金額ヘッダー */}
      <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <div>
          <p className="text-[10px] text-pink-400 font-black uppercase tracking-widest leading-none mb-1">
             {selectedRes.service_type === '添' ? '添い寝・精算' : 'かりんと・精算'}
          </p>
          <p className="text-[28px] font-black text-green-400 tabular-nums leading-none">¥{displayTotal.toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-full text-2xl font-bold active:scale-90 transition-transform">×</button>
      </div>

      {/* 2. 選択済みOP一覧 */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-2.5 min-h-[54px] flex flex-wrap gap-1.5 shrink-0 items-center overflow-y-auto max-h-[140px] z-10 shadow-lg">
        {selectedOps.length === 0 ? (
          <p className="text-[11px] text-gray-500 font-black italic pl-1 opacity-60">※ オプションを選択してください</p>
        ) : (
          selectedOps.map((op) => (
            <button key={op.id} onClick={() => toggleOp(op.id, op.name, op.price, "")}
              className="bg-pink-600 border border-pink-400 text-white px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 active:scale-95 transition-all shadow-md"
            >
              {op.name} <span className="text-[14px] leading-none opacity-50 ml-0.5">×</span>
            </button>
          ))
        )}
      </div>

      {/* 3. メイングリッド：縦スクロール */}
      <div className="flex-1 overflow-y-auto px-2 pt-3 pb-40 space-y-6 scrollbar-hide overscroll-contain">
        {currentCategories.map((cat) => (
          <div key={cat.label} className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-500 px-1 uppercase tracking-[0.2em] border-l-2 border-pink-500/50 ml-1">
              {cat.label}
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {cat.items.map((item: any) => {
                const isSelected = selectedOps.some(op => op.id === (item.id || item.n));
                return (
                  <button 
                    key={item.id || item.n} 
                    onClick={() => toggleOp(item.id || item.n, item.t, item.p, cat.label)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-150 border
                      ${isSelected ? 'bg-pink-500 border-pink-300 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-90' : 'bg-white/5 border-white/5 text-gray-400 active:bg-white/10'}`}
                  >
                    <span className={`text-[15px] font-black leading-none mb-0.5 ${isSelected ? 'text-white' : 'text-gray-200'}`}>{item.n}</span>
                    <span className={`text-[8px] font-bold leading-none truncate w-full px-0.5 text-center ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>{item.t}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. アクションボタン */}
      <div className="p-4 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 fixed bottom-0 left-0 right-0 z-40 flex gap-2">
        <button onClick={() => sendNotification('HELP')} disabled={isSending} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-black text-[14px] active:scale-95 transition-all">✋ 呼出</button>
        <button 
          onClick={() => sendNotification(isInCall ? 'ADD' : 'START')}
          disabled={isSending}
          className={`flex-[2.5] py-4 rounded-2xl font-black text-[18px] shadow-2xl transition-all active:scale-[0.97]
            ${isInCall ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}
            ${isSending ? 'opacity-50' : ''}
          `}
        >
          {isSending ? '...' : isInCall ? '🔥 追加OPを店に通知' : '🚀 スタート'}
        </button>
      </div>
    </div>
  );
}