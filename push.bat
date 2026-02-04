@echo off
:: [重要] さっき作ったトークン（vcl_...）をここに貼り付けてください
SET VERCEL_TOKEN=ft2H1u3JFi1rtE856gt1aLki

echo [1/3] ファイルを保存中...
git add .
echo [2/3] コミット中...
git commit -m "fix: bypass header error with token"

echo [3/3] Vercelへデプロイ中 (トークン認証)...
:: トークンを環境変数にセットした状態で実行すると、ログイン処理をスキップできます
npx vercel --prod --yes --token %VERCEL_TOKEN%

echo ---------------------------------------
echo 🎉 デプロイ完了しました！
pause