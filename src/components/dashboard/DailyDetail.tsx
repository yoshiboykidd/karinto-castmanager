'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type DailyDetailProps = {
  date: Date;
  dayNum: number;
  shift: any; 
  editReward: { f: string; first: string; main: string; amount: string };
  setEditReward: (val: any) => void;
  onSave: () => void;
  isEditable: boolean;
};

export default function DailyDetail({
  date,
  dayNum,
  shift,
  editReward,
  setEditReward,
  onSave,
  isEditable
}: DailyDetailProps) {
  if (!date) return null;

  const isOfficial = shift?.status === 'official';
  const isRequested = shift?.status === 'requested';
  const isModified = isRequested && shift?.is_official_pre_exist;
  const isKarin = dayNum === 10;
  const isSoine = dayNum === 11 || dayNum === 22;

  let themeClass = "bg-white border-pink-100";
  if (isModified) themeClass = "bg-green-50/40 border-green-200";
  else if (isRequested) themeClass = "bg-purple-50/40 border-purple-200";

  return (
    <section className={`relative overflow-hidden rounded-[32px] border shadow-xl p-4 pt-6 flex flex-col space-y-1.5 transition-all duration-300 ${themeClass}`}>
      
      {/* 特定日バッジ */}
      {(isKarin || isSoine) && (
        <div className={`absolute top-0 left-0 right-0 py-0.5 text-center font-black text-[10px] tracking-[0.2em] shadow-sm z-20
          ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'}`}>
          {isKarin ? 'かりんとの日' : '添い寝の日'}
        </div>
      )}

      {/* 1行目：日付 ＆ 変更申請情報 */}
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
              {shift.start_time}〜{shift.end_time}
            </span>
          </div>
        )}
      </div>

      {/* 2行目：メイン時間（絶対に1行に収める設定） */}
      <div className="flex items-center justify-between px-1 h-10 gap-1">
        {shift && shift.start_time !== 'OFF' ? (
          <>
            {/* ラベル：幅を取らないようフォントとパディングを微調整 */}
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

            {/* 時間：右詰め & 改行禁止 & サイズ微調整 */}
            <div className="flex-1 text-right overflow-hidden">
              <span className={`text-[31px] font-black leading-none tracking-tighter whitespace-nowrap inline-block align-middle
                ${isRequested && !isModified ? 'text-purple-500' : 'text-pink-500'}`}>
                {shift.start_time}〜{shift.end_time}
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

      {/* 3行目以降：実績入力フォーム（さらに間隔を詰めてコンパクトに） */}
      {(isOfficial || isModified) && shift?.start_time !== 'OFF' ? (
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
                className="w-32 text-right bg-transparent font-black text-2xl border-none focus:ring-0 tracking-tighter"
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
      ) : isRequested && !isModified ? (
        <div className="bg-purple-100/30 rounded-2xl py-3 text-center border border-purple-200">
          <p className="text-purple-500 font-black text-sm italic">店長の承認をお待ちください☕️</p>
        </div>
      ) : null}
    </section>
  );
}