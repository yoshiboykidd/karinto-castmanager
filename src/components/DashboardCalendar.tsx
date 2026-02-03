'use client';

import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
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
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });

  return (
    <div className="w-full">
      {/* 1. ヘッダー */}
      <div className="flex items-center justify-between mb-4 px-4 font-black text-slate-700">
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft className="text-pink-300" />
        </button>
        <span className="text-lg tracking-tighter">{format(month, 'yyyy / M月')}</span>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight className="text-pink-300" />
        </button>
      </div>

      {/* 2. 曜日 */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <div key={d} className="text-[9px] font-black text-slate-300 pb-2 text-center tracking-widest">{d}</div>
        ))}

        {/* 3. 日付セル */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const s = Array.isArray(shifts) ? shifts.find((x: any) => x.shift_date === dateStr) : null;
          
          const isOfficial = s?.status === 'official';
          const isRequested = s?.status === 'requested';
          const isModified = isRequested && s?.is_official_pre_exist; // 確定後の変更
          const hasOfficialBase = isOfficial || isModified;

          const isSelected = Array.isArray(selectedDates) 
            ? selectedDates.some(d => isSameDay(d, day)) 
            : selectedDates && isSameDay(selectedDates, day);

          const dNum = day.getDate();
          const isKarin = dNum === 10;
          const isSoine = dNum === 11 || dNum === 22;

          return (
            <div 
              key={dateStr} 
              onClick={() => onSelect(day)} 
              className={`relative h-12 w-full flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 cursor-pointer
              ${isKarin ? 'bg-orange-50/50' : isSoine ? 'bg-yellow-50/50' : 'bg-transparent'} 
              ${isSelected ? 'bg-white shadow-lg ring-2 ring-pink-400 z-10' : ''}`}
            >
              {/* 日付数字 */}
              <span className={`z-20 text-[13px] font-black 
                ${hasOfficialBase ? 'text-white' : isSelected ? 'text-pink-500' : 'text-slate-600'}`}>
                {dNum}
              </span>

              {/* A. 確定ベース：ピンクの丸 */}
              {hasOfficialBase && (
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 shadow-sm z-10" />
              )}
              
              {/* B. 変更申請中：極太の「緑」枠線 */}
              {isModified && (
                <div className="absolute inset-0.5 rounded-full border-[5px] border-green-500 z-[15] animate-pulse" />
              )}
              
              {/* C. 新規申請：紫の点線 */}
              {isRequested && !isModified && (
                <div className="absolute inset-1 rounded-full border-2 border-purple-400 border-dashed animate-pulse z-10" />
              )}

              {/* 特定日ドット */}
              {isKarin && <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-400 shadow-sm z-30" />}
              {isSoine && <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-sm z-30" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}