'use client';

import { createClient } from '@/utils/supabase/client';
import { Trash2, Edit3, History } from 'lucide-react';

interface DiaryListProps {
  posts: any[];
  onUpdateSuccess: () => void;
  onEdit: (post: any) => void;
}

export default function DiaryList({ posts, onUpdateSuccess, onEdit }: DiaryListProps) {
  const supabase = createClient();

  const handleDelete = async (post: any) => {
    if (!confirm('この日記を削除してよろしいですか？ 写真も完全に消去されます。')) return;
    
    try {
      // 📍 1. Storageからファイルを削除 (URLからパスを抽出) [cite: 2026-02-21]
      const filePath = post.image_url.split('diary-photos/')[1];
      if (filePath) {
        await supabase.storage.from('diary-photos').remove([filePath]);
      }

      // 📍 2. DBからレコードを削除 [cite: 2026-02-21]
      const { error } = await supabase.from('diary_posts').delete().eq('id', post.id);
      if (error) throw error;

      onUpdateSuccess();
      alert('削除しました');
    } catch (err: any) {
      alert('削除失敗: ' + err.message);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <History size={16} className="text-gray-400" />
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Your History</h2>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 flex gap-4 items-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-inner bg-gray-50">
              <img src={post.image_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-300 font-black mb-1">{new Date(post.created_at).toLocaleDateString()}</p>
              <p className="text-[13px] font-bold text-gray-700 truncate">{post.content}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(post)} className="p-2 text-pink-300 hover:text-pink-500 active:scale-90"><Edit3 size={18} /></button>
              <button onClick={() => handleDelete(post)} className="p-2 text-gray-200 hover:text-rose-400 active:scale-90"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}