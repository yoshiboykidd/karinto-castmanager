import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client
import re
from datetime import datetime, timedelta, timezone

# --- 設定エリア ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BASE_URL = "https://ikekari.com/attend.php"
JST = timezone(timedelta(hours=9)) # 日本時間

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_sync():
    print(f"🚀 同期開始: {datetime.now(JST)}")
    
    for i in range(7):
        target_date_obj = datetime.now(JST) + timedelta(days=i)
        target_date_str = target_date_obj.strftime("%Y/%m/%d")
        db_date_str = target_date_obj.strftime("%Y-%m-%d")
        
        url = f"{BASE_URL}?date_get={target_date_str}"
        response = requests.get(url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for item in soup.find_all('li'):
            name_tag = item.find('h3')
            if not name_tag: continue
            
            hp_name = re.sub(r'（\d+）', '', name_tag.get_text()).strip()
            time_match = re.search(r'(\d{2}:\d{2})-(\d{2}:\d{2})', item.get_text())
            if not time_match: continue
            
            # 1. キャスト名から ID を取得
            res = supabase.table("cast_members").select("login_id").eq("hp_display_name", hp_name).execute()
            
            if res.data:
                login_id = res.data[0]['login_id']
                
                # 2. 【重要】現在のDBの状態を確認
                # 申請中(requested)かどうか、現在のフラグの状態を取得します
                existing_shift = supabase.table("shifts") \
                    .select("status, is_official") \
                    .eq("login_id", login_id) \
                    .eq("shift_date", db_date_str) \
                    .execute()

                # 基本となるデータ（HPに存在するので pre_exist は常に True）
                data = {
                    "login_id": login_id,
                    "hp_display_name": hp_name,
                    "shift_date": db_date_str,
                    "is_official_pre_exist": True  # 公式HPに枠が存在することの証明
                }

                # 3. 三すくみロジックによる上書き判定
                # すでにDBにデータがあり、かつステータスが 'requested'（申請中）の場合
                if existing_shift.data and existing_shift.data[0].get('status') == 'requested':
                    print(f"  ⚠️ {hp_name} ({db_date_str}) は申請中のため、時間は上書きせず pre_exist のみ更新します")
                    # data には start_time, end_time, status, is_official を含めない（現在の申請値を保護）
                else:
                    # 新規データ、または既存データが 'official' の場合は、HPの内容で更新
                    data.update({
                        "start_time": time_match.group(1),
                        "end_time": time_match.group(2),
                        "status": "official",
                        "is_official": True
                    })

                # 4. Upsert 実行 (on_conflict で ID と日付が一致する行を対象にする)
                supabase.table("shifts").upsert(data, on_conflict="login_id,shift_date").execute()
                print(f"  ✅ {hp_name} ({db_date_str}) 同期完了")

if __name__ == "__main__":
    scrape_and_sync()