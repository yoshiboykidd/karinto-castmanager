'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DailyDetailProps {
  date: Date;
  dayNum: number;
  shift: any;
  editReward: { f: string; first: string; main: string; amount: string; };
  setEditReward: (val: any) => void;
  onSave: () => void;
  isEditable: boolean;
}

export default function DailyDetail({ date, shift, editReward, setEditReward, onSave, isEditable }: DailyDetailProps) {
  return (
    <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl p-5 flex flex-col space-y-1">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-2xl font-black text-gray-800 flex items-baseline">
          {format(date, 'M/d')}<span className="text-lg ml-1 opacity-70">({format(date, 'E', { locale: ja })})</span>
        </h3>
        <div className="flex items-center gap-1.5">
          {shift && <span className="text-[22px] font-black text-pink-500">{shift.start_time}〜{shift.end_time}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-4">
        {(['f', 'first', 'main'] as const).map((key) => (
          <div key={key} className="flex flex-col items-center">
            <label className="text-[11px] font-black text-gray-400 uppercase">{key}</label>
            <input 
              type="number" 
              disabled={!isEditable}
              value={editReward[key]} 
              onChange={e => setEditReward({...editReward, [key]: e.target.value})} 
              className={`w-full text-center py-2 rounded-xl font-black text-3xl border-b-2 ${!isEditable ? 'bg-gray-50 text-gray-300 border-transparent' : 'bg-white text-pink-500 border-pink-50'}`} 
            />
          </div>
        ))}
      </div>

      <button 
        onClick={onSave} 
        disabled={!isEditable}
        className={`w-full font-black py-4 rounded-[20px] text-lg shadow-lg active:scale-95 transition-all ${isEditable ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-400'}`}
      >
        {isEditable ? '実績を保存 💾' : '未来日は保存不可'}
      </button>
    </section>
  );
}