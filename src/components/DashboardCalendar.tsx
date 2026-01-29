'use client';

import { DayPicker } from 'react-day-picker';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

export default function DashboardCalendar({ 
  shifts, 
  selectedDate, 
  onSelect 
}: { 
  shifts: any[], 
  selectedDate: Date | undefined, 
  onSelect: (date: Date | undefined) => void 
}) {
  const shiftDays = shifts.map(s => new Date(s.shift_date));

  return (
    <DayPicker
      locale={ja}
      mode="single"
      selected={selectedDate}
      onSelect={onSelect}
      modifiers={{ booked: shiftDays }}
      modifiersStyles={{
        booked: { fontWeight: 'bold', backgroundColor: '#FFF0F5', color: '#FF69B4', borderRadius: '50%' }
      }}
      styles={{
        caption: { color: '#FF69B4' },
        head_cell: { color: '#9CA3AF' }
      }}
    />
  );
}