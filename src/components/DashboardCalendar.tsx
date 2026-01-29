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
    <div className="w-full flex justify-center py-2 bg-white rounded-xl">
      <style>{`
        /* 全体の基本設定 */
        .rdp { margin: 0; --rdp-accent-color: #ec4899; }
        .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; border-radius: 8px; }

        /* 曜日の見出し（日〜土）を強制色分け */
        .rdp-head_cell { font-size: 10px; font-weight: 800; padding-bottom: 8px; text-align: center; }
        .rdp-head_cell:nth-child(1) { color: #ef4444 !important; } /* 日曜日(1番目)は赤 */
        .rdp-head_cell:nth-child(7) { color: #3b82f6 !important; } /* 土曜日(7番目)は青 */

        /* 日付の数字を強制色分け */
        .rdp-day_isSun:not(.rdp-day_selected) { color: #ef4444 !important; font-weight: bold !important; }
        .rdp-day_isSat:not(.rdp-day_selected) { color: #3b82f6 !important; font-weight: bold !important; }

        /* イベント（10, 11, 22日）の金枠 */
        .rdp-day_isEvent { 
          border: 2px solid #fbbf24 !important; 
          background-color: #fffbeb !important; 
          border-radius: 8px !important;
          color: #b45309 !important;
        }

        /* シフトがある日の下線 */
        .rdp-day_hasShift:not(.rdp-day_selected) {
          text-decoration: underline !important;
          text-decoration-color: #f472b6 !important;
          text-decoration-thickness: 3px !important;
        }

        .rdp-table { width: 100%; max-width: 100%; border-collapse: separate; border-spacing: 2px; }
        .rdp-cell { width: 44px; height: 44px; text-align: center; }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        locale={ja}
        modifiers={modifiers}
        // modifiersStylesの代わりにクラス名で制御します
        modifiersClassNames={{
          isSun: "rdp-day_isSun",
          isSat: "rdp-day_isSat",
          isEvent: "rdp-day_isEvent",
          hasShift: "rdp-day_hasShift"
        }}
      />
    </div>
  );
}