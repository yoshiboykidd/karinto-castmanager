//@ts-nocheck
'use client';

import { DayPicker } from "react-day-picker";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";
import "react-day-picker/dist/style.css"; 

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  // 1. シフトの日付リストを作成（念のため空白などを除去）
  const shiftDates = Array.isArray(shifts) 
    ? shifts.map(s => String(s.shift_date).trim()) 
    : [];

  const modifiers = {
    isEvent: (date) => [10, 11, 22].includes(getDate(date)),
    isSat: (date) => getDay(date) === 6,
    isSun: (date) => getDay(date) === 0,
    // 2. 比較ロジックをより確実に
    hasShift: (date) => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      return shiftDates.includes(formattedDate);
    },
  };

  return (
    <div className="w-full flex flex-col items-center py-2 bg-white rounded-xl relative">
      
      {/* 🛠️ デバッグ表示：読み込んでいるシフトの数 */}
      <div className="text-[10px] text-gray-400 mb-1">
        読み込み中のシフト: {shiftDates.length}件
      </div>

      <style>{`
        .rdp { margin: 0; --rdp-accent-color: #ec4899; }
        
        .rdp-head_cell { color: #9ca3af !important; font-weight: 800 !important; }
        .rdp-table thead tr th:nth-child(1) { color: #ef4444 !important; }
        .rdp-table thead tr th:nth-child(7) { color: #3b82f6 !important; }

        .rdp-day_isSun:not(.rdp-day_selected) { color: #ef4444 !important; font-weight: 800 !important; }
        .rdp-day_isSat:not(.rdp-day_selected) { color: #3b82f6 !important; font-weight: 800 !important; }

        /* 【重要】出勤日のピンク丸デザイン（セレクタを強化） */
        .rdp-cell .rdp-day_hasShift:not(.rdp-day_selected) {
          background-color: #fdf2f8 !important; 
          color: #db2777 !important;           
          border-radius: 50% !important;        
          font-weight: 900 !important;
          border: none !important;
        }

        .rdp-day_isEvent { 
          border: 2px solid #fbbf24 !important; 
          background-color: #fffbeb !important; 
          border-radius: 8px !important;
        }

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
          isEvent: "rdp-day_isEvent",
          hasShift: "rdp-day_hasShift"
        }}
      />
    </div>
  );
}