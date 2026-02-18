'use client';

import React from 'react';

export default function DailyStats({ dayTotals, rewardAmount, theme = 'pink' }: any) {
  const accentColor = theme === 'pink' ? 'text-pink-500' : theme === 'blue' ? 'text-blue-500' : 'text-yellow-600';

  return (
    <div className="px-4 py-4 bg-white border-t border-gray-100 flex flex-col space-y-2 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
      
      {/* 📍 本日の合計金額エリア */}
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-[14px] font-black text-gray-800 tracking-tighter">本日の合計</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-[12px] font-black ${accentColor}`}>¥</span>
          <span className={`text-[32px] font-black tracking-tighter ${accentColor} [text-shadow:_0.8px_0_0_currentColor]`}>
            {(rewardAmount || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 📍 指名数集計エリア（帯状のデザインに刷新） */}
      <div className="space-y-1.5">
        {/* 枠外ラベル */}
        <div className="grid grid-cols-[56px_1fr_1fr_1fr] px-1">
          <div />
          <p className="text-[9px] font-black text-gray-400 text-center tracking-widest scale-y-90">フリー</p>
          <p className="text-[9px] font-black text-gray-400 text-center tracking-widest scale-y-90">初指名</p>
          <p className="text-[9px] font-black text-gray-400 text-center tracking-widest scale-y-90">本指名</p>
        </div>

        {/* 📍 〈か〉の帯 */}
        <div className="grid grid-cols-[56px_1fr_1fr_1fr] items-center text-center bg-blue-50/60 border border-blue-100/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex justify-center py-2 bg-blue-500 text-white border-r border-blue-400/30">
            <span className="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded shrink-0">か</span>
          </div>
          <p className="py-2 text-[24px] font-black text-blue-600/90 leading-none tracking-tighter">{dayTotals.ka.free || 0}</p>
          <p className="py-2 text-[24px] font-black text-blue-600/90 leading-none tracking-tighter">{dayTotals.ka.first || 0}</p>
          <p className="py-2 text-[24px] font-black text-blue-600/90 leading-none tracking-tighter">{dayTotals.ka.main || 0}</p>
        </div>

        {/* 📍 〈添〉の帯 */}
        <div className="grid grid-cols-[56px_1fr_1fr_1fr] items-center text-center bg-pink-50/60 border border-pink-100/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex justify-center py-2 bg-pink-500 text-white border-r border-pink-400/30">
            <span className="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded shrink-0">添</span>
          </div>
          <p className="py-2 text-[24px] font-black text-pink-600/90 leading-none tracking-tighter">{dayTotals.soe.free || 0}</p>
          <p className="py-2 text-[24px] font-black text-pink-600/90 leading-none tracking-tighter">{dayTotals.soe.first || 0}</p>
          <p className="py-2 text-[24px] font-black text-pink-600/90 leading-none tracking-tighter">{dayTotals.soe.main || 0}</p>
        </div>
      </div>

    </div>
  );
}