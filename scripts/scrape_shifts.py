import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client
import re
from datetime import datetime, timedelta

# GitHub Secretsから環境変数を読み込む
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BASE_URL = "https://ikekari.com/attend.php"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_sync():
    for i in range(7):
        target_date = (datetime.now() + timedelta(days=i)).strftime("%Y/%m/%d")
        url = f"{BASE_URL}?date_get={target_date}"
        
        response = requests.get(url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.find_all('li')

        for item in items:
            name_tag = item.find('h3')
            if not name_tag: continue
            
            raw_name = name_tag.get_text()
            hp_name = re.sub(r'（\d+）', '', raw_name).strip()

            time_match = re.search(r'(\d{2}:\d{2})-(\d{2}:\d{2})', item.get_text())
            if not time_match: continue
            
            start_time = time_match.group(1)
            end_time = time_match.group(2)

            res = supabase.table("cast_members").select("login_id").eq("hp_display_name", hp_name).execute()
            
            if res.data:
                login_id = res.data[0]['login_id']
                data = {
                    "login_id": login_id,
                    "hp_display_name": hp_name,
                    "shift_date": target_date.replace("/", "-"),
                    "start_time": start_time,
                    "end_time": end_time
                }
                supabase.table("shifts").upsert(data).execute()
                print(f"Synced: {hp_name}")

if __name__ == "__main__":
    scrape_and_sync()
