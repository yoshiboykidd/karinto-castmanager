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
};

export default function MonthlySummary({ month, totals }: MonthlySummaryProps) {
  return (
    <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[32px] p-5 border border-pink-200 relative overflow-hidden shadow-sm flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-black text-pink-500 tracking-tighter leading-none">
          {month}の実績
        </h2>
        {/* 出勤・稼働バッジ */}
        <div className="flex gap-1.5">
          <div className="bg-white/90 px-3 py-2 rounded-xl border border-pink-50 shadow-sm flex items-center justify-center min-w-[70px]">
            <span className="text-[10px] font-bold text-black leading-none">
              出勤<span className="text-[18px] mx-1 font-black text-pink-500">{totals.count}</span>日
            </span>
          </div>
          <div className="bg-white/90 px-3 py-2 rounded-xl border border-pink-50 shadow-sm flex items-center justify-center min-w-[70px]">
            <span className="text-[10px] font-bold text-black leading-none">
              稼働<span className="text-[18px] mx-1 font-black text-pink-500">{Math.round(totals.hours * 10) / 10}</span>h
            </span>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-[52px] font-black text-pink-600 leading-none tracking-tighter">
          <span className="text-2xl mr-1 opacity-40 translate-y-[-4px] inline-block">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-0.5 bg-white/40 rounded-2xl border border-white/60 text-center py-2">
        <div><p className="text-[10px] text-pink-400 font-black leading-tight">フリー</p><p className="text-xl font-black text-pink-600 leading-none">{totals.f || 0}</p></div>
        <div><p className="text-[10px] text-pink-400 font-black leading-tight">初指名</p><p className="text-xl font-black text-pink-600 leading-none">{totals.first || 0}</p></div>
        <div><p className="text-[10px] text-pink-400 font-black leading-tight">本指名</p><p className="text-xl font-black text-pink-600 leading-none">{totals.main || 0}</p></div>
      </div>
    </section>
  );
}