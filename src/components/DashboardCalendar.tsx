'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isValid, isAfter, startOfDay, isToday } from 'date-fns';
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
        <span className="text-[20px] tracking-tighter">{format(month, 'yyyy / M月')}</span>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight className="text-pink-300" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1">
        {/* 曜日ラベル（サイズUP & 平日黒） */}
        {['日', '月', '火', '水', '木', '金', '土'].map((d, idx) => (
          <div key={d} className={`text-[12px] font-black pb-2 text-center tracking-widest
            ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-900'}`}>
            {d}
          </div>
        ))}

        {/* 日付セル */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dNum = day.getDate();
          
          const s = Array.isArray(shifts) ? shifts.find((x: any) => x.shift_date === dateStr) : null;
          const isOfficial = s?.status === 'official';
          const isRequested = s?.status === 'requested';
          const isModified = isRequested && s?.is_official_pre_exist;

          const refStart = isModified ? s?.hp_start_time : s?.start_time;
          const hasOfficialBase = (isOfficial || isModified) && refStart && refStart !== 'OFF';

          const isFuture = isAfter(startOfDay(day), today);
          const canSelect = !isRequestMode || isFuture;

          const isSelected = canSelect && selectedDates ? (
            Array.isArray(selectedDates) 
              ? selectedDates.some(d => (d instanceof Date) && isSameDay(d, day)) 
              : (selectedDates instanceof Date && isSameDay(selectedDates, day))
          ) : false;

          const isCurrentDay = isToday(day);
          
          // ★特定日判定（10日、11日、22日）
          const isKarin = dNum === 10; // かりんと日
          const isSoine = dNum === 11 || dNum === 22; // 添い寝の日

          // テキスト色判定（平日を黒に）
          const dayOfWeek = getDay(day);
          const isHoliday = holidays.includes(dateStr);
          let textColor = 'text-gray-900'; // デフォルト黒
          
          if (hasOfficialBase) textColor = 'text-white';
          else if (isHoliday || dayOfWeek === 0) textColor = 'text-red-500';
          else if (dayOfWeek === 6) textColor = 'text-blue-500';
          else if (isSelected) textColor = isRequestMode ? 'text-purple-600' : 'text-pink-500';

          return (
            <div 
              key={dateStr} 
              onClick={() => {
                if (canSelect) onSelect(day);
              }} 
              className={`relative h-12 w-full flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 cursor-pointer
              ${isSelected 
                  ? (isRequestMode ? 'bg-white shadow-lg ring-2 ring-purple-500 z-10' : 'bg-white shadow-lg ring-2 ring-pink-400 z-10') 
                  : ''}
              ${!isSelected && isKarin ? 'bg-orange-100/80 border border-orange-200' : ''}
              ${!isSelected && isSoine ? 'bg-yellow-100/80 border border-yellow-200' : ''}
              ${isRequestMode && !isFuture ? 'opacity-40 grayscale-[0.5] cursor-not-allowed' : ''}`}
            >
              {/* 日付数字（サイズUP: 13px -> 15px） */}
              <span className={`z-20 text-[15px] font-black ${textColor} ${isCurrentDay && !hasOfficialBase && !isSelected ? 'underline decoration-2 underline-offset-4 decoration-pink-300' : ''}`}>
                {dNum}
              </span>

              {/* 確定ピンク丸（そのまま） */}
              {hasOfficialBase && (
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 shadow-sm z-10" />
              )}
              
              {/* 各種申請中マーク（そのまま） */}
              {isModified && <div className="absolute inset-0.5 rounded-full border-[5px] border-green-500 z-[15] animate-pulse" />}
              {isRequested && !isModified && <div className="absolute inset-1 rounded-full border-2 border-purple-400 border-dashed animate-pulse z-10" />}

              {/* 右上のアクセントドット（そのまま維持） */}
              {isKarin && !hasOfficialBase && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-500 shadow-sm z-30 ring-1 ring-white" />
              )}
              {isSoine && !hasOfficialBase && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-500 shadow-sm z-30 ring-1 ring-white" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}