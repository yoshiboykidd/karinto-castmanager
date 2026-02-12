'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Megaphone, Trash2, Send, RefreshCw, Edit3 } from 'lucide-react';

// 📍 型定義を追加して波線を消す
interface NewsManagerProps {
  targetShopId: string;
  role: string;
  myShopId: string | null;
}

export default function NewsManager({ targetShopId, role, myShopId }: NewsManagerProps) {
  const [supabase] = useState(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
  const [content, setContent] = useState('');
  const [newsList, setNewsList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchNews = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    setNewsList(data || []);
  };

  useEffect(() => { fetchNews(); }, []);

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const payload = { content, shop_id: targetShopId, display_date: new Date().toISOString().split('T')[0] };
    if (editingId) {
      await supabase.from('news').update(payload).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('news').insert([payload]);
    }
    setContent('');
    fetchNews();
    setIsProcessing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    await supabase.from('news').delete().eq('id', id);
    fetchNews();
  };

  return (
    <div className="space-y-4">
      <section className={`p-6 rounded-[32px] shadow-xl border border-gray-100 bg-white ${editingId ? 'ring-4 ring-pink-100' : ''}`}>
        <form onSubmit={handleNewsSubmit} className="space-y-4">
          <textarea className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none" placeholder="お知らせを入力..." value={content} onChange={(e) => setContent(e.target.value)} required />
          <button type="submit" disabled={isProcessing} className={`w-full font-black py-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all ${editingId ? 'bg-orange-500' : 'bg-gray-900'}`}>
            {editingId ? '変更を保存する' : 'ニュースを配信 🚀'}
          </button>
        </form>
      </section>

      <div className="space-y-3">
        {newsList.map((news) => (
          <div key={news.id} className="bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm relative group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black px-3 py-1 bg-gray-100 rounded-full text-gray-500 uppercase">{news.shop_id}</span>
              {(role === 'developer' || news.shop_id === myShopId) && (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(news.id); setContent(news.content); }} className="text-blue-500"><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(news.id)} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
            <p className="font-bold text-gray-700 whitespace-pre-wrap">{news.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}