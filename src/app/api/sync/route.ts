import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. 環境変数の確認
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // キーの末尾5文字だけ表示（セキュリティのため）
    const keyStatus = key ? `あり (末尾: ...${key.slice(-5)})` : '❌ なし (これが原因です)';
    const urlStatus = url ? `あり (...${url.slice(-10)})` : '❌ なし';

    if (!key) {
      return NextResponse.json({ 
        status: 'FATAL', 
        message: 'Vercelに SUPABASE_SERVICE_ROLE_KEY が設定されていません！これがないと書き込めません。',
        env_check: { url: urlStatus, key: keyStatus }
      });
    }

    // 2. DB接続＆書き込みテスト
    const supabase = createClient(url!, key!);
    const testDate = '2099-01-01'; // 未来の日付でテスト

    // テストデータを1件入れる
    const { data, error } = await supabase
      .from('shifts')
      .upsert({ 
        login_id: 'TEST_00000', 
        shift_date: testDate, 
        hp_display_name: '診断テスト太郎',
        status: 'test'
      }, { onConflict: 'login_id, shift_date' })
      .select();

    if (error) {
      return NextResponse.json({ 
        status: 'DB_ERROR', 
        message: 'DBには繋がりましたが、書き込みに失敗しました。',
        error_details: error.message 
      });
    }

    return NextResponse.json({ 
      status: 'SUCCESS', 
      message: '✅ 正常です。DBに書き込めました。',
      inserted_data: data,
      env_check: { url: urlStatus, key: keyStatus }
    });

  } catch (e: any) {
    return NextResponse.json({ status: 'CRASH', error: e.message });
  }
}