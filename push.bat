@echo off
:: 文字化け対策（UTF-8に変更）
chcp 65001 > nul

:: [重要] トークンをここに貼り付け
SET VERCEL_TOKEN=ft2H1u3JFi1rtE856gt1aLki

echo [1/3] ファイルを保存中...
git add .

echo [2/3] コミット中...
git commit -m "fix: specific date UI and junction path deployment"

echo [3/3] Vercelへデプロイ中 (ディレクトリを明示)...
:: 「.」を追加することで、単一ファイルではなく「このフォルダ全体」であることをCLIに教えます
npx vercel . --prod --yes --token %VERCEL_TOKEN%

echo ---------------------------------------
echo 🎉 すべて完了しました！
echo karinto-castmanager.vercel.app を確認してください。
pause