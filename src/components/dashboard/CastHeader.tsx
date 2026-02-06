'use client';

import { format, isValid } from 'date-fns';

type CastHeaderProps = {
  shopName: string;
  syncTime?: string | null;
  displayName?: string;
  version: string;
  bgColor?: string; // テーマカラーを受け取る
};

export default function CastHeader({ 
  shopName, 
  syncTime, 
  displayName, 
  version, 
  bgColor 
}: CastHeaderProps) {

  // 安全な時間表示ロジック
  const formattedTime = (() => {
    try {
      if (!syncTime) return '--:--';
      const date = new Date(syncTime);
      return isValid(date) ? format(date, 'HH:mm') : '--:--';
    } catch (e) {
      return '--:--';
    }
  })();

  // テーマが適用されているか判定（背景色が白以外ならテーマあり）
  const isThemed = !!bgColor && !bgColor.includes('white');

  return (
    <header className={`px-6 pt-10 pb-4 rounded-b-[40px] shadow-sm relative transition-colors duration-500
      ${isThemed 
        ? `${bgColor} text-white border-b border-white/10` // テーマ色ON
        : 'bg-white text-gray-800 border-b border-pink-50' // デフォルト（白）
      }
    `}>
      <div className="flex justify-between items-start">
        <div>
          {/* バージョン番号 */}
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 leading-none underline decoration-2 underline-offset-4
            ${isThemed ? 'text-white/80 decoration-white/50' : 'text-pink-300 decoration-pink-100'}
          `}>
            {version}
          </p>
          {/* 店名 */}
          <p className={`text-[13px] font-bold mb-1
            ${isThemed ? 'text-white/90' : 'text-gray-400'}
          `}>
            {shopName || 'KARINTO'}店
          </p>
        </div>

        {/* 同期時間バッジ */}
        <div className={`px-2 py-1 rounded-lg flex items-center gap-1
          ${isThemed ? 'bg-white/20 border border-white/10' : 'bg-gray-50 border border-gray-100'}
        `}>
          <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
          <span className={`text-[9px] font-black uppercase tracking-tighter
            ${isThemed ? 'text-white' : 'text-gray-400'}
          `}>
            HP同期: {formattedTime}
          </span>
        </div>
      </div>

      {/* 名前（大） */}
      <h1 className="text-3xl font-black flex items-baseline gap-0.5 leading-tight mt-1">
        {displayName || 'キャスト'}
        <span className={`text-[14px] font-bold ml-0.5
          ${isThemed ? 'text-white/80' : 'text-pink-400'}
        `}>
          さん
        </span>
      </h1>
    </header>
  );
}