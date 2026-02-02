@echo off

:: --- ここにメモした情報を貼り付けてください（カッコは絶対に入れない） ---

set VERCEL_TOKEN=JANyr7PMAkWuYqsUycbHuGNN

set VERCEL_ORG_ID=team_LeEOFVqgpSOToSYVJZqqVrIw

set VERCEL_PROJECT_ID=prj_qQnOy6pnoPn8OwUmWqza1fnTFUSb

:: --------------------------------------------



:: Node.js v24の潔癖症（日本語PC名エラー）を回避する魔法の1行

set COMPUTERNAME=Karinto-PC



echo 🚀 1/2: GitHubへプッシュ中...

git add .

git commit -m "update v2.8.0"

git push



echo 🚀 2/2: Vercel本番デプロイ中...

:: ログイン処理を介さず、トークンとIDで直接住所を叩く

npx vercel --prod --token %VERCEL_TOKEN% --scope %VERCEL_ORG_ID%

