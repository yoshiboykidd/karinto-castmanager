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
    <div className="w-full flex justify-center p-1 bg-white rounded-xl">
      <style>{`
        /* ✨ 縦並びを解消する魔法のコード */
        .rdp-table {
          display: table !important; /* テーブル形式を強制 */
          border-collapse: separate !important;
          border-spacing: 4px !important; /* セル同士の隙間をあける */
          width: auto !important;
          max-width: none !important;
        }
        
        /* 月の表示エリア */
        .rdp-months { justify-content: center !important; }

        /* ✨ 日付セル（サイズを固定して安定させる） */
        .rdp-cell {
          width: 40px !important;
          height: 40px !important;
          padding: 0 !important;
        }

        .rdp-button {
          width: 40px !important;
          height: 40px !important;
          max-width: 40px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          position: relative;
        }

        /* ✨ シフトあり（薄いピンク） */
        .hasShift:not(.rdp-day_selected) {
          background-color: #fdf2f8 !important;
          color: #ec4899 !important;
          border: 1px solid #fce7f3 !important;
        }

        /* ✨ 選択時（青丸：ピンクを完全に飲み込む） */
        .rdp-day_selected {
          background-color: #3b82f6 !important;
          color: white !important;
          border: none !important;
          /* 外側に少し広げて後ろのピンクを隠す */
          transform: scale(1.1); 
          z-index: 10;
          box-shadow: 0 0 0 2px #3b82f6;
        }

        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        
        .isEvent:not(.rdp-day_selected):not(.hasShift) { 
          background-color: #fffbeb !important;
          border-radius: 8px !important;
        }

        /* ナビゲーションの調整 */
        .rdp-nav_button { color: #fda4af; }
        .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 15px; }
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