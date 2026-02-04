@echo off
chcp 65001 > nul

:: [重要] トークンをここに貼り付け
SET VERCEL_TOKEN=ft2H1u3JFi1rtE856gt1aLki

echo [1/3] ファイルを保存中...
git add .

echo [2/3] コミット中...
git commit -m "fix: restore specific date UI and icons"

echo [3/3] Vercelへ本番デプロイ中...
:: 「.」を消しました。これで「ディレクトリ全体」として認識させます
:: さらに --confirm を追加して、Node.js v24 の不安定な挙動を抑え込みます
npx vercel --prod --yes --token %VERCEL_TOKEN% --confirm

echo ---------------------------------------
echo 🎉 デプロイ完了しました！
pause