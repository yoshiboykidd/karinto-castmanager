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
    <section className="bg-white rounded-[32px] border border-pink-100 shadow-xl p-6 flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ヘッダー：日付とシフト状況 */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none flex items-baseline">
          {format(date, 'M/d')}
          <span className="text-lg ml-1.5 text-pink-300 font-bold">
            ({format(date, 'E', { locale: ja })})
          </span>
        </h3>
        <div className="flex flex-col items-end">
          {shift ? (
            <>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mb-1 uppercase tracking-wider ${shift.status === 'official' ? 'bg-blue-50 text-blue-400 border border-blue-100' : 'bg-orange-50 text-orange-400 border border-orange-100'}`}>
                {shift.status === 'official' ? 'Official' : 'Requested'}
              </span>
              <span className="text-2xl font-black text-pink-500 tracking-tighter">
                {shift.start_time}〜{shift.end_time}
              </span>
            </>
          ) : (
            <span className="text-xs font-black text-gray-300 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              No Shift
            </span>
          )}
        </div>
      </div>

      {/* 入力エリア：三つの数字 */}
      <div className="grid grid-cols-3 gap-3">
        {(['f', 'first', 'main'] as const).map((key) => (
          <div key={key} className="relative group">
            <label className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] z-10">
              {key === 'f' ? 'Free' : key === 'first' ? '1st' : 'Main'}
            </label>
            <input 
              type="number" 
              inputMode="numeric"
              disabled={!isEditable}
              value={editReward[key]} 
              onChange={e => setEditReward({...editReward, [key]: e.target.value})} 
              className={`w-full text-center pt-5 pb-3 bg-pink-50/20 rounded-2xl font-black text-3xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-pink-100 ${
                !isEditable 
                ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed opacity-50' 
                : 'text-pink-500 border-pink-100 group-hover:border-pink-200 focus:border-pink-300'
              }`} 
            />
          </div>
        ))}
      </div>

      {/* 報酬合計エリア：デカい数字 */}
      <div className="bg-gradient-to-br from-pink-50/50 to-purple-50/30 p-4 rounded-[28px] border border-pink-100 flex items-center justify-between shadow-inner relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest leading-none mb-1">Total Reward</p>
          <label className="text-sm font-black text-gray-700">報酬合計</label>
        </div>
        <div className="flex items-center text-pink-500 relative z-10">
          <span className="text-2xl font-black mr-1 opacity-40 translate-y-1 italic">¥</span>
          <input 
            type="text" 
            disabled={!isEditable}
            value={editReward.amount !== '' ? Number(editReward.amount).toLocaleString() : ''} 
            onChange={e => {
              const v = e.target.value.replace(/,/g, '');
              if (/^\d*$/.test(v)) setEditReward({ ...editReward, amount: v });
            }} 
            className={`w-36 text-right bg-transparent font-black text-4xl border-none focus:ring-0 placeholder-pink-100 ${
              !isEditable ? 'text-gray-200 cursor-not-allowed' : 'text-pink-500'
            }`} 
            placeholder="0"
          />
        </div>
        {/* 背景の飾り */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-pink-100/20 rounded-full blur-2xl" />
      </div>

      {/* 保存ボタン */}
      <button 
        onClick={onSave} 
        disabled={!isEditable}
        className={`w-full font-black py-4 rounded-2xl text-lg shadow-lg active:scale-95 transition-all relative overflow-hidden group ${
          isEditable 
          ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-pink-200' 
          : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
        }`}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isEditable ? (
            <>実績を保存する <span className="text-xl">💰</span></>
          ) : (
            <>未来日は保存できません <span className="opacity-40 italic">🔒</span></>
          )}
        </span>
        {isEditable && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        )}
      </button>
    </section>
  );
}