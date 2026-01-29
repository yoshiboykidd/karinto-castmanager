//@ts-nocheck
'use client';

import { DayPicker } from "react-day-picker";
import { format, getDay, getDate, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import "react-day-picker/dist/style.css"; 

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  // 1. 全データ
  const shiftDates = Array.isArray(shifts) 
    ? shifts.map(s => String(s.shift_date).trim()) 
    : [];

  // 2. 選択された日の詳細データを探す
  const selectedDayShift = selectedDate && Array.isArray(shifts)
    ? shifts.find(s => isSameDay(new Date(s.shift_date), selectedDate))
    : null;

  const modifiers = {
    isSat: (date) => getDay(date) === 6,
    isSun: (date) => getDay(date) === 0,
    hasShift: (date) => {
      const d = format(date, 'yyyy-MM-dd');
      return shiftDates.includes(d);
    },
  };

  return (
    <div className="w-full flex flex-col items-center py-2 bg-white rounded-xl shadow-sm relative">
      
      <div className="text-[10px] text-gray-300 mb-1">
        ver 1.9 (Shifts: {shiftDates.length})
      </div>

      <style>{`
        .rdp { margin: 0; --rdp-accent-color: #ec4899; }
        .rdp-table thead tr th:nth-child(1) { color: #ef4444 !important; opacity: 1 !important; }
        .rdp-table thead tr th:nth-child(7) { color: #3b82f6 !important; opacity: 1 !important; }
        .rdp-day_isSun:not(.rdp-day_selected) { color: #ef4444 !important; font-weight: 800 !important; }
        .rdp-day_isSat:not(.rdp-day_selected) { color: #3b82f6 !important; font-weight: 800 !important; }
        .rdp-day_hasShift:not(.rdp-day_selected) {
          background-color: #fce7f3 !important; 
          color: #db2777 !important;           
          border-radius: 50% !important;
          font-weight: 900 !important;
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
          hasShift: "rdp-day_hasShift"
        }}
      />

      {/* --- 🚀 ここから追加：タップした日の詳細表示エリア --- */}
      <div className="w-[90%] mt-4 p-4 border-t border-pink-50 flex flex-col items-start bg-pink-50/30 rounded-lg">
        <h4 className="text-xs font-bold text-gray-500 mb-2">
          {selectedDate ? format(selectedDate, 'M月d日(E)', { locale: ja }) : '日付を選択してください'}
        </h4>
        
        {selectedDayShift ? (
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-pink-600">
              {selectedDayShift.start_time} - {selectedDayShift.end_time}
            </span>
            <span className="text-[10px] bg-pink-200 text-pink-700 px-2 py-0.5 rounded-full font-bold">
              出勤
            </span>
          </div>
        ) : (
          <div className="text-sm text-gray-400 font-medium italic">
            予定なし（お休み）
          </div>
        )}
      </div>
      {/* --------------------------------------------------- */}
    </div>
  );
}