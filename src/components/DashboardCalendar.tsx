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
    <div className="w-full flex justify-center p-1 bg-white rounded-xl overflow-hidden custom-calendar-root">
      <style>{`
        /* ✨ カレンダー内の全要素から「円」を排除し「12pxの角丸」へ */
        .custom-calendar-root .rdp-day, 
        .custom-calendar-root .rdp-button, 
        .custom-calendar-root .rdp-day_selected {
          border-radius: 12px !important;
          aspect-ratio: 1 / 1 !important;
        }

        .custom-calendar-root .rdp { --rdp-cell-size: 45px; margin: 0; }
        .custom-calendar-root .rdp-table { border-collapse: separate !important; border-spacing: 2px !important; }
        .custom-calendar-root .rdp-months { justify-content: center !important; }

        .custom-calendar-root .rdp-button {
          width: 44px !important;
          height: 44px !important;
          font-size: 18px !important;
          font-weight: 800 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 3px solid transparent !important;
        }

        /* 🟦 選択時：青い「角丸の枠線」 */
        .custom-calendar-root .rdp-day_selected {
          background-color: transparent !important;
          color: #3b82f6 !important;
          border: 3px solid #3b82f6 !important;
          box-shadow: none !important;
        }

        /* 🌸 シフトあり：薄ピンク */
        .custom-calendar-root .hasShift {
          background-color: #fdf2f8 !important;
          color: #ec4899 !important;
        }

        /* 💡 特定日：薄黄色（シフトなし時のみ） */
        .custom-calendar-root .isEvent:not(.hasShift) { 
          background-color: #fffbeb !important;
        }

        .custom-calendar-root .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .custom-calendar-root .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        .custom-calendar-root .rdp-nav_button { color: #fda4af; border: none !important; }
        .custom-calendar-root .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 17px; }
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