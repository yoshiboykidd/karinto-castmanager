'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isSaturday, isSunday, getDate } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DashboardCalendarProps {
  shifts: any[];
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  month?: Date;
  onMonthChange?: (date: Date) => void;
}

export default function DashboardCalendar({ 
  shifts, selectedDate, onSelect, month, onMonthChange 
}: DashboardCalendarProps) {

  const shiftDays = shifts.map(s => parseISO(s.shift_date));
  
  // ✨ イベント日の判定 (10, 11, 22日)
  const eventDays = (date: Date) => [10, 11, 22].includes(getDate(date));

  const modifiers = {
    hasShift: shiftDays,
    isSaturday: (date: Date) => isSaturday(date),
    isSunday: (date: Date) => isSunday(date),
    isEvent: eventDays,
  };

  return (
    <div className="flex justify-center p-1 bg-white rounded-xl overflow-hidden scale-95 origin-top">
      <style>{`
        /* 基本の色 */
        .rdp-day_selected { background-color: #fce7f3 !important; color: #ec4899 !important; font-weight: 900 !important; border: 2px solid #ec4899 !important; }
        
        /* 土曜日を青に */
        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-head_cell:nth-child(6) { color: #3b82f6 !important; } /* 曜日の「土」 */

        /* 日曜・祝日を赤に (祝日は暫定的に日曜と同じ扱いに設定) */
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        .rdp-head_cell:nth-child(7) { color: #ef4444 !important; } /* 曜日の「日」 */

        /* ✨ イベント日のデザイン（数字の下にドット、または背景を薄く） */
        .isEvent:not(.rdp-day_selected) { 
          background-color: #fffbeb; /* 薄い黄色 */
          font-weight: 900 !important;
          border-radius: 8px;
        }

        /* シフトがある日（ピンクの丸） */
        .hasShift:not(.rdp-day_selected) {
          color: white !important;
          background-color: #ec4899 !important;
          border-radius: 50%;
        }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        locale={ja}
        modifiers={modifiers}
        modifiersClassNames={{
          isSaturday: 'isSaturday',
          isSunday: 'isSunday',
          isEvent: 'isEvent',
          hasShift: 'hasShift'
        }}
        formatters={{
          formatCaption: (date) => format(date, 'yyyy.MM', { locale: ja }),
        }}
      />
    </div>
  );
}