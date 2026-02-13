'use client';

import React from 'react';

export default function DailyStats({ dayTotals, rewardAmount, theme = 'pink' }: any) {
  // テーマに基づいたアクセントカラー（報酬額の数字に使用）
  const accentColor = theme === 'pink' ? 'text-pink-500' : 
                     theme === 'blue' ? 'text-blue-500' : 'text-yellow-600';

  return (
    <div className="px-4 py-3 bg-gray-50/50 border-y border-gray-100 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">Daily Achievement</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] font-bold text-gray-400">報酬額:</span>
          <span className={`text-[16px] font-black ${accentColor}`}>
            ¥{(rewardAmount || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* --- か 区分 --- */}
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between px-3">
          <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-blue-500 text-white text-[10px] font-black">か</span>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-[8px] text-gray-400 font-bold uppercase leading-none mb-0.5">Free</p>
              <p className="text-[13px] font-black leading-none">{dayTotals.ka.free}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-gray-400 font-bold uppercase leading-none mb-0.5">First</p>
              <p className="text-[13px] font-black leading-none">{dayTotals.ka.first}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-gray-400 font-bold uppercase leading-none mb-0.5">Main</p>
              <p className="text-[13px] font-black leading-none">{dayTotals.ka.main}</p>
            </div>
          </div>
        </div>

        {/* --- 添 区分 --- */}
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between px-3">
          <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-pink-500 text-white text-[10px] font-black">添</span>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-[8px] text-gray-400 font-bold uppercase leading-none mb-0.5">Free</p>
              <p className="text-[13px] font-black leading-none">{dayTotals.soe.free}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-gray-400 font-bold uppercase leading-none mb-0.5">First</p>
              <p className="text-[13px] font-black leading-none">{dayTotals.soe.first}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-gray-400 font-bold uppercase leading-none mb-0.5">Main</p>
              <p className="text-[13px] font-black leading-none">{dayTotals.soe.main}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}