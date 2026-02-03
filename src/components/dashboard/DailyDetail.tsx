'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// プロパティ定義を完全に固定します
interface DailyDetailProps {
  date: Date;
  dayNum: number;
  shift: any;
  editReward: {
    f: string;
    first: string;
    main: string;
    amount: string;
  };
  setEditReward: (val: any) => void;
  onSave: () => void;
  isEditable: boolean; // Page.tsxからの波線を消す鍵
}

export default function DailyDetail({
  date,
  dayNum,
  shift,
  editReward,
  setEditReward,
  onSave,
  isEditable
}: DailyDetailProps) {
  const dateStr = format(date, 'M月d日(E)', { locale: ja });

  return (
    <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl p-5 flex flex-col space-y-1">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline">
          {format(date, 'M/d')}
          <span className="text-lg ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>
        <div className="flex items-center gap-1.5">
          {shift ? (
            <>
              <span className={`text-[13px] font-black px-2.5 py-1.5 rounded-lg border leading-none ${shift.status === 'official' ? 'text-blue-500 bg-blue-50 border-blue-100' : 'text-orange-500 bg-orange-50 border-orange-100'}`}>
                {shift.status === 'official' ? '確定シフト' : '申請中'}
              </span>
              <span className="text-[22px] font-black text-pink-500 leading-none">{shift.start_time}〜{shift.end_time}</span>
            </>
          ) : (
            <span className="text-[13px] font-black text-gray-300 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 leading-none">
              シフトなし
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-0.5 pt-1">
        <div className="grid grid-cols-3 gap-2 px-1">
          {(['f', 'first', 'main'] as const).map((key) => (
            <div key={key} className="flex flex-col items-center">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">
                {key === 'f' ? 'フリー' : key === 'first' ? '初指名' : '本指名'}
              </label>
              <input 
                type="number" 
                inputMode="numeric"
                disabled={!isEditable}
                value={editReward[key]} 
                onChange={e => setEditReward({...editReward, [key]: e.target.value})} 
                className={`w-full text-center py-2 bg-white rounded-xl font-black text-3xl border-b-2 border-pink-50 focus:border-pink-300 focus:outline-none transition-all ${!isEditable ? 'opacity-30 cursor-not-allowed' : 'text-pink-500'}`} 
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-pink-50/40 p-3 rounded-[22px] border border-pink-100 flex items-center justify-between shadow-inner">
        <label className="text-[13px] font-black text-gray-900 uppercase">報酬合計</label>
        <div className="flex items-center text-pink-500">
          <span className="text-2xl font-black mr-1 opacity-40 translate-y-[1px]">¥</span>
          <input 
            type="text" 
            disabled={!isEditable}
            value={editReward.amount !== '' ? Number(editReward.amount).toLocaleString() : ''} 
            onChange={e => {
              const v = e.target.value.replace(/,/g, '');
              if (/^\d*$/.test(v)) setEditReward({ ...editReward, amount: v });
            }} 
            className={`w-40 text-right bg-transparent font-black text-[32px] border-none focus:ring-0 ${!isEditable ? 'opacity-30 cursor-not-allowed' : 'text-pink-500'}`} 
          />
        </div>
      </div>

      <div className="flex gap-2 pt-0.5">
        <button 
          onClick={onSave} 
          disabled={!isEditable}
          className={`flex-[2.5] text-white font-black py-4 rounded-[20px] text-lg shadow-lg active:scale-95 transition-all ${isEditable ? 'bg-pink-500' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          {isEditable ? '実績を保存 💾' : '未来日は保存不可'}
        </button>
      </div>
    </section>
  );
}