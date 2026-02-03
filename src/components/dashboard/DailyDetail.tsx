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
  const isModified = isRequested && shift?.is_official_pre_exist;

  // 2. デザインテーマ設定
  let themeClass = "bg-white border-pink-100";
  if (isModified) themeClass = "bg-orange-50/40 border-orange-200";
  else if (isRequested) themeClass = "bg-purple-50/40 border-purple-200";

  return (
    <section className={`rounded-[32px] border shadow-xl p-5 flex flex-col space-y-3 transition-all duration-300 ${themeClass}`}>
      
      {/* A. 日付ヘッダー（余計なテキストを削除） */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline">
          {format(date, 'M/d')}
          <span className="text-lg ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>
      </div>

      {/* B. 変更申請中セクション（バッジと時間のみに簡略化） */}
      {isModified && (
        <div className="flex items-center gap-3 px-3 py-2 bg-white/60 rounded-2xl border border-orange-100 shadow-sm">
          <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-orange-500 text-white shadow-sm shrink-0">
            変更申請中
          </span>
          <span className="text-[20px] font-black text-orange-500 tracking-tighter">
            {shift.start_time}〜{shift.end_time}
          </span>
        </div>
      )}

      {/* C. メイン時間表示 */}
      <div className="flex items-center gap-4 px-1 py-1">
        {shift && shift.start_time !== 'OFF' ? (
          <>
            {/* バッジ：左側に配置 */}
            {isOfficial || isModified ? (
              <span className="text-[15px] font-black px-4 py-2 rounded-xl bg-blue-500 text-white shadow-md shrink-0">
                確定
              </span>
            ) : isRequested ? (
              <span className="text-[15px] font-black px-4 py-2 rounded-xl bg-purple-500 text-white shadow-md shrink-0">
                新規
              </span>
            ) : null}

            {/* 時間表示：右側に大きく表示 */}
            <span className={`text-[36px] font-black leading-none tracking-tighter ${isRequested && !isModified ? 'text-purple-500' : 'text-pink-500'}`}>
              {shift.start_time}〜{shift.end_time}
            </span>
          </>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <span className="text-[15px] font-black px-4 py-2 rounded-xl bg-gray-400 text-white shadow-sm">休み</span>
            <span className="text-xl font-black text-gray-300 italic opacity-50">Day Off</span>
          </div>
        )}
      </div>

      {/* D. 実績入力フォーム（確定 または 変更申請中の場合に表示） */}
      {(isOfficial || isModified) && shift?.start_time !== 'OFF' ? (
        <div className="space-y-3 pt-3 border-t border-gray-100/50">
          <div className="grid grid-cols-3 gap-3">
            {(['f', 'first', 'main'] as const).map((key) => (
              <div key={key} className="flex flex-col space-y-1">
                <label className="text-[10px] font-black text-gray-400 text-center uppercase tracking-widest">
                  {key === 'f' ? 'フリー' : key === 'first' ? '初指名' : '本指名'}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={editReward[key]}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditReward({ ...editReward, [key]: e.target.value })}
                  className="w-full text-center py-3 bg-white rounded-2xl font-black text-3xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none text-pink-500 shadow-sm"
                />
              </div>
            ))}
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-pink-100 flex items-center justify-between shadow-inner">
            <span className="text-[12px] font-black text-gray-400 uppercase">報酬合計額</span>
            <div className="flex items-center text-pink-500">
              <span className="text-2xl font-black mr-1 opacity-30">¥</span>
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
                className="w-36 text-right bg-transparent font-black text-[32px] border-none focus:ring-0 tracking-tighter"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onSave} className="flex-[3] bg-pink-500 text-white font-black py-4 rounded-2xl text-xl shadow-lg active:scale-95 transition-all">
              実績を保存 💾
            </button>
            <button
              onClick={() => setEditReward({ f: '', first: '', main: '', amount: '' })}
              className="flex-1 bg-gray-100 text-gray-400 font-black py-4 rounded-2xl text-[13px] active:scale-95 transition-all border border-gray-200"
            >
              クリア
            </button>
          </div>
        </div>
      ) : isRequested && !isModified ? (
        <div className="bg-purple-100/30 rounded-2xl p-6 text-center border border-purple-200 mt-2">
          <p className="text-purple-500 font-black text-sm italic">店長の承認をお待ちください☕️</p>
        </div>
      ) : null}
    </section>
  );
}