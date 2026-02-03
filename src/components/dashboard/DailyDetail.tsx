'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// page.tsx (v3.3.3) の呼び出し側に合わせたプロパティ定義
type DailyDetailProps = {
  date: Date;
  dayNum: number;
  shift: any; // page.tsx から渡される selectedShift
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

  return (
    <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl p-5 flex flex-col space-y-1">
      {/* 1. ヘッダー：日付と確定シフトの表示 */}
      {shift && shift.start_time !== 'OFF' ? (
        <>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline">
              {format(date, 'M/d')}
              <span className="text-lg ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-black text-blue-500 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 leading-none">確定シフト</span>
              <span className="text-[22px] font-black text-pink-500 leading-none">{shift.start_time}〜{shift.end_time}</span>
            </div>
          </div>

          {/* 2. 入力エリア：フリー・初指名・本指名 */}
          <div className="flex flex-col space-y-0.5 pt-1">
            <div className="grid grid-cols-3 gap-2 px-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">フリー</label>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">初指名</label>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">本指名</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['f', 'first', 'main'] as const).map((key) => (
                <input
                  key={key}
                  type="number"
                  inputMode="numeric"
                  value={editReward[key]}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditReward({ ...editReward, [key]: e.target.value })}
                  className={`w-full text-center py-2 bg-white rounded-xl font-black text-3xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none transition-all ${
                    editReward[key] === '' ? 'text-gray-200' : 'text-pink-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 3. 報酬合計エリア */}
          <div className="bg-pink-50/40 p-3 rounded-[22px] border border-pink-100 flex items-center justify-between shadow-inner">
            <label className="text-[13px] font-black text-gray-900 uppercase">報酬合計</label>
            <div className="flex items-center text-pink-500">
              <span className="text-2xl font-black mr-1 opacity-40 translate-y-[1px]">¥</span>
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
                className={`w-40 text-right bg-transparent font-black text-[32px] border-none focus:ring-0 caret-pink-500 tracking-tighter ${
                  editReward.amount === '' ? 'text-gray-200' : 'text-pink-500'
                }`}
              />
            </div>
          </div>

          {/* 4. アクションボタン */}
          <div className="flex gap-2 pt-0.5">
            <button
              onClick={onSave}
              className="flex-[2.5] bg-pink-500 text-white font-black py-4 rounded-[20px] text-lg shadow-lg active:scale-95 transition-all"
            >
              実績を保存 💾
            </button>
            <button
              onClick={() => setEditReward({ f: '', first: '', main: '', amount: '' })}
              className="flex-1 bg-gray-100 text-gray-400 font-black py-4 rounded-[18px] text-[13px] active:scale-95 transition-all border border-gray-200"
            >
              クリア 🗑️
            </button>
          </div>
        </>
      ) : (
        /* シフトがない時の表示 */
        <div className="py-8 text-center text-gray-300 font-bold italic text-xs">
          確定シフトなし⛄️
        </div>
      )}
    </section>
  );
}