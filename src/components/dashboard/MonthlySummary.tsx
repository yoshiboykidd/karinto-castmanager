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
      
      {/* 上段：タイトルと稼働バッジ */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-black text-pink-500 tracking-tighter leading-none">
          {month}の実績
        </h2>
        
        {/* 出勤・稼働バッジ */}
        <div className="flex gap-2">
          {/* 出勤 */}
          <div className="bg-white/90 px-3 py-1.5 rounded-xl border border-pink-50 shadow-sm flex flex-col items-center justify-center min-w-[72px] leading-none">
            <span className="text-[9px] font-bold text-gray-400 mb-0.5">出勤</span>
            <span className="text-[22px] font-black text-pink-500 tracking-tighter">
              {totals.count}<span className="text-[11px] ml-0.5 font-bold text-gray-400">日</span>
            </span>
          </div>
          {/* 稼働 */}
          <div className="bg-white/90 px-3 py-1.5 rounded-xl border border-pink-50 shadow-sm flex flex-col items-center justify-center min-w-[72px] leading-none">
            <span className="text-[9px] font-bold text-gray-400 mb-0.5">稼働</span>
            <span className="text-[22px] font-black text-pink-500 tracking-tighter">
              {Math.round(totals.hours * 10) / 10}<span className="text-[11px] ml-0.5 font-bold text-gray-400">h</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* 中段：合計金額（そのまま） */}
      <div className="text-center py-1">
        <p className="text-[52px] font-black text-pink-600 leading-none tracking-tighter filter drop-shadow-sm">
          <span className="text-2xl mr-1 opacity-40 translate-y-[-4px] inline-block">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* 下段：内訳（白背景で連結・数字大きく） */}
      <div className="grid grid-cols-3 bg-white rounded-2xl border border-pink-50 shadow-sm divide-x divide-pink-50 py-3">
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className="text-[10px] text-pink-300 font-bold leading-none">フリー</p>
          <p className="text-[24px] font-black text-pink-500 leading-none tracking-tighter">{totals.f || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className="text-[10px] text-pink-300 font-bold leading-none">初指名</p>
          <p className="text-[24px] font-black text-pink-500 leading-none tracking-tighter">{totals.first || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className="text-[10px] text-pink-300 font-bold leading-none">本指名</p>
          <p className="text-[24px] font-black text-pink-500 leading-none tracking-tighter">{totals.main || 0}</p>
        </div>
      </div>

    </section>
  );
}