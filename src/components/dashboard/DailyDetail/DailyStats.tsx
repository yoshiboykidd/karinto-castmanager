'use client';

import React from 'react';

export default function DailyStats({ dayTotals, rewardAmount, theme = 'pink' }: any) {
  const accentColor = theme === 'pink' ? 'text-pink-500' : theme === 'blue' ? 'text-blue-500' : 'text-yellow-600';

  return (
    <div className="px-4 py-5 bg-white border-t border-gray-100 space-y-4 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between px-2">
        <span className="text-[14px] font-black text-gray-800">本日の合計</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-[11px] font-bold ${accentColor}`}>¥</span>
          <span className={`text-[28px] font-black tracking-tighter ${accentColor}`}>
            {(rewardAmount || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 text-center text-[10px] font-black text-gray-400 px-1">
          <div /><div>フリー</div><div>初指名</div><div>本指名</div>
        </div>
        {[
          { label: 'か', data: dayTotals.ka, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: '添', data: dayTotals.soe, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' }
        ].map((row) => (
          <div key={row.label} className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
            <div className="flex justify-center">
              <span className={`text-[11px] font-black ${row.color} ${row.bg} w-7 h-5 flex items-center justify-center rounded border ${row.border}`}>{row.label}</span>
            </div>
            <div className="text-center text-[16px] font-black text-gray-700">{row.data.free}</div>
            <div className="text-center text-[16px] font-black text-gray-700">{row.data.first}</div>
            <div className="text-center text-[16px] font-black text-gray-700">{row.data.main}</div>
          </div>
        ))}
      </div>
    </div>
  );
}