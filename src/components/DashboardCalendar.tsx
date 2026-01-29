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
      
      {/* 🔴 届いているか確認するための目印 */}
      <div className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full mb-1 font-black animate-pulse">
        LATEST VERSION 1.3
      </div>

      <style>{`
        .rdp { margin: 0; --rdp-accent-color: #ec4899; }
        
        /* 1. 曜日の見出し（日〜土）を強制色分け */
        .rdp-table thead tr th:nth-child(1) { color: #ef4444 !important; opacity: 1 !important; } /* 日：赤 */
        .rdp-table thead tr th:nth-child(7) { color: #3b82f6 !important; opacity: 1 !important; } /* 土：青 */

        /* 2. 日付の数字を「列の順番」で強制色分け */
        /* 1列目（日曜日）のボタン */
        .rdp-table tbody tr td:nth-child(1) button:not(.rdp-day_selected) { 
          color: #ef4444 !important; 
          font-weight: 800 !important; 
        }
        /* 7列目（土曜日）のボタン */
        .rdp-table tbody tr td:nth-child(7) button:not(.rdp-day_selected) { 
          color: #3b82f6 !important; 
          font-weight: 800 !important; 
        }

        /* 3. イベント（10, 11, 22）の金枠 */
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
          isEvent: "rdp-day_isEvent"
        }}
      />
    </div>
  );
}