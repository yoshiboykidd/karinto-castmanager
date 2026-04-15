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
  
  // URLから ?target= を取得（管理画面TOPのボタンと連動）
  const urlTarget = searchParams.get('target') as 'cast' | 'user' | null;
  const currentView = urlTarget || 'cast';

  const [castForm, setCastForm] = useState({ title: '', body: '', imageUrl: '' });
  const [userForm, setUserForm] = useState({ title: '', body: '', imageUrl: '' });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<'cast' | 'user'>('cast');
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [targetShopId, setTargetShopId] = useState(role === 'developer' ? 'all' : (myShopId || ''));

  // ニュース一覧の取得（ターゲットに合わせてフィルタリング）
  const fetchNews = async () => {
    let query = supabase.from('news').select('*').order('created_at', { ascending: false });
    
    // 現在の表示モード（cast or user）に合わせて履歴を絞り込む
    query = query.eq('target', currentView);

    if (role !== 'developer') {
      query = query.or(`shop_id.eq.all,shop_id.eq.${myShopId}`);
    }
    const { data } = await query;
    setNewsList(data || []);
  };

  useEffect(() => { fetchNews(); }, [role, myShopId, currentView]);

  // 編集開始
  const startEdit = (news: any) => {
    setEditingId(news.id);
    setEditTarget(news.target);
    const formData = { title: news.title || '', body: news.body || '', imageUrl: news.image_url || '' };
    if (news.target === 'cast') setCastForm(formData);
    else setUserForm(formData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingId(null);
    setCastForm({ title: '', body: '', imageUrl: '' });
    setUserForm({ title: '', body: '', imageUrl: '' });
  };

  // 写真アップロード処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cast' | 'user') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(type);
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

      if (type === 'cast') setCastForm({ ...castForm, imageUrl: publicUrl });
      else setUserForm({ ...userForm, imageUrl: publicUrl });
      
    } catch (err) {
      console.error(err);
      alert('アップロードに失敗しました');
    } finally {
      setIsUploading(null);
    }
  };

  // 配信・更新ボタン
  const handleNewsSubmit = async (type: 'cast' | 'user') => {
    const form = type === 'cast' ? castForm : userForm;
    if (!form.title && !form.body) return;

    setIsProcessing(true);
    try {
      if (editingId) {
        // 更新
        const { error } = await supabase
          .from('news')
          .update({
            title: form.title,
            body: form.body,
            image_url: form.imageUrl,
            content: form.title
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // 新規配信
        const { error } = await supabase
          .from('news')
          .insert([{
            title: form.title,
            body: form.body,
            image_url: form.imageUrl,
            target: type,
            shop_id: targetShopId,
            content: form.title
          }]);
        if (error) throw error;
      }

      cancelEdit();
      fetchNews();
      alert(editingId ? '更新しました' : '配信しました');
    } catch (err) {
      console.error(err);
      alert('処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 削除処理
  const handleDelete = async (id: string, shopId: string) => {
    if (role !== 'developer' && shopId !== myShopId) {
      alert('他店舗のニュースは削除できません');
      return;
    }
    if (!window.confirm('このニュースを削除しますか？')) return;

    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
      fetchNews();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="space-y-10">
      {/* 📢 キャスト向けセクション */}
      {currentView === 'cast' && (!editingId || editTarget === 'cast') && (
        <section className="p-6 rounded-[32px] shadow-xl border-t-8 border-rose-400 bg-white animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Megaphone className="text-rose-500" size={20} />
              <span className="text-sm font-black text-gray-700 uppercase tracking-widest italic">Cast Notice Mode</span>
            </div>
            {editingId && (
              <button onClick={cancelEdit} className="text-[10px] font-black text-rose-400 flex items-center gap-1 uppercase bg-rose-50 px-3 py-1 rounded-full">
                <X size={12} /> Exit Edit
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-rose-50 transition-all" placeholder="キャストへのタイトル" value={castForm.title} onChange={(e) => setCastForm({...castForm, title: e.target.value})} />
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
            <textarea className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-rose-50 transition-all resize-none" placeholder="キャストへの本文..." value={castForm.body} onChange={(e) => setCastForm({...castForm, body: e.target.value})} />
            <button onClick={() => handleNewsSubmit('cast')} disabled={isProcessing} className="w-full font-black py-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 bg-rose-500 shadow-rose-100">
              {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
              {editingId ? 'キャスト向け情報を更新' : 'キャストへ一斉配信'}
            </button>
          </div>
        </section>
      )}

      {/* 💎 ユーザー向けセクション */}
      {currentView === 'user' && (!editingId || editTarget === 'user') && (
        <section className="p-6 rounded-[32px] shadow-xl border-t-8 border-blue-400 bg-white animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Newspaper className="text-blue-500" size={20} />
              <span className="text-sm font-black text-gray-700 uppercase tracking-widest italic">User News Mode</span>
            </div>
            {editingId && (
              <button onClick={cancelEdit} className="text-[10px] font-black text-blue-400 flex items-center gap-1 uppercase bg-blue-50 px-3 py-1 rounded-full">
                <X size={12} /> Exit Edit
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="店舗ニュースのタイトル" value={userForm.title} onChange={(e) => setUserForm({...userForm, title: e.target.value})} />
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
            <textarea className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all resize-none" placeholder="店舗ニュースの本文..." value={userForm.body} onChange={(e) => setUserForm({...userForm, body: e.target.value})} />
            <button onClick={() => handleNewsSubmit('user')} disabled={isProcessing} className="w-full font-black py-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 bg-blue-500 shadow-blue-100">
              {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
              {editingId ? 'ユーザー向け情報を更新' : 'ユーザーへ一斉配信'}
            </button>
          </div>
        </section>
      )}

      {/* 配信履歴 */}
      <div className="space-y-3 pt-6 border-t border-gray-100">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-4">
          {currentView === 'cast' ? 'Notice' : 'News'} Broadcast History
        </h3>
        {newsList.map((news) => {
          const canManage = role === 'developer' || news.shop_id === myShopId;
          const isCast = news.target === 'cast';
          return (
            <div key={news.id} className={`bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm transition-all hover:shadow-md ${!canManage ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${isCast ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                  {isCast ? 'CAST 向け' : 'USER 向け'}
                </span>
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
                {new Date(news.created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}