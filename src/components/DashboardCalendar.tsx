'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DashboardCalendarProps {
  shifts: any[];
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  month?: Date;                    // ✨ 追加
  onMonthChange?: (date: Date) => void; // ✨ 追加
}

export default function DashboardCalendar({ 
  shifts, 
  selectedDate, 
  onSelect,
  month,           // ✨ 受け取る
  onMonthChange    // ✨ 受け取る
}: DashboardCalendarProps) {

  // シフトがある日のスタイル設定
  const shiftDays = shifts.map(s => parseISO(s.shift_date));

  const modifiers = {
    hasShift: shiftDays,
  };

  const modifiersStyles = {
    hasShift: {
      color: 'white',
      backgroundColor: '#ec4899', // ピンク
      fontWeight: 'bold',
      borderRadius: '50%',
    },
  };

  return (
    <div className="flex justify-center p-1 bg-white rounded-xl overflow-hidden scale-95 origin-top">
      <style>{`
        .rdp { --rdp-cell-size: 45px; margin: 0; }
        .rdp-day_selected { background-color: #fce7f3 !important; color: #ec4899 !important; font-weight: 900 !important; border: 2px solid #ec4899 !important; }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #fff1f2; color: #ec4899; }
        .rdp-head_cell { font-size: 10px; font-weight: 900; color: #fda4af; text-transform: uppercase; }
        .rdp-nav_button { color: #fda4af; }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        month={month}              // ✨ DayPicker本体に月を伝える
        onMonthChange={onMonthChange} // ✨ 矢印が押されたら親に伝える
        locale={ja}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        formatters={{
          formatCaption: (date) => format(date, 'yyyy.MM', { locale: ja }),
        }}
      />
    </div>
  );
}