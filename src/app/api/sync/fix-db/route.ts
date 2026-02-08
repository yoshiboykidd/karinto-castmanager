import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 管理者権限（Service Role）でDBを操作
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    log("🚀 DB修復を開始します...");

    // 1. キャスト名簿（cast_members）のIDを全員「8桁（0埋め）」に統一する
    // 例: '600037' -> '00600037'
    const { data: members, error: fetchError } = await supabase
      .from('cast_members')
      .select('id, login_id');

    if (fetchError) throw new Error(`名簿取得エラー: ${fetchError.message}`);

    let fixedCount = 0;
    for (const member of members || []) {
      const currentId = String(member.login_id).trim();
      // すでに8桁なら何もしない
      if (currentId.length === 8 && currentId.startsWith('00')) continue;

      // 8桁に変換
      const newId = currentId.padStart(8, '0');
      
      const { error: updateError } = await supabase
        .from('cast_members')
        .update({ login_id: newId })
        .eq('id', member.id); // UUIDで指定して更新

      if (updateError) {
        log(`❌ ID修正失敗 (${currentId}): ${updateError.message}`);
      } else {
        fixedCount++;
      }
    }
    log(`✅ 名簿IDの修正完了: ${fixedCount}件を8桁にしました。`);

    // 2. シフトテーブルの未来のデータを一旦クリア（ゴミ掃除）
    // これで「きれいなID」を受け入れる準備完了
    const today = new Date().toISOString().split('T')[0];
    const { error: deleteError } = await supabase
      .from('shifts')
      .delete()
      .gte('shift_date', today); // 今日以降を削除

    if (deleteError) {
      log(`⚠️ 未来シフト削除エラー: ${deleteError.message}`);
    } else {
      log(`🧹 未来のシフトを一旦リセットしました（再取得のため）`);
    }

    return NextResponse.json({ success: true, logs });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, logs }, { status: 500 });
  }
}