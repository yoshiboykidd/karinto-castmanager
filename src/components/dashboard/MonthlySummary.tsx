'use client';

import { useState } from 'react';

export default function MonthlySummary({ month, totals, targetAmount = 0, theme = 'pink' }: any) {
  const [isCovered, setIsCovered] = useState(true);

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
      className={`relative bg-gradient-to-br ${c.bgFrom} ${c.bgTo} rounded-[32px] p-4 border ${c.border} overflow-hidden shadow-sm flex flex-col space-y-2 subpixel-antialiased cursor-pointer select-none`}
    >
      {isCovered && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-md transition-all duration-300">
          <img src={imageURL} alt="KCM Cover" className="w-full h-full object-cover opacity-90" />
          <div className="absolute bottom-3 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full">
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Tap to reveal</p>
          </div>
        </div>
      )}

      {/* 1行目：表題（中央配置・上下を詰める） */}
      <div className="text-center relative z-10 pt-1">
        <h2 className={`text-[18px] font-black ${c.textSub} tracking-tighter leading-none`}>{month}の実績</h2>
      </div>

      {/* 2行目：実績バッジ（1行に横並び・3桁対応） */}
      <div className="flex justify-between gap-1 relative z-10">
        {[
          { label: '出勤', val: totals.count, unit: '日', text: c.textSub },
          { label: '稼働', val: Math.round(totals.hours * 10) / 10, unit: 'h', text: c.textSub },
          { label: '当欠', val: totals.absent || 0, unit: '日', text: 'text-red-500' },
          { label: '遅刻', val: totals.late || 0, unit: '回', text: 'text-orange-500' }
        ].map((item, i) => (
          <div key={i} className={`bg-white/90 px-1 py-1.5 rounded-xl border ${c.subBorder} shadow-sm flex items-baseline justify-center flex-1 min-w-0`}>
            <span className="text-[8px] font-bold text-gray-400 mr-0.5 shrink-0">{item.label}</span>
            <span className={`text-[19px] font-black ${item.text} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{item.val}</span>
            <span className="text-[8px] font-bold text-gray-400 ml-0.5 shrink-0">{item.unit}</span>
          </div>
        ))}
      </div>
      
      {/* 3行目：合計金額（高さを抑えつつ巨大な文字サイズ） */}
      <div className="text-center relative z-10 -my-1">
        <p className={`text-[52px] font-black ${c.textMain} leading-none tracking-tighter filter drop-shadow-sm [text-shadow:_0.8px_0_0_currentColor]`}>
          <span className="text-2xl mr-0.5 opacity-40 translate-y-[-4px] inline-block font-black">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* 4行目：表題（枠の外・重ならないように配置） */}
      <div className="grid grid-cols-[60px_1fr_1fr_1fr] relative z-10 px-1 pt-1">
        <div />
        <p className={`text-[10px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>フリー</p>
        <p className={`text-[10px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>初指名</p>
        <p className={`text-[10px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>本指名</p>
      </div>

      {/* 5〜6行目：実績（白枠内） */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-[24px] border ${c.subBorder} shadow-sm divide-y divide-gray-50 relative z-10`}>
        {/* 〈か〉行 */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr] py-2 items-center text-center">
          <div className="flex justify-center">
            <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none shadow-sm">〈か〉</span>
          </div>
          <p className={`text-[24px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_f || 0}</p>
          <p className={`text-[24px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_first || 0}</p>
          <p className={`text-[24px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_main || 0}</p>
        </div>
        {/* 〈添〉行 */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr] py-2 items-center text-center bg-gray-50/10">
          <div className="flex justify-center">
            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none shadow-sm">〈添〉</span>
          </div>
          <p className={`text-[24px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_f || 0}</p>
          <p className={`text-[24px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_first || 0}</p>
          <p className={`text-[24px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_main || 0}</p>
        </div>
      </div>
    </section>
  );
}