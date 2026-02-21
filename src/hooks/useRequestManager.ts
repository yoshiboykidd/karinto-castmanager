import { useState, useCallback } from 'react';
import { format } from 'date-fns';

// ★修正1: 店舗ごとのWebhook URLリストを作成
// Discordの「サーバー設定」→「連携サービス」→「ウェブフック」で店舗ごとに作成し、URLをコピペしてください
const SHOP_WEBHOOKS: { [key: string]: string } = {
  '001': "https://discord.com/api/webhooks/...", // 神田
  '002': "https://discord.com/api/webhooks/...", // 赤坂
  '003': "https://discord.com/api/webhooks/...", // 秋葉原
  '004': "https://discord.com/api/webhooks/...", // 上野
  '005': "https://discord.com/api/webhooks/...", // 渋谷
  '006': "https://discord.com/api/webhooks/...", // 池西
  '007': "https://discord.com/api/webhooks/...", // 五反田
  '008': "https://discord.com/api/webhooks/...", // 大宮
  '009': "https://discord.com/api/webhooks/...", // 吉祥寺
  '010': "https://discord.com/api/webhooks/...", // 大久保
  '011': "https://discord.com/api/webhooks/...", // 池東
  '012': "https://discord.com/api/webhooks/...", // 小岩
  // URLがない店舗は通知が飛びません
};

// 予備（全店舗共通の通知先がある場合などはここに入れる）
const DEFAULT_WEBHOOK_URL = ""; 

export function useRequestManager(
  supabase: any, 
  profile: any, 
  shifts: any, 
  selectedMulti: Date[] = [], 
  refreshData: () => void, 
  resetSelection: () => void
) {
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});

  const handleBulkSubmit = useCallback(async () => {
    if (!profile || !profile.login_id || !Array.isArray(shifts) || selectedMulti.length === 0) {
      alert('申請するデータが正しく読み込まれていません。');
      return;
    }
    
    try {
      const requests = selectedMulti.map(date => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return null;

        const key = format(date, 'yyyy-MM-dd');
        const safeShifts = Array.isArray(shifts) ? shifts : [];
        const existing = safeShifts.find((s: any) => s.shift_date === key);

        return {
          login_id: profile.login_id,
          hp_display_name: profile.display_name || 'キャスト',
          shift_date: key,
          start_time: requestDetails[key]?.s || '11:00',
          end_time: requestDetails[key]?.e || '23:30',
          status: 'requested',
          is_official: false,
          is_official_pre_exist: existing?.is_official_pre_exist || existing?.status === 'official' || false
        };
      }).filter(r => r !== null);

      if (requests.length === 0) return;

      const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
      
      if (!error) {
        // ★修正2: キャストの所属店舗IDを取得 (home_shop_id または shop_id)
        const shopId = profile.home_shop_id || profile.shop_id;
        
        // ★修正3: その店舗に対応するURLを取得
        const targetUrl = SHOP_WEBHOOKS[shopId] || DEFAULT_WEBHOOK_URL;

        if (targetUrl) {
          fetch(targetUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              content: `🔔 シフト申請 (${shopId}): **${profile.display_name}** (${requests.length}件)` 
            }) 
          }).catch(err => console.error("Webhook Error:", err));
        } else {
          console.warn(`Shop ID ${shopId} のWebhook URLが設定されていません`);
        }
        
        alert('申請を送信しました！🚀');
        resetSelection(); 
        refreshData();    
      } else {
        throw error;
      }
    } catch (err: any) {
      alert('送信に失敗しました。');
      console.error("Submit Error:", err);
    }
  }, [profile, shifts, selectedMulti, requestDetails, supabase, refreshData, resetSelection]);

  return { requestDetails, setRequestDetails, handleBulkSubmit };
}