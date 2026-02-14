'use client';

import React from 'react';

export default function ReservationList({ reservations, onSelect, getBadgeStyle, isAbsent }: any) {
  // 予約がない場合の表示
  if (reservations.length === 0) {
    return (
      <div className="py-2 text-center text-gray-200 font-bold italic text-[10px]">
        {isAbsent ? '当欠処理済み' : 'No Mission'}
      </div>
    );
  }

  // 表示順を整理（時間順）
  const sortedReservations = [...reservations].sort((a, b) => 
    (a.start_time || "").localeCompare(b.start_time || "")
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
          {/* サービス区分 */}
          <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded shrink-0 ${getBadgeStyle(res.service_type)}`}>
            {res.service_type || 'か'}
          </span>
          
          {/* 指名カテゴリ */}
          <span className={`text-[10px] font-black w-9 h-6 flex items-center justify-center rounded shrink-0 tracking-tighter ${getBadgeStyle(res.nomination_category)}`}>
            {res.nomination_category || 'FREE'}
          </span>

          {/* 時間表示 ＋ 警告マーク */}
          <div className="flex flex-col items-start shrink-0 font-black text-gray-700 ml-1">
            <div className="flex items-center tracking-tighter">
              <span className="text-[16px]">{res.start_time?.substring(0, 5)}</span>
              <span className="text-[9px] mx-0.5 opacity-20">〜</span>
              <span className="text-[16px]">{res.end_time?.substring(0, 5)}</span>
            </div>
            
            {/* 重複時のフラグ表示 */}
            {res.isDuplicate && (
              <span className={`text-[8px] flex items-center gap-0.5 leading-none mt-0.5 ${res.isLatest ? 'text-amber-600' : 'text-gray-400'}`}>
                ⚠️ {res.isLatest ? '最新の修正' : '古い内容'}
              </span>
            )}
          </div>

          {/* 名前 */}
          <div className="flex items-baseline truncate ml-auto font-black">
            <span className="text-[15px]">{res.customer_name}</span>
            <span className="text-[8px] font-bold text-gray-400 ml-0.5">様</span>
          </div>
        </button>
      ))}
    </div>
  );
}