'use client';

import { createClient } from '@/utils/supabase/client';
import { Trash2, Edit3, History, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function DiaryList({ posts, onUpdateSuccess, onEdit }: any) {
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 🗑️ ストレージとDBの連動削除ロジック
  const handleDelete = async (post: any) => {
    if (!confirm('このブログを削除しますか？ 本文内の写真もすべてストレージから消去されます。')) return;
    
    setDeletingId(post.id);
    try {
      // 📍 1. 本文(HTML)から全画像URLを抽出
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.content, 'text/html');
      const images = doc.querySelectorAll('img');
      const pathsToDelete: string[] = [];

      images.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && src.includes('diary-photos/')) {
          // URLからバケット名以降の相対パス（キャストID/ファイル名）を抽出
          const path = src.split('diary-photos/')[1];
          if (path) pathsToDelete.push(path);
        }
      });

      // 📍 2. ストレージから物理ファイルを一括削除
      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('diary-photos')
          .remove(pathsToDelete);
        
        if (storageError) console.error('Storage deletion error:', storageError);
      }

      // 📍 3. データベースから投稿レコードを削除
      const { error: dbError } = await supabase
        .from('diary_posts')
        .delete()
        .eq('id', post.id);

      if (dbError) throw dbError;

      onUpdateSuccess();
      // 成功時はアラートを出さず、リストが消える動きだけでOK（UX向上のため）
      
    } catch (err: any) {
      alert('削除に失敗しました: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-2 text-gray-400">
        <History size={16} />
        <h2 className="text-xs font-black uppercase tracking-[0.2em]">Blog History</h2>
      </div>

      <div className="grid gap-4">
        {posts.map((post: any) => (
          <div key={post.id} className={`bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 flex gap-4 items-center transition-opacity ${deletingId === post.id ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* サムネイル表示 */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-pink-50 flex items-center justify-center border border-pink-50">
              {post.image_url ? (
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText className="text-pink-200" size={32} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-300 font-black mb-1">{new Date(post.created_at).toLocaleDateString()}</p>
              {/* HTMLタグを除去してプレビュー */}
              <div 
                className="text-[13px] font-bold text-gray-700 line-clamp-2 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/<img[^>]*>/g, '[画像]') }}
              />
            </div>

            <div className="flex gap-1">
              <button 
                onClick={() => onEdit(post)} 
                className="p-2 text-pink-300 active:scale-90 transition-transform"
                disabled={deletingId === post.id}
              >
                <Edit3 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(post)} 
                className="p-2 text-gray-200 hover:text-rose-400 active:scale-90 transition-all"
                disabled={deletingId === post.id}
              >
                {deletingId === post.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
              </button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-10 text-gray-300 font-bold text-sm">
            まだ投稿がありません 🌸
          </div>
        )}
      </div>
    </section>
  );
}