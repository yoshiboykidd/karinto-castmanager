'use client';

import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { format, isValid } from 'date-fns';

type CastHeaderProps = {
  shopName: string;
  syncTime?: string | null;
  displayName?: string;
  version?: string;
  bgColor?: string; // テーマカラー受け取り用
};

export default function CastHeader({ 
  shopName, 
  syncTime, 
  displayName, 
  bgColor // 色が渡されなければデフォルト（白）
}: CastHeaderProps) {
  const [seasonalEmoji, setSeasonalEmoji] = useState('☃️');
  const [isPanicMode, setIsPanicMode] = useState(false);

  // 時間表示の安全策（ISO文字列を HH:mm に変換）
  const formattedTime = (() => {
    try {
      if (!syncTime) return '--:--';
      const date = new Date(syncTime);
      return isValid(date) ? format(date, 'HH:mm') : '--:--';
    } catch (e) {
      return '--:--';
    }
  })();

  useEffect(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) setSeasonalEmoji('🌸');
    else if (month >= 6 && month <= 8) setSeasonalEmoji('🌻');
    else if (month >= 9 && month <= 11) setSeasonalEmoji('🍁');
    else setSeasonalEmoji('☃️');
  }, []);

  // テーマが適用されているか判定（背景色が白以外ならテーマあり）
  const isThemed = !!bgColor && !bgColor.includes('white');

  return (
    <>
      {/* 緊急脱出用オーバーレイ (Panic Mode) */}
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
          ? `${bgColor} text-white border-b border-white/10` // テーマ色ON
          : 'bg-white text-gray-800 border-b border-pink-50' // デフォルト（白）
        }
      `}>
        <div className="flex justify-between items-end">
          
          {/* --- 左サイド --- */}
          <div className="flex flex-col space-y-1">
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
                お疲れ様です <span className="text-[14px]">🍵</span>
              </p>
            </div>
          </div>

          {/* --- 右サイド（サイズ統一・中央寄せ） --- */}
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
                <span className={`text-[13px] font-black tracking-tight
                  ${isThemed ? 'text-white' : 'text-green-600'}
                `}>{formattedTime}</span>
              </div>
            </div>

            {/* 緊急脱出ボタン */}
            <button
              onClick={() => setIsPanicMode(true)}
              className={`w-[128px] h-[44px] rounded-xl border flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 group
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