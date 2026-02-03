import { useState, useEffect } from 'react';
import { format, startOfToday, isAfter } from 'date-fns';

export function useAchievement(supabase: any, profile: any, shifts: any[], selectedSingle: Date | undefined, refreshData: () => void) {
  // 実績入力用の状態
  const [editReward, setEditReward] = useState({ f: '', first: '', main: '', amount: '' });

  // 選択された日付が変わったら、入力フォームの中身を同期する
  useEffect(() => {
    if (!selectedSingle) return;
    const dateStr = format(selectedSingle, 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    
    setEditReward({ 
      f: String(shift?.f_count || ''), 
      first: String(shift?.first_request_count || ''), 
      main: String(shift?.main_request_count || ''), 
      amount: String(shift?.reward_amount || '') 
    });
  }, [selectedSingle, shifts]);

  // 実績保存ロジック（HP情報が絶対）
  const handleSaveAchievement = async () => {
    if (!selectedSingle || !profile) return;
    const dateStr = format(selectedSingle, 'yyyy-MM-dd');
    const selectedShift = shifts.find(s => s.shift_date === dateStr);

    if (!selectedShift || selectedShift.start_time === 'OFF') {
      alert('HPにシフトがない日は実績を入力できません');
      return;
    }

    const { error } = await supabase.from('shifts').update({ 
      f_count: Number(editReward.f) || 0, 
      first_request_count: Number(editReward.first) || 0, 
      main_request_count: Number(editReward.main) || 0, 
      reward_amount: Number(editReward.amount) || 0,
      is_official: true 
    }).eq('login_id', profile.login_id).eq('shift_date', dateStr);
    
    if (!error) { 
      refreshData(); 
      alert('実績を保存しました💰'); 
    }
  };

  // その日が編集可能かどうかの判定
  const today = startOfToday();
  const selectedShift = selectedSingle ? shifts.find(s => s.shift_date === format(selectedSingle, 'yyyy-MM-dd')) : null;
  const isEditable = selectedSingle && 
                     !isAfter(selectedSingle, today) && 
                     selectedShift && 
                     selectedShift.start_time && 
                     selectedShift.start_time !== 'OFF';

  return { editReward, setEditReward, handleSaveAchievement, isEditable, selectedShift };
}