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
    if (!confirm('この日記（ブログ）を削除しますか？ 写真は自動では削除されませんので、運営側で確認をお願いします。')) return;
    
    try {
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
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Blog History</h2>
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 animate-in fade-in duration-500">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <button onClick={() => onEdit(post)} className="p-2 text-pink-300 hover:bg-pink-50 rounded-full transition-colors"><Edit3 size={18} /></button>
                <button onClick={() => handleDelete(post)} className="p-2 text-gray-200 hover:text-rose-400 rounded-full transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>

            {/* 📍 HTMLを安全にプレビュー表示。画像はCSSで制御 [cite: 2026-02-21] */}
            <div 
              className="prose prose-pink prose-sm max-w-none text-gray-700 font-bold line-clamp-4 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>
        ))}
      </div>
    </section>
  );
}