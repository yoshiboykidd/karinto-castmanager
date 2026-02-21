'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ImageIcon, Bold, List, Send, Loader2, Sparkles, Undo, Redo } from 'lucide-react';

export default function DiaryEditor({ castProfile, onPostSuccess, editingPost, onCancelEdit }: any) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'rounded-2xl border-4 border-white shadow-lg my-4 max-w-full h-auto',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-pink focus:outline-none min-h-[300px] p-6 text-[16px] font-bold leading-relaxed',
      },
    },
  });

  useEffect(() => {
    if (editingPost && editor) {
      editor.commands.setContent(editingPost.content);
    } else if (editor) {
      editor.commands.setContent('');
    }
  }, [editingPost, editor]);

  // 📸 画像圧縮 ＋ 挿入
  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const img = document.createElement('img'); // 📍 衝突回避
      const reader = new FileReader();
      reader.onload = (event) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const maxSide = 1200;
          if (width > height) { if (width > maxSide) { height *= maxSide / width; width = maxSide; } }
          else { if (height > maxSide) { width *= maxSide / height; height = maxSide; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              const fileName = `${castProfile.login_id}/${Date.now()}.jpg`;
              const { data } = await supabase.storage.from('diary-photos').upload(fileName, compressedFile);
              if (data) {
                const { data: { publicUrl } } = supabase.storage.from('diary-photos').getPublicUrl(data.path);
                editor?.chain().focus().setImage({ src: publicUrl }).run();
              }
            }
          }, 'image/jpeg', 0.7);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!editor || isSubmitting) return;
    const htmlContent = editor.getHTML();
    if (editor.isEmpty) return;

    // 📍 本文から最初の <img> タグの src を抽出してサムネイルにする
    const match = htmlContent.match(/<img src="([^"]+)"/);
    const firstImageUrl = match ? match[1] : null;

    setIsSubmitting(true);
    try {
      if (editingPost) {
        const { error } = await supabase.from('diary_posts').update({ 
          content: htmlContent,
          image_url: firstImageUrl // 編集時もサムネイルを更新
        }).eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('diary_posts').insert([{
          cast_id: castProfile.login_id,
          cast_name: castProfile.display_name,
          content: htmlContent,
          image_url: firstImageUrl, // 自動抽出したURLを保存
          shop_id: castProfile.home_shop_id,
        }]);
        if (error) throw error;
      }

      alert('ブログを公開しました！✨');
      editor.commands.setContent('');
      onPostSuccess();
    } catch (err: any) {
      alert('エラー: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2 text-pink-400">
        <div className="flex items-center gap-2"><Sparkles size={16} /><h2 className="text-xs font-black uppercase tracking-[0.2em]">{editingPost ? 'Edit' : 'New'} Blog</h2></div>
        {editingPost && <button onClick={onCancelEdit} className="text-[10px] font-black underline">キャンセル</button>}
      </div>

      <div className="flex flex-wrap gap-1.5 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-pink-100 shadow-sm sticky top-[72px] z-20">
        <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-2.5 rounded-xl transition-all ${editor?.isActive('bold') ? 'bg-pink-500 text-white shadow-md' : 'text-pink-300'}`}><Bold size={18} /></button>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-2.5 rounded-xl transition-all ${editor?.isActive('bulletList') ? 'bg-pink-500 text-white shadow-md' : 'text-pink-300'}`}><List size={18} /></button>
        <button onClick={addImage} className="p-2.5 rounded-xl text-pink-400 bg-pink-50 hover:bg-pink-100 active:scale-90 transition-all"><ImageIcon size={18} /></button>
        <div className="flex-1" />
        <button onClick={() => editor?.chain().focus().undo().run()} className="p-2.5 text-gray-300"><Undo size={18} /></button>
        <button onClick={() => editor?.chain().focus().redo().run()} className="p-2.5 text-gray-300"><Redo size={18} /></button>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl shadow-pink-200/10 border border-pink-50 overflow-hidden min-h-[350px]">
        <EditorContent editor={editor} />
      </div>

      <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-5 rounded-[24px] bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-pink-200">
        {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <><span>公開する ✨</span><Send size={20} /></>}
      </button>
    </section>
  );
}