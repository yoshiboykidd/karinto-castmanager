'use client';

type MonthlySummaryProps = {
  month: string;
  totals: {
    amount: number; count: number; hours: number;
    f: number; first: number; main: number;
  };
  targetAmount?: number;
  theme?: string;
};

const THEME_STYLES: any = {
  pink:   { bg: 'bg-[#FFF9FA]', border: 'border-pink-100', textMain: 'text-pink-500', bar: 'bg-pink-400' },
  blue:   { bg: 'bg-cyan-50',   border: 'border-cyan-100',   textMain: 'text-cyan-600', bar: 'bg-cyan-400' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-100', textMain: 'text-yellow-600', bar: 'bg-yellow-400' },
  white:  { bg: 'bg-white',     border: 'border-gray-200',   textMain: 'text-gray-700', bar: 'bg-gray-400' },
  black:  { bg: 'bg-gray-50',   border: 'border-gray-300',   textMain: 'text-gray-900', bar: 'bg-gray-800' },
  red:    { bg: 'bg-red-50',    border: 'border-red-100',    textMain: 'text-red-600',  bar: 'bg-red-500' },
};

export default function MonthlySummary({ month, totals, targetAmount = 0, theme = 'pink' }: MonthlySummaryProps) {
  const c = THEME_STYLES[theme] || THEME_STYLES.pink;
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.floor((totals.amount / targetAmount) * 100)) : 0;

  return (
    <section className={`${c.bg} rounded-[32px] p-5 border ${c.border} shadow-sm space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-black ${c.textMain} tracking-tighter`}>{month}の実績</h2>
        <div className="flex gap-2">
          <div className="bg-white px-3 py-1 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">出勤</p>
            <p className={`text-xl font-black ${c.textMain}`}>{totals.count}<span className="text-xs ml-0.5">日</span></p>
          </div>
          <div className="bg-white px-3 py-1 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">稼働</p>
            <p className={`text-xl font-black ${c.textMain}`}>{Math.round(totals.hours * 10) / 10}<span className="text-xs ml-0.5">h</span></p>
          </div>
        </div>
      </div>
      
      <div className="text-center py-2">
        <p className={`text-5xl font-black ${c.textMain} tracking-tighter`}>
          <span className="text-2xl mr-1 opacity-50">¥</span>{totals.amount.toLocaleString()}
        </p>
      </div>

      {targetAmount > 0 && (
        <div className="space-y-1 px-1">
          <div className="flex justify-between items-end text-[11px] font-bold text-gray-400">
            <span>目標 ¥{targetAmount.toLocaleString()}</span>
            <span className={c.textMain}>{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-white">
            <div className={`h-full ${c.bar} transition-all duration-1000`} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[{ l: 'フリー', v: totals.f }, { l: '初指名', v: totals.first }, { l: '本指名', v: totals.main }].map((item, i) => (
          <div key={i} className="bg-white/80 rounded-2xl p-2 text-center border border-white shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 mb-0.5">{item.l}</p>
            <p className={`text-2xl font-black ${c.textMain} tracking-tighter`}>{item.v || 0}</p>
          </div>
        ))}
      </div>
    </section>
  );
}