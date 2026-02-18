'use client';

import React, { useState, useMemo } from 'react';

// 📍 かりんと専用オプションデータ（テキストを詳細版に更新）
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

// 📍 添い寝専用オプションデータ（コース時間別）
const SOINE_OPS = [
  { label: '45分価格', items: [{ n: '1', t: 'OP1', p: 1000 }, { n: '2', t: 'OP2', p: 1000 }, { n: '3', t: 'OP3', p: 1000 }, { n: '4', t: 'OP4', p: 1000 }, { n: '5', t: 'OP5', p: 1000 }, { n: '3-1', t: '3点1', p: 2500 }, { n: '3-2', t: '3点2', p: 2500 }, { n: '3-3', t: '3点3', p: 2500 }, { n: '3-4', t: '3点4', p: 2500 }, { n: '3-5', t: '3点5', p: 2500 }] },
  { label: '60分価格', items: [{ n: '1', t: 'OP1', p: 1000 }, { n: '2', t: 'OP2', p: 1000 }, { n: '3', t: 'OP3', p: 1000 }, { n: '4', t: 'OP4', p: 1000 }, { n: '5', t: 'OP5', p: 1000 }, { n: '3-1', t: '3点1', p: 2000 }, { n: '3-2', t: '3点2', p: 2000 }, { n: '3-3', t: '3点3', p: 2000 }, { n: '3-4', t: '3点4', p: 2000 }, { n: '3-5', t: '3点5', p: 2000 }] },
  { label: '90分価格', items: [{ n: '1', t: 'OP1', p: 500 }, { n: '2', t: 'OP2', p: 500 }, { n: '3', t: 'OP3', p: 500 }, { n: '4', t: 'OP4', p: 500 }, { n: '5', t: 'OP5', p: 500 }, { n: '3-1', t: '3点1', p: 1500 }, { n: '3-2', t: '3点2', p: 1500 }, { n: '3-3', t: '3点3', p: 1500 }, { n: '3-4', t: '3点4', p: 1500 }, { n: '3-5', t: '3点5', p: 1500 }] },
  { label: '120分価格', items: [{ n: '1', t: 'OP1', p: 500 }, { n: '2', t: 'OP2', p: 500 }, { n: '3', t: 'OP3', p: 500 }, { n: '4', t: 'OP4', p: 500 }, { n: '5', t: 'OP5', p: 500 }, { n: '3-1', t: '3点1', p: 1000 }, { n: '3-2', t: '3点2', p: 1000 }, { n: '3-3', t: '3点3', p: 1000 }, { n: '3-4', t: '3点4', p: 1000 }, { n: '3-5', t: '3点5', p: 1000 }] },
];

