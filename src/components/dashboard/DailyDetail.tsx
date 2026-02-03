'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// Vercelエラーを防ぐため、page.tsxから渡されている dayNum を型に含めます
type DailyDetailProps = {
  date: Date;
  dayNum: number; // page.tsxの selected.single.getDate() を受け取る
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
  // 確定済みフラグがある場合は「変更申請中」
  const isModified = isRequested && shift?.is_official_pre_exist;

  // 2. デザインテーマの設定
  let themeClass = "bg-white border-pink-100";
  if (isModified) themeClass = "bg-orange-50/40 border-orange-200";
  else if (isRequested) themeClass = "bg-purple-50/40 border-purple-200";

  return (
    <section className={`rounded-[32px] border shadow-xl p-5 flex flex-col space-y-2 transition-all duration-300 ${themeClass}`}>
      
      {/* ヘッダー：日付と状態バッジ */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline">
          {format(date, 'M/d')}
          <span className="text-lg ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>
        
        <div className="flex flex-col items-end gap-1">
          {isModified ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-500 text-white uppercase tracking-tighter shadow-sm animate-pulse">
              変更申請中
            </span>
          ) : isOfficial ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500 text-white uppercase tracking-tighter shadow-sm">
              確定シフト
            </span>
          ) : isRequested ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500 text-white uppercase tracking-tighter shadow-sm">
              新規申請中
            </span>
          ) : (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-gray-400 text-white uppercase tracking-tighter">
              お休み
            </span>
          )}
        </div>
      </div>

      {/* 時間表示エリア：対比表示 */}
      <div className="px-1 py-1">
        {isModified ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2 opacity-50">
              <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">Before</span>
              <span className="text-base font-black text-gray-500 line-through decoration-gray-400">
                {/* 確定時の時間を表示（DBに保存されている現在の値） */}
                {shift.start_time}〜{shift.end_time}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded uppercase">After</span>
              <span className="text-2xl font-black text-orange-500">
                {shift.start_time}〜{shift.end_time}
              </span>
            </div>
          </div>
        ) : shift && shift.start_time !== 'OFF' ? (
          <div className="flex items-center gap-3">
            <span className={`text-[32px] font-black leading-none ${isRequested ? 'text-purple-500' : 'text-pink-500'}`}>
              {shift.start_time}〜{shift.end_time}
            </span>
          </div>
        ) : (
          <p className="text-gray-300 font-black italic text-sm py-2">予定なし⛄️</p>
        )}
      </div>

      {/* 入力フォーム（確定 または 変更申請中の実績入力用） */}
      {(isOfficial || isModified) && shift?.start_time !== 'OFF' ? (
        <div className="space-y-3 pt-2 border-t border-gray-100/30">
          <div className="grid grid-cols-3 gap-2">
            {(['f', 'first', 'main'] as const).map((key) => (
              <div key={key} className="flex flex-col space-y-1">
                <label className="text-[10px] font-black text-gray-400 text-center uppercase tracking-tighter">
                  {key === 'f' ? 'フリー' : key === 'first' ? '初指名' : '本指名'}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={editReward[key]}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditReward({ ...editReward, [key]: e.target.value })}
                  className="w-full text-center py-2 bg-white rounded-xl font-black text-2xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none text-pink-500"
                />
              </div>
            ))}
          </div>

          <div className="bg-white/60 p-3 rounded-2xl border border-pink-50 flex items-center justify-between shadow-inner">
            <span className="text-[11px] font-black text-gray-400 uppercase">報酬合計</span>
            <div className="flex items-center text-pink-500">
              <span className="text-xl font-black mr-1 opacity-40">¥</span>
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

          <div className="flex gap-2">
            <button onClick={onSave} className="flex-[2.5] bg-pink-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg active:scale-95 transition-all">
              実績を保存 💾
            </button>
            <button
              onClick={() => setEditReward({ f: '', first: '', main: '', amount: '' })}
              className="flex-1 bg-gray-50 text-gray-400 font-black py-4 rounded-2xl text-[12px] active:scale-95 transition-all border border-gray-100"
            >
              クリア 🗑️
            </button>
          </div>
        </div>
      ) : isRequested && !isModified ? (
        <div className="bg-purple-50/50 rounded-2xl p-6 text-center border border-purple-100">
          <p className="text-purple-500 font-black text-sm italic">店長の承認をお待ちください✨</p>
          <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest mt-1">Pending Approval</p>
        </div>
      ) : (
        <div className="py-6 text-center opacity-30">
          <p className="text-gray-400 font-black text-sm italic">お休み🍵</p>
        </div>
      )}
    </section>
  );
}