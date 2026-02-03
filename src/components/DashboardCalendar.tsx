// components/DashboardCalendar.tsx
import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ★波線を消すための門番（Props）の設定
interface DashboardCalendarProps {
  shifts: any;           // これがあることで Page.tsx の波線が消えます
  selectedDates: any;
  onSelect: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  isRequestMode: boolean;
}

export default function DashboardCalendar({ 
  shifts, 
  selectedDates, 
  onSelect, 
  month, 
  onMonthChange, 
  isRequestMode 
}: DashboardCalendarProps) {
  
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </button>
        <span className="font-black text-slate-700">{format(month, 'yyyy年 M月')}</span>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-300 pb-1 text-center">{d}</div>
        ))}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          // その日のデータを探す
          const dayShift = Array.isArray(shifts) ? shifts.find((s: any) => s.shift_date === dateStr) : undefined;
          
          // 判定ロジック（ピンク・紫・黄色〇）
          const isOfficial = dayShift?.status === 'official' && dayShift?.is_official === true;
          const isRequested = dayShift?.status === 'requested' && !!dayShift?.main_request;
          const isSpecialDay = day.getDate() === 10 || (day.getMonth() === 10 && day.getDate() === 22);

          // 選択判定
          const isSelected = Array.isArray(selectedDates) 
            ? selectedDates.some(d => isSameDay(d, day)) 
            : selectedDates && isSameDay(selectedDates, day);

          return (
            <div 
              key={dateStr} 
              onClick={() => onSelect(day)} 
              className={`relative h-12 w-full flex flex-col items-center justify-center rounded-xl border border-gray-50 
                ${isSpecialDay ? 'bg-yellow-50' : 'bg-white'} 
                ${isSelected ? 'ring-2 ring-pink-500' : ''}`}
            >
              <span className={`z-10 text-xs font-black ${isOfficial ? 'text-white' : 'text-gray-600'}`}>
                {day.getDate()}
              </span>
              {isOfficial && <div className="absolute inset-1 rounded-full bg-pink-400" />}
              {isRequested && !isOfficial && <div className="absolute inset-1 rounded-full border-2 border-purple-400 border-dashed" />}
              {isSpecialDay && <div className="absolute top-1 right-1 h-1 w-1 rounded-full bg-yellow-400" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}