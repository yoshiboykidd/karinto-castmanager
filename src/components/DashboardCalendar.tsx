import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardCalendar({ shifts, selectedDates, onSelect, month, onMonthChange, isRequestMode }: any) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });

  return (
    <div className="w-full">
      {/* 月切り替え：フォントをBlackにしてPOPに */}
      <div className="flex items-center justify-between mb-4 px-4">
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-2 text-gray-300 active:text-pink-400">
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-black text-slate-700 tracking-tighter">
          {format(month, 'yyyy / M月')}
        </span>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-2 text-gray-300 active:text-pink-400">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <div key={d} className="text-[9px] font-black text-slate-300 pb-2 text-center tracking-widest">{d}</div>
        ))}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const s = Array.isArray(shifts) ? shifts.find((x: any) => x.shift_date === dateStr) : null;
          
          const isOfficial = s?.status === 'official';
          const isRequested = s?.status === 'requested' && !!s?.main_request;
          const isSelected = Array.isArray(selectedDates) ? selectedDates.some(d => isSameDay(d, day)) : selectedDates && isSameDay(selectedDates, day);
          const isSpecial = day.getDate() === 10 || (day.getMonth() === 10 && day.getDate() === 22);

          return (
            <div 
              key={dateStr} 
              onClick={() => onSelect(day)} 
              className={`
                relative h-12 w-full flex flex-col items-center justify-center rounded-2xl transition-all duration-200 active:scale-90
                ${isSpecial ? 'bg-yellow-50/50' : 'bg-transparent'} 
                ${isSelected ? 'bg-white shadow-lg ring-2 ring-pink-400 z-10' : ''}
              `}
            >
              {/* 日付数字：確定時は白、それ以外はグレー */}
              <span className={`z-10 text-[13px] font-black ${isOfficial ? 'text-white' : isSelected ? 'text-pink-500' : 'text-slate-600'}`}>
                {day.getDate()}
              </span>

              {/* 確定：サクラピンクの円 */}
              {isOfficial && <div className="absolute inset-1 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 shadow-sm" />}
              
              {/* 申請中：紫の点線（デザイン重視の細め） */}
              {isRequested && !isOfficial && (
                <div className="absolute inset-1 rounded-full border-2 border-purple-300 border-dashed animate-pulse" />
              )}

              {/* 特定日：小さな黄色の星（ドット） */}
              {isSpecial && <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-sm" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}