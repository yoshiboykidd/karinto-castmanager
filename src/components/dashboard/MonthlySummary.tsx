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
    <section className="bg-gradient-to-br from-[#FFE9ED] to-[#FFF5F7] rounded-[32px] p-4 border border-pink-200 relative overflow-hidden shadow-sm flex flex-col space-y-1">
      
      {/* 上段：タイトルと稼働バッジ */}
      <div className="flex items-center justify-between h-9">
        <h2 className="text-[20px] font-black text-pink-500 tracking-tighter leading-none shrink-0">
          {month}の実績
        </h2>
        
        <div className="flex gap-1.5">
          {/* 出勤 */}
          <div className="bg-white/90 px-3 py-1.5 rounded-xl border border-pink-50 shadow-sm flex items-baseline justify-center min-w-[70px]">
            <span className="text-[11px] font-bold text-gray-500 mr-1">出勤</span>
            <span className="text-[26px] font-black text-pink-500 leading-none tracking-tighter">
              {totals.count}
            </span>
            <span className="text-[12px] font-bold text-gray-400 ml-0.5">日</span>
          </div>
          {/* 稼働 */}
          <div className="bg-white/90 px-3 py-1.5 rounded-xl border border-pink-50 shadow-sm flex items-baseline justify-center min-w-[70px]">
            <span className="text-[11px] font-bold text-gray-500 mr-1">稼働</span>
            <span className="text-[26px] font-black text-pink-500 leading-none tracking-tighter">
              {Math.round(totals.hours * 10) / 10}
            </span>
            <span className="text-[12px] font-bold text-gray-400 ml-0.5">h</span>
          </div>
        </div>
      </div>
      
      {/* 中段：合計金額（余白ほぼなし） */}
      <div className="text-center h-[52px] flex items-center justify-center">
        <p className="text-[52px] font-black text-pink-600 leading-none tracking-tighter filter drop-shadow-sm translate-y-[-2px]">
          <span className="text-2xl mr-1 opacity-40 translate-y-[-4px] inline-block">¥</span>
          {totals.amount.toLocaleString()}
        </p>
      </div>

      {/* 下段：内訳（文字サイズ維持、枠は狭く） */}
      <div className="grid grid-cols-3 bg-white rounded-2xl border border-pink-50 shadow-sm divide-x divide-pink-50 py-1.5">
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className="text-[12px] text-pink-400 font-black leading-none tracking-widest scale-y-90">フリー</p>
          <p className="text-[34px] font-black text-pink-600 leading-none tracking-tighter h-[30px] flex items-center">{totals.f || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className="text-[12px] text-pink-400 font-black leading-none tracking-widest scale-y-90">初指名</p>
          <p className="text-[34px] font-black text-pink-600 leading-none tracking-tighter h-[30px] flex items-center">{totals.first || 0}</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <p className="text-[12px] text-pink-400 font-black leading-none tracking-widest scale-y-90">本指名</p>
          <p className="text-[34px] font-black text-pink-600 leading-none tracking-tighter h-[30px] flex items-center">{totals.main || 0}</p>
        </div>
      </div>

    </section>
  );
}