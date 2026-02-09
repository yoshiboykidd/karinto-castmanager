'use client';

import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, Star, Coins, Calendar as CalIcon, Heart } from 'lucide-react';

interface DailyDetailProps {
  date: Date;
  dayNum: number;
  shift: any; // 取得したシフト/予約データ
}

export default function DailyDetail({ date, dayNum, shift }: DailyDetailProps) {
  // 自動計算ロジック（仮：実際のロジックに合わせて調整してください）
  const baseReward = shift?.reward || 0;
  const pointReward = (shift?.points || 0) * 100; // 1pt = 100円計算など
  const total = baseReward + pointReward;

  return (
    <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 日付ヘッダー：サクラピンクのグラデーション */}
      <div className="flex items-center gap-2 mb-3 px-2">
        <div className="w-10 h-10 rounded-2xl bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-100">
          <span className="text-lg font-black">{dayNum}</span>
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-800">
            {format(date, 'yyyy年 M月 d日', { locale: ja })}
          </h3>
          <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Reservation Detail</p>
        </div>
      </div>

      {/* メインカード：サクラ色の淡い背景 */}
      <div className="bg-[#FFF5F7] rounded-[32px] p-6 border border-pink-100 shadow-sm relative overflow-hidden">
        {/* 背景の装飾アイコン */}
        <Heart className="absolute -right-4 -top-4 w-24 h-24 text-pink-200/30 rotate-12" />

        {!shift ? (
          <div className="py-10 text-center">
            <p className="text-gray-400 font-bold text-sm">この日の予約・出勤はありません</p>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            
            {/* 時間セクション */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Clock className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-pink-400">勤務時間</p>
                  <p className="text-base font-black text-gray-800">
                    {shift.start_time || '19:00'} 〜 {shift.end_time || '24:00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-pink-100 w-full" />

            {/* 自動計算報酬セクション */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 p-4 rounded-2xl border border-pink-50">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-orange-400" />
                  <span className="text-[10px] font-bold text-gray-500">基本報酬</span>
                </div>
                <p className="text-lg font-black text-gray-800">
                  ¥{baseReward.toLocaleString()}
                </p>
              </div>

              <div className="bg-white/60 p-4 rounded-2xl border border-pink-50">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-[10px] font-bold text-gray-500">ポイント報酬</span>
                </div>
                <p className="text-lg font-black text-gray-800">
                  ¥{pointReward.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 合計金額：一番目立たせる */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-5 text-white shadow-xl shadow-pink-200">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold opacity-80 mb-1">本日の推定合計報酬</p>
                  <p className="text-3xl font-black italic tracking-tighter">
                    <span className="text-sm mr-1">¥</span>
                    {total.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold opacity-70">AUTO CALCULATED</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 補足メッセージ */}
      <p className="text-center mt-4 text-[10px] font-bold text-pink-300 italic">
        ※金額は自動集計による概算です。確定金額は給与明細を確認してください。
      </p>
    </div>
  );
}