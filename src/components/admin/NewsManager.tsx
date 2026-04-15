'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Trash2, Send, RefreshCw, Image as ImageIcon, Edit3, X, Megaphone, Newspaper } from 'lucide-react';

interface NewsManagerProps {
  role: string;
  myShopId: string | null;
}

export default function NewsManager({ role, myShopId }: NewsManagerProps) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  
  // URLの ?target= によって操作するテーブルを物理的に切り替える
  const currentView = (searchParams.get('target') as 'cast' | 'user') || 'cast';
  const tableName = currentView === 'user' ? 'user_news' : 'cast_notices';

  const [formData, setFormData] = useState({ title: '', body: '', imageUrl: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. ニュース/お知らせ一覧の取得
  const fetchNews = async () => {
    let query = supabase.from(tableName).select('*').order('created_at', { ascending: false });
    
    // 管理者以外は自店舗または全体向けのみ表示
    if (role !== 'developer') {
      query = query.or(`shop_id.eq.all,shop_id.eq.${myShopId}`);
    }
    const { data } = await query;
    setNewsList(data || []);
  };

  useEffect(() => {
    fetchNews();
  }, [currentView, myShopId]);

  // 2. 送信・更新処理
  const handleNewsSubmit = async () => {
    if (!formData.title) {
      alert('タイトルを入力してください');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        title: formData.title,
        body: formData.body,
        image_url: formData.imageUrl,
        shop_id: role === 'developer' ? 'all' : (myShopId || 'all')
      };

      if (editingId) {
        // 更新
        const { error } = await supabase
          .from(tableName)
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await supabase
          .from(tableName)
          .insert([payload]);
        if (error) throw error;
      }

      alert(editingId ? '更新しました' : '配信しました');
      setFormData({ title: '', body: '', imageUrl: '' });
      setEditingId(null);
      fetchNews();
    } catch (err: any) {
      console.error(err);
      alert(`処理に失敗しました: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. 編集モード開始
  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      body: item.body || '',
      imageUrl: item.image_url || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. 写真アップロード
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `news/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cast-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cast-assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imageUrl: publicUrl });
    } catch (err) {
      console.error(err);
      alert('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  // 5. 削除処理
  const handleDelete = async (id: string, shopId: string) => {
    if (role !== 'developer' && shopId !== myShopId) {
      alert('他店舗のデータは削除できません');
      return;
    }
    if (!window.confirm('本当に削除しますか？')) return;

    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      fetchNews();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="space-y-10">
      {/* 入力・編集セクション */}
      <section className={`p-6 rounded-[32px] shadow-xl border-t-8 bg-white animate-in fade-in slide-in-from-bottom-4 ${currentView === 'user' ? 'border-blue-400' : 'border-rose-400'}`}>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            {currentView === 'user' ? <Newspaper className="text-blue-500" size={20} /> : <Megaphone className="text-rose-500" size={20} />}
            <span className="text-sm font-black text-gray-700 uppercase tracking-widest italic">
              {currentView === 'user' ? 'User News Mode' : 'Cast Notice Mode'}
            </span>
          </div>
          {editingId && (
            <button 
              onClick={() => { setEditingId(null); setFormData({title:'', body:'', imageUrl:''}); }} 
              className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1"
            >
              <X size={12} /> Cancel Edit
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          <input 
            type="text" 
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-opacity-20 transition-all" 
            placeholder="タイトルを入力" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
          />
          
          <div className="space-y-2">
            <div className="relative">
              <input 
                type="text" 
                className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-500 text-xs outline-none focus:bg-white transition-all" 
                placeholder="画像URL" 
                value={formData.imageUrl} 
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
              />
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <span className="text-[10px] font-black text-gray-600 uppercase">
                {isUploading ? 'Uploading...' : '📸 写真を選択'}
              </span>
            </label>
          </div>

          <textarea 
            className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-opacity-20 transition-all resize-none" 
            placeholder="本文を入力してください..." 
            value={formData.body} 
            onChange={(e) => setFormData({...formData, body: e.target.value})} 
          />

          <button 
            onClick={handleNewsSubmit} 
            disabled={isProcessing} 
            className={`w-full font-black py-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${currentView === 'user' ? 'bg-blue-500 shadow-blue-100' : 'bg-rose-500 shadow-rose-100'}`}
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
            {editingId ? '更新する' : '一斉配信する'}
          </button>
        </div>
      </section>

      {/* 履歴セクション */}
      <div className="space-y-3 pt-6 border-t border-gray-100">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-4">
          {currentView === 'user' ? 'User News' : 'Cast Notice'} History
        </h3>
        
        {newsList.map((item) => {
          const canManage = role === 'developer' || item.shop_id === myShopId;
          return (
            <div key={item.id} className={`bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm transition-all hover:shadow-md ${!canManage ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-1">
                  <p className="font-black text-gray-800 text-[15px]">{item.title}</p>
                  <div className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-1">
                  {canManage && (
                    <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit3 size={16} />
                    </button>
                  )}
                  {canManage && (
                    <button onClick={() => handleDelete(item.id, item.shop_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {item.image_url && (
                <div className="mt-3">
                  <img src={item.image_url} alt="thumb" className="w-32 h-auto rounded-xl border border-gray-100 shadow-sm object-cover" />
                </div>
              )}
              
              {item.body && (
                <p className="text-[11px] text-gray-400 font-medium line-clamp-2 mt-2 leading-relaxed">
                  {item.body}
                </p>
              )}
            </div>
          );
        })}
        
        {newsList.length === 0 && (
          <div className="text-center py-10 text-gray-300 text-xs font-bold italic bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            配信履歴はありません
          </div>
        )}
      </div>
    </div>
  );
}