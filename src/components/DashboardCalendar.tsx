'use client';

import { format, isSameMonth, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';

type Shift = {
  shift_date: string;
  status: string;
  start_time: string;
  end_time: string;
  is_specific_day?: boolean;
};

type DashboardCalendarProps = {
  shifts: Shift[];
  selectedDates: Date | Date[] | undefined;
  onSelect: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  isRequestMode: boolean;
};

export default function DashboardCalendar({
  shifts,
  selectedDates,
  onSelect,
  month,
  onMonthChange,
  isRequestMode
}: DashboardCalendarProps) {
  
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

  const prevMonth = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const isSelected = (date: Date) => {
    if (Array.isArray(selectedDates)) {
      return selectedDates.some(d => isSameDay(d, date));
    }
    return selectedDates ? isSameDay(selectedDates, date) : false;
  };

  return (
    <div className="select-none">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-pink-500 font-black text-xl transition-colors">
          &lt;
        </button>
        <h2 className="text-[22px] font-black text-gray-800 tracking-tight">
          {format(month, 'yyyy')} / <span className="text-pink-500 text-[26px]">{format(month, 'M')}</span>
          <span className="text-[14px] ml-1 text-gray-400 font-bold">月</span>
        </h2>
        <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-pink-500 font-black text-xl transition-colors">
          &gt;
        </button>
      </div>

      {/* 曜日ヘッダー（平日＝黒） */}
      <div className="grid grid-cols-7 mb-2 border-b border-gray-100 pb-2">
        {weekDays.map((d, i) => {
          let colorClass = "text-gray-900"; 
          if (i === 5) colorClass = "text-blue-500";
          if (i === 6) colorClass = "text-red-500";
          return (
            <div key={d} className={`text-center font-black text-[15px] ${colorClass}`}>
              {d}
            </div>
          );
        })}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-y-3 gap-x-1">
        {calendarDays.map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, month);
          
          const shift = shifts.find(s => s.shift_date === key);
          const isOfficial = shift?.status === 'official';
          const isRequested = shift?.status === 'requested';
          const hasTime = isOfficial && shift?.start_time !== 'OFF';
          
          // 特定日判定
          const isSpecific = shift?.is_specific_day || false;

          const selected = isSelected(day);
          const today = isToday(day);

          // 背景色・文字色の決定ロジック
          // 優先度： 選択中 > 本日 > 特定日 > 通常
          let containerClass = "text-gray-900"; // デフォルト黒
          
          if (selected) {
            containerClass = isRequestMode 
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200 scale-110' 
              : 'bg-gray-900 text-white shadow-xl scale-110';
          } else if (today) {
            containerClass = 'bg-pink-50 text-pink-600 font-bold border border-pink-100';
          } else if (isSpecific) {
            // ★ここを変更：背景を濃い黄色(amber-200)にし、枠線(amber-300)も追加
            containerClass = 'bg-amber-200 text-gray-900 font-bold border border-amber-300';
          }

          return (
            <div 
              key={key} 
              onClick={() => onSelect(day)}
              className="relative flex flex-col items-center justify-start h-[56px] cursor-pointer group"
            >
              {/* ① 特定日マーカー（最上部にゴールドの点） */}
              {isSpecific && (
                <div className="absolute -top-1 w-2 h-2 bg-amber-500 rounded-full shadow-sm z-20 animate-bounce-slow border border-white" />
              )}

              {/* 日付数字コンテナ */}
              <div className={`
                w-10 h-10 flex items-center justify-center rounded-full transition-all relative z-10
                ${containerClass}
                ${!isCurrentMonth && !selected && 'opacity-30'}
                ${isRequestMode && !selected && !isCurrentMonth ? 'opacity-20' : ''}
              `}>
                {/* 確定シフトがある場合の「ピンクの円」背景 */}
                {/* 特定日の黄色と混ざらないよう、特定日かつ非選択の場合はピンクを少し濃くする等の調整も可能だが、現状は透過で重ねる */}
                {hasTime && !selected && (
                  <span className={`absolute inset-0 rounded-full opacity-60 scale-90 border border-pink-200 ${isSpecific ? 'bg-pink-200 mix-blend-multiply' : 'bg-pink-100'}`}></span>
                )}

                {/* 日付数字 */}
                <span className={`text-[19px] font-black leading-none ${!isCurrentMonth && !selected ? 'font-medium' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* ② 申請中バッジ（緑の点） */}
              {isRequested && !isOfficial && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full shadow-sm"></span>
              )}

              {/* ③ 変更申請中バッジ */}
              {isRequested && isOfficial && (
                <span className="absolute -right-0 top-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border border-white"></span>
                </span>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}