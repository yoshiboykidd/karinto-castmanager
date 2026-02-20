'use client';

import React from 'react';

export default function ReservationList({ reservations, onSelect, getBadgeStyle, noMissionMessage }: any) {
  // 💡 時刻表示のフォーマットロジック
  const formatTime = (t: any) => {
    const s = String(t || "");
    if (!s || s === "null") return "--:--";
    const match = s.match(/(\d{2}:\d{2})/);
    if (match) return match[1];
    return s.startsWith('20') ? "--:--" : s.substring(0, 5);
  };

  // 1. 📍 ハイブリッド・フィルタリング
  // [予約日・開始・終了・客番号]が完全に一致する重複がある場合、最新(isLatest)のみを表示
  // 内容が少しでも違う修正メールは、両方とも isLatest: true になるため自動的に並んで表示されます
  const displayReservations = (reservations || []).filter((res: any) => res.isLatest);

  if (displayReservations.length === 0) {
    return (
      <div className="py-8 px-4 text-center text-gray-300 font-black italic text-[12px] leading-relaxed">
        {noMissionMessage}
      </div>
    );
  }

  // 2. 時刻順に並べ替え
  const sortedReservations = [...displayReservations].sort((a, b) => 
    formatTime(a.start_time).localeCompare(formatTime(b.start_time))
  );

  return (
    <div className="p-2 pt-1 space-y-1">
      {sortedReservations.map((res: any, idx: number) => (
        <button 
          key={idx} 
          onClick={() => onSelect(res)} 
          // 💡 画面に出るものは全て「最新の情報」なので、透明度などのペナルティは無し
          className="w-full rounded-xl p-1 px-2 border border-gray-100 bg-gray-50/50 flex items-center gap-1 shadow-sm active:bg-gray-100 transition-all text-gray-800"
        >
          {/* サービスバッジ（か、など） */}
          <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded shrink-0 ${getBadgeStyle(res.service_type)}`}>
            {res.service_type || 'か'}
          </span>
          
          {/* 指名種別バッジ */}
          <span className={`text-[10px] font-black w-9 h-6 flex items-center justify-center rounded shrink-0 tracking-tighter ${getBadgeStyle(res.nomination_category)}`}>
            {res.nomination_category || 'FREE'}
          </span>

          {/* 予約時間表示 */}
          <div className="flex flex-col items-start shrink-0 font-black text-gray-700 ml-1">
            <div className="flex items-center tracking-tighter">
              <span className="text-[16px]">{formatTime(res.start_time)}</span>
              <span className="text-[9px] mx-0.5 opacity-20">〜</span>
              <span className="text-[16px]">{formatTime(res.end_time)}</span>
            </div>
            {/* 内容が修正された履歴がある場合のみ、控えめに通知 */}
            {res.isDuplicate && (
              <span className="text-[8px] flex items-center gap-0.5 leading-none mt-0.5 text-amber-600">
                ✨ 内容更新あり
              </span>
            )}
          </div>

          {/* 客番号と名前 */}
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