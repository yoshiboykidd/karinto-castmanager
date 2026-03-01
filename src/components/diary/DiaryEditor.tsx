// @ts-nocheck
/* eslint-disable */
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
// 📍 ここを { } で囲む形式に修正 (Turbopack対策)
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  ImageIcon, Bold, Send, Loader2, Undo, Redo, 
  Eye, X, PenLine, Underline as UnderlineIcon, AlignCenter, AlignLeft, Palette
} from 'lucide-react';

// 文字サイズ拡張の定義
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize,
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

export default function DiaryEditor({ castProfile, onPostSuccess, editingPost }: any) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [title, setTitle] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({ HTMLAttributes: { class: 'rounded-2xl border-4 border-white shadow-lg my-4 mx-auto max-w-full h-auto' } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontSize,
    ],
    content: '',
    onUpdate({ editor }) { setPreviewContent(editor.getHTML()); },
    editorProps: {
      attributes: { class: 'prose prose-pink focus:outline-none min-h-[400px] p-6 text-[16px] font-medium leading-relaxed' },
    },
  });

  useEffect(() => {
    if (editingPost && editor) {
      editor.commands.setContent(editingPost.content);
      setPreviewContent(editingPost.content);
      setTitle(editingPost.title || '');
    }
  }, [editingPost, editor]);

  const handleFinalSubmit = async () => {
    if (!editor || isSubmitting) return;
    const htmlContent = editor.getHTML();
    const firstImg = new DOMParser().parseFromString(htmlContent, 'text/html').querySelector('img')?.getAttribute('src') || null;
    setIsSubmitting(true);
    try {
      const data = { title, content: htmlContent, image_url: firstImg };
      if (editingPost) { await supabase.from('diary_posts').update(data).eq('id', editingPost.id); }
      else { await supabase.from('diary_posts').insert([{ ...data, cast_id: castProfile.login_id, cast_name: castProfile.display_name, shop_id: castProfile.home_shop_id }]); }
      editor.commands.setContent('');
      setTitle('');
      setIsPreviewOpen(false);
      onPostSuccess();
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]; if (!file) return;
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let w = img.width; let h = img.height;
          if (w > 1200) { h *= 1200 / w; w = 1200; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          canvas.toBlob(async (blob) => {
            if (blob) {
              const path = `${castProfile.login_id}/${Date.now()}.jpg`;
              const { data } = await supabase.storage.from('diary-photos').upload(path, blob);
              if (data) {
                const { publicUrl } = supabase.storage.from('diary-photos').getPublicUrl(data.path).data;
                editor?.chain().focus().setImage({ src: publicUrl }).run();
              }
            }
            setIsUploading(false);
          }, 'image/jpeg', 0.6);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  if (!editor) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 p-2 bg-white/95 backdrop-blur-md rounded-[28px] border border-pink-100 shadow-lg sticky top-[72px] z-20 transition-all">
        <div className="flex flex-wrap items-center gap-1">
          <button onClick={() => editor.chain().focus().setFontSize('0.8rem').run()} className="p-2 text-slate-400 font-bold hover:text-pink-500">あ小</button>
          <button onClick={() => editor.chain().focus().unsetFontSize().run()} className="p-2 text-slate-700 font-black hover:text-pink-500">あ</button>
          <button onClick={() => editor.chain().focus().setFontSize('1.5rem').run()} className="p-2 text-slate-800 font-black text-xl hover:text-pink-500">あ大</button>
          <div className="w-[1px] h-6 bg-pink-50 mx-1" />
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2.5 rounded-xl ${editor.isActive('bold') ? 'bg-pink-500 text-white shadow-md' : 'text-pink-300'}`}><Bold size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2.5 rounded-xl ${editor.isActive('underline') ? 'bg-pink-500 text-white shadow-md' : 'text-pink-300'}`}><UnderlineIcon size={18} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2.5 rounded-xl ${editor.isActive({ textAlign: 'center' }) ? 'text-pink-500 bg-pink-50' : 'text-pink-200'}`}><AlignCenter size={18} /></button>
          <div className="flex-1" />
          <button onClick={addImage} disabled={isUploading} className="p-2.5 text-pink-400">{isUploading ? <Loader2 className="animate-spin" /> : <ImageIcon size={18} />}</button>
          <button onClick={() => setShowColorPicker(!showColorPicker)} className={`p-2.5 rounded-xl ${showColorPicker ? 'bg-rose-500 text-white shadow-md' : 'text-rose-400 bg-rose-50'}`}><Palette size={18} /></button>
        </div>
        {showColorPicker && (
          <div className="flex items-center gap-2.5 p-2 bg-white rounded-2xl border border-pink-50 shadow-inner">
            {['#000000', '#ef4444', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'].map(color => (
              <button key={color} onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
            ))}
            <button onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }} className="px-3 py-1 text-xs font-black text-slate-400">消去</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-pink-100 p-4 focus-within:border-pink-300 transition-all">
        <input type="text" placeholder="タイトルを入力（任意）" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-lg font-black text-slate-700 placeholder:text-pink-200" />
      </div>

      <div className="bg-white rounded-[32px] shadow-xl border border-pink-50 min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      <button onClick={() => setIsPreviewOpen(true)} className="w-full py-5 rounded-[24px] bg-white border-2 border-pink-200 text-pink-500 font-black text-lg shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all">
        <Eye size={20} /><span>プレビューで確認する ✨</span>
      </button>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FFF5F7] w-full max-w-md max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-pink-100 flex items-center justify-between">
              <span className="font-black text-pink-500">お客さんへの見え方</span>
              <button onClick={() => setIsPreviewOpen(false)} className="p-2 text-gray-400 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white mx-4 my-4 rounded-[32px] shadow-inner border border-pink-50">
              {title && <h2 className="text-xl font-black text-pink-600 mb-4">{title}</h2>}
              <article className="prose prose-pink max-w-none font-medium text-slate-700 [&_.text-center]:text-center" dangerouslySetInnerHTML={{ __html: previewContent }} />
            </div>
            <div className="p-6 bg-white">
              <button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full py-5 rounded-[24px] bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-xl shadow-lg active:scale-95 transition-all">
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'この内容で日記を出す ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}