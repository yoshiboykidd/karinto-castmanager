'use client';

import React from 'react';
import { format, isValid } from 'date-fns';
// ★ アイコンのインポートを復活
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
  
  // 日付が有効でない場合は何も出さない（安全策）
  if (!date || !isValid(date)) return null;

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. ヘッダー部分（デザイン復元） */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-800 tracking-tighter">{dayNum}</span>
          <span className="text-sm font-bold text-slate-400">{format(date, 'MMM')}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100">
          <Clock size={14} className="text-slate-400" />
          <span className="text-xs font-black text-slate-500 tracking-widest uppercase">
            {/* ガード処理は維持 */}
            {shift?.start_time && shift.start_time !== 'OFF' ? `${shift.start_time} - ${shift.end_time}` : 'No Shift'}
          </span>
        </div>
      </div>

      {/* 2. 入力フォーム部分（デザイン復元＆ガード適用） */}
      <div className="space-y-4">
        {/* 指名・本指・フリーの3カラム入力 */}
        <div className="grid grid-cols-3 gap-3">
          {/* 指名 */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">指名</span>
            <div className="relative group">
              <Trophy className="absolute left-4 top-3.5 text-pink-300 transition-colors group-focus-within:text-pink-500" size={20} />
              <input 
                type="number" 
                inputMode="numeric"
                pattern="\d*"
                placeholder="0"
                value={editReward.main || ''} // ガード
                disabled={!isEditable}
                onChange={(e) => setEditReward({...editReward, main: e.target.value})}
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-2xl font-black text-slate-700 focus:ring-2 focus:ring-pink-200 focus:bg-white transition-all disabled:opacity-50 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* 本指 */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">本指</span>
            <div className="relative group">
              <Clock className="absolute left-4 top-3.5 text-purple-300 transition-colors group-focus-within:text-purple-500" size={20} />
              <input 
                type="number" 
                inputMode="numeric"
                placeholder="0"
                value={editReward.first || ''} // ガード
                disabled={!isEditable}
                onChange={(e) => setEditReward({...editReward, first: e.target.value})}
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-2xl font-black text-slate-700 focus:ring-2 focus:ring-purple-200 focus:bg-white transition-all disabled:opacity-50 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* フリー */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">フリー</span>
            <div className="relative group">
              <Coins className="absolute left-4 top-3.5 text-yellow-400 transition-colors group-focus-within:text-yellow-600" size={20} />
              <input 
                type="number" 
                inputMode="numeric"
                placeholder="0"
                value={editReward.f || ''} // ガード
                disabled={!isEditable}
                onChange={(e) => setEditReward({...editReward, f: e.target.value})}
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-2xl font-black text-slate-700 focus:ring-2 focus:ring-yellow-200 focus:bg-white transition-all disabled:opacity-50 placeholder:text-gray-300"
              />
            </div>
          </div>
        </div>

        {/* 報酬金額入力 */}
        <div className="pt-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">報酬金額 (円)</span>
          <div className="relative group">
            <span className="absolute left-4 top-4 font-black text-pink-400 text-lg">¥</span>
            <input 
              type="number" 
              inputMode="numeric"
              placeholder="0"
              value={editReward.amount || ''} // ガード
              disabled={!isEditable}
              onChange={(e) => setEditReward({...editReward, amount: e.target.value})}
              className="w-full h-14 pl-10 pr-4 bg-pink-50/50 border-none rounded-2xl font-black text-pink-500 text-xl focus:ring-2 focus:ring-pink-200 focus:bg-pink-50 transition-all disabled:opacity-50 placeholder:text-pink-300/50 text-right tracking-wider"
            />
          </div>
        </div>

        {/* 保存ボタンエリア */}
        {isEditable ? (
          <button 
            onClick={onSave}
            className="w-full h-14 mt-4 bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-pink-100 active:scale-95 transition-all hover:shadow-xl hover:from-pink-500 hover:to-rose-500"
          >
            <Save size={20} className="text-white" />
            <span className="font-black text-white tracking-widest">実績を保存する</span>
          </button>
        ) : (
          <div className="w-full py-4 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
            <span className="text-[10px] font-black text-slate-400 tracking-tighter flex items-center justify-center gap-2">
              <Clock size={12} />
              ※この日の実績はまだ編集できません
            </span>
          </div>
        )}
      </div>
    </div>
  );
}