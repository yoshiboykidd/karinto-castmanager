'use client';

import { useMemo } from 'react';

export default function MonthlySummary({ month, totals, targetAmount, theme }: any) {
  // 達成率の計算
  const progress = useMemo(() => {
    if (!targetAmount || targetAmount === 0) return 0;
    return Math.min(Math.round((totals.amount / targetAmount) * 100), 100);
  }, [totals.amount, targetAmount]);

  const accentColor = theme === 'pink' ? 'text-pink-500' : 
                      theme === 'blue' ? 'text-cyan-500' : 
                      theme === 'yellow' ? 'text-yellow-600' : 'text-gray-600';

  const barColor = theme === 'pink' ? 'bg-pink-400' : 
                   theme === 'blue' ? 'bg-cyan-400' : 
                   theme === 'yellow' ? 'bg-yellow-400' : 'bg-gray-400';

  return (
    <section className="bg-white/80 backdrop-blur-xl border border-white rounded-[40px] p-8 shadow-2xl shadow-pink-100/20 animate-in fade-in zoom-in duration-700">
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 italic">Monthly Performance</p>
          <h2 className="text-5xl font-black text-gray-800 tracking-tighter italic">
            {month}<span className={`ml-2 text-sm not-italic opacity-30`}>TOTAL</span>
          </h2>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-black ${accentColor} tracking-tighter italic`}>
            {progress}<span className="text-sm ml-1">%</span>
          </p>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Achievement</p>
        </div>
      </div>

      {/* 📍 達成率バー */}
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-8 border border-gray-50 shadow-inner p-1">
        <div 
          className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out shadow-sm`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 📍 実績グリッド：数字を極太・斜体で強調 */}
      <div className="grid grid-cols-2 gap-y-8 gap-x-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Rewards</p>
          <p className="text-2xl font-black text-gray-800 tracking-tighter italic">
            ¥{totals.amount?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Avg Hourly</p>
          <p className="text-2xl font-black text-gray-800 tracking-tighter italic">
            ¥{totals.hours > 0 ? Math.round(totals.amount / totals.hours).toLocaleString() : '0'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Work Hours</p>
          <p className="text-2xl font-black text-gray-800 tracking-tighter italic">
            {totals.hours?.toFixed(1) || '0.0'}<span className="text-xs ml-1">h</span>
          </p>
        </div>
        <div className="space-y-1 text-right border-l border-gray-100 pl-4">
          <div className="flex justify-end gap-3">
            <div className="text-center">
              <p className="text-[9px] font-black text-pink-300 uppercase italic">Nom</p>
              <p className="text-lg font-black text-gray-700 italic">{totals.main + totals.first}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black text-cyan-300 uppercase italic">Free</p>
              <p className="text-lg font-black text-gray-700 italic">{totals.f}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}