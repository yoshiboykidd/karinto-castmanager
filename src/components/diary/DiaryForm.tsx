'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client'; // [cite: 2026-02-20]
import { Send, X, Loader2, ImagePlus, Sparkles, RefreshCw } from 'lucide-react';

interface DiaryFormProps {
  castProfile: any;
  onPostSuccess: () => void;
  editingPost?: any;
  onCancelEdit?: () => void;
}

export default function DiaryForm({ castProfile, onPostSuccess, editingPost, onCancelEdit }: DiaryFormProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content);
      setPreviewUrl(editingPost.image_url);
      setImageFile(null);
    } else {
      setContent('');
      setPreviewUrl(null);
      setImageFile(null);
    }
  }, [editingPost]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- 圧縮ロジック [cite: 2026-02-21] ---
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        const maxSide = 1200;
        if (width > height) { if (width > maxSide) { height *= maxSide / width; width = maxSide; } }
        else { if (height > maxSide) { width *= maxSide / height; height = maxSide; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            setImageFile(compressedFile);
            setPreviewUrl(URL.createObjectURL(compressedFile));
          }
        }, 'image/jpeg', 0.7);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || (!imageFile && !editingPost) || !castProfile) return;

    // 📍 投稿開始時にフォーカスを外してキーボードを閉じる（ズーム対策）
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = editingPost?.image_url || '';

      if (imageFile) {
        const fileName = `${castProfile.login_id}_${Date.now()}.jpg`;
        const filePath = `${castProfile.login_id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('diary-photos').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('diary-photos').getPublicUrl(filePath);

        if (editingPost?.image_url) {
          const oldPath = editingPost.image_url.split('diary-photos/')[1];
          if (oldPath) await supabase.storage.from('diary-photos').remove([oldPath]);
        }
        finalImageUrl = publicUrl;
      }

      if (editingPost) {
        const { error } = await supabase.from('diary_posts').update({ content: content.trim(), image_url: finalImageUrl }).eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('diary_posts').insert([{
          cast_id: castProfile.login_id, cast_name: castProfile.display_name,
          content: content.trim(), image_url: finalImageUrl, shop_id: castProfile.home_shop_id,
        }]);
        if (error) throw error;
      }

      // 📍 フォームの完全リセット
      setContent('');
      setImageFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      alert(editingPost ? '修正が完了しました！✨' : '日記を公開しました！✨');
      onPostSuccess();
    } catch (err: any) {
      alert('エラー: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 overflow-x-hidden"> {/* 📍 横はみ出し防止 */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-pink-400" />
          <h2 className="text-xs font-black text-pink-400 uppercase tracking-[0.2em]">{editingPost ? 'Edit Post' : 'New Post'}</h2>
        </div>
        {editingPost && <button type="button" onClick={onCancelEdit} className="text-[10px] font-black text-gray-400 underline underline-offset-4">キャンセル</button>}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        {/* 画像プレビュー */}
        <div className="relative" onClick={() => !previewUrl && fileInputRef.current?.click()}>
          {previewUrl ? (
            <div className="relative aspect-[4/5] w-full rounded-[40px] overflow-hidden shadow-xl border-4 border-white">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreviewUrl(null); }} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full active:scale-90"><X size={20} /></button>
              <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="absolute bottom-4 right-4 bg-pink-500 text-white p-3 rounded-full shadow-lg active:scale-90"><RefreshCw size={20} /></button>
            </div>
          ) : (
            <div className="aspect-[4/5] w-full rounded-[40px] border-4 border-dashed border-pink-200 bg-white flex flex-col items-center justify-center gap-3 text-pink-300">
              <ImagePlus size={32} />
              <p className="font-black text-sm uppercase tracking-widest">Select Photo</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>

        {/* テキスト入力：iOSのズームを防ぐため text-[16px] を指定 [cite: 2026-01-29] */}
        <div className="bg-white rounded-[32px] p-6 shadow-lg shadow-pink-200/10 border border-pink-50">
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="メッセージを書いてね 🌸" 
            className="w-full h-24 bg-transparent text-gray-700 font-bold outline-none resize-none text-[16px]" 
            maxLength={200} 
          />
          <div className="flex justify-end text-[10px] font-black text-pink-200 pt-2 border-t border-pink-50">
            {content.length} / 200
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || !content.trim() || !previewUrl} 
          className={`w-full py-5 rounded-[24px] font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${
            isSubmitting || !content.trim() || !previewUrl 
              ? 'bg-gray-100 text-gray-400' 
              : 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-pink-200'
          }`}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (
            <><span>{editingPost ? '日記を更新する ✨' : '日記をアップする ✨'}</span><Send size={20} /></>
          )}
        </button>
      </form>
    </section>
  );
}