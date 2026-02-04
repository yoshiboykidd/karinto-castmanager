'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isValid, isAfter, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardCalendarProps {
  shifts: any[];
  selectedDates: any;
  onSelect: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  isRequestMode: boolean;
}

export default function DashboardCalendar({ shifts, selectedDates, onSelect, month, onMonthChange, isRequestMode }: DashboardCalendarProps) {
  const [holidays, setHolidays] = useState<string[]>([]);

  useEffect(() => {
    if (!month || !isValid(month)) return;
    fetch(`https://holidays-jp.github.io/api/v1/${month.getFullYear()}/date.json`)
      .then(res => res.ok ? res.json() : {})
      .then(data => setHolidays(Object.keys(data)))
      .catch(() => {});
  }, [month?.getFullYear()]);

  // セーフティガード
  if (!month || !isValid(month)) return null;

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const today = startOfDay(new Date());

  return (
    <div className="w-full">
      {/* 月切り替えヘッダー */}
      <div className="flex items-center justify-between mb-4 px-4 font-black text-slate-700">
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft className="text-pink-300" />
        </button>
        <span className="text-lg tracking-tighter">{format(month, 'yyyy / M月')}</span>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight className="text-pink-300" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1">
        {/* 曜日ラベル */}
        {['日', '月', '火', '水', '木', '金', '土'].map((d, idx) => (
          <div key={d} className={`text-[10px] font-black pb-2 text-center tracking-widest
            ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-300'}`}>
            {d}
          </div>
        ))}

        {/* 日付セル */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dNum = day.getDate();
          
          // シフト判定
          const s = Array.isArray(shifts) ? shifts.find((x: any) => x.shift_date === dateStr) : null;
          const isOfficial = s?.status === 'official';
          const isRequested = s?.status === 'requested';
          const isModified = isRequested && s?.is_official_pre_exist;
          const hasOfficialBase = (isOfficial || isModified) && s?.start_time !== 'OFF';

          // ★修正箇所：選択判定に「明日以降」の条件を追加（申請モード中のみ適用）
          const isFuture = isAfter(startOfDay(day), today);
          const canSelect = !isRequestMode || isFuture;

          const isSelected = canSelect && selectedDates ? (
            Array.isArray(selectedDates) 
              ? selectedDates.some(d => (d instanceof Date) && isSameDay(d, day)) 
              : (selectedDates instanceof Date && isSameDay(selectedDates, day))
          ) : false;

          const isKarin = dNum === 10;
          const isSoine = dNum === 11 || dNum === 22;

          // テキスト色判定
          const dayOfWeek = getDay(day);
          const isHoliday = holidays.includes(dateStr);
          let textColor = 'text-slate-600';
          if (hasOfficialBase) textColor = 'text-white';
          else if (isHoliday || dayOfWeek === 0) textColor = 'text-red-500';
          else if (dayOfWeek === 6) textColor = 'text-blue-500';
          else if (isSelected) textColor = 'text-pink-500';

          return (
            <div 
              key={dateStr} 
              onClick={() => {
                // ★修正箇所：明日以降の日付、または通常モードの時だけクリック可能にする
                if (canSelect) onSelect(day);
              }} 
              className={`relative h-12 w-full flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 cursor-pointer
              ${isSelected ? 'bg-white shadow-lg ring-2 ring-pink-400 z-10' : ''}
              ${!isSelected && isKarin ? 'bg-orange-50/60' : ''}
              ${!isSelected && isSoine ? 'bg-yellow-50/60' : ''}
              ${isRequestMode && !isFuture ? 'opacity-40 grayscale-[0.5] cursor-not-allowed' : ''}`}
            >
              <span className={`z-20 text-[13px] font-black ${textColor}`}>{dNum}</span>

              {/* 確定ピンク丸 */}
              {hasOfficialBase && (
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 shadow-sm z-10" />
              )}
              
              {/* 各種申請中マーク */}
              {isModified && <div className="absolute inset-0.5 rounded-full border-[5px] border-green-500 z-[15] animate-pulse" />}
              {isRequested && !isModified && <div className="absolute inset-1 rounded-full border-2 border-purple-400 border-dashed animate-pulse z-10" />}

              {/* 右上のアクセントドット */}
              {isKarin && !hasOfficialBase && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-400 shadow-sm z-30" />
              )}
              {isSoine && !hasOfficialBase && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-sm z-30" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}