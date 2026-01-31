'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isSaturday, isSunday } from 'date-fns';
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
  const eventDays = (date: Date) => [10, 11, 22].includes(date.getDate());

  return (
    <div className="w-full flex justify-center p-1 bg-white rounded-xl overflow-hidden">
      <style>{`
        .rdp { --rdp-cell-size: 45px; margin: 0; }
        .rdp-button { font-size: 18px !important; font-weight: 800 !important; }
        
        /* 🌸 シフトあり：12pxの角丸（四角） */
        .hasShift:not(.rdp-day_selected) { 
          background-color: #fdf2f8 !important; 
          color: #ec4899 !important; 
          border-radius: 12px !important; 
        }

        /* 🟦 選択時：青い丸（現状維持） */
        .rdp-day_selected { 
          background-color: #3b82f6 !important; 
          color: white !important; 
          border-radius: 50% !important;
        }

        /* 💡 特定日：角丸四角 */
        .isEvent:not(.hasShift):not(.rdp-day_selected) { 
          background-color: #fffbeb !important; 
          border-radius: 8px !important; 
        }

        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        .rdp-nav_button { color: #fda4af; }
        .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 17px; }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        locale={ja}
        modifiers={{
          hasShift: shiftDays,
          isSaturday: (date: Date) => isSaturday(date),
          isSunday: (date: Date) => isSunday(date),
          isEvent: eventDays,
        }}
        modifiersClassNames={{
          isSaturday: 'isSaturday',
          isSunday: 'isSunday',
          isEvent: 'isEvent',
          hasShift: 'hasShift'
        }}
      />
    </div>
  );
}