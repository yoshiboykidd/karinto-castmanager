'use client';

import { format, parseISO } from 'date-fns';

type NewsItem = {
  id: string;
  created_at: string;
  content: string;
};

type NewsSectionProps = {
  newsList: NewsItem[];
};

export default function NewsSection({ newsList }: NewsSectionProps) {
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
            <div key={n.id} className="p-4 px-6 flex gap-4 items-start">
              <span className="text-[10px] text-pink-400 font-black shrink-0 bg-pink-50 px-2 py-1 rounded leading-none mt-0.5">
                {format(parseISO(n.created_at), 'MM/dd')}
              </span>
              <p className="text-[13px] font-bold text-gray-700 leading-relaxed">
                {n.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}