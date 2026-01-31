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
        /* ✨ 7列のテーブルレイアウトを死守 */
        .rdp-table {
          display: table !important;
          border-collapse: separate !important;
          border-spacing: 2px !important;
          width: auto !important;
        }

        /* ✨ 数字を大きく、セルを丸く */
        .rdp-button {
          width: 44px !important;
          height: 44px !important;
          border-radius: 50% !important; /* 👈 ここで確実に丸くする */
          font-size: 18px !important;    /* 👈 数字をさらに大きく */
          font-weight: 800 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          position: relative !important;
          padding: 0 !important;
        }

        /* ✨ シフトあり（桜色の正円） */
        .hasShift:not(.rdp-day_selected) {
          background-color: #fdf2f8 !important;
          color: #ec4899 !important;
          border: 1px solid #fce7f3 !important;
          border-radius: 50% !important;
        }

        /* ✨ 選択時（青い正円：ピンクを上書き） */
        .rdp-day_selected {
          background-color: #3b82f6 !important;
          color: white !important;
          border: none !important;
          border-radius: 50% !important;
          box-shadow: 0 0 0 3px #3b82f6;
          z-index: 10;
        }

        /* 土日・イベントの色設定 */
        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        
        .isEvent:not(.rdp-day_selected):not(.hasShift) { 
          background-color: #fffbeb !important;
          border-radius: 12px !important; /* イベント日のみ少し角丸四角 */
        }

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