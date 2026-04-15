'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trash2, Send, RefreshCw, Image as ImageIcon, Edit3, X, Megaphone, Newspaper } from 'lucide-react';

interface NewsManagerProps {
  role: string;
  myShopId: string | null;
}

export default function NewsManager({ role, myShopId }: NewsManagerProps) {
  const supabase = createClient();
  
  // 📍 修正：入力フォームをキャスト用とユーザー用で分離
  const [castForm, setCastForm] = useState({ title: '', body: '', imageUrl: '' });
  const [userForm, setUserForm] = useState({ title: '', body: '', imageUrl: '' });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<'cast' | 'user'>('cast');
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null); // 'cast' | 'user' | null
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

  const startEdit = (news: any) => {
    setEditingId(news.id);
    setEditTarget(news.target || 'cast');
    if (news.target === 'user') {
      setUserForm({ title: news.title || '', body: news.body || '', imageUrl: news.image_url || '' });
    } else {
      setCastForm({ title: news.title || '', body: news.body || '', imageUrl: news.image_url || '' });
    }
    setTargetShopId(news.shop_id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCastForm({ title: '', body: '', imageUrl: '' });
    setUserForm({ title: '', body: '', imageUrl: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cast' | 'user') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(target);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('news-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(filePath);
      
      if (target === 'cast') setCastForm({ ...castForm, imageUrl: publicUrl });
      else setUserForm({ ...userForm, imageUrl: publicUrl });
    } catch (err: any) {
      alert('アップロードに失敗しました: ' + err.message);
    } finally {
      setIsUploading(null);
    }
  };

  const handleNewsSubmit = async (target: 'cast' | 'user') => {
    const form = target === 'cast' ? castForm : userForm;
    if (!form.title.trim() && !form.body.trim()) return;
    
    setIsProcessing(true);
    const finalShopId = role === 'developer' ? targetShopId : myShopId;

    try {
      if (editingId) {
        await supabase.from('news').update({
          title: form.title.trim(),
          body: form.body.trim(),
          image_url: form.imageUrl.trim(),
          content: form.title.trim() || form.body.trim().substring(0, 20),
          shop_id: finalShopId,
          target: target, // 📍 targetを保存
        }).eq('id', editingId);
      } else {
        await supabase.from('news').insert([{
          title: form.title.trim(),
          body: form.body.trim(),
          image_url: form.imageUrl.trim(),
          content: form.title.trim() || form.body.trim().substring(0, 20),
          shop_id: finalShopId,
          target: target, // 📍 targetを保存
          display_date: new Date().toISOString().split('T')[0]
        }]);
      }
      cancelEdit();
      fetchNews();
    } catch (err) {
      alert('処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, postShopId: string) => {
    if (role !== 'developer' && postShopId !== myShopId) {
      alert('権限がありません');
      return;
    }
    if (!confirm('このお知らせを削除しますか？')) return;
    await supabase.from('news').delete().eq('id', id);
    fetchNews();
  };

  return (
    <div className="space-y-10">
      {/* 📢 キャスト向け（サクラピンク） */}
      {(!editingId || editTarget === 'cast') && (
        <section className="p-6 rounded-[32px] shadow-xl border-t-8 border-rose-400 bg-white">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Megaphone className="text-rose-500" size={20} />
              <span className="text-sm font-black text-gray-700 uppercase tracking-widest">キャスト向けお知らせ</span>
            </div>
            {editingId && (
              <button onClick={cancelEdit} className="text-[10px] font-black text-rose-400 flex items-center gap-1 uppercase">
                <X size={12} /> Cancel Edit
              </button>
            )}
          </div>
          <div className="space-y-4">
            <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700 outline-none focus:bg-white transition-all" placeholder="タイトル" value={castForm.title} onChange={(e) => setCastForm({...castForm, title: e.target.value})} />
            <div className="space-y-2">
              <div className="relative">
                <input type="text" className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-500 text-xs outline-none focus:bg-white transition-all" placeholder="画像URL" value={castForm.imageUrl} onChange={(e) => setCastForm({...castForm, imageUrl: e.target.value})} />
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'cast')} disabled={isUploading === 'cast'} />
                <span className="text-[10px] font-black text-gray-600 uppercase">{isUploading === 'cast' ? 'Uploading...' : '📸 写真を選択'}</span>
              </label>
            </div>
            <textarea className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white transition-all" placeholder="本文" value={castForm.body} onChange={(e) => setCastForm({...castForm, body: e.target.value})} />
            <button onClick={() => handleNewsSubmit('cast')} disabled={isProcessing} className={`w-full font-black py-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-rose-500' : 'bg-rose-500'}`}>
              {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
              {editingId ? 'キャスト向け情報を更新' : 'キャストへ一斉配信'}
            </button>
          </div>
        </section>
      )}

      {/* 💎 ユーザー向け（ライトブルー） */}
      {(!editingId || editTarget === 'user') && (
        <section className="p-6 rounded-[32px] shadow-xl border-t-8 border-blue-400 bg-white">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Newspaper className="text-blue-500" size={20} />
              <span className="text-sm font-black text-gray-700 uppercase tracking-widest">ユーザー向けNews</span>
            </div>
            {editingId && (
              <button onClick={cancelEdit} className="text-[10px] font-black text-rose-400 flex items-center gap-1 uppercase">
                <X size={12} /> Cancel Edit
              </button>
            )}
          </div>
          <div className="space-y-4">
            <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700 outline-none focus:bg-white transition-all" placeholder="タイトル" value={userForm.title} onChange={(e) => setUserForm({...userForm, title: e.target.value})} />
            <div className="space-y-2">
              <div className="relative">
                <input type="text" className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-500 text-xs outline-none focus:bg-white transition-all" placeholder="画像URL" value={userForm.imageUrl} onChange={(e) => setUserForm({...userForm, imageUrl: e.target.value})} />
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'user')} disabled={isUploading === 'user'} />
                <span className="text-[10px] font-black text-gray-600 uppercase">{isUploading === 'user' ? 'Uploading...' : '📸 写真を選択'}</span>
              </label>
            </div>
            <textarea className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white transition-all" placeholder="本文" value={userForm.body} onChange={(e) => setUserForm({...userForm, body: e.target.value})} />
            <button onClick={() => handleNewsSubmit('user')} disabled={isProcessing} className={`w-full font-black py-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-blue-500' : 'bg-blue-500'}`}>
              {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
              {editingId ? 'ユーザー向け情報を更新' : 'ユーザーへ一斉配信'}
            </button>
          </div>
        </section>
      )}

      {/* 配信履歴 */}
      <div className="space-y-3 pt-6 border-t border-gray-100">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-4">Broadcast History</h3>
        {newsList.map((news) => {
          const canManage = role === 'developer' || news.shop_id === myShopId;
          const isCast = news.target === 'cast';
          return (
            <div key={news.id} className={`bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm transition-all ${!canManage ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2">
                  <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${isCast ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                    {isCast ? 'CAST 向け' : 'USER 向け'}
                  </span>
                  <span className="text-[8px] font-black px-3 py-1 bg-gray-100 text-gray-400 rounded-full uppercase">
                    {news.shop_id === 'all' ? '全店舗共通' : `SHOP: ${news.shop_id}`}
                  </span>
                </div>
                <div className="flex gap-1">
                  {canManage && (
                    <button onClick={() => startEdit(news)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
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
                  <div className="mt-3 relative w-32 group">
                    <img src={news.image_url} alt="preview" className="w-full h-auto rounded-xl border border-gray-100 shadow-sm object-cover" />
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