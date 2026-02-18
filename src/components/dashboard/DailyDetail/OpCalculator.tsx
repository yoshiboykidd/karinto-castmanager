'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SHOP_ID_MAP: { [key: string]: number } = {
  '池袋東口': 11, '池東': 11,
  '池袋西口': 6,  '池西': 6,
  '大久保': 10,
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
  const [dbRes, setDbRes] = useState(selectedRes);

  const fetchLatest = async () => {
    try {
      const { data } = await supabase.from('reservations').select('*').eq('id', selectedRes.id);
      if (data && data.length > 0) setDbRes(data[0]);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchLatest();
  }, [selectedRes.id]);

  const isActuallyPlaying = useMemo(() => isInCall || dbRes?.status === 'playing', [isInCall, dbRes?.status]);
  const isCompleted = useMemo(() => dbRes?.status === 'completed', [dbRes?.status]);
  const currentCategories = useMemo(() => dbRes?.service_type === '添' ? SOINE_OPS : KARINTO_OPS, [dbRes?.service_type]);

  const savedOpsActive = useMemo(() => {
    const details = Array.isArray(dbRes?.op_details) ? dbRes.op_details : [];
    return details.filter((op: any) => op?.status !== 'canceled');
  }, [dbRes?.op_details]);

  const opsTotal = useMemo(() => {
    const savedSum = savedOpsActive.reduce((sum: number, op: any) => sum + (op?.price || 0), 0);
    const newSum = selectedOps.reduce((sum, op) => sum + (op?.price || 0), 0);
    return savedSum + newSum;
  }, [selectedOps, savedOpsActive]);

  const displayTotal = useMemo(() => {
    if (isCompleted && dbRes?.actual_total_price) return Number(dbRes.actual_total_price);
    return initialTotal + opsTotal;
  }, [isCompleted, dbRes?.actual_total_price, initialTotal, opsTotal]);

  const toggleOp = (no: string, text: string, price: number, catLabel: string) => {
    if (isCompleted) return;
    setSelectedOps((prev) => {
      const opId = dbRes?.service_type === '添' ? `${catLabel}-${no}` : no;
      const isAlreadySelected = prev.some(op => (dbRes?.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) === opId);
      if (isAlreadySelected) return prev.filter(op => (dbRes?.service_type === '添' ? `${op.catLabel}-${op.no}` : op.no) !== opId);
      return [...prev, { no, name: text, price, catLabel, timing: 'additional', status: 'active' }];
    });
  };

  const sendNotification = async (type: 'START' | 'HELP' | 'FINISH') => {
    if (!dbRes?.id) return;
    setIsSending(true);

    try {
      const label = dbRes?.shop_label || "";
      const castId = String(dbRes?.login_id || dbRes?.cast_id || "");
      let shopNo = SHOP_ID_MAP[label] || Number(dbRes?.shop_id || 0) || null;

      const nowTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
      const timeRange = `${String(dbRes.start_time || "").substring(0, 5)}-${String(dbRes.end_time || "").substring(0, 5)}`;
      
      const allOps = [...savedOpsActive, ...selectedOps];
      const opNos = allOps.map(o => o.no).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})).join('，');
      
      let statusText = type === 'START' ? '入室完了' : type === 'FINISH' ? 'プレイ終了' : 'スタッフ呼出';

      // 📍 修正：ご要望の通知フォーマットに変更
      const message = `【${dbRes.course_info || 'コース未設定'}】【${timeRange}】\n` +
                      `【${dbRes.customer_name || '不明'}様】\n` +
                      `【${nowTime}】 ${statusText}\n` +
                      `【Op】(${opNos || 'なし'}) ${displayTotal.toLocaleString()}円`;

      if (type === 'START' || type === 'FINISH') {
        const updateData: any = { 
          actual_total_price: displayTotal, 
          op_details: [...(Array.isArray(dbRes.op_details) ? dbRes.op_details : []), ...selectedOps], 
          updated_at: new Date().toISOString() 
        };
        if (type === 'START') { updateData.status = 'playing'; }
        if (type === 'FINISH') { updateData.status = 'completed'; }
        await supabase.from('reservations').update(updateData).eq('id', dbRes.id);
      }

      await supabase.from('notifications').insert({ 
        shop_id: shopNo, 
        cast_id: castId, 
        type: type === 'HELP' ? 'help' : 'in_out',
        content: message, 
      });

      onToast("送信完了");
      await fetchLatest();
      setTimeout(() => onClose(), 500);
    } catch (err: any) { alert(`エラー: ${err.message}`); }
    finally { setIsSending(false); }
  };

  const handleReEdit = () => {
    if (!confirm("完了済みの予約を修正モードに戻しますか？")) return;
    supabase.from('reservations').update({ status: 'playing' }).eq('id', dbRes.id).then(() => fetchLatest());
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] z-[99999] flex flex-col bg-gray-900 text-white overflow-hidden font-sans">
      {/* ヘッダー */}
      <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[26px] font-black text-green-400 tabular-nums leading-none">
            <span className="text-[13px] opacity-60">¥</span>{displayTotal.toLocaleString()}
          </p>
        </div>
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-full text-2xl font-bold">×</button>
      </div>

      {/* オプションリスト */}
      <div className="flex-1 overflow-y-auto px-2 pt-3 pb-6 space-y-6 overscroll-contain">
        {currentCategories.map((cat: any) => (
          <div key={cat.label} className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-500 px-1 uppercase border-l-2 border-pink-500 ml-1 tracking-widest">{cat.label}</h3>
            <div className="grid grid-cols-4 gap-2">
              {cat.items.map((item: any) => {
                const isSelected = selectedOps.some(op => op.no === item.n && (dbRes?.service_type !== '添' || op.catLabel === cat.label));
                const isSaved = savedOpsActive.some((op: any) => op?.no === item.n && (dbRes?.service_type !== '添' || op.catLabel === cat.label));
                return (
                  <button key={`${cat.label}-${item.n}`} onClick={() => toggleOp(item.n, item.t, item.p || (cat as any).price || 0, cat.label)} className={`min-h-[75px] rounded-[20px] flex flex-col items-center justify-center border transition-all ${isSelected || isSaved ? 'bg-pink-500 border-pink-300' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    <span className="text-[20px] font-black">{item.n}</span>
                    <span className="text-[11px] font-black leading-tight text-center px-1">{item.t}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="shrink-0 p-4 bg-gray-900 border-t border-gray-800 flex gap-2 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        {isCompleted ? (
          <div className="flex-1 flex flex-col gap-2">
            <div className="py-4 bg-gray-800 text-gray-400 rounded-2xl font-black text-center">✅ プレイ終了済み</div>
            <button onClick={handleReEdit} className="py-3 bg-red-900/30 text-red-400 border border-red-900/50 rounded-xl text-xs font-black active:scale-95 transition-all">⚠️ 内容を修正する</button>
          </div>
        ) : (
          <>
            <button onClick={() => sendNotification('HELP')} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-black text-[13px] active:scale-95 transition-transform">✋ 呼出</button>
            <button onClick={() => sendNotification(isActuallyPlaying ? 'FINISH' : 'START')} disabled={isSending} className={`flex-[2.5] py-4 rounded-2xl font-black text-[18px] shadow-xl transition-all ${isActuallyPlaying ? 'bg-orange-600 shadow-orange-900/40' : 'bg-green-500 shadow-green-900/40'}`}>
              {isSending ? '...' : isActuallyPlaying ? '🏁 プレイ終了' : '🚀 スタート'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}