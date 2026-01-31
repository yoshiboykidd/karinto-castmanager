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
    <div className="w-full flex justify-center p-1 bg-white rounded-xl">
      <style>{`
        .rdp { --rdp-cell-size: 45px; margin: 0; border: none !important; }
        .rdp-table { border-collapse: collapse !important; border: 0 !important; }
        .rdp-cell { border: 0 !important; padding: 0 !important; }
        .rdp-months { justify-content: center !important; }

        .rdp-button {
          width: 44px !important;
          height: 44px !important;
          border-radius: 12px !important;
          font-size: 18px !important;
          font-weight: 800 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.1s ease;
          border: 2px solid transparent !important; /* 枠の予約 */
        }

        /* ✨ 選択時：青い線枠だけにする */
        .rdp-day_selected {
          background-color: transparent !important; /* 背景は塗らない */
          color: #3b82f6 !important; /* 文字を青く */
          border: 3px solid #3b82f6 !important; /* 太めの青枠 */
          z-index: 10;
        }

        /* シフトあり（桜色の角丸） */
        .hasShift:not(.rdp-day_selected) {
          background-color: #fdf2f8 !important;
          color: #ec4899 !important;
        }

        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        
        .isEvent:not(.rdp-day_selected):not(.hasShift) { 
          background-color: #fffbeb !important;
        }

        .rdp-nav_button { color: #fda4af; border: none !important; }
        .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 17px; }
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
      />
    </div>
  );
}