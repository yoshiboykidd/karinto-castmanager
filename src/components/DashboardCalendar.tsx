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
    <div className="flex justify-center p-1 bg-white rounded-xl overflow-hidden shadow-inner">
      <style>{`
        /* ✨ 基本レイアウトの復旧（縦一列になるのを防ぐ） */
        .rdp { --rdp-cell-size: 45px; margin: 0; }
        .rdp-months { justify-content: center; }

        /* ✨ 日付セルの基本設定 */
        .rdp-day {
          width: 42px !important;
          height: 42px !important;
          max-width: 42px !important;
          border-radius: 50% !important;
          margin: 1.5px !important;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        /* ✨ シフトありのピンク（桜色） */
        .hasShift {
          background-color: #fdf2f8 !important;
          color: #ec4899 !important;
          border: 1px solid #fce7f3 !important;
        }

        /* ✨ 選択時の青丸（ピンクを完全に隠す） */
        .rdp-day_selected, 
        .rdp-day_selected:hover {
          background-color: #3b82f6 !important;
          color: white !important;
          opacity: 1 !important;
          border: none !important;
          /* ピンクを隠すために一回り大きく、かつz-index的な強さを持たせる */
          box-shadow: 0 0 0 2px #3b82f6; 
        }

        /* 土日・イベントの色 */
        .rdp-day.isSaturday:not(.rdp-day_selected) { color: #3b82f6 !important; }
        .rdp-day.isSunday:not(.rdp-day_selected) { color: #ef4444 !important; }
        
        .isEvent:not(.rdp-day_selected):not(.hasShift) { 
          background-color: #fffbeb !important;
          border-radius: 8px !important;
        }

        /* 見出し（年月）の調整 */
        .rdp-caption_label { font-weight: 900; color: #4b5563; font-size: 15px; }
        .rdp-head_cell { font-size: 11px; font-weight: 900; color: #fda4af; }
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