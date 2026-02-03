import { useState } from 'react';
import { format } from 'date-fns';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1467395577829523487/oQUEYdVA4oSbkAb53WYNMCnVIiOa0Tsi25WRPVWDtxF2UsnJFGrsU_gb-qG37gdyTQaQ";

export function useRequestManager(
  supabase: any, 
  profile: any, 
  shifts: any[], 
  selectedMulti: Date[], 
  refreshData: () => void, 
  resetSelection: () => void
) {
  // 申請する各日付の時間設定を管理
  const [requestDetails, setRequestDetails] = useState<{[key: string]: {s: string, e: string}}>({});

  const handleBulkSubmit = async () => {
    if (!profile || selectedMulti.length === 0) return;
    
    const requests = selectedMulti.map(date => {
      const key = format(date, 'yyyy-MM-dd');
      const existing = shifts.find(s => s.shift_date === key);
      return {
        login_id: profile.login_id,
        hp_display_name: profile.display_name || 'キャスト',
        shift_date: key,
        start_time: requestDetails[key]?.s || '11:00',
        end_time: requestDetails[key]?.e || '23:00',
        status: 'requested', // スクレイパーによる上書きを阻止する重要フラグ
        is_official: false,
        is_official_pre_exist: existing?.is_official_pre_exist || existing?.status === 'official'
      };
    });

    const { error } = await supabase.from('shifts').upsert(requests, { onConflict: 'login_id,shift_date' });
    
    if (!error) {
      // Discord通知（非同期でOK）
      fetch(DISCORD_WEBHOOK_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `🔔 シフト申請: **${profile.display_name}** (${requests.length}件)` }) 
      }).catch(err => console.error("Webhook Error:", err));
      
      alert('申請を送信しました！🚀');
      resetSelection(); // 選択をクリア
      refreshData();    // 最新データを再取得
    } else {
      alert('送信に失敗しました。');
      console.error(error);
    }
  };

  return { requestDetails, setRequestDetails, handleBulkSubmit };
}