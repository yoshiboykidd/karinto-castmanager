'use client';

import { Calendar } from "@/components/ui/calendar";
import { format, getDay, getDate } from "date-fns";
import { ja } from "date-fns/locale";

interface Props {
  shifts: any[];
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

export default function DashboardCalendar({ shifts, selectedDate, onSelect }: Props) {
  // シフトがある日を特定するロジック
  const shiftDates = shifts.map(s => s.shift_date);

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onSelect}
      locale={ja}
      className="p-0"
      modifiers={{
        hasShift: (date) => shiftDates.includes(format(date, 'yyyy-MM-dd')),
        isEventDay: (date) => [10, 22].includes(getDate(date)), // 10日と22日
      }}
      modifiersStyles={{
        hasShift: { 
          fontWeight: '900',
          textDecoration: 'underline',
          textDecorationColor: '#f472b6',
          textUnderlineOffset: '4px'
        }
      }}
      components={{
        DayRender: ({ date, ...props }) => {
          const day = getDay(date);
          const dateNum = getDate(date);
          const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const hasShift = shiftDates.includes(format(date, 'yyyy-MM-dd'));

          // 基本の色分け
          let textColor = "text-gray-700";
          if (day === 0) textColor = "text-red-500"; // 日曜：赤
          if (day === 6) textColor = "text-blue-500"; // 土曜：青

          // イベント日の背景色
          let bgColor = isSelected ? "bg-pink-500 text-white" : "bg-transparent";
          let borderStyle = "";
          
          if (dateNum === 10 || dateNum === 22) {
            borderStyle = "border-2 border-amber-400 ring-2 ring-amber-100"; // かりんとの日・添い寝の日
          }

          return (
            <div 
              {...props}
              className={`
                relative h-9 w-9 flex items-center justify-center rounded-lg text-sm font-black transition-all cursor-pointer
                ${textColor} ${bgColor} ${borderStyle}
              `}
            >
              {dateNum}
              {/* 出勤日のドット */}
              {hasShift && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 bg-pink-400 rounded-full"></div>
              )}
            </div>
          );
        }
      }}
    />
  );
}