//@ts-nocheck
'use client';

import { Calendar } from "@/components/ui/calendar";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  // 出勤日をリスト化
  const shiftDates = Array.isArray(shifts) ? shifts.map(s => s.shift_date) : [];

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onSelect}
      locale={ja}
      className="p-0 border-none"
      // ✨ 土・日・イベント日の判定
      modifiers={{
        isEvent: (date) => [10, 22].includes(getDate(date)),
        isSat: (date) => getDay(date) === 6,
        isSun: (date) => getDay(date) === 0,
        hasShift: (date) => shiftDates.includes(format(date, 'yyyy-MM-dd')),
      }}
      // ✨ 色とデザインの指定
      modifiersClassNames={{
        isEvent: "border-2 border-amber-400 bg-amber-50 text-amber-600 font-bold rounded-lg ring-1 ring-amber-200",
        isSat: "text-blue-500 font-bold",
        isSun: "text-red-500 font-bold",
        hasShift: "underline decoration-pink-400 decoration-2 underline-offset-4 font-black",
      }}
    />
  );
}