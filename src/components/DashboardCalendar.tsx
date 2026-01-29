//@ts-nocheck
'use client';

import { Calendar } from "@/components/ui/calendar";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";

export default function DashboardCalendar({ shifts, selectedDate, onSelect }) {
  const shiftDates = Array.isArray(shifts) ? shifts.map(s => s.shift_date) : [];

  return (
    // 枠いっぱいに広げるための外枠
    <div className="w-full flex justify-center px-1">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        locale={ja}
        className="w-full p-0"
        // ✨ Shadcn/uiのスタイルを力技で上書き
        classNames={{
          months: "w-full space-y-4",
          month: "w-full space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-bold text-gray-700",
          nav: "space-x-1 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          table: "w-full border-collapse space-y-1",
          head_row: "flex w-full justify-between mb-2", // 横に広げる
          head_cell: "text-gray-400 rounded-md w-9 font-bold text-[10px] uppercase text-center",
          row: "flex w-full justify-between mt-2", // 横に広げる
          cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-9 w-9 p-0 font-black flex items-center justify-center rounded-lg transition-all",
          day_selected: "!bg-pink-500 !text-white hover:!bg-pink-500 hover:!text-white", // 選択時を強制
          day_today: "bg-gray-100 text-gray-900",
        }}
        modifiers={{
          isEvent: (date) => [10, 22].includes(getDate(date)),
          isSat: (date) => getDay(date) === 6,
          isSun: (date) => getDay(date) === 0,
          hasShift: (date) => shiftDates.includes(format(date, 'yyyy-MM-dd')),
        }}
        // ✨ ! (重要フラグ) をつけて、元の色設定に絶対に勝つ
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