'use client';

import { createClient } from '@/utils/supabase/client';
import { Trash2, Edit3, History } from 'lucide-react';

// 📍 型定義：onEdit を追加して波線エラーを解消 [cite: 2026-02-21]
interface DiaryListProps {
  posts: any[];
  onUpdateSuccess: () => void;
  onEdit: (post: any) => void;
}

export default function DiaryList({ posts, onUpdateSuccess, onEdit }: DiaryListProps) {
  const supabase = createClient();

  // 削除処理（DB + Storage） [cite: 2026-02-21]
  const handleDelete = async (post: any) => {
    if (!confirm('この日記を削除してよろしいですか？ 写真も完全に消去されます。')) return;
    
    try {
      // 1. Storageから物理ファイルを削除
      const urlParts = post.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${post.cast_id}/${fileName}`;
      await supabase.storage.from('diary-photos').remove([filePath]);

      // 2. DBからレコードを削除
      const { error } = await supabase.from('diary_posts').delete().eq('id', post.id);
      if (error) throw error;

      onUpdateSuccess();
    } catch (err: any) {
      alert('削除に失敗しました: ' + err.message);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <History size={16} className="text-gray-400" />
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Your History</h2>
      </div>

      <div className="grid gap-4">
        {posts.length === 0 ? (
          <p className="text-center py-10 text-gray-300 font-bold text-sm italic">まだ投稿がありません 🧊</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 flex gap-4 items-center animate-in fade-in duration-500">
              {/* 写真プレビュー */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              
              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-300 font-black mb-1">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
                <p className="text-[13px] font-bold text-gray-700 truncate">{post.content}</p>
              </div>

              {/* 操作ボタン */}
              <div className="flex gap-1">
                {/* 📍 編集：クリックすると DiaryForm に内容がセットされます */}
                <button 
                  onClick={() => onEdit(post)} 
                  className="p-2 text-pink-300 hover:text-pink-500 active:scale-90 transition-all"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(post)} 
                  className="p-2 text-gray-200 hover:text-rose-400 active:scale-90 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}