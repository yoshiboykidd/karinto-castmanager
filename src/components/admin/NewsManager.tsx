'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trash2, Send, RefreshCw, Image as ImageIcon, Edit3, X } from 'lucide-react';

interface NewsManagerProps {
  role: string;
  myShopId: string | null;
}

export default function NewsManager({ role, myShopId }: NewsManagerProps) {
  const supabase = createClient();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // 📍 追記：編集状態の管理
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  // 📍 追記：編集を開始するロジック
  const startEdit = (news: any) => {
    setEditingId(news.id);
    setTitle(news.title || '');
    setBody(news.body || '');
    setImageUrl(news.image_url || '');
    setTargetShopId(news.shop_id);
    // 入力フォームまでスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 📍 追記：編集をキャンセルするロジック
  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setImageUrl('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('news-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(filePath);
      setImageUrl(publicUrl);
    } catch (err: any) {
      alert('アップロードに失敗しました: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !body.trim()) return;
    
    setIsProcessing(true);
    const finalShopId = role === 'developer' ? targetShopId : myShopId;

    try {
      if (editingId) {
        // 📍 修正：編集時は UPDATE を実行
        await supabase.from('news').update({
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl.trim(),
          content: title.trim() || body.trim().substring(0, 20),
          shop_id: finalShopId,
        }).eq('id', editingId);
      } else {
        // 新規投稿時は INSERT
        await supabase.from('news').insert([{
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl.trim(),
          content: title.trim() || body.trim().substring(0, 20),
          shop_id: finalShopId,
          display_date: new Date().toISOString().split('T')[0]
        }]);
      }
      
      cancelEdit(); // フォームリセット
      fetchNews();
    } catch (err) {
      alert('処理に失敗しました');
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
      {/* 📝 投稿フォーム */}
      <section className="p-6 rounded-[32px] shadow-xl border border-gray-100 bg-white">
        <form onSubmit={handleNewsSubmit} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {editingId ? 'Edit Broadcast' : 'New Broadcast'}
            </span>
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="text-[10px] font-black text-rose-400 flex items-center gap-1 uppercase tracking-widest hover:opacity-70"
              >
                <X size={12} /> Cancel Edit
              </button>
            )}
          </div>

          <input 
            type="text"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700 outline-none focus:bg-white transition-all"
            placeholder="タイトル（一覧に表示）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-2">
            <div className="relative">
              <input 
                type="text"
                className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-500 text-xs outline-none focus:bg-white transition-all"
                placeholder="画像URL（アップロードで自動入力）"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              <span className="text-[10px] font-black text-gray-600 uppercase">
                {isUploading ? 'Uploading...' : '📸 写真を選択してアップ'}
              </span>
            </label>
          </div>

          <textarea 
            className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white transition-all" 
            placeholder="本文（タップすると表示されます）" 
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
          />

          <button 
            type="submit" 
            disabled={isProcessing} 
            className={`w-full font-black py-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-rose-500' : 'bg-gray-900'}`}
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
            {editingId ? 'ニュースを更新する' : 'ニュースを配信する'}
          </button>
        </form>
      </section>

      {/* 📋 ニュース一覧（プレビュー） */}
      <div className="space-y-3">
        {newsList.map((news) => {
          const canManage = role === 'developer' || news.shop_id === myShopId;
          return (
            <div key={news.id} className={`bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm transition-all ${!canManage ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${news.shop_id === 'all' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                  {news.shop_id === 'all' ? '全店舗共通' : `SHOP: ${news.shop_id}`}
                </span>
                
                <div className="flex gap-1">
                  {/* 📍 追記：編集ボタン */}
                  {canManage && (
                    <button 
                      onClick={() => startEdit(news)} 
                      className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                  {canManage && (
                    <button onClick={() => handleDelete(news.id, news.shop_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
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