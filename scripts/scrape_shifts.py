import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client
import re
from datetime import datetime, timedelta, timezone

# --- 1. 設定エリア ---
# GitHub Secretsから環境変数を読み込む
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BASE_URL = "https://ikekari.com/attend.php"

# 日本時間(JST)の設定
JST = timezone(timedelta(hours=9))

# Supabaseクライアントの初期化
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_sync():
    print(f"🚀 シフト同期ジョブを開始しました (実行時刻: {datetime.now(JST).strftime('%Y-%m-%d %H:%M:%S')} JST)")
    
    # 本日から7日分（1週間）のシフトを巡回
    for i in range(7):
        target_date_obj = datetime.now(JST) + timedelta(days=i)
        target_date_str = target_date_obj.strftime("%Y/%m/%d") # URL用
        db_date_str = target_date_obj.strftime("%Y-%m-%d")    # DB登録用
        
        url = f"{BASE_URL}?date_get={target_date_str}"
        print(f"--- {target_date_str} の情報を取得中 ---")
        
        try:
            response = requests.get(url, timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 各キャストの情報を抽出
            items = soup.find_all('li')
            
            for item in items:
                name_tag = item.find('h3')
                if not name_tag: continue
                
                # 名前のクレンジング（「名前（年齢）」→「名前」）
                raw_name = name_tag.get_text()
                hp_name = re.sub(r'（\d+）', '', raw_name).strip()

                # 出勤時間の抽出（例: 20:00-05:00）
                time_match = re.search(r'(\d{2}:\d{2})-(\d{2}:\d{2})', item.get_text())
                if not time_match: continue
                
                start_time = time_match.group(1)
                end_time = time_match.group(2)

                # Supabaseの名簿(cast_members)からIDを検索
                res = supabase.table("cast_members").select("login_id").eq("hp_display_name", hp_name).execute()
                
                if res.data:
                    login_id = res.data[0]['login_id']
                    
                    shift_data = {
                        "login_id": login_id,
                        "hp_display_name": hp_name,
                        "shift_date": db_date_str,
                        "start_time": start_time,
                        "end_time": end_time
                    }
                    
                    # 【重要】on_conflict を指定して、既存データがあれば更新(Upsert)する
                    supabase.table("shifts").upsert(
                        shift_data, 
                        on_conflict="login_id,shift_date"
                    ).execute()
                    
                    print(f"  ✅ {hp_name} ({login_id}): {start_time} - {end_time}")
                else:
                    # 名簿にいないキャストはスキップ
                    pass
                    
        except Exception as e:
            print(f"  ❌ {target_date_str} の処理中にエラー: {e}")

if __name__ == "__main__":
    scrape_and_sync()
