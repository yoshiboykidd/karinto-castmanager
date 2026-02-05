'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format, parseISO } from 'date-fns';

// 親から店舗リストの定義をもらうか、ここでも定義するか。今回は簡略化のためここでも定義（共通定数ファイルに逃がすのがベストですが）
const SHOP_LIST_DISPLAY = [
  { id: 'all', name: '📢 全店舗共通' },
  { id: '001', name: '📍 神田' },  // IDはshop_masterに合わせて修正
  { id: '002', name: '📍 赤坂' },
  { id: '003', name: '📍 秋葉原' }, // あなたの環境に合わせて修正してください
  { id: '004', name: '📍 上野' },
  { id: '005', name: '📍 渋谷' },
  { id: '006', name: '📍 池西' },
  { id: '007', name: '📍 五反田' },
  { id: '008', name: '📍 大宮' },
  { id: '009', name: '📍 吉祥寺' },
  { id: '010', name: '📍 大久保' },
  { id: '011', name: '📍 池東' },
  { id: '012', name: '📍 小岩' },
    // ...必要に応じて
];

export default function NewsManager({ targetShopId, role, myShopId }: { targetShopId: string, role: string, myShopId: string | null }) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [content, setContent] = useState('');
  const [newsList, setNewsList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    setNewsList(data || []);
  }

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const payload = { 
      content, 
      shop_id: targetShopId, 
      display_date: new Date().toISOString().split('T')[0] 
    };

    if (editingId) {
      await supabase.from('news').update(payload).eq('id', editingId);
      alert('修正しました！');
      setEditingId(null);
    } else {
      await supabase.from('news').insert([payload]);
      alert('配信しました！🌸');
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

  const startEdit = (news: any) => {
    setEditingId(news.id);
    setContent(news.content);
    // 編集時はスクロールトップせずとも、フォームに入ればOK
  };

  return (
    <section className={`p-6 rounded-[30px] shadow-sm border border-gray-100 bg-white animate-in fade-in slide-in-from-bottom-4 duration-500 ${editingId ? 'ring-2 ring-amber-300' : ''}`}>
      <h2 className="text-sm font-black text-gray-400 mb-4 flex items-center">
        <span className="mr-2 text-lg">📢</span> ニュース配信
      </h2>
      
      <form onSubmit={handleNewsSubmit} className="space-y-4">
        <textarea
          className="w-full h-20 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 font-bold text-gray-700 text-sm"
          placeholder="お知らせメッセージ..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        
        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full font-black py-3 rounded-xl shadow-sm active:scale-95 transition-all text-white text-xs ${editingId ? 'bg-amber-500' : 'bg-blue-500'}`}
        >
          {editingId ? '内容を保存する' : 'ニュースを配信 🚀'}
        </button>
      </form>

      <div className="mt-8 space-y-3">
         {newsList.map((news) => (
            <div key={news.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative group">
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${news.shop_id === 'all' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                    {/* IDから名前を表示したい場合はここで変換 */}
                    {news.shop_id === 'all' ? '全店舗' : news.shop_id}
                </span>
                {(role === 'developer' || news.shop_id === myShopId) && (
                  <div className="flex space-x-2 opacity-30 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(news)} className="text-[10px] text-blue-500">✎</button>
                    <button onClick={() => handleDelete(news.id)} className="text-[10px] text-red-500">×</button>
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-gray-600">{news.content}</p>
            </div>
         ))}
      </div>
    </section>
  );
}