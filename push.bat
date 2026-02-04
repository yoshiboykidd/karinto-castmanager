@echo off
echo [1/3] ファイルを保存中...
git add .

echo [2/3] コミット中 (修正版の反映)...
git commit -m "fix: restore specific dates, icons, and hydration guards"

echo [3/3] Vercelへ本番デプロイ中...
:: ここで npx を使うことで、Vercel CLIがインストールされていなくても確実に動かします
npx vercel --prod --yes

echo ---------------------------------------
echo 🎉 すべて完了しました！
echo karinto-castmanager.vercel.app を確認してください。
pause