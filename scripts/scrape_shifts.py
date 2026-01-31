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
            
            # 名簿からIDを取得
            res = supabase.table("cast_members").select("login_id").eq("hp_display_name", hp_name).execute()
            
            if res.data:
                login_id = res.data[0]['login_id']
                # ここが重要：on_conflict="login_id,shift_date" を必ず含める
                data = {
                    "login_id": login_id,
                    "hp_display_name": hp_name,
                    "shift_date": db_date_str,
                    "start_time": time_match.group(1),
                    "end_time": time_match.group(2)
                }
                supabase.table("shifts").upsert(data, on_conflict="login_id,shift_date").execute()
                print(f"  ✅ {hp_name} ({db_date_str}) 同期完了")

if __name__ == "__main__":
    scrape_and_sync()
