'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// ... (Props定義などは変更なし)

export default function RequestList({
  multiDates,
  requestDetails,
  setRequestDetails,
  shifts,
  onSubmit
}: RequestListProps) {
  const sortedDates = [...multiDates].sort((a, b) => a.getTime() - b.getTime());

  // ★ 厳格バリデーション：確定シフトと同じ時間のままの日を特定する
  const redundantDates = sortedDates.filter((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const official = shifts.find(s => s.shift_date === key && s.status === 'official');
    if (!official) return false; // 確定シフトがない（新規）日はOK

    const currentS = requestDetails[key]?.s || official.start_time;
    const currentE = requestDetails[key]?.e || official.end_time;

    // 確定時間と1ミリも変わっていない場合は「重複」とみなす
    return official.start_time === currentS && official.end_time === currentE;
  });

  // 送信可能条件：選択日があり、かつ「重複」が0件であること
  const canSubmit = sortedDates.length > 0 && redundantDates.length === 0;

  if (sortedDates.length === 0) {
    return (
      <section className="bg-white rounded-[32px] border border-purple-100 p-8 shadow-xl text-center">
        <p className="text-gray-300 text-xs font-bold italic">カレンダーから日付を選んでください📅</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[32px] border border-purple-100 p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-purple-600 text-[14px] uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
          申請リスト ({sortedDates.length}件)
        </h3>
        {/* ★ エラー表示：重複がある場合に警告を出す */}
        {redundantDates.length > 0 && (
          <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg animate-bounce">
            ⚠️ 時間を変更してください
          </span>
        )}
      </div>

      <div className="flex flex-col">
        {sortedDates.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const official = shifts.find(s => s.shift_date === key && s.status === 'official');
          const isOff = requestDetails[key]?.s === 'OFF';

          // この行が重複（未変更）かどうか
          const isRedundant = official && 
            (requestDetails[key]?.s || official.start_time) === official.start_time && 
            (requestDetails[key]?.e || official.end_time) === official.end_time;

          return (
            <div key={key} className={`py-3.5 border-b border-gray-100 last:border-0 flex flex-col space-y-2 transition-all ${isRedundant ? 'bg-red-50/50 -mx-2 px-2 rounded-xl' : ''}`}>
              <div className="flex items-center justify-between px-1">
                <span className="text-[16px] font-black text-gray-800">
                  {format(d, 'M/d')} <span className="text-xs opacity-60">({format(d, 'E', { locale: ja })})</span>
                </span>
                {isRedundant && (
                  <span className="text-[10px] font-black text-red-400">確定と同じ時間のままです</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* ... (新規/変更バッジ表示) ... */}
                
                {/* ... (セレクトボックスUI: style={{ textAlignLast: 'center' }} を含む) ... */}

                <button
                  onClick={() => {
                    const nextVal = isOff ? { s: (official?.start_time || '11:00'), e: (official?.end_time || '23:00') } : { s: 'OFF', e: 'OFF' };
                    setRequestDetails({ ...requestDetails, [key]: nextVal });
                  }}
                  className={`px-4 py-2.5 rounded-lg font-black text-[12px] transition-all border shrink-0 ${isOff ? 'bg-purple-500 text-white border-purple-500 shadow-md' : 'bg-white text-gray-400 border-gray-200'}`}
                >
                  {isOff ? '出勤にする' : 'お休み'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`w-full font-black py-4 rounded-2xl text-lg shadow-lg transition-all active:scale-95 ${
          canSubmit 
            ? 'bg-purple-600 text-white shadow-purple-200' 
            : 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'
        }`}
      >
        {canSubmit ? '申請を確定する 🚀' : '時間を変更してください ⚠️'}
      </button>
    </section>
  );
}