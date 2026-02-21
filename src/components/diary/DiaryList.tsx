'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trash2, Edit3, Check, X, History } from 'lucide-react';

export default function DiaryList({ posts, onUpdateSuccess }: { posts: any[], onUpdateSuccess: () => void }) {
  const supabase = createClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // 削除処理（DB + Storage）
  const handleDelete = async (post: any) => {
    if (!confirm('この日記を削除してよろしいですか？ 写真も完全に消去されます。')) return;
    
    try {
      // 1. Storageからファイルを削除 [cite: 2026-02-21]
      const urlParts = post.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${post.cast_id}/${fileName}`;
      
      await supabase.storage.from('diary-photos').remove([filePath]);

      // 2. DBからレコードを削除
      const { error } = await supabase.from('diary_posts').delete().eq('id', post.id);
      if (error) throw error;

      onUpdateSuccess();
    } catch (err: any) {
      alert('削除失敗: ' + err.message);
    }
  };

  // 編集保存
  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('diary_posts')
        .update({ content: editContent })
        .eq('id', id);
      
      if (error) throw error;
      setEditingId(null);
      onUpdateSuccess();
    } catch (err: any) {
      alert('更新失敗: ' + err.message);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <History size={16} className="text-gray-400" />
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">History & Edit</h2>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 animate-in fade-in duration-500">
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-300 font-black mb-1">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
                
                {editingId === post.id ? (
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-sm font-bold border-b border-pink-200 outline-none bg-pink-50/30 p-1"
                    rows={2}
                  />
                ) : (
                  <p className="text-[13px] font-bold text-gray-700 line-clamp-2">{post.content}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {editingId === post.id ? (
                  <>
                    <button onClick={() => handleUpdate(post.id)} className="p-2 text-green-400 bg-green-50 rounded-full"><Check size={18} /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-gray-300 bg-gray-50 rounded-full"><X size={18} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(post.id); setEditContent(post.content); }} className="p-2 text-pink-300 hover:text-pink-500 active:scale-90 transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(post)} className="p-2 text-gray-200 hover:text-rose-400 active:scale-90 transition-all"><Trash2 size={18} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}