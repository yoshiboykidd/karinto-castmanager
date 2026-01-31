'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isSaturday, isSunday } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

export default function DashboardCalendar({ 
  shifts, selectedDates, onSelect, month, onMonthChange, isRequestMode 
}: any) {
  const shiftDays = shifts.filter((s:any) => s.status === 'official').map((s:any) => parseISO(s.shift_date));
  const requestedDays = shifts.filter((s:any) => s.status === 'requested').map((s:any) => parseISO(s.shift_date));
  const isEventDay = (date: Date) => [10, 11, 22].includes(date.getDate());

  const commonProps = {
    month, onMonthChange, locale: ja,
    modifiers: { hasShift: shiftDays, isRequested: requestedDays, isEvent: isEventDay, isSaturday, isSunday },
    modifiersClassNames: { hasShift: 'hasShift', isRequested: 'isRequested', isEvent: 'isEvent', isSaturday: 'isSaturday', isSunday: 'isSunday' },
    formatters: { formatCaption: (date: Date) => format(date, 'yyyy/M', { locale: ja }) },
  };

  return (
    <div className="w-full flex justify-center p-1 bg-white rounded-xl overflow-hidden">
      <style>{`
        .rdp { --rdp-cell-size: 45px; margin: 0; }
        .rdp-button { font-size: 18px !important; font-weight: 800 !important; }
        .rdp-caption { display: flex !important; justify-content: center !important; align-items: center !important; position: relative !important; height: 36px; }
        .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 18px !important; }
        .hasShift:not(.rdp-day_selected) { background-color: #fdf2f8 !important; color: #ec4899 !important; border-radius: 12px !important; }
        .isRequested:not(.rdp-day_selected) { border: 2px dashed #fda4af !important; border-radius: 12px !important; }
        .isEvent:not(.hasShift):not(.rdp-day_selected) { background-color: #fffbeb !important; border-radius: 8px !important; }
        .rdp-day_selected:not(.is-request-ui) { background-color: #3b82f6 !important; color: white !important; border-radius: 50% !important; }
        .is-request-ui .rdp-day_selected { background-color: #f3e8ff !important; color: #a855f7 !important; border: 2px solid #a855f7 !important; border-radius: 12px !important; }
        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
      `}</style>
      {isRequestMode ? (
        <DayPicker mode="multiple" selected={selectedDates} onSelect={onSelect} className="is-request-ui" {...commonProps} />
      ) : (
        <DayPicker mode="single" selected={selectedDates} onSelect={onSelect} {...commonProps} />
      )}
    </div>
  );
}