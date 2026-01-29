//@ts-nocheck
'use client';

import { DayPicker } from "react-day-picker";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";
import "react-day-picker/dist/style.css"; 

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  const shiftDates = Array.isArray(shifts) ? shifts.map(s => s.shift_date) : [];

  const modifiers = {
    isEvent: (date) => [10, 11, 22].includes(getDate(date)),
    isSat: (date) => getDay(date) === 6,
    isSun: (date) => getDay(date) === 0,
    hasShift: (date) => shiftDates.includes(format(date, 'yyyy-MM-dd')),
  };

  return (
    <div className="w-full flex flex-col items-center py-2 bg-white rounded-xl relative">
      <style>{`
        /* 全体：土日の色を強制上書き */
        .rdp { margin: 0; --rdp-accent-color: #ec4899; }
        
        /* 1. 曜日の見出し（日・土） */
        .rdp-head_cell { color: #9ca3af !important; font-weight: 800 !important; }
        .rdp-table thead tr th:first-child { color: #ef4444 !important; } /* 日曜を赤 */
        .rdp-table thead tr th:last-child { color: #3b82f6 !important; }  /* 土曜を青 */

        /* 2. 日付の数字（日・土） */
        .rdp-day_isSun:not(.rdp-day_selected) { color: #ef4444 !important; font-weight: 800 !important; }
        .rdp-day_isSat:not(.rdp-day_selected) { color: #3b82f6 !important; font-weight: 800 !important; }

        /* 3. イベント（10, 11, 22） */
        .rdp-day_isEvent { 
          border: 2px solid #fbbf24 !important; 
          background-color: #fffbeb !important; 
          border-radius: 8px !important;
          color: #b45309 !important;
        }

        /* 4. シフトありの下線 */
        .rdp-day_hasShift:not(.rdp-day_selected) {
          text-decoration: underline !important;
          text-decoration-color: #f472b6 !important;
          text-decoration-thickness: 3px !important;
        }

        .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; border-radius: 8px; }
        .rdp-table { width: 100%; max-width: 100%; }
        .rdp-cell { width: 44px; height: 44px; text-align: center; }
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
          isEvent: "rdp-day_isEvent",
          hasShift: "rdp-day_hasShift"
        }}
      />
      
      {/* 🛠️ デバッグ用目印（これが見えたら最新です） */}
      <span className="text-[8px] text-gray-200 absolute bottom-0 right-2">v1.2</span>
    </div>
  );
}