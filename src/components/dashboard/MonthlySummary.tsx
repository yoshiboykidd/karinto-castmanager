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
      className={`relative bg-gradient-to-br ${c.bgFrom} ${c.bgTo} rounded-[32px] p-5 border ${c.border} overflow-hidden shadow-sm flex flex-col space-y-2 subpixel-antialiased cursor-pointer select-none`}
    >
      {/* 📍 KCM画像の蓋（isCoveredがtrueの時のみ最前面に表示） */}
      {isCovered && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-md transition-all duration-300">
          <img 
            src={imageURL} 
            alt="KCM Cover" 
            className="w-full h-full object-cover opacity-90"
          />
          {/* 下部に薄く案内を表示 */}
          <div className="absolute bottom-3 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full">
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Tap to reveal</p>
          </div>
        </div>
      )}

      {/* 以下、元の実績表示コンテンツ（蓋が開いた時に見える） */}
      <div className="flex items-center justify-between mb-1 relative z-10">
        <h2 className={`text-[20px] font-black ${c.textSub} tracking-tighter leading-none shrink-0`}>{month}の実績</h2>
        <div className="flex gap-1.5">
          <div className={`bg-white/90 px-3 py-1.5 rounded-xl border ${c.subBorder} shadow-sm flex items-baseline justify-center min-w-[70px]`}>
            <span className="text-[11px] font-bold text-gray-400 mr-1">出勤</span>
            <span className={`text-[24px] font-black ${c.textSub} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.count}</span>
            <span className="text-[11px] font-bold text-gray-400 ml-0.5">日</span>
          </div>
          <div className={`bg-white/90 px-3 py-1.5 rounded-xl border ${c.subBorder} shadow-sm flex items-baseline justify-center min-w-[70px]`}>
            <span className="text-[11px] font-bold text-gray-400 mr-1">稼働</span>
            <span className={`text-[24px] font-black ${c.textSub} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{Math.round(totals.hours * 10) / 10}</span>
            <span className="text-[11px] font-bold text-gray-400 ml-0.5">h</span>
          </div>
        </div>
      </div>
      
      <div className="text-center flex flex-col items-center justify-center relative z-10 -my-1">
        <p className={`text-[56px] font-black ${c.textMain} leading-none tracking-tighter filter drop-shadow-sm [text-shadow:_0.8px_0_0_currentColor]`}>
          <span className="text-3xl mr-1 opacity-40 translate-y-[-6px] inline-block">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {targetAmount > 0 && (
        <div className="bg-white/40 rounded-xl p-2.5 border border-white/50 shadow-sm mx-1 relative z-10">
          <div className="flex justify-between items-end mb-1.5 px-1">
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-gray-400 tracking-widest bg-white/60 px-1.5 py-0.5 rounded">GOAL</span>
                <span className={`text-[16px] font-black ${c.textSub} tracking-tight leading-none`}>¥{targetAmount.toLocaleString()}</span>
             </div>
             <div className="flex items-baseline">
                <span className={`text-[20px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{progressPercent}</span>
                <span className={`text-[10px] font-bold ${c.textLabel} ml-0.5`}>%</span>
             </div>
          </div>
          <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden border border-white/60 shadow-inner relative">
            <div className={`h-full ${c.bar} transition-all duration-1000 ease-out shadow-sm relative`} style={{ width: `${progressPercent}%` }}>
               <div className="absolute inset-0 w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,#fff_6px,#fff_12px)]"></div>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-3 bg-white/80 backdrop-blur-sm rounded-2xl border ${c.subBorder} shadow-sm divide-x divide-gray-100 py-2 relative z-10`}>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[11px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>フリー</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.f || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[11px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>初指名</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.first || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[11px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>本指名</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter [text-shadow:_0.4px_0_0_currentColor]`}>{totals.main || 0}</p>
        </div>
      </div>
    </section>
  );
}