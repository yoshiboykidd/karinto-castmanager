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

  // 1. ステータス判定
  const isOfficial = shift?.status === 'official';
  const isRequested = shift?.status === 'requested';
  const isModified = isRequested && shift?.is_official_pre_exist; // 確定後の変更申請

  // 2. 特定日判定
  const isKarin = dayNum === 10;
  const isSoine = dayNum === 11 || dayNum === 22;

  // 3. 配色テーマの動的切り替え（カレンダーと同期）
  let themeClass = "bg-white border-pink-100";
  let modTextClass = "text-green-600";
  let modBadgeClass = "bg-green-600";

  if (isModified) {
    themeClass = "bg-green-50/40 border-green-200";
  } else if (isRequested) {
    themeClass = "bg-purple-50/40 border-purple-200";
  }

  return (
    <section className={`relative overflow-hidden rounded-[32px] border shadow-xl p-4 pt-6 flex flex-col space-y-1.5 transition-all duration-300 ${themeClass}`}>
      
      {/* 特定日バッジ（最上段） */}
      {(isKarin || isSoine) && (
        <div className={`absolute top-0 left-0 right-0 py-0.5 text-center font-black text-[10px] tracking-[0.2em] shadow-sm z-20
          ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'}`}>
          {isKarin ? 'かりんとの日' : '添い寝の日'}
        </div>
      )}

      {/* 1行目：日付 ＆ 変更申請情報（緑色に変更） */}
      <div className="flex items-center justify-between px-1 h-7">
        <h3 className="text-xl font-black text-gray-800 tracking-tight leading-none flex items-baseline">
          {format(date, 'M/d')}
          <span className="text-base ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>

        {isModified && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md text-white shadow-sm ${modBadgeClass}`}>
              変更申請中
            </span>
            <span className={`text-[16px] font-black tracking-tighter ${modTextClass}`}>
              {shift.start_time}〜{shift.end_time}
            </span>
          </div>
        )}
      </div>

      {/* 2行目：メイン時間表示（確定＝青、新規＝紫） */}
      <div className="flex items-center gap-3 px-1 h-10">
        {shift && shift.start_time !== 'OFF' ? (
          <>
            {isOfficial || isModified ? (
              <span className="text-[13px] font-black px-3 py-1.5 rounded-xl bg-blue-500 text-white shadow-md shrink-0">
                確定
              </span>
            ) : isRequested ? (
              <span className="text-[13px] font-black px-3 py-1.5 rounded-xl bg-purple-500 text-white shadow-md shrink-0">
                新規
              </span>
            ) : null}

            <span className={`text-[32px] font-black leading-none tracking-tighter 
              ${isRequested && !isModified ? 'text-purple-500' : 'text-pink-500'}`}>
              {shift.start_time}〜{shift.end_time}
            </span>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-black px-3 py-1.5 rounded-xl bg-gray-400 text-white shadow-sm">休み</span>
            <span className="text-xs font-black text-gray-300 italic uppercase tracking-widest opacity-50">No Schedule</span>
          </div>
        )}
      </div>

      {/* 3行目以降：実績入力フォーム（確定 または 変更申請中の場合に表示） */}
      {(isOfficial || isModified) && shift?.start_time !== 'OFF' ? (
        <div className="space-y-2 pt-2 border-t border-gray-100/50">
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
                  className="w-full text-center py-2 bg-white rounded-xl font-black text-2xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none text-pink-500 shadow-sm"
                />
              </div>
            ))}
          </div>

          <div className="bg-white/80 p-2.5 rounded-2xl border border-pink-100 flex items-center justify-between shadow-inner">
            <span className="text-[11px] font-black text-gray-400 uppercase">報酬合計</span>
            <div className="flex items-center text-pink-500">
              <span className="text-xl font-black mr-1 opacity-30">¥</span>
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
        <div className="bg-purple-100/30 rounded-2xl py-4 text-center border border-purple-200">
          <p className="text-purple-500 font-black text-sm italic">承認をお待ちください☕️</p>
        </div>
      ) : null}
    </section>
  );
}