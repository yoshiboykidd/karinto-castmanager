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
    <div className="w-full flex flex-col items-center py-2 bg-white rounded-xl relative border-2 border-pink-50">
      
      {/* 🟢 反映確認用ラベルを 1.4 に更新 */}
      <div className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full mb-1 font-black">
        LATEST VERSION 1.4
      </div>

      <style>{`
        .rdp { margin: 0; --rdp-accent-color: #ec4899; }
        
        /* 曜日の見出しの色 */
        .rdp-table thead tr th:nth-child(1) { color: #ef4444 !important; } /* 日：赤 */
        .rdp-table thead tr th:nth-child(7) { color: #3b82f6 !important; } /* 土：青 */

        /* 日付（数字）の色 */
        .rdp-day_isSun:not(.rdp-day_selected) { color: #ef4444 !important; font-weight: 800 !important; }
        .rdp-day_isSat:not(.rdp-day_selected) { color: #3b82f6 !important; font-weight: 800 !important; }

        /* イベント（10, 11, 22）の金枠 */
        .rdp-day_isEvent { 
          border: 2px solid #fbbf24 !important; 
          background-color: #fffbeb !important; 
          border-radius: 8px !important;
          color: #b45309 !important;
        }

        .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; border-radius: 8px; }
        .rdp-table { width: 100%; max-width: 100%; border-collapse: collapse; }
        .rdp-cell { width: 44px; height: 44px; text-align: center; padding: 0; }
        .rdp-button { width: 40px; height: 40px; justify-content: center; }
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
          isEvent: "rdp-day_isEvent"
        }}
      />
    </div>
  );
}