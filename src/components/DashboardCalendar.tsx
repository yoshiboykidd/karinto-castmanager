//@ts-nocheck
'use client';

import { DayPicker } from "react-day-picker";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";
import "react-day-picker/dist/style.css"; 

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  const shiftDates = Array.isArray(shifts) ? shifts.map(s => String(s.shift_date).trim()) : [];

  const modifiers = {
    isEvent: (date) => [10, 11, 22].includes(getDate(date)),
    isSat: (date) => getDay(date) === 6,
    isSun: (date) => getDay(date) === 0,
    hasShift: (date) => {
      const d = format(date, 'yyyy-MM-dd');
      return shiftDates.includes(d);
    },
  };

  return (
    <div className="w-full flex flex-col items-center py-2 bg-white rounded-xl relative">
      
      {/* 🚀 バージョン確認用目印 */}
      <div className="text-[10px] text-gray-300 mb-1">
        v1.9 (Shifts: {shiftDates.length})
      </div>

      <style>{`
        .rdp { margin: 0; --rdp-accent-color: #ec4899; }
        
        /* 曜日の文字色 */
        .rdp-table thead tr th:nth-child(1) { color: #ef4444 !important; opacity: 1 !important; }
        .rdp-table thead tr th:nth-child(7) { color: #3b82f6 !important; opacity: 1 !important; }

        /* 土日の数字の色 */
        .rdp-day_isSun:not(.rdp-day_selected) { color: #ef4444 !important; font-weight: 800 !important; }
        .rdp-day_isSat:not(.rdp-day_selected) { color: #3b82f6 !important; font-weight: 800 !important; }

        /* 【確定】出勤日のピンク丸（枠なし） */
        .rdp-day_hasShift:not(.rdp-day_selected) {
          background-color: #fce7f3 !important; /* 薄ピンク */
          color: #db2777 !important;           /* 濃いピンク文字 */
          border-radius: 50% !important;
          font-weight: 900 !important;
          border: none !important;
        }

        /* 選択中（当日など） */
        .rdp-day_selected { 
          background-color: var(--rdp-accent-color) !important; 
          color: white !important; 
          border-radius: 50% !important; 
        }

        .rdp-table { width: 100%; max-width: 100%; border-collapse: separate; border-spacing: 4px; }
        .rdp-cell { width: 44px; height: 44px; text-align: center; padding: 0; }
        .rdp-button { width: 40px; height: 40px; justify-content: center; margin: auto !important; }
      `}</style>
      
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        locale={ja}
        modifiers={modifiers}
        modifiersClassNames={{
          isSun: "rdp-day_isSun",
          isSat: "rdp-day_isSat",
          hasShift: "rdp-day_hasShift"
        }}
      />
    </div>
  );
}