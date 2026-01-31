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
    <div className="flex justify-center p-1 bg-white rounded-xl overflow-hidden shadow-inner">
      <style>{`
        /* ✨ 全体のサイズとフォント */
        .rdp { --rdp-cell-size: 48px; margin: 0; }
        .rdp-day { font-size: 16px; font-weight: 600; position: relative; width: 48px; height: 48px; display: flex; items-center; justify-content: center; } 
        
        /* ✨ 選択時の青い丸（ズレ防止） */
        .rdp-day_selected { 
          background-color: #3b82f6 !important; /* 青に変更 */
          color: white !important; 
          font-weight: 900 !important;
          border-radius: 50% !important;
          border: none !important; /* 枠線を消してズレを防止 */
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        /* ✨ シフト該当日のピンク（薄く変更） */
        .hasShift:not(.rdp-day_selected) {
          color: #ec4899 !important;
          background-color: #fdf2f8 !important; /* 極めて薄いピンク */
          border: 1px solid #fce7f3;
          border-radius: 50%;
        }

        /* 土日・イベントの基本色 */
        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-head_cell:nth-child(6) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        .rdp-head_cell:nth-child(7) { color: #ef4444 !important; }

        .isEvent:not(.rdp-day_selected):not(.hasShift) { 
          background-color: #fffbeb;
          font-weight: 900 !important;
          border-radius: 8px;
        }

        /* 矢印や曜日の調整 */
        .rdp-nav_button { color: #fda4af; }
        .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 16px; }
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