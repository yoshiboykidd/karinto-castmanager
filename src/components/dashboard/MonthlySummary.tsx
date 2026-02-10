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
  pink: { 
    bg: 'bg-white', 
    border: 'border-pink-100', 
    textMain: 'text-[#5E4E52]', // 柔らかいブラウン系グレー
    textHighlight: 'text-pink-400',
    bar: 'bg-gradient-to-r from-pink-200 to-pink-400',
    glow: 'shadow-[0_0_20px_rgba(255,183,197,0.3)]'
  },
  // 他のテーマも同様に洗練された色調に変更可能
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
    <section className={`${c.bg} rounded-[40px] p-6 border-2 ${c.border} shadow-[0_15px_40px_rgba(0,0,0,0.03)] relative overflow-hidden`}>
      {/* 背景の装飾玉 */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full blur-3xl opacity-60" />

      {/* タイトルとバッジ */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-lg font-black text-gray-700 tracking-tight flex items-center gap-2">
          <span className="w-2 h-6 bg-pink-400 rounded-full" />
          {month}の実績
        </h2>
        <div className="flex gap-2">
          <div className="bg-pink-50/50 px-3 py-1 rounded-full border border-pink-100">
            <span className="text-[10px] font-black text-pink-400 italic">{totals.count} <span className="text-[8px] opacity-70">Days</span></span>
          </div>
          <div className="bg-pink-50/50 px-3 py-1 rounded-full border border-pink-100">
            <span className="text-[10px] font-black text-pink-400 italic">{Math.round(totals.hours * 10) / 10} <span className="text-[8px] opacity-70">Hrs</span></span>
          </div>
        </div>
      </div>
      
      {/* メイン金額 */}
      <div className="text-center mb-8 relative z-10">
        <p className={`text-[52px] font-black ${c.textMain} leading-none tracking-tighter`}>
          <span className="text-2xl mr-1 text-pink-300">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* 進捗バーセクション */}
      {targetAmount > 0 && (
        <div className="mb-8 px-2 relative z-10">
          <div className="flex justify-between items-end mb-2">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-pink-200 uppercase tracking-widest italic">Target Goal</span>
                <span className="text-sm font-black text-gray-500">¥{targetAmount.toLocaleString()}</span>
             </div>
             <div className="text-right">
                <span className={`text-2xl font-black ${c.textHighlight} italic leading-none`}>{progressPercent}%</span>
             </div>
          </div>
          
          <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner relative">
            <div 
              className={`h-full ${c.bar} ${c.glow} transition-all duration-1000 ease-out relative`} 
              style={{ width: `${progressPercent}%` }}
            >
               <div className="absolute inset-0 w-full h-full opacity-20 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}

      {/* 内訳グリッド */}
      <div className="grid grid-cols-3 gap-3 relative z-10">
        {[
          { label: 'Free', val: totals.f, color: 'text-pink-400' },
          { label: 'First', val: totals.first, color: 'text-rose-400' },
          { label: 'Main', val: totals.main, color: 'text-pink-500' }
        ].map((item, idx) => (
          <div key={idx} className="bg-gray-50/50 border border-gray-100 rounded-3xl p-3 text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
            <p className={`text-xl font-black ${item.color} tracking-tighter`}>{item.val || 0}</p>
          </div>
        ))}
      </div>
    </section>
  );
}