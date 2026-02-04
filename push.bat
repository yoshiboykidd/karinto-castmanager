@echo off
chcp 65001 > nul

echo [1/3] ファイルを保存中...
git add .

echo [2/3] コミット中...
git commit -m "fix: specific date UI and junction path deployment"

echo [3/3] Vercelへデプロイ中...
:: --confirm を --yes に変更し、トークンを直接流し込みます。
:: トークンの前後に " " (ダブルクォーテーション) をつけることで 'js' エラーを確実に防ぎます。
npx vercel --prod --yes --token "ft2H1u3JFi1rtE856gt1aLki"

echo ---------------------------------------
echo 🎉 デプロイ完了しました！
pause