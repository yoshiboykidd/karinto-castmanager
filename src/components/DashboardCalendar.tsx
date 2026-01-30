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
  const eventDays = (date: Date) => [10, 11, 22].includes(getDate(date));

  const modifiers = {
    hasShift: shiftDays,
    isSaturday: (date: Date) => isSaturday(date),
    isSunday: (date: Date) => isSunday(date),
    isEvent: eventDays,
  };

  return (
    <div className="flex justify-center p-1 bg-white rounded-xl overflow-hidden scale-100 origin-top">
      <style>{`
        /* ✨ 数字を大きく、セルを広く (45px -> 48px) */
        .rdp { --rdp-cell-size: 48px; margin: 0; }
        .rdp-day { font-size: 16px; font-weight: 600; } 
        
        .rdp-day_selected { background-color: #fce7f3 !important; color: #ec4899 !important; font-weight: 900 !important; border: 2px solid #ec4899 !important; }
        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-head_cell:nth-child(6) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        .rdp-head_cell:nth-child(7) { color: #ef4444 !important; }

        .isEvent:not(.rdp-day_selected) { 
          background-color: #fffbeb;
          font-weight: 900 !important;
          border-radius: 8px;
        }

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