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

const THEME_STYLES: any = {
  pink:   { bgFrom: 'from-[#FFF9FA]', bgTo: 'to-[#FFF0F3]', border: 'border-pink-100',  textMain: 'text-[#FF8DA1]', textSub: 'text-[#FFB7C5]',  textLabel: 'text-pink-300',  subBorder: 'border-pink-50',  bar: 'bg-[#FFB7C5]' },
  // 他のテーマは省略（必要なら追加可能）
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

  return (
    <section className={`bg-gradient-to-br ${c.bgFrom} ${c.bgTo} rounded-[32px] p-5 border ${c.border} relative overflow-hidden shadow-sm flex flex-col space-y-2`}>
      
      <div className="flex items-center justify-between mb-1">
        <h2 className={`text-[20px] font-black ${c.textSub} tracking-tighter leading-none shrink-0`}>
          {month}の実績
        </h2>
        <div className="flex gap-1.5">
          <div className={`bg-white/90 px-3 py-1.5 rounded-xl border ${c.subBorder} shadow-sm flex items-baseline justify-center min-w-[70px]`}>
            <span className="text-[11px] font-bold text-gray-300 mr-1">出勤</span>
            <span className={`text-[24px] font-black ${c.textSub} leading-none tracking-tighter`}>{totals.count}</span>
            <span className="text-[11px] font-bold text-gray-400 ml-0.5">日</span>
          </div>
          <div className={`bg-white/90 px-3 py-1.5 rounded-xl border ${c.subBorder} shadow-sm flex items-baseline justify-center min-w-[70px]`}>
            <span className="text-[11px] font-bold text-gray-300 mr-1">稼働</span>
            <span className={`text-[24px] font-black ${c.textSub} leading-none tracking-tighter`}>{Math.round(totals.hours * 10) / 10}</span>
            <span className="text-[11px] font-bold text-gray-400 ml-0.5">h</span>
          </div>
        </div>
      </div>
      
      <div className="text-center flex flex-col items-center justify-center relative z-10 -my-1">
        <p className={`text-[56px] font-black ${c.textMain} leading-none tracking-tighter filter drop-shadow-sm`}>
          <span className="text-3xl mr-1 opacity-40 translate-y-[-6px] inline-block">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {targetAmount > 0 && (
        <div className="bg-white/40 rounded-xl p-2.5 border border-white/50 shadow-sm mx-1">
          <div className="flex justify-between items-end mb-1.5 px-1">
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-gray-400 tracking-widest bg-white/60 px-1.5 py-0.5 rounded">GOAL</span>
                <span className={`text-[16px] font-black ${c.textSub} tracking-tight leading-none`}>
                  ¥{targetAmount.toLocaleString()}
                </span>
             </div>
             <div className="flex items-baseline">
                <span className={`text-[20px] font-black ${c.textMain} leading-none tracking-tighter`}>
                   {progressPercent}
                </span>
                <span className={`text-[10px] font-bold ${c.textLabel} ml-0.5`}>%</span>
             </div>
          </div>
          
          <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden border border-white/60 shadow-inner relative">
            <div 
              className={`h-full ${c.bar} transition-all duration-1000 ease-out shadow-sm relative`} 
              style={{ width: `${progressPercent}%` }}
            >
               <div className="absolute inset-0 w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,#fff_6px,#fff_12px)]"></div>
            </div>
          </div>
        </div>
      )}

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