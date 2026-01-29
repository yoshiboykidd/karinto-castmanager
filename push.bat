@echo off
echo 🌸 Karinto Manager を更新中...

:: 1. 変更をすべて追加
git add .

:: 2. 自動で日記（コミットメッセージ）を書く（日時のメモ付き）
git commit -m "Auto update: %date% %time%"

:: 3. GitHubへ送信
git push origin main

echo.
echo ✅ 更新が完了しました！Vercelの反映を待ってください🌸
pause