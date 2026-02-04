'use client';

import { format, isAfter, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

// ★ 型定義: s => の波線を消すための定義
type Shift = {
  shift_date: string;
  status: string;
  start_time: string;
  end_time: string;
};

type RequestListProps = {
  multiDates: Date[];
  requestDetails: { [key: string]: { s: string; e: string } };
  setRequestDetails: (details: any) => void;
  shifts: Shift[];
  onSubmit: () => void;
};

// 11:00〜23:00の選択肢
const TIME_OPTIONS: string[] = [];
for (let h = 11; h <= 23; h++) {
  TIME_OPTIONS.push(`${h}:00`);
  if (h !== 23) TIME_OPTIONS.push(`${h}:30`);
}

export default function RequestList({
  multiDates,
  requestDetails,
  setRequestDetails,
  shifts,
  onSubmit
}: RequestListProps) {
  // 本日の日付の開始時刻（00:00:00）を取得
  const today = startOfDay(new Date());

  // ★ 1. 日付順にソート ＆ 「明日以降」のみにフィルタリング
  const sortedDates = [...multiDates]
    .filter((d) => isAfter(startOfDay(d), today))
    .sort((a, b) => a.getTime() - b.getTime());

  // ★ 2. 重複チェック（確定シフトと全く同じ時間のままの日を特定）
  const redundantDates = sortedDates.filter((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const official = (shifts || []).find((s: Shift) => s.shift_date === key && s.status === 'official');
    if (!official) return false;

    // 画面の入力値（未操作なら公式の時間を使用）
    const currentS = requestDetails[key]?.s || official.start_time;
    const currentE = requestDetails[key]?.e || official.end_time;

    return official.start_time === currentS && official.end_time === currentE;
  });

  // 全ての日付が適切に変更されていれば送信可能
  const canSubmit = sortedDates.length > 0 && redundantDates.length === 0;

  if (sortedDates.length === 0) {
    return (
      <section className="bg-white rounded-[32px] border border-purple-100 p-8 shadow-xl text-center">
        <p className="text-gray-300 text-xs font-bold italic">明日以降の日付を選んでください📅</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[32px] border border-purple-100 p-5 shadow-xl space-y-3">
      {/* 申請リストヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="font-black text-purple-600 text-[14px] uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
          申請リスト ({sortedDates.length}件)
        </h3>
        {redundantDates.length > 0 && (
          <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg animate-pulse">
            ⚠️ 時間を変更してください
          </span>
        )}
      </div>

      <div className="flex flex-col">
        {sortedDates.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const official = (shifts || []).find((s: Shift) => s.shift_date === key && s.status === 'official');
          const isOff = requestDetails[key]?.s === 'OFF';

          // 初期値の設定
          const defaultS = official?.start_time && official.start_time !== 'OFF' ? official.start_time : '11:00';
          const defaultE = official?.end_time && official.end_time !== 'OFF' ? official.end_time : '23:00';

          // この行が確定と同じ時間のままか判定
          const isRedundant = official && 
            (requestDetails[key]?.s || official.start_time) === official.start_time && 
            (requestDetails[key]?.e || official.end_time) === official.end_time;

          return (
            <div key={key} className={`py-3.5 border-b border-gray-100 last:border-0 flex flex-col space-y-2 transition-all ${isRedundant ? 'bg-red-50/50 -mx-2 px-2 rounded-xl' : ''}`}>
              <div className="flex items-center justify-between px-1">
                <span className="text-[16px] font-black text-gray-800">
                  {format(d, 'M/d')} <span className="text-xs opacity-60">({format(d, 'E', { locale: ja })})</span>
                </span>
                {official && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 leading-none">確定</span>
                    <span className="text-[17px] font-black text-gray-400 leading-none">
                      {official.start_time === 'OFF' ? 'お休み' : `${official.start_time}〜${official.end_time}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {official ? (
                  <span className="bg-orange-50 text-orange-500 text-[12px] font-black px-2.5 py-2 rounded-xl border border-orange-100 leading-none shrink-0">変更</span>
                ) : (
                  <span className="bg-green-50 text-green-500 text-[12px] font-black px-2.5 py-2 rounded-xl border border-green-100 leading-none shrink-0">新規</span>
                )}
                
                {isOff ? (
                  <div className="flex-1 bg-gray-50 py-2.5 rounded-lg text-center font-black text-gray-400 tracking-widest text-sm border border-dashed border-gray-200">
                    OFF (お休み)
                  </div>
                ) : (
                  <>
                    <select
                      value={requestDetails[key]?.s || defaultS}
                      onChange={(e) => setRequestDetails({ ...requestDetails, [key]: { ...requestDetails[key], s: e.target.value } })}
                      className="w-24 bg-gray-100 py-2.5 rounded-lg text-center font-black text-base border-none focus:ring-1 focus:ring-purple-200 appearance-none"
                      style={{ textAlignLast: 'center' }}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-gray-300 font-black text-lg">~</span>
                    <select
                      value={requestDetails[key]?.e || defaultE}
                      onChange={(e) => setRequestDetails({ ...requestDetails, [key]: { ...requestDetails[key], e: e.target.value } })}
                      className="w-24 bg-gray-100 py-2.5 rounded-lg text-center font-black text-base border-none focus:ring-1 focus:ring-purple-200 appearance-none"
                      style={{ textAlignLast: 'center' }}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </>
                )}
                <button
                  onClick={() => {
                    const nextVal = isOff ? { s: defaultS, e: defaultE } : { s: 'OFF', e: 'OFF' };
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

      {/* 送信ボタン（バリデーション結果によって状態変化） */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`w-full font-black py-4 rounded-2xl text-lg shadow-lg active:scale-95 transition-all ${
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