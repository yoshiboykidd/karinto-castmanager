'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Megaphone, Trash2, Send, RefreshCw, Edit3, ShieldAlert } from 'lucide-react';

interface NewsManagerProps {
  role: string;
  myShopId: string | null;
}

export default function NewsManager({ role, myShopId }: NewsManagerProps) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [content, setContent] = useState('');
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 📍 開発者なら「全店舗」、店長なら「自店舗」をデフォルトにする
  const [targetShopId, setTargetShopId] = useState(role === 'developer' ? 'all' : (myShopId || ''));

  const fetchNews = async () => {
    let query = supabase.from('news').select('*').order('created_at', { ascending: false });

    // 📍 店長（admin）の場合は、全店舗向け('all')か、自店舗のニュースのみ表示
    if (role !== 'developer') {
      query = query.or(`shop_id.eq.all,shop_id.eq.${myShopId}`);
    }

    const { data } = await query;
    setNewsList(data || []);
  };

  useEffect(() => { fetchNews(); }, [role, myShopId]);

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsProcessing(true);
    // 📍 投稿先：店長の場合は強制的に自分の店舗IDにする
    const finalShopId = role === 'developer' ? targetShopId : myShopId;

    try {
      await supabase.from('news').insert([{
        content: content.trim(),
        shop_id: finalShopId,
        display_date: new Date().toISOString().split('T')[0]
      }]);
      setContent('');
      fetchNews();
    } catch (err) {
      alert('配信に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, postShopId: string) => {
    // 📍 権限チェック：開発者か、自分の店舗の投稿のみ削除可能
    if (role !== 'developer' && postShopId !== myShopId) {
      alert('他店舗のニュースを削除する権限がありません');
      return;
    }

    if (!confirm('このお知らせを削除しますか？')) return;
    await supabase.from('news').delete().eq('id', id);
    fetchNews();
  };

  return (
    <div className="space-y-4">
      {/* 📝 投稿フォーム */}
      <section className="p-6 rounded-[32px] shadow-xl border border-gray-100 bg-white">
        <form onSubmit={handleNewsSubmit} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Broadcast</span>
            
            {/* 📍 開発者だけが投稿先を選べる */}
            {role === 'developer' ? (
              <select 
                value={targetShopId} 
                onChange={(e) => setTargetShopId(e.target.value)}
                className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full outline-none"
              >
                <option value="all">全店舗に配信</option>
                <option value="001">神田店</option>
                <option value="002">赤坂店</option>
                {/* 必要に応じて店舗を追加 */}
              </select>
            ) : (
              <span className="text-[10px] font-black bg-blue-50 text-blue-500 px-3 py-1 rounded-full uppercase">
                To: {myShopId} Shop Only
              </span>
            )}
          </div>

          <textarea 
            className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white transition-all" 
            placeholder="お知らせ内容を入力..." 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            required 
          />
          <button 
            type="submit" 
            disabled={isProcessing} 
            className="w-full font-black py-4 rounded-2xl text-white shadow-lg bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
            ニュースを配信する
          </button>
        </form>
      </section>

      {/* 📋 ニュース一覧 */}
      <div className="space-y-3">
        {newsList.map((news) => {
          // 📍 この投稿を削除できるかどうか
          const canDelete = role === 'developer' || news.shop_id === myShopId;

          return (
            <div key={news.id} className={`bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm transition-all ${!canDelete ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${news.shop_id === 'all' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                  {news.shop_id === 'all' ? '全店舗共通' : `SHOP: ${news.shop_id}`}
                </span>
                
                {/* 📍 削除権限がある場合のみゴミ箱を表示 */}
                {canDelete && (
                  <button onClick={() => handleDelete(news.id, news.shop_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="font-bold text-gray-700 whitespace-pre-wrap text-[14px]">{news.content}</p>
              <div className="mt-2 text-[8px] text-gray-300 font-bold uppercase tracking-widest">
                {new Date(news.created_at).toLocaleString('ja-JP')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}