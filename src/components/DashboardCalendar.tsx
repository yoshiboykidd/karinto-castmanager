import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardCalendar({ shifts, selectedDates, onSelect, month, onMonthChange, isRequestMode }: any) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4 px-4 font-black text-slate-700">
        <button onClick={() => onMonthChange(new Date(month.setMonth(month.getMonth() - 1)))}><ChevronLeft /></button>
        <span>{format(month, 'yyyy年 M月')}</span>
        <button onClick={() => onMonthChange(new Date(month.setMonth(month.getMonth() + 1)))}><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => <div key={d} className="text-[10px] font-bold text-slate-300 pb-1 text-center">{d}</div>)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const s = Array.isArray(shifts) ? shifts.find((x: any) => x.shift_date === dateStr) : null;
          
          const isOfficial = s?.status === 'official';
          const isRequested = s?.status === 'requested' && !!s?.main_request;
          const isSelected = Array.isArray(selectedDates) ? selectedDates.some(d => isSameDay(d, day)) : selectedDates && isSameDay(selectedDates, day);
          const isSpecial = day.getDate() === 10 || (day.getMonth() === 10 && day.getDate() === 22);

          return (
            <div key={dateStr} onClick={() => onSelect(day)} 
              className={`relative h-12 w-full flex flex-col items-center justify-center rounded-xl transition-all active:scale-95
              ${isSpecial ? 'bg-yellow-50' : 'bg-white'} ${isSelected ? 'ring-2 ring-pink-500 z-10 shadow-md' : 'border border-gray-50'}`}>
              
              <span className={`z-10 text-xs font-black ${isOfficial ? 'text-white' : isRequested ? 'text-purple-600' : 'text-slate-600'}`}>
                {day.getDate()}
              </span>

              {/* 確定：ピンクの円 */}
              {isOfficial && <div className="absolute inset-1 rounded-full bg-pink-400 shadow-sm" />}
              {/* 申請中：紫の点線リング */}
              {isRequested && !isOfficial && <div className="absolute inset-1 rounded-full border-2 border-purple-400 border-dashed animate-pulse" />}
              {/* 特定日：黄色の点 */}
              {isSpecial && <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-400" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}