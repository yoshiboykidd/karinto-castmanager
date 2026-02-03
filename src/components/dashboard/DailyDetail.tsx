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
  dayNum, // selected.single.getDate() が渡されている
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

  // 2. 特定日判定 (10日:かりんと / 11・22日:添い寝)
  const isKarin = dayNum === 10;
  const isSoine = dayNum === 11 || dayNum === 22;

  // 3. デザインテーマ設定
  let themeClass = "bg-white border-pink-100";
  if (isModified) themeClass = "bg-orange-50/40 border-orange-200";
  else if (isRequested) themeClass = "bg-purple-50/40 border-purple-200";

  return (
    <section className={`relative overflow-hidden rounded-[32px] border shadow-xl p-5 pt-7 flex flex-col space-y-4 transition-all duration-300 ${themeClass}`}>
      
      {/* ★ 特定日バッジ：最上段に配置 */}
      {(isKarin || isSoine) && (
        <div className={`absolute top-0 left-0 right-0 py-1 text-center font-black text-[11px] tracking-[0.3em] shadow-sm
          ${isKarin ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'}`}>
          {isKarin ? 'かりんとの日' : '添い寝の日'}
        </div>
      )}

      {/* A. 1行目：日付 ＆ 変更申請情報 */}
      <div className="flex items-center justify-between px-1 h-8 mt-1">
        <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline">
          {format(date, 'M/d')}
          <span className="text-lg ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>

        {isModified && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-orange-500 text-white shadow-sm">
              変更申請中
            </span>
            <span className="text-[18px] font-black text-orange-500 tracking-tighter">
              {shift.start_time}〜{shift.end_time}
            </span>
          </div>
        )}
      </div>

      {/* B. メイン時間表示（高さを固定してズレを防止） */}
      <div className="flex items-center gap-4 px-1 h-12">
        {shift && shift.start_time !== 'OFF' ? (
          <>
            {isOfficial || isModified ? (
              <span className="text-[15px] font-black px-4 py-2 rounded-xl bg-blue-500 text-white shadow-md shrink-0">
                確定
              </span>
            ) : isRequested ? (
              <span className="text-[15px] font-black px-4 py-2 rounded-xl bg-purple-500 text-white shadow-md shrink-0">
                新規
              </span>
            ) : null}

            <span className={`text-[36px] font-black leading-none tracking-tighter ${isRequested && !isModified ? 'text-purple-500' : 'text-pink-500'}`}>
              {shift.start_time}〜{shift.end_time}
            </span>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-black px-4 py-2 rounded-xl bg-gray-400 text-white shadow-sm">休み</span>
            <span className="text-xl font-black text-gray-300 italic opacity-40 uppercase tracking-widest text-[11px]">No Schedule</span>
          </div>
        )}
      </div>

      {/* C. 実績入力フォーム */}
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
        <div className="bg-purple-100/30 rounded-2xl p-6 text-center border border-purple-200 mt-1">
          <p className="text-purple-500 font-black text-sm italic">承認されるまでお待ちください☕️</p>
        </div>
      ) : null}
    </section>
  );
}