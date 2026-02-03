import { useState } from 'react';
import { isSameDay } from 'date-fns';

export function useNavigation() {
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  
  // 選択状態の管理
  const [selected, setSelected] = useState<{
    single: Date | undefined;
    multi: Date[];
  }>({
    single: new Date(), // 初期値は今日
    multi: [],
  });

  const toggleMode = (mode: boolean) => {
    setIsRequestMode(mode);
    // モード切り替え時に選択をリセット（混乱を防ぐため）
    setSelected({ single: undefined, multi: [] });
  };

  // ★ここがカレンダーの onClick から呼ばれる関数
  const handleDateSelect = (date: Date) => {
    if (isRequestMode) {
      // 申請モード：タップするたびに追加・削除（複数選択）
      setSelected(prev => {
        const isAlreadySelected = prev.multi.some(d => isSameDay(d, date));
        if (isAlreadySelected) {
          return { ...prev, multi: prev.multi.filter(d => !isSameDay(d, date)) };
        } else {
          return { ...prev, multi: [...prev.multi, date] };
        }
      });
    } else {
      // 実績入力モード：1日だけ選択
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