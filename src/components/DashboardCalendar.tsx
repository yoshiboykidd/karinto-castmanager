'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isSaturday, isSunday, getDate } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DashboardCalendarProps {
  shifts: any[];
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  month?: Date;
  onMonthChange?: (date: Date) => void;
}

export default function DashboardCalendar({ 
  shifts, selectedDate, onSelect, month, onMonthChange 
}: DashboardCalendarProps) {

  const shiftDays = shifts.map(s => parseISO(s.shift_date));
  const eventDays = (date: Date) => [10, 11, 22].includes(getDate(date));

  const modifiers = {
    hasShift: shiftDays,
    isSaturday: (date: Date) => isSaturday(date),
    isSunday: (date: Date) => isSunday(date),
    isEvent: eventDays,
  };

  return (
    <div className="flex justify-center p-1 bg-white rounded-xl overflow-hidden">
      <style>{`
        /* ✨ 縦一列になるのを防ぐための基本リセット */
        .rdp-months { display: flex !important; justify-content: center !important; }
        .rdp-month { margin: 0 !important; }
        .rdp-table { max-width: none !important; }
        
        .rdp { --rdp-cell-size: 45px; margin: 0; }

        /* 日付セルのスタイル */
        .rdp-day {
          width: 42px !important;
          height: 42px !important;
          border-radius: 50% !important;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* シフトあり（桜色） */
        .hasShift {
          background-color: #fdf2f8 !important;
          color: #ec4899 !important;
          border: 1px solid #fce7f3 !important;
        }

        /* 選択時（青丸：ピンクを完全に隠す） */
        .rdp-day_selected {
          background-color: #3b82f6 !important;
          color: white !important;
          border: none !important;
          box-shadow: 0 0 0 3px #3b82f6; /* 青い縁取りでピンクを隠す */
          z-index: 20;
        }

        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        
        .isEvent:not(.rdp-day_selected):not(.hasShift) { 
          background-color: #fffbeb !important;
          border-radius: 8px !important;
        }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        locale={ja}
        modifiers={modifiers}
        modifiersClassNames={{
          isSaturday: 'isSaturday',
          isSunday: 'isSunday',
          isEvent: 'isEvent',
          hasShift: 'hasShift'
        }}
        formatters={{
          formatCaption: (date) => format(date, 'yyyy.MM', { locale: ja }),
        }}
      />
    </div>
  );
}