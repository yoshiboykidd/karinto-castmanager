'use client';

import { useState } from 'react';

export default function MonthlySummary({ month, totals, targetAmount = 0, theme = 'pink' }: any) {
  const [isCovered, setIsCovered] = useState(true); // 初期状態は蓋（KCM画像）を表示

  // 📍 提供されたSupabaseのURLを設定
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
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.floor((totals.amount / targetAmount) * 100)) : 0;

  return (
    <section 
      onClick={() => setIsCovered(!isCovered)} // 枠全体タップで開閉
      className={`relative bg-gradient-to-br ${c.bgFrom} ${c.bgTo} rounded-[32px] p-5 border ${c.border} overflow-hidden shadow-sm flex flex-col space-y-4 subpixel-antialiased cursor-pointer select-none`}
    >
      {/* 📍 KCM画像の蓋 */}
      {isCovered && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-md transition-all duration-300">
          <img src={imageURL} alt="KCM Cover" className="w-full h-full object-cover opacity-90" />
          <div className="absolute bottom-3 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full">
            <p className="text-[10px] font-black text-white uppercase tracking-widest text-shadow-sm">Tap to reveal</p>
          </div>
        </div>
      )}

      {/* 1行目：表題（中央配置） */}
      <div className="text-center relative z-10">
        <h2 className={`text-[20px] font-black ${c.textSub} tracking-tighter leading-none`}>{month}の実績</h2>
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
            <span className="text-[9px] font-bold text-gray-400 mr-0.5 shrink-0">{item.label}</span>
            <span className={`text-[19px] font-black ${item.text} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{item.val}</span>
            <span className="text-[9px] font-bold text-gray-400 ml-0.5 shrink-0">{item.unit}</span>
          </div>
        ))}
      </div>
      
      {/* 3行目：合計金額（デザイン不変） */}
      <div className="text-center flex flex-col items-center justify-center relative z-10 -my-1">
        <p className={`text-[56px] font-black ${c.textMain} leading-none tracking-tighter filter drop-shadow-sm [text-shadow:_0.8px_0_0_currentColor]`}>
          <span className="text-3xl mr-1 opacity-40 translate-y-[-6px] inline-block font-black">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* 目標ゲージ（デザイン不変） */}
      {targetAmount > 0 && (
        <div className="bg-white/40 rounded-xl p-2 border border-white/50 shadow-sm mx-1 relative z-10">
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-white/60 shadow-inner relative">
            <div className={`h-full ${c.bar} transition-all duration-1000 ease-out shadow-sm relative`} style={{ width: `${progressPercent}%` }}>
               <div className="absolute inset-0 w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,#fff_6px,#fff_12px)]"></div>
            </div>
          </div>
        </div>
      )}

      {/* 4行目：表題（枠の外に出したラベル） */}
      <div className="grid grid-cols-[50px_1fr_1fr_1fr] relative z-10 px-2 -mb-2">
        <div />
        <p className={`text-[11px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>フリー</p>
        <p className={`text-[11px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>初指名</p>
        <p className={`text-[11px] ${c.textLabel} font-black text-center tracking-widest scale-y-90`}>本指名</p>
      </div>

      {/* 5〜6行目：指名数グリッド（白枠内） */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border ${c.subBorder} shadow-sm divide-y divide-gray-50 relative z-10`}>
        {/* 5行目：〈か〉内訳 */}
        <div className="grid grid-cols-[50px_1fr_1fr_1fr] py-2.5 items-center text-center">
          <p className={`text-[11px] font-black ${c.textSub} opacity-60 tracking-tighter`}>〈か〉</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_f || 0}</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_first || 0}</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.ka_main || 0}</p>
        </div>
        {/* 6行目：〈添〉内訳 */}
        <div className="grid grid-cols-[50px_1fr_1fr_1fr] py-2.5 items-center text-center">
          <p className={`text-[11px] font-black ${c.textSub} opacity-60 tracking-tighter`}>〈添〉</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_f || 0}</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_first || 0}</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.soe_main || 0}</p>
        </div>
      </div>
    </section>
  );
}