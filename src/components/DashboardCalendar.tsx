//@ts-nocheck
'use client';

import { Calendar } from "@/components/ui/calendar"; 
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  const shiftDates = Array.isArray(shifts) ? shifts.map(s => s.shift_date) : [];

  return (
    <div className="w-full flex justify-center py-1 overflow-hidden">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        locale={ja}
        className="w-full p-0"
        classNames={{
          months: "w-full space-y-4",
          month: "w-full space-y-4",
          caption: "flex justify-center pt-1 relative items-center mb-4",
          caption_label: "text-sm font-black text-gray-700",
          nav: "space-x-1 flex items-center",
          table: "w-full border-collapse space-y-1",
          head_row: "flex w-full justify-between px-2", 
          head_cell: "text-gray-400 rounded-md w-9 font-bold text-[10px] uppercase text-center",
          row: "flex w-full justify-between mt-2 px-2", 
          cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-9 w-9 p-0 font-black flex items-center justify-center rounded-lg transition-all",
          day_selected: "!bg-pink-500 !text-white hover:!bg-pink-500 hover:!text-white rounded-lg",
          day_today: "bg-gray-100 text-gray-900",
          day_outside: "opacity-20",
        }}
        modifiers={{
          isEvent: (date) => [10, 22].includes(getDate(date)),
          isSat: (date) => getDay(date) === 6,
          isSun: (date) => getDay(date) === 0,
          hasShift: (date) => shiftDates.includes(format(date, 'yyyy-MM-dd')),
        }}
        modifiersClassNames={{
          isSat: "!text-blue-500", 
          isSun: "!text-red-500",
          isEvent: "!border-2 !border-amber-400 !bg-amber-50 !text-amber-600 !ring-1 !ring-amber-200",
          hasShift: "!underline !decoration-pink-400 !decoration-2 !underline-offset-4 !font-black",
        }}
      />
    </div>
  );
}