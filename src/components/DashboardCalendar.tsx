'use client';

import React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { ja } from 'date-fns/locale';

interface Props {
  shifts: any[];
  selectedDates: Date | Date[] | undefined;
  onSelect: (date: Date | Date[]) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  isRequestMode: boolean;
}

const DashboardCalendar: React.FC<Props> = ({
  shifts,
  selectedDates,
  onSelect,
  month,
  onMonthChange,
  isRequestMode,
}) => {
  const startDate = startOfWeek(startOfMonth(month));
  const endDate = endOfWeek(endOfMonth(month));
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDateClick = (day: Date) => {
    if (isRequestMode) {
      const currentDates = Array.isArray(selectedDates) ? [...selectedDates] : [];
      const index = currentDates.findIndex((d) => isSameDay(d, day));
      if (index > -1) { currentDates.splice(index, 1); } 
      else { currentDates.push(day); }
      onSelect(currentDates);
    } else { onSelect(day); }
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => onMonthChange(subMonths(month, 1))} className="p-2 text-pink-300 font-black text-xl">&lt;</button>
        <h2 className="text-[20px] font-black text-gray-700 italic tracking-tighter">{format(month, 'yyyy / MM', { locale: ja })}</h2>
        <button onClick={() => onMonthChange(addMonths(month, 1))} className="p-2 text-pink-300 font-black text-xl">&gt;</button>
      </div>

      <div className="grid grid-cols-7 mb-2 text-[10px] font-black uppercase text-center">
        <div className="text-red-300">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-blue-300">土</div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayNum = day.getDate();
          const shift = (shifts || []).find((s) => s.shift_date === key);
          const isOfficial = shift?.status === 'official' && shift.start_time !== 'OFF';
          const isRequested = shift?.status === 'requested';
          const isCurrentMonth = isSameMonth(day, month);
          const isSelected = Array.isArray(selectedDates) ? selectedDates.some((d) => isSameDay(d, day)) : selectedDates && isSameDay(selectedDates, day);

          // 💡 特定日 (10, 11, 22) の判定
          const isSpecialDay = isCurrentMonth && [10, 11, 22].includes(dayNum);

          return (
            <div
              key={key}
              onClick={() => handleDateClick(day)}
              className={`relative h-12 flex items-center justify-center cursor-pointer ${!isCurrentMonth ? 'opacity-10' : 'opacity-100'}`}
            >
              {/* 選択時 */}
              {isSelected && (
                <div className={`absolute inset-0.5 rounded-xl border-2 z-0 ${isRequestMode ? 'border-purple-300 bg-purple-50/30' : 'border-pink-200 bg-pink-50/30'}`} />
              )}

              {/* 1. 特定日 (黄色い〇) */}
              {isSpecialDay && (
                <div className="absolute w-8 h-8 border-2 border-yellow-400 rounded-full z-0" />
              )}

              {/* 2. 確定出勤 (ピンクの円) */}
              {isOfficial && isCurrentMonth && (
                <div className="absolute w-8 h-8 bg-pink-400 rounded-full opacity-20 z-0" />
              )}

              {/* 3. 申請中 (紫の細いリング) */}
              {isRequested && isCurrentMonth && (
                <div className="absolute w-7 h-7 border border-purple-300 rounded-full z-0" />
              )}

              <span className={`relative z-10 text-[16px] font-black tracking-tighter ${isOfficial ? 'text-pink-500' : isRequested ? 'text-purple-500' : 'text-gray-600'}`}>
                {dayNum}
              </span>
              {isSameDay(day, new Date()) && <div className="absolute bottom-1 w-1 h-1 bg-pink-300 rounded-full" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardCalendar;