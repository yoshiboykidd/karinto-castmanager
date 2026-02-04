'use client';

import React from 'react';
import { format, isValid } from 'date-fns';
import { Save, Clock, Trophy, Coins } from 'lucide-react';

interface DailyDetailProps {
  date: Date;
  dayNum: number;
  shift: any;
  editReward: { f: string; first: string; main: string; amount: string };
  setEditReward: (val: any) => void;
  onSave: () => void;
  isEditable: boolean;
}

export default function DailyDetail({ 
  date, dayNum, shift, editReward, setEditReward, onSave, isEditable 
}: DailyDetailProps) {
  
  // 日付が有効でない場合は何も出さない
  if (!date || !isValid(date)) return null;

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-800 tracking-tighter">{dayNum}</span>
          <span className="text-sm font-bold text-slate-400">{format(date, 'MMM')}</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100">
          <span className="text-xs font-black text-slate-500 tracking-widest uppercase">
            {shift?.start_time && shift.start_time !== 'OFF' ? `${shift.start_time} - ${shift.end_time}` : 'No Shift'}
          </span>
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">指名</span>
            <input 
              type="number" 
              value={editReward.main || ''} 
              disabled={!isEditable}
              onChange={(e) => setEditReward({...editReward, main: e.target.value})}
              className="w-full h-12 bg-gray-50 border-none rounded-2xl text-center font-black text-slate-700 focus:ring-2 focus:ring-pink-200 disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">本指</span>
            <input 
              type="number" 
              value={editReward.first || ''} 
              disabled={!isEditable}
              onChange={(e) => setEditReward({...editReward, first: e.target.value})}
              className="w-full h-12 bg-gray-50 border-none rounded-2xl text-center font-black text-slate-700 focus:ring-2 focus:ring-pink-200 disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">フリー</span>
            <input 
              type="number" 
              value={editReward.f || ''} 
              disabled={!isEditable}
              onChange={(e) => setEditReward({...editReward, f: e.target.value})}
              className="w-full h-12 bg-gray-50 border-none rounded-2xl text-center font-black text-slate-700 focus:ring-2 focus:ring-pink-200 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="pt-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 text-center">報酬金額 (円)</span>
          <input 
            type="number" 
            placeholder="0"
            value={editReward.amount || ''} 
            disabled={!isEditable}
            onChange={(e) => setEditReward({...editReward, amount: e.target.value})}
            className="w-full h-14 bg-pink-50/50 border-none rounded-2xl text-center font-black text-pink-500 text-xl focus:ring-2 focus:ring-pink-200 disabled:opacity-50 placeholder:text-pink-200"
          />
        </div>

        {isEditable ? (
          <button 
            onClick={onSave}
            className="w-full h-14 mt-4 bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-pink-100 active:scale-95 transition-all"
          >
            <Save size={20} className="text-white" />
            <span className="font-black text-white tracking-widest">実績を保存する</span>
          </button>
        ) : (
          <div className="w-full py-4 text-center">
            <span className="text-[10px] font-black text-slate-300 tracking-tighter">
              ※この日の実績はまだ編集できません
            </span>
          </div>
        )}
      </div>
    </div>
  );
}