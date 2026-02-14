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
      className={`relative bg-gradient-to-br ${c.bgFrom} ${c.bgTo} rounded-[32px] p-5 border ${c.border} overflow-hidden shadow-sm flex flex-col space-y-3 subpixel-antialiased cursor-pointer select-none`}
    >
      {/* 📍 KCM画像の蓋 */}
      {isCovered && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-md transition-all duration-300">
          <img src={imageURL} alt="KCM Cover" className="w-full h-full object-cover opacity-90" />
          <div className="absolute bottom-3 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full">
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Tap to reveal</p>
          </div>
        </div>
      )}

      {/* 1行目：表題（中央配置） */}
      <div className="text-center relative z-10">
        <h2 className={`text-[20px] font-black ${c.textSub} tracking-tighter leading-none`}>{month}の実績</h2>
      </div>

      {/* 2行目：出勤・稼働・当欠・遅刻 */}
      <div className={`relative z-10 flex justify-between bg-white/90 px-4 py-2 rounded-2xl border ${c.subBorder} shadow-sm text-[12px] font-black ${c.textSub} tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>
        <span>出勤 {totals.count || 0}日</span>
        <span>稼働 {Math.round(totals.hours * 10) / 10}h</span>
        <span className="text-red-500">当欠 {totals.absent || 0}日</span>
        <span className="text-orange-500">遅刻 {totals.late || 0}回</span>
      </div>
      
      {/* 3行目：報酬合計金額 */}
      <div className="text-center relative z-10 py-1">
        <p className={`text-[56px] font-black ${c.textMain} leading-none tracking-tighter filter drop-shadow-sm [text-shadow:_0.8px_0_0_currentColor]`}>
          <span className="text-3xl mr-1 opacity-40 translate-y-[-6px] inline-block font-black">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* 4〜6行目：指名数グリッド */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border ${c.subBorder} shadow-sm overflow-hidden relative z-10 divide-y divide-gray-100`}>
        {/* 4行目：ラベル */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr] py-2 text-center items-center">
          <div />
          <p className={`text-[11px] ${c.textLabel} font-black tracking-widest`}>フリー</p>
          <p className={`text-[11px] ${c.textLabel} font-black tracking-widest`}>初指名</p>
          <p className={`text-[11px] ${c.textLabel} font-black tracking-widest`}>本指名</p>
        </div>

        {/* 5行目：〈か〉 */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr] py-3 text-center items-center">
          <p className={`text-[12px] font-black ${c.textSub} opacity-60 tracking-tighter`}>〈か〉</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_f || 0}</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_first || 0}</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_main || 0}</p>
        </div>

        {/* 6行目：〈添〉 */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr] py-3 text-center items-center bg-white/30">
          <p className={`text-[12px] font-black ${c.textSub} opacity-60 tracking-tighter`}>〈添〉</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_f || 0}</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_first || 0}</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_main || 0}</p>
        </div>
      </div>
    </section>
  );
}