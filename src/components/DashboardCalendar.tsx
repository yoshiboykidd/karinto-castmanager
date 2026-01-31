'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isSaturday, isSunday } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DashboardCalendarProps {
  shifts: any[];
  selectedDates: any; 
  onSelect: (val: any) => void; 
  month: Date;
  onMonthChange: (date: Date) => void;
  isRequestMode: boolean;
}

export default function DashboardCalendar({ 
  shifts, selectedDates, onSelect, month, onMonthChange, isRequestMode 
}: DashboardCalendarProps) {

  const shiftDays = shifts.filter(s => s.status === 'official').map(s => parseISO(s.shift_date));
  const requestedDays = shifts.filter(s => s.status === 'requested').map(s => parseISO(s.shift_date));

  return (
    <div className="w-full flex justify-center p-1 bg-white rounded-xl overflow-hidden">
      <style>{`
        .rdp { --rdp-cell-size: 45px; margin: 0; }
        .rdp-button { font-size: 18px !important; font-weight: 800 !important; }
        
        .rdp-caption { 
          display: flex !important; justify-content: center !important; align-items: center !important;
          position: relative !important; height: 40px;
        }
        .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 18px !important; }

        /* 🌸 確定シフト：12px角丸四角 */
        .hasShift:not(.rdp-day_selected) { 
          background-color: #fdf2f8 !important; color: #ec4899 !important; border-radius: 12px !important; 
        }

        /* ⏳ 申請中：点線の枠 */
        .isRequested:not(.rdp-day_selected) {
          border: 2px dashed #fda4af !important; border-radius: 12px !important;
        }

        /* 🟦 選択（実績入力モード）：青い丸 */
        .rdp-day_selected:not(.is-request-ui) { 
          background-color: #3b82f6 !important; color: white !important; border-radius: 50% !important;
        }

        /* 🟪 選択（申請モード）：紫枠 */
        .is-request-ui .rdp-day_selected {
          background-color: #f3e8ff !important; color: #a855f7 !important;
          border: 2px solid #a855f7 !important; border-radius: 12px !important;
        }

        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        .rdp-nav_button { color: #fda4af; }
      `}</style>
      <DayPicker
        mode={isRequestMode ? "multiple" : "single"}
        selected={selectedDates}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        locale={ja}
        modifiers={{
          hasShift: shiftDays,
          isRequested: requestedDays,
          isSaturday: (date: Date) => isSaturday(date),
          isSunday: (date: Date) => isSunday(date),
        }}
        modifiersClassNames={{
          hasShift: 'hasShift',
          isRequested: 'isRequested',
          isSaturday: 'isSaturday',
          isSunday: 'isSunday',
        }}
        // 複数選択時のカレンダー全体のクラス
        className={isRequestMode ? 'is-request-ui' : ''}
        formatters={{
          formatCaption: (date) => format(date, 'yyyy/M', { locale: ja }),
        }}
      />
    </div>
  );
}