// ...省略 (import類)
export default function DashboardCalendar({ 
  shifts = [], selectedDates, onSelect, month, onMonthChange, isRequestMode 
}: any) {
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時間をリセットして今日を判定

  // ... (modifiersの設定などはそのまま)

  return (
    <div className="w-full flex justify-center p-1 bg-white rounded-xl overflow-hidden">
      <style>{`
        /* 既存のスタイル ... */
        .rdp-day_disabled { opacity: 0.2; pointer-events: none; } /* グレーアウトの設定 */
      `}</style>
      
      <DayPicker 
        mode={isRequestMode ? "multiple" : "single"}
        selected={selectedDates}
        onSelect={onSelect}
        // ✨ ここが重要：今日以前（今日を含む）を無効化
        disabled={isRequestMode ? { before: new Date(new Date().setDate(new Date().getDate() + 1)) } : undefined}
        className={isRequestMode ? "is-request-ui" : ""}
        {...commonProps} 
      />
    </div>
  );
}