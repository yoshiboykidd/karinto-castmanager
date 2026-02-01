'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

export default function DashboardCalendar({ 
  shifts = [], selectedDates, onSelect, month, onMonthChange, isRequestMode 
}: any) {

  // ✨ 1. 各種状態の日付を抽出
  const confirmedDays = (shifts || []).filter((s: any) => s.status === 'official').map((s: any) => parseISO(s.shift_date));
  const newRequestDays = (shifts || []).filter((s: any) => s.status === 'requested' && !s.is_official_pre_exist).map((s: any) => parseISO(s.shift_date));
  const modRequestDays = (shifts || []).filter((s: any) => s.status === 'requested' && s.is_official_pre_exist).map((s: any) => parseISO(s.shift_date));

  // ✨ 2. DayPickerに渡す共通設定（ここを定義することで波線が消えます）
  const commonProps = {
    month,
    onMonthChange,
    locale: ja,
    modifiers: { 
      hasShift: confirmedDays, 
      isNewRequest: newRequestDays,
      isModRequest: modRequestDays,
      isSaturday: (date: Date) => date.getDay() === 6,
      isSunday: (date: Date) => date.getDay() === 0
    },
    modifiersClassNames: { 
      hasShift: 'hasShift', 
      isNewRequest: 'isNewRequest',
      isModRequest: 'isModRequest',
      isSaturday: 'isSaturday',
      isSunday: 'isSunday'
    },
    formatters: {
      formatCaption: (date: Date) => format(date, 'yyyy/M', { locale: ja })
    },
  };

  return (
    <div className="w-full flex justify-center p-1 bg-white rounded-xl overflow-hidden">
      <style>{`
        .rdp { --rdp-cell-size: 45px; margin: 0; }
        .rdp-button { font-size: 18px !important; font-weight: 800 !important; }
        .rdp-day_selected:not(.is-request-ui) { background-color: #ec4899 !important; color: white !important; border-radius: 50% !important; }
        .is-request-ui .rdp-day_selected { background-color: #f3e8ff !important; color: #a855f7 !important; border: 2px solid #a855f7 !important; border-radius: 12px !important; }
        .hasShift:not(.rdp-day_selected) { background-color: #fdf2f8 !important; color: #ec4899 !important; border-radius: 12px !important; }
        .isNewRequest:not(.rdp-day_selected) { border: 2px dashed #fda4af !important; border-radius: 12px !important; }
        .isModRequest:not(.rdp-day_selected) { border: 2px dashed #3b82f6 !important; background-color: #fdf2f8 !important; border-radius: 12px !important; }
        .isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        .rdp-day_disabled { opacity: 0.15; pointer-events: none; } /* 過去日の見た目 */
      `}</style>
      
      {isRequestMode ? (
        <DayPicker 
          mode="multiple" 
          selected={selectedDates} 
          onSelect={onSelect} 
          className="is-request-ui" 
          // ✨ 翌日以降のみ選択可能にする制限
          disabled={{ before: new Date(new Date().setDate(new Date().getDate() + 1)) }}
          {...commonProps} 
        />
      ) : (
        <DayPicker 
          mode="single" 
          selected={selectedDates} 
          onSelect={onSelect} 
          {...commonProps} 
        />
      )}
    </div>
  );
}