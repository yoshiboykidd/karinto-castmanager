'use client';

import { createClient } from '@/utils/supabase/client';
import { Trash2, Edit3, History, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DiaryListProps {
  posts: any[];
  onUpdateSuccess: () => void;
  onEdit: (post: any) => void;
}

export default function DiaryList({ posts, onUpdateSuccess, onEdit }: DiaryListProps) {
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * 🗑️ 物理削除連動型の削除処理
   */
  const handleDelete = async (post: any) => {
    const confirmMsg = "この日記を削除しますか？\n本文内の写真もすべてストレージから消去されます。";
    if (!confirm(confirmMsg)) return;
    
    setDeletingId(post.id);

    try {
      // 1. 本文(HTML)から全画像URLを抽出して物理パスに変換
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.content, 'text/html');
      const images = doc.querySelectorAll('img');
      const pathsToDelete: string[] = [];

      images.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && src.includes('diary-photos/')) {
          const path = src.split('diary-photos/')[1];
          if (path) pathsToDelete.push(path);
        }
      });

      // 2. ストレージからの物理削除
      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('diary-photos')
          .remove(pathsToDelete);
        
        if (storageError) console.error('Storage deletion failed:', storageError.message);
      }

      // 3. データベースからのレコード削除
      const { error: dbError } = await supabase
        .from('diary_posts')
        .delete()
        .eq('id', post.id);

      if (dbError) throw dbError;

      onUpdateSuccess();
      
    } catch (err: any) {
      alert('削除に失敗しました: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <History size={16} className="text-gray-400" />
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Blog History</h2>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <div 
            key={post.id} 
            className={`bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 flex gap-4 items-center transition-all ${
              deletingId === post.id ? 'opacity-50 scale-[0.98]' : 'hover:shadow-md'
            }`}
          >
            {/* 📸 サムネイル */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-[#FFF5F7] flex items-center justify-center border border-pink-50">
              {post.image_url ? (
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText className="text-pink-200" size={30} />
              )}
            </div>
            
            {/* 📝 テキストプレビュー */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-300 font-black mb-1">
                {new Date(post.created_at).toLocaleDateString('ja-JP')}
              </p>
              
              {/* 📍 修正箇所: (tag: string) と明示して波線を消去 */}
              <div 
                className="text-[13px] font-bold text-slate-600 line-clamp-2 leading-snug"
                dangerouslySetInnerHTML={{ 
                  __html: post.content
                    .replace(/<img[^>]*>/g, '<span class="text-pink-300 text-[10px] font-black mx-0.5">[画像]</span>')
                    .replace(/<[^>]*>/g, (tag: string) => tag.startsWith('<span') ? tag : '') 
                }}
              />
            </div>

            {/* ⚙️ 操作ボタン */}
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => onEdit(post)} 
                className="p-2.5 text-pink-300 hover:text-pink-500 active:scale-90 transition-all"
                disabled={deletingId !== null}
              >
                <Edit3 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(post)} 
                className="p-2.5 text-gray-200 hover:text-rose-400 active:scale-90 transition-all"
                disabled={deletingId !== null}
              >
                {deletingId === post.id ? (
                  <Loader2 className="animate-spin text-pink-400" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}