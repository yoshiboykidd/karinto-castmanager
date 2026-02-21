'use client';

import { useState, useMemo } from 'react';

export default function MonthlySummary({ month, totals, reservations = [], targetAmount = 0, theme = 'pink' }: any) {
  const [isCovered, setIsCovered] = useState(true);

  // 💡 修正：計算ロジックを追加
  const calculatedTotals = useMemo(() => {
    return (reservations || []).reduce((acc: any, res: any) => {
      // 大文字小文字・空白を無視して判定
      const currentStatus = String(res.status || '').toLowerCase().trim();

      if (currentStatus === 'completed') {
        const isSoe = res.service_type === '添';
        const cat = res.nomination_category;
        
        // 金額の加算 (actual_total_price)
        acc.amount += Number(res.actual_total_price) || 0;

        // 指名数のカウント
        if (isSoe) {
          if (cat === 'FREE') acc.soe_f++;
          else if (cat === '初指') acc.soe_first++;
          else if (cat === '本指') acc.soe_main++;
        } else {
          if (cat === 'FREE') acc.ka_f++;
          else if (cat === '初指') acc.ka_first++;
          else if (cat === '本指') acc.ka_main++;
        }
      }
      return acc;
    }, {
      amount: 0,
      ka_f: 0, ka_first: 0, ka_main: 0,
      soe_f: 0, soe_first: 0, soe_main: 0
    });
  }, [reservations]);

  const imageURL = "https://gstsgybukinlkzdqotyv.supabase.co/storage/v1/object/public/assets/KCMlogo.png";

  const THEME_STYLES: any = {
    pink:   { bgFrom: 'from-[#FFE9ED]', bgTo: 'to-[#FFF5F7]', border: 'border-pink-200',  textMain: 'text-pink-600', textSub: 'text-pink-500',  textLabel: 'text-pink-400',  subBorder: 'border-pink-50',  bar: 'bg-pink-400' },
    blue:   { bgFrom: 'from-blue-50',   bgTo: 'to-blue-100',   border: 'border-blue-200',  textMain: 'text-blue-600', textSub: 'text-blue-500',  textLabel: 'text-blue-400',  subBorder: 'border-blue-100', bar: 'bg-blue-400' },
    yellow: { bgFrom: 'from-yellow-50', bgTo: 'to-yellow-100', border: 'border-yellow-200', textMain: 'text-yellow-600', textSub: 'text-yellow-500', textLabel: 'text-yellow-400', subBorder: 'border-yellow-100', bar: 'bg-yellow-400' },
    white:  { bgFrom: 'from-white',     bgTo: 'to-gray-50',    border: 'border-gray-200',  textMain: 'text-gray-600', textSub: 'text-gray-500',  textLabel: 'text-gray-400',  subBorder: 'border-gray-100', bar: 'bg-gray-400' },
    black:  { bgFrom: 'from-gray-100',  bgTo: 'to-gray-200',   border: 'border-gray-300',  textMain: 'text-gray-800', textSub: 'text-gray-700',  textLabel: 'text-gray-500',  subBorder: 'border-gray-200', bar: 'bg-gray-700' },
    red:    { bgFrom: 'from-red-50',    bgTo: 'to-red-100',    border: 'border-red-200',   textMain: 'text-red-600',  textSub: 'text-red-500',   textLabel: 'text-red-400',   subBorder: 'border-red-100',  bar: 'bg-red-400' },
  };
  
  const c = THEME_STYLES[theme] || THEME_STYLES.pink;

  return (
    <section 
      onClick={() => setIsCovered(!isCovered)}
      className={`relative bg-gradient-to-br ${c.bgFrom} ${c.bgTo} rounded-[32px] p-4 border ${c.border} overflow-hidden shadow-sm flex flex-col space-y-1.5 subpixel-antialiased cursor-pointer select-none`}
    >
      {isCovered && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-md transition-all duration-300">
          <img src={imageURL} alt="KCM Cover" className="w-full h-full object-cover opacity-90" />
          <div className="absolute bottom-3 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full">
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Tap to reveal</p>
          </div>
        </div>
      )}

      <div className="text-center relative z-10">
        <h2 className={`text-[18px] font-black ${c.textSub} tracking-tighter leading-none`}>{month}の実績</h2>
      </div>

      <div className="flex justify-between gap-1 relative z-10">
        {[
          { label: '出勤', val: totals.count, unit: '日', text: c.textSub },
          { label: '稼働', val: Math.round(totals.hours * 10) / 10, unit: 'h', text: c.textSub },
          { label: '当欠', val: totals.absent || 0, unit: '日', text: 'text-red-500' },
          { label: '遅刻', val: totals.late || 0, unit: '回', text: 'text-orange-500' }
        ].map((item, i) => (
          <div key={i} className={`bg-white/90 px-1 py-1.5 rounded-xl border ${c.subBorder} shadow-sm flex items-baseline justify-center flex-1 min-w-0`}>
            <span className="text-[8px] font-bold text-gray-400 mr-0.5 shrink-0">{item.label}</span>
            <span className={`text-[18px] font-black ${item.text} leading-none tracking-tighter`}>{item.val}</span>
            <span className="text-[8px] font-bold text-gray-400 ml-0.5 shrink-0">{item.unit}</span>
          </div>
        ))}
      </div>
      
      <div className="text-center relative z-10 -my-2">
        <p className={`text-[52px] font-black ${c.textMain} leading-none tracking-tighter filter drop-shadow-sm [text-shadow:_0.8px_0_0_currentColor]`}>
          <span className="text-2xl mr-0.5 opacity-40 translate-y-[-4px] inline-block font-black">¥</span>
          {/* 💡 修正：集計結果を表示 */}
          {calculatedTotals.amount.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-[56px_1fr_1fr_1fr] relative z-10 px-1 pt-1">
        <div />
        <p className={`text-[9px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>フリー</p>
        <p className={`text-[9px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>初指名</p>
        <p className={`text-[9px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>本指名</p>
      </div>

      <div className="space-y-1.5 relative z-10">
        <div className="grid grid-cols-[56px_1fr_1fr_1fr] items-center text-center bg-blue-50/60 border border-blue-100/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex justify-center py-2 bg-blue-500 text-white border-r border-blue-400/30">
            <span className="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded shrink-0">か</span>
          </div>
          {/* 💡 修正：集計結果を表示 */}
          <p className="py-2 text-[24px] font-black text-blue-600/90 leading-none tracking-tighter">{calculatedTotals.ka_f || 0}</p>
          <p className="py-2 text-[24px] font-black text-blue-600/90 leading-none tracking-tighter">{calculatedTotals.ka_first || 0}</p>
          <p className="py-2 text-[24px] font-black text-blue-600/90 leading-none tracking-tighter">{calculatedTotals.ka_main || 0}</p>
        </div>

        <div className="grid grid-cols-[56px_1fr_1fr_1fr] items-center text-center bg-pink-50/60 border border-pink-100/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex justify-center py-2 bg-pink-500 text-white border-r border-pink-400/30">
            <span className="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded shrink-0">添</span>
          </div>
          {/* 💡 修正：集計結果を表示 */}
          <p className="py-2 text-[24px] font-black text-pink-600/90 leading-none tracking-tighter">{calculatedTotals.soe_f || 0}</p>
          <p className="py-2 text-[24px] font-black text-pink-600/90 leading-none tracking-tighter">{calculatedTotals.soe_first || 0}</p>
          <p className="py-2 text-[24px] font-black text-pink-600/90 leading-none tracking-tighter">{calculatedTotals.soe_main || 0}</p>
        </div>
      </div>
    </section>
  );
}