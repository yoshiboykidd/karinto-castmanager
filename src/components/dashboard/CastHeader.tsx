'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { format, isValid, parseISO, isToday } from 'date-fns'; // ★isTodayを追加

type CastHeaderProps = {
  shopName: string;
  syncTime?: string | null;
  displayName?: string;
  version?: string;
  bgColor?: string; 
};

export default function CastHeader({ 
  shopName, 
  syncTime, 
  displayName, 
  bgColor 
}: CastHeaderProps) {
  const router = useRouter();
  const [seasonalEmoji, setSeasonalEmoji] = useState('☃️');
  const [isPanicMode, setIsPanicMode] = useState(false);

  // ★修正: 時間表示のロジック強化
  // 「今日」なら時間だけ、「過去/未来」なら日付も出して、止まっているのか判断しやすくする
  const formattedTime = useMemo(() => {
    if (!syncTime) return '--:--';
    
    try {
      // 文字列ならパース、すでにDateならそのまま使う
      const date = typeof syncTime === 'string' ? parseISO(syncTime) : syncTime;

      if (!isValid(date)) {
        // 日付として無効なら、文字列そのまま返す（例: "15:00" など手動入力値の場合）
        return String(syncTime);
      }

      // 今日なら時間だけ、違うなら日付もつける
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else {
        return format(date, 'M/d HH:mm');
      }
    } catch (e) {
      return '--:--';
    }
  }, [syncTime]);

  useEffect(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) setSeasonalEmoji('🌸');
    else if (month >= 6 && month <= 8) setSeasonalEmoji('🌻');
    else if (month >= 9 && month <= 11) setSeasonalEmoji('🍁');
    else setSeasonalEmoji('☃️');
  }, []);

  const isThemed = !!bgColor && !bgColor.includes('white');

  return (
    <>
      {/* 緊急脱出用オーバーレイ */}
      {isPanicMode && (
        <div 
          className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center cursor-pointer"
          onDoubleClick={() => setIsPanicMode(false)}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mb-4"></div>
          <p className="text-gray-400 font-bold text-sm tracking-widest animate-pulse">CONNECTING...</p>
          <p className="absolute bottom-10 text-[10px] text-gray-300">Double tap to resume</p>
        </div>
      )}

      <header className={`px-5 pt-8 pb-5 rounded-b-[40px] shadow-sm relative transition-colors duration-500
        ${isThemed 
          ? `${bgColor} text-white border-b border-white/10` 
          : 'bg-white text-gray-800 border-b border-pink-50' 
        }
      `}>
        <div className="flex justify-between items-end">
          
          {/* --- 左サイド（名前エリア）: ここだけクリックでマイページへ --- */}
          <div 
            onClick={() => router.push('/mypage')}
            className="flex flex-col space-y-1 cursor-pointer active:opacity-70 transition-opacity"
          >
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none
              ${isThemed ? 'text-white/70' : 'text-pink-300/80'}
            `}>
              - CastManager -
            </p>
            <p className={`text-[12px] font-bold pl-0.5
              ${isThemed ? 'text-white/80' : 'text-gray-400'}
            `}>
              {shopName || '店舗未設定'}
            </p>

            <div className="pt-1">
              <h1 className="font-black leading-tight flex items-baseline">
                <span className="text-[26px]">{displayName || 'キャスト'}</span>
                <span className={`text-[13px] ml-1 font-bold
                  ${isThemed ? 'text-white/80' : 'text-gray-400'}
                `}>さん</span>
                <span className="text-[24px] ml-1 filter drop-shadow-sm -translate-y-0.5">{seasonalEmoji}</span>
              </h1>
              <p className={`text-[11px] font-bold flex items-center gap-1 pl-0.5 mt-0.5
                ${isThemed ? 'text-white/90' : 'text-gray-400'}
              `}>
                お疲れ様です <span className="text-[14px]">♨️</span>
              </p>
            </div>
          </div>

          {/* --- 右サイド（ボタンエリア） --- */}
          <div className="flex flex-col items-end space-y-2 pb-0.5">
            
            {/* HP同期時刻 */}
            <div className={`w-[128px] h-[44px] rounded-xl border flex items-center justify-center gap-2 shadow-sm transition-colors
              ${isThemed 
                ? 'bg-white/20 border-white/20 text-white' 
                : 'bg-green-50/80 border-green-100'
              }
            `}>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                  ${isThemed ? 'bg-white' : 'bg-green-400'}
                `}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5
                  ${isThemed ? 'bg-white' : 'bg-green-500'}
                `}></span>
              </span>
              <div className="flex flex-col leading-none items-center">
                <span className={`text-[8px] font-black uppercase tracking-tighter mb-0.5
                  ${isThemed ? 'text-white/70' : 'text-green-600/50'}
                `}>HP SYNC</span>
                {/* 文字数が増える可能性があるので文字サイズ調整 */}
                <span className={`font-black tracking-tight whitespace-nowrap
                  ${formattedTime.length > 5 ? 'text-[11px]' : 'text-[13px]'}
                  ${isThemed ? 'text-white' : 'text-green-600'}
                `}>{formattedTime}</span>
              </div>
            </div>

            {/* 緊急脱出ボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // 親のイベントを止める
                setIsPanicMode(true);
              }}
              className={`w-[128px] h-[44px] rounded-xl border flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 group z-10 cursor-pointer
                ${isThemed
                  ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                  : 'bg-rose-50/80 border-rose-100 hover:bg-rose-100'
                }
              `}
            >
              <LogOut className={`w-4 h-4 shrink-0 group-hover:rotate-12 transition-transform
                ${isThemed ? 'text-white' : 'text-rose-400'}
              `} />
              <div className="flex flex-col leading-none items-center">
                <span className={`text-[8px] font-black uppercase tracking-tighter mb-0.5
                  ${isThemed ? 'text-white/70' : 'text-rose-400/50'}
                `}>SECRET</span>
                <span className={`text-[13px] font-black tracking-widest
                  ${isThemed ? 'text-white' : 'text-rose-500'}
                `}>ESCAPE</span>
              </div>
            </button>
            
          </div>
        </div>
      </header>
    </>
  );
}