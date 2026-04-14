'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Megaphone, Trash2, Send, RefreshCw, Edit3, ShieldAlert, Image as ImageIcon } from 'lucide-react';

interface NewsManagerProps {
  role: string;
  myShopId: string | null;
}

export default function NewsManager({ role, myShopId }: NewsManagerProps) {
  const supabase = createClient();
  
  // 📍 修正：入力項目を拡張
  const [title, setTitle] = useState('');     // 件名
  const [body, setBody] = useState('');       // 本文
  const [imageUrl, setImageUrl] = useState(''); // 画像URL
  
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetShopId, setTargetShopId] = useState(role === 'developer' ? 'all' : (myShopId || ''));

  const fetchNews = async () => {
    let query = supabase.from('news').select('*').order('created_at', { ascending: false });
    if (role !== 'developer') {
      query = query.or(`shop_id.eq.all,shop_id.eq.${myShopId}`);
    }
    const { data } = await query;
    setNewsList(data || []);
  };

  useEffect(() => { fetchNews(); }, [role, myShopId]);

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // タイトルか本文のどちらかは必須にする
    if (!title.trim() && !body.trim()) return;
    
    setIsProcessing(true);
    const finalShopId = role === 'developer' ? targetShopId : myShopId;

    try {
      // 📍 修正：新しいカラム（title, body, image_url）を含めて保存
      // content には互換性のためにタイトルを入れておきます
      await supabase.from('news').insert([{
        title: title.trim(),
        body: body.trim(),
        image_url: imageUrl.trim(),
        content: title.trim() || body.trim().substring(0, 20), // 既存用
        shop_id: finalShopId,
        display_date: new Date().toISOString().split('T')[0]
      }]);
      
      // フォームリセット
      setTitle('');
      setBody('');
      setImageUrl('');
      fetchNews();
    } catch (err) {
      alert('配信に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, postShopId: string) => {
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
      <section className="p-6 rounded-[32px] shadow-xl border border-gray-100 bg-white">
        <form onSubmit={handleNewsSubmit} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Broadcast</span>
            {role === 'developer' ? (
              <select 
                value={targetShopId} 
                onChange={(e) => setTargetShopId(e.target.value)}
                className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full outline-none"
              >
                <option value="all">全店舗に配信</option>
                <option value="001">神田店</option>
                <option value="002">赤坂店</option>
                <option value="003">秋葉原店</option>
                <option value="004">上野店</option>
                <option value="005">渋谷店</option>
                <option value="006">池袋西口店</option>
                <option value="007">五反田店</option>
                <option value="008">大宮店</option>
                <option value="009">吉祥寺店</option>
                <option value="010">大久保店</option>
                <option value="011">池袋東口店</option>
                <option value="012">小岩店</option>
              </select>
            ) : (
              <span className="text-[10px] font-black bg-blue-50 text-blue-500 px-3 py-1 rounded-full uppercase">
                To: {myShopId} Shop Only
              </span>
            )}
          </div>

          {/* 📍 追記：タイトル入力 */}
          <input 
            type="text"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700 outline-none focus:bg-white transition-all"
            placeholder="タイトル（一覧に表示されます）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* 📍 追記：画像URL入力 */}
          <div className="relative">
            <input 
              type="text"
              className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-500 text-xs outline-none focus:bg-white transition-all"
              placeholder="画像URL（任意）"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          </div>

          {/* 本文入力 */}
          <textarea 
            className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white transition-all" 
            placeholder="本文（タップすると表示されます）" 
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
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

      <div className="space-y-3">
        {newsList.map((news) => {
          const canDelete = role === 'developer' || news.shop_id === myShopId;
          return (
            <div key={news.id} className={`bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm transition-all ${!canDelete ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${news.shop_id === 'all' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                  {news.shop_id === 'all' ? '全店舗共通' : `SHOP: ${news.shop_id}`}
                </span>
                {canDelete && (
                  <button onClick={() => handleDelete(news.id, news.shop_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              {/* 📍 修正：一覧での表示内容もリッチに */}
              <div className="space-y-2">
                <p className="font-black text-gray-800 text-[15px]">{news.title || news.content}</p>
                {news.image_url && (
                  <div className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                    <ImageIcon size={12} /> 画像あり
                  </div>
                )}
                {news.body && (
                  <p className="text-[11px] text-gray-400 line-clamp-1">{news.body}</p>
                )}
              </div>

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