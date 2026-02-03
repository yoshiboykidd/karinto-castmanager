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
    <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl p-6 flex flex-col space-y-4">
      
      {/* ヘッダー：日付と現在の確定シフト */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none">
          {format(date, 'M/d')}
          <span className="text-lg ml-1 text-pink-300 font-bold">
            ({format(date, 'E', { locale: ja })})
          </span>
        </h3>
        <div className="flex items-center gap-1.5">
          {shift && (
            <span className="text-2xl font-black text-pink-500 tracking-tighter">
              {shift.start_time}〜{shift.end_time}
            </span>
          )}
        </div>
      </div>

      {/* 入力エリア：三つの数字（日本語ラベル） */}
      <div className="grid grid-cols-3 gap-2 px-1">
        {(['f', 'first', 'main'] as const).map((key) => (
          <div key={key} className="flex flex-col items-center">
            <label className="text-[11px] font-black text-gray-400 mb-1">
              {key === 'f' ? 'フリー' : key === 'first' ? '初指名' : '本指名'}
            </label>
            <input 
              type="number" 
              inputMode="numeric"
              disabled={!isEditable}
              value={editReward[key]} 
              onChange={e => setEditReward({...editReward, [key]: e.target.value})} 
              className={`w-full text-center py-3 bg-pink-50/20 rounded-2xl font-black text-3xl border-b-4 transition-all focus:outline-none ${
                !isEditable 
                ? 'bg-gray-50 text-gray-200 border-transparent cursor-not-allowed opacity-50' 
                : 'text-pink-500 border-pink-100 focus:border-pink-300'
              }`} 
            />
          </div>
        ))}
      </div>

      {/* 報酬合計エリア */}
      <div className="bg-pink-50/40 p-4 rounded-[28px] border border-pink-100 flex items-center justify-between shadow-inner">
        <label className="text-sm font-black text-gray-700">報酬合計</label>
        <div className="flex items-center text-pink-500">
          <span className="text-2xl font-black mr-1 opacity-40 translate-y-1 italic">¥</span>
          <input 
            type="text" 
            disabled={!isEditable}
            value={editReward.amount !== '' ? Number(editReward.amount).toLocaleString() : ''} 
            onChange={e => {
              const v = e.target.value.replace(/,/g, '');
              if (/^\d*$/.test(v)) setEditReward({ ...editReward, amount: v });
            }} 
            className={`w-36 text-right bg-transparent font-black text-4xl border-none focus:ring-0 ${
              !isEditable ? 'text-gray-200 cursor-not-allowed' : 'text-pink-500'
            }`} 
            placeholder="0"
          />
        </div>
      </div>

      {/* 保存ボタン */}
      <button 
        onClick={onSave} 
        disabled={!isEditable}
        className={`w-full font-black py-4 rounded-2xl text-lg shadow-lg active:scale-95 transition-all ${
          isEditable 
          ? 'bg-pink-500 text-white shadow-pink-200' 
          : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
        }`}
      >
        {isEditable ? (
          '実績を保存する 💰'
        ) : (
          '未来日は保存できません 🔒'
        )}
      </button>
    </section>
  );
}