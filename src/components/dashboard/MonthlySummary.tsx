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
    <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[32px] p-5 border border-pink-200 relative overflow-hidden shadow-sm flex flex-col space-y-4">
      
      {/* 上段：タイトルと稼働バッジ（1行構成で大きく） */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-black text-pink-500 tracking-tighter leading-none shrink-0">
          {month}の実績
        </h2>
        
        <div className="flex gap-2">
          {/* 出勤 */}
          <div className="bg-white/90 px-4 py-2 rounded-xl border border-pink-50 shadow-sm flex items-baseline justify-center min-w-[80px]">
            <span className="text-[11px] font-bold text-gray-500 mr-1">出勤</span>
            <span className="text-[26px] font-black text-pink-500 leading-none tracking-tighter">
              {totals.count}
            </span>
            <span className="text-[12px] font-bold text-gray-400 ml-0.5">日</span>
          </div>
          {/* 稼働 */}
          <div className="bg-white/90 px-4 py-2 rounded-xl border border-pink-50 shadow-sm flex items-baseline justify-center min-w-[80px]">
            <span className="text-[11px] font-bold text-gray-500 mr-1">稼働</span>
            <span className="text-[26px] font-black text-pink-500 leading-none tracking-tighter">
              {Math.round(totals.hours * 10) / 10}
            </span>
            <span className="text-[12px] font-bold text-gray-400 ml-0.5">h</span>
          </div>
        </div>
      </div>
      
      {/* 中段：合計金額 */}
      <div className="text-center py-1">
        <p className="text-[52px] font-black text-pink-600 leading-none tracking-tighter filter drop-shadow-sm">
          <span className="text-2xl mr-1 opacity-40 translate-y-[-4px] inline-block">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* 下段：内訳（文字も数字もガッツリ大きく） */}
      <div className="grid grid-cols-3 bg-white rounded-2xl border border-pink-50 shadow-sm divide-x divide-pink-50 py-4">
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-[12px] text-pink-400 font-black leading-none tracking-widest">フリー</p>
          <p className="text-[34px] font-black text-pink-600 leading-none tracking-tighter">{totals.f || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-[12px] text-pink-400 font-black leading-none tracking-widest">初指名</p>
          <p className="text-[34px] font-black text-pink-600 leading-none tracking-tighter">{totals.first || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-[12px] text-pink-400 font-black leading-none tracking-widest">本指名</p>
          <p className="text-[34px] font-black text-pink-600 leading-none tracking-tighter">{totals.main || 0}</p>
        </div>
      </div>

    </section>
  );
}