@echo off

:: --- ここにメモした情報を貼り付けてください ---

set VERCEL_TOKEN=【JBHlJKE6lvunwyiwyXiYokea】

set VERCEL_ORG_ID=【team_LeEOFVqgpSOToSYVJZqqVrIw】

set VERCEL_PROJECT_ID=【prj_qQnOy6pnoPn8OwUmWqza1fnTFUSb】

:: --------------------------------------------



:: Node.jsの「日本語PC名エラー」を回避するために、一時的に英語名を名乗る

set COMPUTERNAME=Karinto-PC



echo 🚀 Git Pushを開始します...

git add .

git commit -m "fix header and UI v2.8.0"

git push



echo 🚀 Vercelへの本番デプロイを開始します...

npx vercel --prod