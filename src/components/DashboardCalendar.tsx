//@ts-nocheck
'use client';

import { DayPicker } from "react-day-picker";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";
import "react-day-picker/dist/style.css"; 

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  const shiftDates = Array.isArray(shifts) ? shifts.map(s => s.shift_date) : [];

  // 土日・イベント日の判定（10, 11, 22を追加）
  const modifiers = {
    isEvent: (date) => [10, 11, 22].includes(getDate(date)),
    isSat: (date) => getDay(date) === 6,
    isSun: (date) => getDay(date) === 0,
    hasShift: (date) => shiftDates.includes(format(date, 'yyyy-MM-dd')),
  };

  // 日付（数字部分）の色設定
  const modifiersStyles = {
    isSat: { color: '#3b82f6', fontWeight: 'bold' }, // 土曜の数字を青
    isSun: { color: '#ef4444', fontWeight: 'bold' }, // 日曜の数字を赤
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
        
        /* 曜日の見出し（日〜土）の色設定 */
        .rdp-head_cell { font-size: 10px; font-weight: 800; padding-bottom: 8px; }
        .rdp-head_cell:first-child { color: #ef4444 !important; } /* 日曜日を赤 */
        .rdp-head_cell:last-child { color: #3b82f6 !important; }  /* 土曜日を青 */
        
        .rdp-caption_label { font-size: 14px; font-weight: 900; color: #374151; }
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