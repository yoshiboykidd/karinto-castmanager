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
    /* ✨ IDを付与して CSSの優先順位を最大化 */
    <div id="calendar-root" className="w-full flex justify-center p-1 bg-white rounded-xl">
      <style>{`
        /* 🚨 最優先（ID指定）で丸を四角に矯正 */
        #calendar-root .rdp-day,
        #calendar-root .rdp-button,
        #calendar-root .rdp-day_selected,
        #calendar-root .rdp-day_selected:hover {
          border-radius: 12px !important; /* 角丸四角 */
          clip-path: none !important;
          mask-image: none !important;
        }

        #calendar-root .rdp { --rdp-cell-size: 46px; margin: 0; }
        
        /* 選択中の青い枠線（四角） */
        #calendar-root .rdp-day_selected {
          background-color: transparent !important;
          color: #3b82f6 !important;
          border: 3px solid #3b82f6 !important;
          box-shadow: none !important;
        }

        /* シフト日の薄ピンク（角丸） */
        #calendar-root .hasShift {
          background-color: #fdf2f8 !important;
          color: #ec4899 !important;
        }

        /* 特定日の薄黄色（シフトなし時） */
        #calendar-root .isEvent:not(.hasShift) { 
          background-color: #fffbeb !important;
        }

        /* 土日・ナビゲーションの調整 */
        #calendar-root .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        #calendar-root .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        #calendar-root .rdp-nav_button { color: #fda4af; border: none !important; }
        #calendar-root .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 17px; }
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