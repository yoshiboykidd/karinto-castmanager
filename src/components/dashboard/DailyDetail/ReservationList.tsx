'use client';

import React from 'react';

export default function ReservationList({ reservations, onSelect, getBadgeStyle, isAbsent, noMissionMessage }: any) {
  // 💡 修正：ISO形式(2026-...)が来ても時刻(HH:mm)だけを確実に抽出するロジック
  const formatTime = (t: any) => {
    const s = String(t || "");
    if (!s || s === "null") return "--:--";
    const match = s.match(/(\d{2}:\d{2})/);
    if (match) return match[1]; // 時刻部分が見つかればそれを返す
    return s.startsWith('20') ? "--:--" : s.substring(0, 5); // 日付なら隠す
  };

  if (reservations.length === 0) {
    return (
      <div className="py-8 px-4 text-center text-gray-300 font-black italic text-[12px] leading-relaxed">
        {noMissionMessage}
      </div>
    );
  }

  // 表示時刻に基づいてソート
  const sortedReservations = [...reservations].sort((a, b) => 
    formatTime(a.start_time).localeCompare(formatTime(b.start_time))
  );

  return (
    <div className="p-2 pt-1 space-y-1">
      {sortedReservations.map((res: any, idx: number) => (
        <button 
          key={idx} 
          onClick={() => onSelect(res)} 
          className={`w-full rounded-xl p-1 px-2 border flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all text-gray-800 ${
            res.isDuplicate 
              ? (res.isLatest ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-100/30 border-gray-100 opacity-50') 
              : 'bg-gray-50/50 border-gray-100'
          }`}
        >
          <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded shrink-0 ${getBadgeStyle(res.service_type)}`}>
            {res.service_type || 'か'}
          </span>
          
          <span className={`text-[10px] font-black w-9 h-6 flex items-center justify-center rounded shrink-0 tracking-tighter ${getBadgeStyle(res.nomination_category)}`}>
            {res.nomination_category || 'FREE'}
          </span>

          <div className="flex flex-col items-start shrink-0 font-black text-gray-700 ml-1">
            <div className="flex items-center tracking-tighter">
              <span className="text-[16px]">{formatTime(res.start_time)}</span>
              <span className="text-[9px] mx-0.5 opacity-20">〜</span>
              <span className="text-[16px]">{formatTime(res.end_time)}</span>
            </div>
            {res.isDuplicate && (
              <span className={`text-[8px] flex items-center gap-0.5 leading-none mt-0.5 ${res.isLatest ? 'text-amber-600' : 'text-gray-400'}`}>
                ⚠️ {res.isLatest ? '最新の修正' : '古い内容'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 truncate ml-auto font-black">
            <span className="text-[9px] font-black text-gray-300 tabular-nums">#{res.customer_no || '---'}</span>
            <div className="flex items-baseline">
              <span className="text-[15px]">{res.customer_name}</span>
              <span className="text-[8px] font-bold text-gray-400 ml-0.5">様</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}