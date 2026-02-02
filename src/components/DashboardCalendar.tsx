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
      if (index > -1) {
        currentDates.splice(index, 1);
      } else {
        currentDates.push(day);
      }
      onSelect(currentDates);
    } else {
      onSelect(day);
    }
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => onMonthChange(subMonths(month, 1))} className="p-2 text-pink-300 font-black text-xl active:scale-90 transition-transform">&lt;</button>
        <h2 className="text-[20px] font-black text-gray-700 italic tracking-tighter">{format(month, 'yyyy / MM', { locale: ja })}</h2>
        <button onClick={() => onMonthChange(addMonths(month, 1))} className="p-2 text-pink-300 font-black text-xl active:scale-90 transition-transform">&gt;</button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
          <div key={d} className={`text-[10px] font-black uppercase text-center ${i === 0 ? 'text-red-300' : i === 6 ? 'text-blue-300' : 'text-gray-300'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayNum = day.getDate();
          const shift = (shifts || []).find((s) => s.shift_date === key);
          
          const isOfficial = shift?.status === 'official' && shift.start_time !== 'OFF';
          const isRequested = shift?.status === 'requested';
          const isSpecialDay = [10, 11, 20].includes(dayNum);
          const isCurrentMonth = isSameMonth(day, month);
          const isSelected = Array.isArray(selectedDates)
            ? selectedDates.some((d) => isSameDay(d, day))
            : selectedDates && isSameDay(selectedDates, day);

          return (
            <div
              key={key}
              onClick={() => handleDateClick(day)}
              className={`relative h-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'} ${isSpecialDay && isCurrentMonth ? 'bg-yellow-50/70' : ''}`}
            >
              {isSelected && (
                <div className={`absolute inset-1 rounded-2xl border-2 z-0 ${isRequestMode ? 'border-purple-300 bg-purple-50/30' : 'border-pink-200 bg-pink-50/30'}`} />
              )}
              {isOfficial && isCurrentMonth && (
                <div className="absolute w-8 h-8 bg-pink-400 rounded-full opacity-20 z-0 animate-in fade-in zoom-in duration-300" />
              )}
              <span className={`relative z-10 text-[15px] font-black tracking-tighter ${isOfficial ? 'text-pink-500' : 'text-gray-600'} ${isRequested ? 'underline decoration-wavy decoration-purple-400 underline-offset-4' : ''}`}>
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