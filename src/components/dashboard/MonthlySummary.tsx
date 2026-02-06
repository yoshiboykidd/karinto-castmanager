'use client';

import { useMemo } from 'react';

type MonthlySummaryProps = {
  month: string;
  totals: {
    amount: number;
    count: number;
    hours: number;
    f: number;
    first: number;
    main: number;
  };
  targetAmount?: number;
  theme?: string;
};

// ★カラー定義（ここをパステルに変更！）
const THEME_STYLES: any = {
  // パステル系 (薄め)
  pink:   { bgFrom: 'from-pink-50',   bgTo: 'to-pink-100',   border: 'border-pink-200',  textMain: 'text-pink-400', textSub: 'text-pink-400',  textLabel: 'text-pink-300',  subBorder: 'border-pink-100',  bar: 'bg-pink-300' },
  blue:   { bgFrom: 'from-cyan-50',   bgTo: 'to-cyan-100',   border: 'border-cyan-200',  textMain: 'text-cyan-500', textSub: 'text-cyan-400',  textLabel: 'text-cyan-300',  subBorder: 'border-cyan-100',  bar: 'bg-cyan-300' },
  yellow: { bgFrom: 'from-yellow-50', bgTo: 'to-yellow-100', border: 'border-yellow-200', textMain: 'text-yellow-500', textSub: 'text-yellow-500', textLabel: 'text-yellow-400', subBorder: 'border-yellow-100', bar: 'bg-yellow-300' },
  white:  { bgFrom: 'from-gray-50',   bgTo: 'to-gray-100',   border: 'border-gray-200',  textMain: 'text-gray-500', textSub: 'text-gray-400',  textLabel: 'text-gray-300',  subBorder: 'border-gray-100',  bar: 'bg-gray-300' },

  // クッキリ系 (濃いめ)
  black:  { bgFrom: 'from-gray-100',  bgTo: 'to-gray-200',   border: 'border-gray-300',  textMain: 'text-gray-800', textSub: 'text-gray-700',  textLabel: 'text-gray-500',  subBorder: 'border-gray-200',  bar: 'bg-gray-700' },
  red:    { bgFrom: 'from-red-50',    bgTo: 'to-red-100',    border: 'border-red-200',   textMain: 'text-red-600',  textSub: 'text-red-500',   textLabel: 'text-red-400',   subBorder: 'border-red-100',   bar: 'bg-red-400' },
};

export default function MonthlySummary({ 
  month, 
  totals, 
  targetAmount = 0, 
  theme = 'pink' 
}: MonthlySummaryProps) {
  
  const c = THEME_STYLES[theme] || THEME_STYLES.pink;

  const progressPercent = targetAmount > 0 
    ? Math.min(100, Math.floor((totals.amount / targetAmount) * 100)) 
    : 0;

  const isAchieved = progressPercent >= 100;

  return (
    <section className={`bg-gradient-to-br ${c.bgFrom} ${c.bgTo} rounded-[32px] p-4 border ${c.border} relative overflow-hidden shadow-sm flex flex-col space-y-1`}>
      
      {/* 上段 */}
      <div className="flex items-center justify-between h-9">
        <h2 className={`text-[20px] font-black ${c.textSub} tracking-tighter leading-none shrink-0`}>
          {month}の実績
        </h2>
        
        <div className="flex gap-1.5">
          <div className={`bg-white/90 px-3 py-1.5 rounded-xl border ${c.subBorder} shadow-sm flex items-baseline justify-center min-w-[70px]`}>
            <span className="text-[11px] font-bold text-gray-500 mr-1">出勤</span>
            <span className={`text-[26px] font-black ${c.textSub} leading-none tracking-tighter`}>{totals.count}</span>
            <span className="text-[12px] font-bold text-gray-400 ml-0.5">日</span>
          </div>
          <div className={`bg-white/90 px-3 py-1.5 rounded-xl border ${c.subBorder} shadow-sm flex items-baseline justify-center min-w-[70px]`}>
            <span className="text-[11px] font-bold text-gray-500 mr-1">稼働</span>
            <span className={`text-[26px] font-black ${c.textSub} leading-none tracking-tighter`}>{Math.round(totals.hours * 10) / 10}</span>
            <span className="text-[12px] font-bold text-gray-400 ml-0.5">h</span>
          </div>
        </div>
      </div>
      
      {/* 中段：合計金額 */}
      <div className="text-center h-[52px] flex flex-col items-center justify-center relative">
        <p className={`text-[52px] font-black ${c.textMain} leading-none tracking-tighter filter drop-shadow-sm translate-y-[-2px]`}>
          <span className="text-2xl mr-1 opacity-40 translate-y-[-4px] inline-block">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* 進捗バー */}
      {targetAmount > 0 && (
        <div className="px-1 pb-2">
          <div className="flex justify-between items-end mb-1 px-1">
             <span className={`text-[10px] font-bold ${isAchieved ? 'text-yellow-500 animate-pulse' : 'text-gray-400'}`}>
               {isAchieved ? '🎉 GOAL ACHIEVED!' : `GOAL: ¥${targetAmount.toLocaleString()}`}
             </span>
             <span className={`text-[12px] font-black ${c.textSub}`}>
               {progressPercent}%
             </span>
          </div>
          <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden border border-white/20">
            <div 
              className={`h-full ${c.bar} transition-all duration-1000 ease-out shadow-sm ${isAchieved ? 'animate-pulse' : ''}`} 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 下段：内訳 */}
      <div className={`grid grid-cols-3 bg-white rounded-2xl border ${c.subBorder} shadow-sm divide-x divide-gray-100 py-1.5`}>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[12px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>フリー</p>
          <p className={`text-[34px] font-black ${c.textMain} leading-none tracking-tighter h-[30px] flex items-center`}>{totals.f || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[12px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>初指名</p>
          <p className={`text-[34px] font-black ${c.textMain} leading-none tracking-tighter h-[30px] flex items-center`}>{totals.first || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[12px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>本指名</p>
          <p className={`text-[34px] font-black ${c.textMain} leading-none tracking-tighter h-[30px] flex items-center`}>{totals.main || 0}</p>
        </div>
      </div>
    </section>
  );
}