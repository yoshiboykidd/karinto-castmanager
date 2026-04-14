'use client';

import { useState } from 'react'; // 📍 追記：状態管理
import { format, parseISO } from 'date-fns';

type NewsItem = {
  id: string;
  created_at: string;
  title?: string;     // 📍 追記：件名
  body?: string;      // 📍 追記：本文
  image_url?: string; // 📍 追記：画像URL
  content: string;    // 既存のデータも壊さないように残す
};

type NewsSectionProps = {
  newsList: NewsItem[];
};

export default function NewsSection({ newsList }: NewsSectionProps) {
  // 📍 修正：開いているお知らせのIDを管理
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden mb-8">
      <div className="bg-gray-50 p-2.5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
        News
      </div>
      <div className="divide-y divide-gray-50">
        {newsList.length === 0 ? (
          <div className="p-8 text-center text-gray-300 text-xs font-bold italic">
            お知らせはありません
          </div>
        ) : (
          newsList.map((n) => (
            <div 
              key={n.id} 
              className="p-4 px-6 cursor-pointer active:bg-gray-50 transition-colors" // 📍 タップ可能に
              onClick={() => setExpandedId(expandedId === n.id ? null : n.id)} // 📍 開閉ロジック
            >
              <div className="flex gap-4 items-start">
                <span className="text-[10px] text-pink-400 font-black shrink-0 bg-pink-50 px-2 py-1 rounded leading-none mt-0.5">
                  {format(parseISO(n.created_at), 'MM/dd')}
                </span>
                <div className="flex-1">
                  {/* タイトル：titleがあればそれを、なければ既存のcontentを表示 */}
                  <p className="text-[13px] font-black text-gray-700 leading-relaxed">
                    {n.title || n.content}
                  </p>

                  {/* 📍 修正：開いている時だけ本文と画像を表示 */}
                  {expandedId === n.id && (n.body || n.image_url) && (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1">
                      {/* 画像があれば表示 */}
                      {n.image_url && (
                        <img 
                          src={n.image_url} 
                          alt="news" 
                          className="w-full h-auto rounded-2xl border border-gray-100 shadow-sm"
                        />
                      )}
                      {/* 本文 */}
                      {n.body && (
                        <p className="text-[12px] font-medium text-gray-500 leading-relaxed whitespace-pre-wrap">
                          {n.body}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {/* 矢印アイコン（開閉のヒント） */}
                <span className={`text-[10px] text-gray-300 transition-transform ${expandedId === n.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}