'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isValid, isAfter, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardCalendarProps {
  shifts: any[];
  selectedDates: any;
  onSelect: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  isRequestMode: boolean;
  theme?: string;
}

export default function DashboardCalendar({ shifts, selectedDates, onSelect, month, onMonthChange, isRequestMode, theme = 'pink' }: DashboardCalendarProps) {
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
  const startDay = getDay(days[0]);
  const blanks = Array(startDay).fill(null);
  const today = startOfDay(new Date());

  const themeColors: any = {
    pink: { text: 'text-pink-600', selected: 'ring-pink-400', today: 'bg-pink-50' },
    blue: { text: 'text-cyan-600', selected: 'ring-cyan-400', today: 'bg-cyan-50' },
    yellow: { text: 'text-yellow-600', selected: 'ring-yellow-400', today: 'bg-yellow-50' },
    gray: { text: 'text-gray-600', selected: 'ring-gray-400', today: 'bg-gray-50' },
  };
  const currentTheme = themeColors[theme] || themeColors.pink;

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-6 px-2">
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1))} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft className="text-slate-400" size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            {format(month, 'MMMM', { locale: ja })}
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tighter italic">
            {format(month, 'yyyy.MM')}
          </span>
        </div>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1))} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronRight className="text-slate-400" size={24} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w, i) => (
          <span key={w} className={`text-[9px] font-black text-center tracking-widest ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-slate-300'}`}>
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {blanks.map((_, i) => <div key={`b-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dNum = day.getDate();
          const isSelected = selectedDates && (isSameDay(day, selectedDates) || (Array.isArray(selectedDates) && selectedDates.some(d => isSameDay(day, d))));
          const isToday = isSameDay(day, today);
          const isHoliday = holidays.includes(dateStr);
          const dayOfWeek = getDay(day);

          // シフトデータの検索
          const s = Array.isArray(shifts) ? shifts.find((x: any) => x.shift_date && x.shift_date.startsWith(dateStr)) : null;

          // 📍 状態判定
          const isAbsent = s?.status === 'absent';
          const isLate = s?.is_late === true;
          const isOfficial = s?.status === 'official' && !isAbsent;
          const isRequested = s?.status === 'requested';
          const isModified = isRequested && s?.is_official_pre_exist;
          // 特定日の判定
          const isSpecialDay = s?.is_special_day === true; 

          const refStart = isModified ? s?.hp_start_time : s?.start_time;
          const hasOfficialBase = (isOfficial || isModified) && refStart && refStart !== 'OFF';

          let textColor = 'text-slate-700';
          if (dayOfWeek === 0 || isHoliday) textColor = 'text-rose-500';
          if (dayOfWeek === 6) textColor = 'text-blue-500';

          return (
            <div 
              key={dateStr} 
              onClick={() => onSelect(day)} 
              className={`relative h-12 w-full flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 cursor-pointer
              ${isSelected ? 'bg-white shadow-lg ring-2 ' + currentTheme.selected + ' z-10' : ''}
              ${isToday && !isSelected ? currentTheme.today : ''}
              ${isSpecialDay && !isSelected ? 'bg-blue-100' : ''} // 📍 特定日は背景を薄い青に
              `}
            >
              <span className={`z-20 text-[16px] font-black ${textColor}`}>{dNum}</span>

              {/* 📍 当欠：赤丸 */}
              {isAbsent && (
                <div className="absolute inset-1.5 rounded-full bg-rose-500 opacity-90 z-10 shadow-sm flex items-center justify-center" />
              )}

              {/* 📍 遅刻：薄いオレンジ○ */}
              {!isAbsent && isLate && hasOfficialBase && (
                <div className="absolute inset-1.5 rounded-full bg-orange-100 border-2 border-orange-300 z-10 shadow-sm" />
              )}

              {/* 📍 シフトあり：薄いピンク〇 */}
              {!isAbsent && !isLate && hasOfficialBase && (
                <div className="absolute inset-1.5 rounded-full bg-pink-100 border border-pink-200 z-10" />
              )}

              {/* 申請中（点線丸） */}
              {isRequested && !isModified && !isAbsent && (
                <div className="absolute inset-1 rounded-full border-2 border-slate-200 border-dashed z-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}