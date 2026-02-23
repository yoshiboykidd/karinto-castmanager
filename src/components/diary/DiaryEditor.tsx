'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ImageIcon, Bold, List, Send, Loader2, Sparkles, Undo, Redo, Eye, X, PenLine } from 'lucide-react';

export default function DiaryEditor({ castProfile, onPostSuccess, editingPost, onCancelEdit }: any) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [title, setTitle] = useState(''); // 📍 タイトルの状態管理

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
      setPreviewContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-pink focus:outline-none min-h-[400px] p-6 text-[16px] font-bold leading-relaxed [&_p]:min-h-[1.5em]',
      },
    },
  });

  useEffect(() => {
    if (editingPost && editor) {
      editor.commands.setContent(editingPost.content);
      setPreviewContent(editingPost.content);
      setTitle(editingPost.title || ''); // 📍 編集時は既存タイトルをセット
    }
  }, [editingPost, editor]);

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const img = document.createElement('img');
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSide = 1200;

          if (width > height) {
            if (width > maxSide) { height *= maxSide / width; width = maxSide; }
          } else {
            if (height > maxSide) { width *= maxSide / height; height = maxSide; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              const fileName = `${castProfile.login_id}/${Date.now()}.jpg`;
              
              const { data, error } = await supabase.storage
                .from('diary-photos')
                .upload(fileName, compressedFile);
              
              if (data) {
                const { data: { publicUrl } } = supabase.storage
                  .from('diary-photos')
                  .getPublicUrl(data.path);
                
                editor?.chain().focus().setImage({ src: publicUrl }).run();
              }
              if (error) alert("アップロード失敗: " + error.message);
            }
            setIsUploading(false);
          }, 'image/jpeg', 0.6);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleFinalSubmit = async () => {
    if (!editor || isSubmitting) return;
    const htmlContent = editor.getHTML();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const firstImage = doc.querySelector('img');
    const firstImageUrl = firstImage ? firstImage.getAttribute('src') : null;

    setIsSubmitting(true);
    try {
      if (editingPost) {
        await supabase.from('diary_posts').update({ 
          title: title, // 📍 追加
          content: htmlContent, 
          image_url: firstImageUrl 
        }).eq('id', editingPost.id);
      } else {
        await supabase.from('diary_posts').insert([{
          cast_id: castProfile.login_id,
          cast_name: castProfile.display_name,
          title: title, // 📍 追加
          content: htmlContent,
          image_url: firstImageUrl,
          shop_id: castProfile.home_shop_id,
        }]);
      }
      setIsPreviewOpen(false);
      editor.commands.setContent('');
      setTitle(''); // 📍 タイトルをリセット
      onPostSuccess();
    } catch (err: any) {
      alert('エラー: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* ツールバー */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-pink-100 shadow-sm sticky top-[72px] z-20 transition-all">
        <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-2.5 rounded-xl transition-all ${editor?.isActive('bold') ? 'bg-pink-500 text-white' : 'text-pink-300'}`}><Bold size={18} /></button>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-2.5 rounded-xl transition-all ${editor?.isActive('bulletList') ? 'bg-pink-500 text-white' : 'text-pink-300'}`}><List size={18} /></button>
        
        <button 
          onClick={addImage} 
          disabled={isUploading}
          className={`p-2.5 rounded-xl transition-all flex items-center gap-1 ${isUploading ? 'bg-gray-50 text-gray-300' : 'text-pink-400 bg-pink-50'}`}
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
        </button>

        <div className="flex-1" />
        <button onClick={() => editor?.chain().focus().undo().run()} className="p-2.5 text-gray-300"><Undo size={18} /></button>
        <button onClick={() => editor?.chain().focus().redo().run()} className="p-2.5 text-gray-300"><Redo size={18} /></button>
      </div>

      {/* 📍 タイトル入力欄 (デザイン調整: 清潔感のある白背景にサクラピンクのアクセント) [cite: 2026-01-29] */}
      <div className="bg-white rounded-[24px] shadow-sm border border-pink-100 p-4 transition-all focus-within:border-pink-300">
        <div className="flex items-center gap-3 px-1">
          <PenLine size={18} className="text-pink-300" />
          <input
            type="text"
            placeholder="タイトルを入力（任意）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-lg font-black text-slate-700 placeholder:text-pink-200"
          />
        </div>
      </div>

      {/* エディタ本体 */}
      <div className={`bg-white rounded-[32px] shadow-xl border border-pink-50 transition-all ${isUploading ? 'opacity-60 grayscale-[0.5]' : ''}`}>
        <EditorContent editor={editor} />
      </div>

      <button
        onClick={() => setIsPreviewOpen(true)}
        disabled={editor?.isEmpty || isUploading}
        className="w-full py-5 rounded-[24px] bg-white border-2 border-pink-200 text-pink-500 font-black text-lg shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30"
      >
        <Eye size={20} />
        <span>プレビューで確認する ✨</span>
      </button>

      {/* プレビューモーダル */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FFF5F7] w-full max-w-md max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-pink-100 flex items-center justify-between">
              <h3 className="font-black text-pink-500 flex items-center gap-2"><Eye size={18} /> お客さんへの見え方</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="p-2 text-gray-400"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white mx-4 my-4 rounded-[32px] shadow-inner border border-pink-50">
              {/* 📍 プレビュー内にもタイトルを表示 */}
              {title && <h2 className="text-xl font-black text-pink-600 mb-4">{title}</h2>}
              <article 
                className="prose prose-pink max-w-none font-bold text-slate-700 prose-img:rounded-3xl prose-img:mx-auto [&_p]:min-h-[1.5em]"
                dangerouslySetInnerHTML={{ __html: previewContent }} 
              />
            </div>
            <div className="p-6 bg-white border-t border-pink-100">
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full py-5 rounded-[24px] bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-pink-200"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <><span>この内容で日記を出す ✨</span><Send size={20} /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}