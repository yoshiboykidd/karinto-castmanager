import { useState, useEffect } from 'react';
import { isSameDay } from 'date-fns';

export function useNavigation() {
  const [isRequestMode, setIsRequestMode] = useState(false);
  
  // 1. 初期値は undefined にし、サーバーとクライアントの「時刻のズレ」を回避
  const [viewDate, setViewDate] = useState<Date | undefined>(undefined);
  
  const [selected, setSelected] = useState<{
    single: Date | undefined;
    multi: Date[];
  }>({
    single: undefined, // ここも初期値は undefined
    multi: [],
  });

  // 2. マウント時に初めて「今日」をセットする
  useEffect(() => {
    const today = new Date();
    setViewDate(today);
    setSelected(prev => ({ ...prev, single: today }));
  }, []);

  const toggleMode = (mode: boolean) => {
    setIsRequestMode(mode);
    setSelected({ single: undefined, multi: [] });
  };

  const handleDateSelect = (date: Date) => {
    if (!date) return;
    
    if (isRequestMode) {
      setSelected(prev => {
        const isAlreadySelected = prev.multi.some(d => d && isSameDay(d, date));
        if (isAlreadySelected) {
          return { ...prev, multi: prev.multi.filter(d => d && !isSameDay(d, date)) };
        } else {
          return { ...prev, multi: [...prev.multi, date] };
        }
      });
    } else {
      setSelected({ single: date, multi: [] });
    }
  };

  return {
    isRequestMode,
    toggleMode,
    viewDate,
    setViewDate,
    selected,
    setSelected,
    handleDateSelect
  };
}