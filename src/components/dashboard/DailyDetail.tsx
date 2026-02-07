'use client';

import { format, startOfDay, isAfter } from 'date-fns'; // ★追加
import { ja } from 'date-fns/locale';

type DailyDetailProps = {
  date: Date;
  dayNum: number;
  shift: any; 
  editReward: { f: string; first: string; main: string; amount: string };
  setEditReward: (val: any) => void;
  onSave: () => void;
  onDelete?: () => void;
  isEditable: boolean;
};

export default function DailyDetail({
  date,
  dayNum,
  shift,
  editReward,
  setEditReward,
  onSave,
  onDelete,
  isEditable
}: DailyDetailProps) {
  if (!date) return null;

  // ★追加: 未来の日付判定 (時間情報を無視して日付だけで比較)
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const isFuture = isAfter(targetDate, today);

  // 1. ステータス判定
  const isOfficial = shift?.status === 'official';
  const isRequested = shift?.status === 'requested';
  
  const isTimeDiff = 
    shift && (shift.start_time !== shift.hp_start_time || 
    shift.end_time !== shift.hp_end_time);
  
  const isModified = isRequested && shift?.is_official_pre_exist && isTimeDiff;

  const isKarin = dayNum === 10;
  const isSoine = dayNum === 11 || dayNum === 22;

  // 2. 配色テーマ
  let themeClass = "bg-white border-pink-100";
  if (isModified) themeClass = "bg-green-50/40 border-green-200";
  else if (isRequested) themeClass = "bg-purple-50/40 border-purple-200";

  // 3. 表示時間の切り分け
  const displayOfficialS = isModified ? (shift?.hp_start_time || shift?.start_time) : shift?.start_time;
  const displayOfficialE = isModified ? (shift?.hp_end_time || shift?.end_time) : shift?.end_time;
  
  const displayRequestS = shift?.start_time;
  const displayRequestE = shift?.end_time;

  return (
    <section className={`relative overflow-hidden rounded-[32px] border shadow-xl p-4 pt-6 flex flex-col space-y-1.5 transition-all duration-300 ${themeClass}`}>
      
      {/* 特定日バッジ */}
      {(isKarin || isSoine) && (
        <div className={`absolute top-0 left-0 right-0 py-0.5 text-center font-black text-[10px] tracking-[0.2em] shadow-sm z-20
          ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'}`}>
          {isKarin ? 'かりんとの日' : '添い寝の日'}
        </div>
      )}

      {/* 1行目：日付 ＆ 変更申請中の時間 */}
      <div className="flex items-center justify-between px-1 h-7 mt-0.5">
        <h3 className="text-xl font-black text-gray-800 tracking-tight leading-none flex items-baseline shrink-0">
          {format(date, 'M/d')}
          <span className="text-base ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>

        {isModified && (
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-green-600 text-white shrink-0">
              変更申請中
            </span>
            <span className="text-[19px] font-black text-green-600 tracking-tighter whitespace-nowrap">
              {displayRequestS === 'OFF' ? 'お休み希望' : `${displayRequestS}〜${displayRequestE}`}
            </span>
          </div>
        )}
      </div>

      {/* 2行目：メイン時間 */}
      <div className="flex items-center justify-between px-1 h-10 gap-1">
        {shift && displayOfficialS !== 'OFF' ? (
          <>
            <div className="shrink-0">
              {isOfficial || isModified ? (
                <span className="text-[12px] font-black px-2.5 py-1.5 rounded-xl bg-blue-500 text-white shadow-md whitespace-nowrap">
                  確定シフト
                </span>
              ) : isRequested ? (
                <span className="text-[12px] font-black px-2.5 py-1.5 rounded-xl bg-purple-500 text-white shadow-md whitespace-nowrap">
                  新規申請中
                </span>
              ) : null}
            </div>

            <div className="flex-1 text-right overflow-hidden">
              <span className={`text-[31px] font-black leading-none tracking-tighter whitespace-nowrap inline-block align-middle
                ${isRequested && !isModified ? 'text-purple-500' : 'text-pink-500'}`}>
                {displayOfficialS}〜{displayOfficialE}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-[12px] font-black px-3 py-1.5 rounded-xl bg-gray-400 text-white shadow-sm shrink-0">お休み</span>
            <span className="text-xs font-black text-gray-300 italic uppercase tracking-widest opacity-40">Day Off</span>
          </div>
        )}
      </div>

      {/* 実績入力フォーム (シフトがあり、かつ未来ではない場合のみ表示) */}
      {(isOfficial || isModified) && displayOfficialS !== 'OFF' ? (
        
        // ★修正: 未来ならメッセージのみ、当日以前なら入力フォームを表示
        isFuture ? (
          <div className="pt-4 border-t border-gray-100/50 text-center">
            <p className="text-xs font-bold text-gray-300 italic">
              実績入力は当日以降に可能です ⏳
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 pt-2 border-t border-gray-100/50">
            <div className="grid grid-cols-3 gap-2">
              {(['f', 'first', 'main'] as const).map((key) => (
                <div key={key} className="flex flex-col space-y-0.5">
                  <label className="text-[9px] font-black text-gray-400 text-center uppercase">
                    {key === 'f' ? 'フリー' : key === 'first' ? '初指名' : '本指名'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editReward[key]}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setEditReward({ ...editReward, [key]: e.target.value })}
                    className="w-full text-center py-1.5 bg-white rounded-xl font-black text-2xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none text-pink-500 shadow-sm"
                  />
                </div>
              ))}
            </div>

            <div className="bg-white/80 p-2 rounded-2xl border border-pink-100 flex items-center justify-between shadow-inner">
              <span className="text-[10px] font-black text-gray-400 uppercase ml-1">報酬合計</span>
              <div className="flex items-center text-pink-500 mr-1">
                <span className="text-lg font-black mr-0.5 opacity-30">¥</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editReward.amount !== '' ? Number(editReward.amount).toLocaleString() : ''}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const v = e.target.value.replace(/,/g, '');
                    if (/^\d*$/.test(v)) setEditReward({ ...editReward, amount: v });
                  }}
                  className="w-32 text-right bg-transparent font-black text-2xl border-none focus:outline-none focus:ring-0 tracking-tighter"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-0.5">
              <button onClick={onSave} className="flex-[3] bg-pink-500 text-white font-black py-3 rounded-2xl text-lg shadow-lg active:scale-95 transition-all">
                実績保存 💾
              </button>
              <button
                onClick={() => setEditReward({ f: '', first: '', main: '', amount: '' })}
                className="flex-1 bg-gray-100 text-gray-400 font-black py-3 rounded-2xl text-[11px] active:scale-95 border border-gray-200"
              >
                クリア
              </button>
            </div>
          </div>
        )
      ) : (isRequested && !isModified) ? (
        <div className="space-y-2 pt-2">
          <div className="bg-purple-100/30 rounded-2xl py-3 text-center border border-purple-200">
            <p className="text-purple-500 font-black text-sm italic">承認をお待ちください☕️</p>
          </div>
          
          {onDelete && (
            <button 
              onClick={() => {
                if(window.confirm('この申請を取り消しますか？')) {
                  onDelete();
                }
              }}
              className="w-full py-3 bg-red-50 text-red-500 font-black rounded-2xl border border-red-100 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              申請を取り消す 🗑️
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}