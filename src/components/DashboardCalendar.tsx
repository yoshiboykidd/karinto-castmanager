//@ts-nocheck
'use client';

import { DayPicker } from "react-day-picker";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";
import "react-day-picker/dist/style.css"; // 標準のスタイルを適用

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  const shiftDates = Array.isArray(shifts) ? shifts.map(s => s.shift_date) : [];

  // 土日・イベント日の判定
  const modifiers = {
    isEvent: (date) => [10,11, 22].includes(getDate(date)),
    isSat: (date) => getDay(date) === 6,
    isSun: (date) => getDay(date) === 0,
    hasShift: (date) => shiftDates.includes(format(date, 'yyyy-MM-dd')),
  };

  // スタイルの設定
  const modifiersStyles = {
    isSat: { color: '#3b82f6', fontWeight: 'bold' }, // 青
    isSun: { color: '#ef4444', fontWeight: 'bold' }, // 赤
    isEvent: { 
      border: '2px solid #fbbf24', 
      backgroundColor: '#fffbeb', 
      borderRadius: '8px' 
    },
    hasShift: {
      textDecoration: 'underline',
      textDecorationColor: '#f472b6',
      textDecorationThickness: '2px',
      fontWeight: 'bold'
    }
  };

  return (
    <div className="w-full flex justify-center py-2 bg-white rounded-xl">
      <style>{`
        .rdp { margin: 0; --rdp-accent-color: #ec4899; }
        .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; border-radius: 8px; }
        .rdp-table { width: 100%; max-width: 100%; }
        .rdp-cell { width: 44px; height: 44px; text-align: center; }
        .rdp-head_cell { font-size: 10px; color: #9ca3af; font-weight: 800; }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        locale={ja}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
      />
    </div>
  );
}