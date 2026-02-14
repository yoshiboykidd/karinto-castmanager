'use client';

import React from 'react';

export default function DailyStats({ dayTotals, rewardAmount, theme = 'pink' }: any) {
  // テーマに基づいたアクセントカラー
  const accentColor = theme === 'pink' ? 'text-pink-500' : 
                     theme === 'blue' ? 'text-blue-500' : 'text-yellow-600';

  return (
    <div className="px-4 py-5 bg-white border-t border-gray-100 space-y-5 shadow-[0_-4px_20px_rgba(0,0,0,0,03)] rounded-t-[32px]">
      
      {/* 報酬額合計セクション */}
      <div className="flex items-center justify-between px-2">
        <span className="text-[14px] font-black text-gray-800">本日の合計</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-[11px] font-bold ${accentColor}`}>¥</span>
          <span className={`text-[28px] font-black tracking-tighter ${accentColor}`}>
            {(rewardAmount || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 内訳テーブルセクション */}
      <div className="space-y-3">
        {/* ヘッダー */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 px-1">
          <div />
          <div className="text-center text-[10px] font-black text-gray-400">フリー</div>
          <div className="text-center text-[10px] font-black text-gray-400">初指名</div>
          <div className="text-center text-[10px] font-black text-gray-400">本指名</div>
        </div>

        {/* <か> 行 */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
          <div className="flex justify-center">
            <span className="text-[11px] font-black text-blue-500 bg-blue-50 w-7 h-5 flex items-center justify-center rounded-md border border-blue-100">か</span>
          </div>
          <div className="text-center text-[16px] font-black text-gray-700">{dayTotals.ka.free}</div>
          <div className="text-center text-[16px] font-black text-gray-700">{dayTotals.ka.first}</div>
          <div className="text-center text-[16px] font-black text-gray-700">{dayTotals.ka.main}</div>
        </div>

        {/* <添> 行 */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
          <div className="flex justify-center">
            <span className="text-[11px] font-black text-pink-500 bg-pink-50 w-7 h-5 flex items-center justify-center rounded-md border border-pink-100">添</span>
          </div>
          <div className="text-center text-[16px] font-black text-gray-700">{dayTotals.soe.free}</div>
          <div className="text-center text-[16px] font-black text-gray-700">{dayTotals.soe.first}</div>
          <div className="text-center text-[16px] font-black text-gray-700">{dayTotals.soe.main}</div>
        </div>
      </div>
    </div>
  );
}