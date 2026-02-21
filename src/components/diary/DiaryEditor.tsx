'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ImageIcon, Bold, List, Send, Loader2, Sparkles, Undo, Redo, Eye } from 'lucide-react';

export default function DiaryEditor({ castProfile, onPostSuccess, editingPost, onCancelEdit }: any) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewContent, setPreviewContent] = useState(''); // 📍 プレビュー用

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'rounded-2xl border-4 border-white shadow-lg my-4 max-w-full h-auto mx-auto',
        },
      }),
    ],
    content: '',
    onUpdate({ editor }) {
      setPreviewContent(editor.getHTML()); // 入力のたびにプレビューを更新
    },
    editorProps: {
      attributes: {
        class: 'prose prose-pink focus:outline-none min-h-[250px] p-6 text-[16px] font-bold leading-relaxed',
      },
    },
  });

  useEffect(() => {
    if (editingPost && editor) {
      editor.commands.setContent(editingPost.content);
      setPreviewContent(editingPost.content);
    }
  }, [editingPost, editor]);

  // --- 画像圧縮ロジック (addImage) は以前と同じ ---
  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const img = document.createElement('img');
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

    const match = htmlContent.match(/<img src="([^"]+)"/);
    const firstImageUrl = match ? match[1] : null;

    setIsSubmitting(true);
    try {
      if (editingPost) {
        await supabase.from('diary_posts').update({ content: htmlContent, image_url: firstImageUrl }).eq('id', editingPost.id);
      } else {
        await supabase.from('diary_posts').insert([{
          cast_id: castProfile.login_id, cast_name: castProfile.display_name,
          content: htmlContent, image_url: firstImageUrl, shop_id: castProfile.home_shop_id,
        }]);
      }
      alert('公開しました！✨');
      editor.commands.setContent('');
      setPreviewContent('');
      onPostSuccess();
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <section className="space-y-6">
      {/* 📝 入力セクション */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 text-pink-400">
          <div className="flex items-center gap-2"><Sparkles size={16} /><h2 className="text-xs font-black uppercase tracking-[0.2em]">Editor</h2></div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-pink-100 shadow-sm sticky top-[72px] z-20">
          <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-2.5 rounded-xl ${editor?.isActive('bold') ? 'bg-pink-500 text-white' : 'text-pink-300'}`}><Bold size={18} /></button>
          <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-2.5 rounded-xl ${editor?.isActive('bulletList') ? 'bg-pink-500 text-white' : 'text-pink-300'}`}><List size={18} /></button>
          <button onClick={addImage} className="p-2.5 rounded-xl text-pink-400 bg-pink-50"><ImageIcon size={18} /></button>
          <div className="flex-1" />
          <button onClick={() => editor?.chain().focus().undo().run()} className="p-2.5 text-gray-300"><Undo size={18} /></button>
        </div>

        <div className="bg-white rounded-[32px] shadow-lg border border-pink-50 min-h-[250px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 🌸 プレビューセクション */}
      {previewContent && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 px-2 text-pink-300">
            <Eye size={16} />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Customer View Preview</h2>
          </div>
          
          <div className="bg-white rounded-[40px] p-6 shadow-xl border-4 border-pink-50 relative overflow-hidden">
            {/* 店舗サイトの雰囲気を再現する装飾 */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-200 to-pink-200" />
            
            <article 
              className="prose prose-pink max-w-none font-bold text-slate-700 prose-img:rounded-3xl prose-img:shadow-lg prose-img:mx-auto"
              dangerouslySetInnerHTML={{ __html: previewContent }} 
            />
          </div>
        </div>
      )}

      <button onClick={handleSubmit} disabled={isSubmitting || !previewContent} className="w-full py-5 rounded-[24px] bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-pink-200">
        {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <><span>公開する ✨</span><Send size={20} /></>}
      </button>
    </section>
  );
}