export default function OpCalculator({ selectedRes, initialTotal, supabase, onToast, onClose, isInCall, setIsInCall }: any) {
  const [selectedOps, setSelectedOps] = useState<{name: string, price: number, no: string, catLabel?: string}[]>([]);
  const [isSending, setIsSending] = useState(false);

  const currentCategories = useMemo(() => {
    return selectedRes.service_type === '添' ? SOINE_OPS : KARINTO_OPS;
  }, [selectedRes.service_type]);

  const opsTotal = useMemo(() => selectedOps.reduce((sum, op) => sum + op.price, 0), [selectedOps]);
  const displayTotal = initialTotal + opsTotal;

  const toggleOp = (no: string, text: string, price: number, catLabel: string) => {
    setSelectedOps((prev) => {
      const opId = selectedRes.service_type === '添' ? `${catLabel}-${no}` : no;
      const isAlreadySelected = prev.some(op => (selectedRes.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) === opId);
      
      if (isAlreadySelected) {
        return prev.filter(op => (selectedRes.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) !== opId);
      }
      return [...prev, { no, name: text, price, catLabel }];
    });
  };

  const sendNotification = async (type: 'START' | 'ADD' | 'HELP') => {
    if (!supabase || !selectedRes?.id) return;
    setIsSending(true);

    const opNames = selectedOps.map(o => `${o.no}.${o.name}`).join('/');
    const prefix = selectedRes.service_type === '添' ? '【添】' : '【か】';

    try {
      if (type === 'START' || type === 'ADD') {
        const updateData: any = {
          actual_total_price: displayTotal,
          op_details: [...(selectedRes.op_details || []), ...selectedOps],
          updated_at: new Date().toISOString()
        };
        if (type === 'START') {
          updateData.status = 'playing';
          updateData.in_call_at = new Date().toISOString();
        }
        const { error: updateError } = await supabase.from('reservations').update(updateData).eq('id', selectedRes.id);
        if (updateError) throw updateError;
      }

      let message = "";
      if (type === 'HELP') {
        message = `${prefix}【呼出】${selectedRes.customer_name}様：スタッフ至急！`;
      } else if (type === 'START') {
        message = `${prefix}【入室】${selectedRes.customer_name}様：¥${displayTotal.toLocaleString()}（内訳:${opNames || '無'}）`;
      } else {
        message = `${prefix}【追加】${selectedRes.customer_name}様：追加OP（${opNames}）計¥${opsTotal.toLocaleString()}`;
      }

      const { error: notifyError } = await supabase.from('notifications').insert({
        shop_id: selectedRes.shop_id,
        cast_id: selectedRes.login_id,
        type: type.toLowerCase(),
        message,
        is_read: false
      });
      if (notifyError) throw notifyError;

      if (type === 'START') setIsInCall(true);
      setSelectedOps([]); 
      onToast(type === 'HELP' ? "スタッフを呼びました" : "店舗へ通知・保存しました");
      if (type === 'START') onClose();
    } catch (err) {
      console.error(err);
      alert("通信エラーが発生しました。");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-gray-900 text-white animate-in fade-in duration-200 overflow-hidden font-sans">
      
      <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <div>
          <p className="text-[10px] text-pink-400 font-black uppercase tracking-widest leading-none mb-1">
             {selectedRes.service_type === '添' ? '添い寝コース' : 'かりんとコース'}
          </p>
          <p className="text-[28px] font-black text-green-400 tabular-nums leading-none">¥{displayTotal.toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-full text-2xl font-bold active:scale-90 transition-transform">×</button>
      </div>

      <div className="bg-gray-800 border-b border-gray-700 px-3 py-2.5 min-h-[54px] flex flex-wrap gap-1.5 shrink-0 items-center overflow-y-auto max-h-[140px] shadow-lg">
        {selectedOps.length === 0 ? (
          <p className="text-[11px] text-gray-500 font-black italic opacity-60 pl-1">※ オプションを選択してください</p>
        ) : (
          selectedOps.map((op) => (
            <button key={`${op.catLabel}-${op.no}`} onClick={() => toggleOp(op.no, op.name, op.price, op.catLabel || "")}
              className="bg-pink-600 border border-pink-400 text-white px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 active:scale-95 transition-all shadow-md animate-in zoom-in-90">
              <span className="opacity-70 text-[10px]">{op.no}.</span>{op.name}<span className="opacity-50 ml-0.5">×</span>
            </button>
          ))
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-3 pb-40 space-y-6 scrollbar-hide overscroll-contain">
        {currentCategories.map((cat: any) => (
          <div key={cat.label} className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-500 px-1 uppercase tracking-[0.2em] border-l-2 border-pink-500/50 ml-1">{cat.label}</h3>
            {/* 📍 グリッドを3列に変更し、視認性を向上 */}
            <div className="grid grid-cols-3 gap-2">
              {cat.items.map((item: any) => {
                const isSelected = selectedOps.some(op => op.no === item.n && (selectedRes.service_type !== '添' || op.catLabel === cat.label));
                const price = item.p || (cat as any).price || 0; 
                
                return (
                  <button key={`${cat.label}-${item.n}`} onClick={() => toggleOp(item.n, item.t, price, cat.label)}
                    className={`min-h-[80px] rounded-[24px] flex flex-col items-center justify-center transition-all duration-150 border px-1
                      ${isSelected 
                        ? 'bg-pink-500 border-pink-300 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-95' 
                        : 'bg-white/5 border-white/5 text-gray-400 active:bg-white/10'}`}>
                    {/* 📍 数字をさらに大きく (text-2xl) */}
                    <span className={`text-[22px] font-black leading-none mb-1 ${isSelected ? 'text-white' : 'text-gray-100'}`}>{item.n}</span>
                    {/* 📍 文字を大きくし、2行で収まるように設定 */}
                    <span className={`text-[12px] font-black leading-[1.1] text-center line-clamp-2 break-words px-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {item.t}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 fixed bottom-0 left-0 right-0 z-40 flex gap-2">
        <button onClick={() => sendNotification('HELP')} disabled={isSending} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-black text-[14px] active:scale-95 transition-all">✋ 呼出</button>
        <button 
          onClick={() => sendNotification(isInCall ? 'ADD' : 'START')}
          disabled={isSending || (selectedOps.length === 0 && isInCall)}
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