'use client';

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

// テーマ設定
const THEME_STYLES: any = {
  pink:   { bgFrom: 'from-[#FFE9ED]', bgTo: 'to-[#FFF5F7]', border: 'border-pink-200',  textMain: 'text-pink-600', textSub: 'text-pink-500',  textLabel: 'text-pink-400',  subBorder: 'border-pink-50',  bar: 'bg-pink-400' },
  blue:   { bgFrom: 'from-blue-50',   bgTo: 'to-blue-100',   border: 'border-blue-200',  textMain: 'text-blue-600', textSub: 'text-blue-500',  textLabel: 'text-blue-400',  subBorder: 'border-blue-100', bar: 'bg-blue-400' },
  black:  { bgFrom: 'from-gray-100',  bgTo: 'to-gray-200',   border: 'border-gray-300',  textMain: 'text-gray-800', textSub: 'text-gray-700',  textLabel: 'text-gray-500',  subBorder: 'border-gray-200', bar: 'bg-gray-700' },
  white:  { bgFrom: 'from-white',     bgTo: 'to-gray-50',    border: 'border-gray-200',  textMain: 'text-gray-600', textSub: 'text-gray-500',  textLabel: 'text-gray-400',  subBorder: 'border-gray-100', bar: 'bg-gray-400' },
  red:    { bgFrom: 'from-red-50',    bgTo: 'to-red-100',    border: 'border-red-200',   textMain: 'text-red-600',  textSub: 'text-red-500',   textLabel: 'text-red-400',   subBorder: 'border-red-100',  bar: 'bg-red-400' },
  yellow: { bgFrom: 'from-yellow-50', bgTo: 'to-yellow-100', border: 'border-yellow-200', textMain: 'text-yellow-600', textSub: 'text-yellow-500', textLabel: 'text-yellow-400', subBorder: 'border-yellow-100', bar: 'bg-yellow-400' },
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
    <section className={`bg-gradient-to-br ${c.bgFrom} ${c.bgTo} rounded-[32px] p-5 border ${c.border} relative overflow-hidden shadow-sm flex flex-col space-y-3`}>
      
      {/* 上段: 実績タイトル */}
      <div className="flex items-center justify-between h-8">
        <h2 className={`text-[20px] font-black ${c.textSub} tracking-tighter leading-none shrink-0`}>
          {month}の実績
        </h2>
        <div className="flex gap-1.5">
          <div className={`bg-white/90 px-2 py-1 rounded-lg border ${c.subBorder} shadow-sm flex items-baseline justify-center min-w-[50px]`}>
            <span className="text-[9px] font-bold text-gray-400 mr-1">出勤</span>
            <span className={`text-[18px] font-black ${c.textSub} leading-none`}>{totals.count}</span>
          </div>
          <div className={`bg-white/90 px-2 py-1 rounded-lg border ${c.subBorder} shadow-sm flex items-baseline justify-center min-w-[50px]`}>
            <span className="text-[9px] font-bold text-gray-400 mr-1">稼働</span>
            <span className={`text-[18px] font-black ${c.textSub} leading-none`}>{Math.round(totals.hours * 10) / 10}</span>
          </div>
        </div>
      </div>
      
      {/* メイン金額表示 */}
      <div className="text-center flex flex-col items-center justify-center relative z-10 -my-1">
        <p className={`text-[56px] font-black ${c.textMain} leading-none tracking-tighter filter drop-shadow-sm`}>
          <span className="text-3xl mr-1 opacity-40 translate-y-[-6px] inline-block">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* ★修正: 目標＆進捗エリア（全体的に巨大化） */}
      {targetAmount > 0 && (
        <div className="bg-white/50 rounded-2xl p-3 border border-white/60 shadow-inner">
          
          {/* 目標額とパーセントの表示 */}
          <div className="flex justify-between items-end mb-2 px-1">
             <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">TARGET GOAL</span>
                <span className={`text-[24px] font-black ${c.textSub} tracking-tight`}>
                  <span className="text-[14px] mr-0.5 opacity-60">¥</span>
                  {targetAmount.toLocaleString()}
                </span>
             </div>
             <div className="flex items-baseline">
                <span className={`text-[36px] font-black ${isAchieved ? 'text-yellow-500' : c.textMain} leading-none tracking-tighter`}>
                   {progressPercent}
                </span>
                <span className={`text-[14px] font-bold ${c.textLabel} ml-0.5`}>%</span>
             </div>
          </div>
          
          {/* バー（h-8の極太サイズに変更） */}
          <div className="w-full h-8 bg-gray-200/50 rounded-full overflow-hidden border border-white shadow-inner relative">
            <div 
              className={`h-full ${c.bar} transition-all duration-1000 ease-out shadow-sm relative flex items-center justify-end pr-3`} 
              style={{ width: `${progressPercent}%` }}
            >
               {/* ストライプ加工 */}
               <div className="absolute inset-0 w-full h-full opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_20px)]"></div>
               {/* 光沢 */}
               <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
            </div>
          </div>
        </div>
      )}

      {/* 下段：内訳 */}
      <div className={`grid grid-cols-3 bg-white/80 backdrop-blur-sm rounded-2xl border ${c.subBorder} shadow-sm divide-x divide-gray-100 py-2`}>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[11px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>フリー</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter`}>{totals.f || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[11px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>初指名</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter`}>{totals.first || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className={`text-[11px] ${c.textLabel} font-black leading-none tracking-widest scale-y-90`}>本指名</p>
          <p className={`text-[26px] font-black ${c.textMain} leading-none tracking-tighter`}>{totals.main || 0}</p>
        </div>
      </div>

    </section>
  );
}