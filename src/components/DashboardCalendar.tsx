'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isSaturday, isSunday } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

export default function DashboardCalendar({ shifts, selectedDate, onSelect, month, onMonthChange }: any) {
  const shiftDays = shifts.map((s: any) => parseISO(s.shift_date));
  const eventDays = (date: Date) => [10, 11, 22].includes(date.getDate());

  return (
    <div className="w-full flex justify-center p-1 bg-white rounded-xl">
      <style>{`
        .rdp { --rdp-cell-size: 45px; margin: 0; }
        .hasShift { background-color: #fdf2f8 !important; color: #ec4899 !important; border-radius: 50%; }
        .isEvent:not(.hasShift) { background-color: #fffbeb !important; border-radius: 8px; }
        .rdp-day_selected { background-color: #3b82f6 !important; color: white !important; }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        locale={ja}
        modifiers={{ hasShift: shiftDays, isEvent: eventDays }}
        modifiersClassNames={{ hasShift: 'hasShift', isEvent: 'isEvent' }}
      />
    </div>
  );
}