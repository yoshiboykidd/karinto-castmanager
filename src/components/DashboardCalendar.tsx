'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardCalendarProps {
  shifts: any[];
  selectedDates: any;
  onSelect: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  isRequestMode: boolean;
}

export default function DashboardCalendar({ 
  shifts = [], 
  selectedDates, 
  onSelect, 
  month = new Date(), 
  onMonthChange 
}: DashboardCalendarProps) {
  const [mounted, setMounted] = useState(false);

  // ハイドレーションエラーを確実に防ぐためのマウントチェック
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !month) return <div className="w-full h-[400px] bg-transparent" />;

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

      {/* 2. 曜日（日＝赤、土＝青） */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, idx) => (
          <div key={d} className={`text-[10px] font-black pb-2 text-center tracking-widest
            ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-300'}`}>
            {d}
          </div>
        ))}

        {/* 3. 日付セル */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const s = Array.isArray(shifts) ? shifts.find((x: any) => x.shift_date === dateStr) : null;
          
          const isOfficial = s?.status === 'official';
          const isRequested = s?.status === 'requested';
          const isModified = isRequested && s?.is_official_pre_exist;
          
          // Official(確定)かつ時間が 'OFF' ではない場合のみピンク丸
          const isNotOff = s?.start_time !== 'OFF';
          const hasOfficialBase = (isOfficial || isModified) && isNotOff;

          const isSelected = selectedDates ? (
            Array.isArray(selectedDates) 
              ? selectedDates.some(d => d instanceof Date && isSameDay(d, day)) 
              : (selectedDates instanceof Date && isSameDay(selectedDates, day))
          ) : false;

          const dNum = day.getDate();
          const dayOfWeek = getDay(day); // 0:日, 6:土

          // テキスト色判定（外部データに依存しない）
          let textColor = 'text-slate-600';
          if (hasOfficialBase) {
            textColor = 'text-white';
          } else if (dayOfWeek === 0) {
            textColor = 'text-red-500'; // 日曜は赤
          } else if (dayOfWeek === 6) {
            textColor = 'text-blue-500'; // 土曜は青
          } else if (isSelected) {
            textColor = 'text-pink-500';
          }

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
              <span className={`z-20 text-[13px] font-black ${textColor}`}>
                {dNum}
              </span>

              {hasOfficialBase && (
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 shadow-sm z-10" />
              )}
              
              {isModified && (
                <div className="absolute inset-0.5 rounded-full border-[5px] border-green-500 z-[15] animate-pulse" />
              )}
              
              {isRequested && !isModified && (
                <div className="absolute inset-1 rounded-full border-2 border-purple-400 border-dashed animate-pulse z-10" />
              )}

              {isKarin && <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-400 shadow-sm z-30" />}
              {isSoine && <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-sm z-30" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}