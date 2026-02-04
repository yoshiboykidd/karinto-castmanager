import { useState, useCallback } from 'react';
import { format } from 'date-fns';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1467395577829523487/oQUEYdVA4oSbkAb53WYNMCnVIiOa0Tsi25WRPVWDtxF2UsnJFGrsU_gb-qG37gdyTQaQ";

export function useRequestManager(
  supabase: any, 
  profile: any, 
  shifts: any[] = [], // デフォルト値を空配列にして find() でのクラッシュを防ぐ
  selectedMulti: Date[] = [], 
  refreshData: () => void, 
  resetSelection: () => void
) {
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});

  const handleBulkSubmit = useCallback(async () => {
    // profile または shifts が揃っていない場合は実行させない
    if (!profile || !profile.login_id || !Array.isArray(shifts) || selectedMulti.length === 0) {
      alert('申請するデータが正しく読み込まれていません。');
      return;
    }
    
    try {
      const requests = selectedMulti.map(date => {
        // date が有効な Date オブジェクトか念のためチェック
        if (!(date instanceof Date) || isNaN(date.getTime())) return null;

        const key = format(date, 'yyyy-MM-dd');
        // shifts が null の場合でも find() がエラーにならないようガード
        const existing = (shifts || []).find(s => s.shift_date === key);

        return {
          login_id: profile.login_id,
          hp_display_name: profile.display_name || 'キャスト',
          shift_date: key,
          start_time: requestDetails[key]?.s || '11:00',
          end_time: requestDetails[key]?.e || '23:00',
          status: 'requested',
          is_official: false,
          // すでに確定(official)していたデータがあればフラグを立てる
          is_official_pre_exist: existing?.is_official_pre_exist || existing?.status === 'official' || false
        };
      }).filter(r => r !== null); // 無効なデータを除去

      if (requests.length === 0) return;

      const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
      
      if (!error) {
        // Discord通知
        fetch(DISCORD_WEBHOOK_URL, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `🔔 シフト申請: **${profile.display_name}** (${requests.length}件)` }) 
        }).catch(err => console.error("Webhook Error:", err));
        
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