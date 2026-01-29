//@ts-nocheck
'use client';

import { Calendar } from "@/components/ui/calendar";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  const shiftDates = Array.isArray(shifts) ? shifts.map(s => s.shift_date) : [];

  return (
    <div className="w-full flex justify-center py-1">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        locale={ja}
        className="w-full max-w-full"
        // ✨ カレンダー内部のグリッドを横いっぱいに広げる指定
        classNames={{
          months: "w-full",
          month: "w-full space-y-2",
          table: "w-full border-collapse",
          head_row: "flex justify-between w-full mb-2",
          head_cell: "text-gray-400 w-9 font-bold text-[10px] uppercase text-center",
          row: "flex justify-between w-full mt-1",
          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          day: "h-9 w-9 p-0 font-black aria-selected:opacity-100 flex items-center justify-center rounded-lg",
        }}
        modifiers={{
          isEvent: (date) => [10, 22].includes(getDate(date)),
          isSat: (date) => getDay(date) === 6,
          isSun: (date) => getDay(date) === 0,
          hasShift: (date) => shiftDates.includes(format(date, 'yyyy-MM-dd')),
        }}
        modifiersClassNames={{
          isEvent: "border-2 border-amber-400 bg-amber-50 text-amber-600 rounded-lg ring-1 ring-amber-200",
          isSat: "text-blue-500",
          isSun: "text-red-500",
          hasShift: "underline decoration-pink-400 decoration-2 underline-offset-4",
        }}
      />
    </div>
  );
}