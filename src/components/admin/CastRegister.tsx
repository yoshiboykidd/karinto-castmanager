'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { createCast } from '@/app/(admin)/admin/actions';
import { UserPlus, RefreshCw, Hash, User } from 'lucide-react';

// 📍 1. 呼び出し側の page.tsx と一致する型定義を作成
interface CastRegisterProps {
  role: string;
  myShopId: string | null;
  targetShopId: string;
  onSuccess: () => void;
}

export default function CastRegister({ role, myShopId, targetShopId, onSuccess }: CastRegisterProps) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [newCastName, setNewCastName] = useState('');
  const [newCastNumber, setNewCastNumber] = useState(''); // 下5桁（00001形式）
  const [isProcessing, setIsProcessing] = useState(false);
  const [registerStatus, setRegisterStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // 📍 店長なら自店舗、開発者なら選択中の店舗を優先
  const activeShopId = role === 'developer' ? targetShopId : (myShopId || '');

  // 📍 自動で「次の5桁番号」を計算してセットする
  useEffect(() => {
    async function calculateNextNumber() {
      if (!activeShopId || activeShopId === 'all') return;

      const { data } = await supabase
        .from('cast_members')
        .select('login_id')
        .eq('home_shop_id', activeShopId)
        .order('login_id', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        // 8桁の末尾5桁を数値化して+1
        const lastFullId = data[0].login_id;
        const lastPersonalNum = parseInt(lastFullId.slice(-5));
        setNewCastNumber(String(lastPersonalNum + 1).padStart(5, '0'));
      } else {
        setNewCastNumber('00001'); // 最初の1人目
      }
    }
    calculateNextNumber();
  }, [activeShopId, supabase]);

  const handleRegisterCast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeShopId === 'all' || !newCastNumber) return;

    setIsProcessing(true);
    setRegisterStatus(null);

    const formData = new FormData();
    formData.append('display_name', newCastName);
    formData.append('personal_number', newCastNumber); // 5桁を送信（action側で合体想定）
    formData.append('home_shop_id', activeShopId);

    const result = await createCast(formData);

    if (result.error) {
      setRegisterStatus({ msg: result.error, type: 'error' });
    } else if (result.success) {
      setRegisterStatus({ msg: `登録完了！\nID: ${activeShopId}${newCastNumber}\nPW: 0000`, type: 'success' });
      setNewCastName('');
      // 成功後に親のリストを更新
      setTimeout(() => onSuccess(), 1500);
    }
    setIsProcessing(false);
  };

  return (
    <section className="p-6 rounded-[30px] shadow-xl bg-white border-2 border-pink-100 relative overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-purple-300"></div>
      
      <h2 className="text-sm font-black text-pink-500 mb-6 flex items-center">
        <span className="mr-2 text-lg">👩🏻‍💼</span> キャスト新規登録
      </h2>

      <form onSubmit={handleRegisterCast} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">個人番号 (5桁)</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300" size={14} />
              <input
                type="text"
                value={newCastNumber}
                onChange={(e) => setNewCastNumber(e.target.value)}
                className="w-full bg-pink-50 border border-pink-100 rounded-xl pl-9 pr-3 py-3 text-sm font-black text-pink-600 focus:outline-none font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">表示名 (源氏名)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
              <input
                type="text"
                value={newCastName}
                onChange={(e) => setNewCastName(e.target.value)}
                placeholder="例: はな"
                className="w-full bg-pink-50 border border-pink-100 rounded-xl pl-9 pr-3 py-3 text-sm font-black text-gray-700 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* 8桁プレビュー表示 */}
        <div className="bg-gray-900 rounded-2xl p-4 text-center shadow-inner">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Login ID Preview</p>
          <p className="text-white font-mono font-black text-2xl tracking-tighter">
            {activeShopId}<span className="text-pink-500">{newCastNumber || '-----'}</span>
          </p>
          <p className="text-[9px] text-gray-400 mt-2 font-bold italic">初期パスワードは「0000」で作成されます</p>
        </div>

        <button
          type="submit"
          disabled={isProcessing || activeShopId === 'all'}
          className="w-full bg-gray-800 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 text-xs flex justify-center items-center gap-2"
        >
          {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'この内容で登録を確定 ⚡️'}
        </button>

        {registerStatus && (
          <div className={`text-xs font-bold p-4 rounded-xl mt-2 whitespace-pre-line leading-relaxed border ${
            registerStatus.type === 'success' 
            ? 'bg-green-50 text-green-600 border-green-100' 
            : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {registerStatus.msg}
          </div>
        )}
      </form>
    </section>
  );
}