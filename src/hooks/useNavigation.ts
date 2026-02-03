import { useState } from 'react';
import { startOfToday } from 'date-fns';

export function useNavigation() {
  // モード（実績入力：false / シフト申請：true）
  const [isRequestMode, setIsRequestMode] = useState(false);
  
  // カレンダーの表示月
  const [viewDate, setViewDate] = useState(new Date()); 
  
  // 選択中の日付（単一 or 複数）
  const [selected, setSelected] = useState<{single?: Date, multi: Date[]}>({ 
    single: new Date(), 
    multi: [] 
  });

  // モード切り替え時の初期化
  const toggleMode = (mode: boolean) => {
    setIsRequestMode(mode);
    if (mode) {
      // 申請モードへ：単一選択をクリア
      setSelected({ single: undefined, multi: [] });
    } else {
      // 実績モードへ：今日を選択
      setSelected({ single: new Date(), multi: [] });
    }
  };

  // 日付選択の交通整理ロジック
  const handleDateSelect = (dates: any) => {
    if (isRequestMode) {
      // 申請モード：明日以降のみ選択可能
      const tomorrow = startOfToday();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const filtered = (Array.isArray(dates) ? dates : []).filter(d => d >= tomorrow);
      setSelected({ single: undefined, multi: filtered });
    } else {
      // 実績モード：単一選択のみ
      const d = Array.isArray(dates) ? dates[0] : dates;
      setSelected({ single: d instanceof Date ? d : undefined, multi: [] });
    }
  };

  return {
    isRequestMode,
    toggleMode,
    viewDate,
    setViewDate,
    selected,
    handleDateSelect,
    setSelected // 必要に応じて直接更新用
  };
}