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

  const modifiers = {
    hasShift: shiftDays,
    isSaturday: (date: Date) => isSaturday(date),
    isSunday: (date: Date) => isSunday(date),
    isEvent: eventDays,
  };

  return (
    <div className="w-full flex justify-center p-1 bg-white rounded-xl overflow-hidden">
      <style>{`
        /* 🚨 強制的に丸を四角へ矯正 */
        .rdp-day, .rdp-button, .rdp-day_selected {
          border-radius: 12px !important; /* 👈 円(50%)を完全に上書き */
          aspect-ratio: 1 / 1 !important;
        }

        .rdp { --rdp-cell-size: 45px; margin: 0; }
        .rdp-table { border-collapse: separate !important; border-spacing: 2px !important; }
        .rdp-months { justify-content: center !important; }

        .rdp-button {
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
        .rdp-day_selected, .rdp-day_selected:hover, .rdp-day_selected:focus {
          background: transparent !important; /* 塗りつぶしを消す */
          color: #3b82f6 !important;
          border: 3px solid #3b82f6 !important; /* 枠線を出す */
          opacity: 1 !important;
        }

        /* 🌸 シフトあり：薄ピンク */
        .hasShift {
          background-color: #fdf2f8 !important;
          color: #ec4899 !important;
        }

        /* 💡 特定日：薄黄色 */
        .isEvent:not(.hasShift) { 
          background-color: #fffbeb !important;
        }

        /* 曜日と年月 */
        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
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