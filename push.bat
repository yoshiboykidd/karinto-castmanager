@echo off
chcp 65001 > nul

git add .
git commit -m "fix: restore specific date UI and icons"

:: 「deploy」という単語を明示し、さらに 「--cwd .」 でカレントディレクトリを強制指定します
:: トークンは必ず " " で囲ってください
npx vercel deploy --prod --yes --token "ft2H1u3JFi1rtE856gt1aLki" --cwd .

echo ---------------------------------------
echo 🎉 デプロイが完了しました！
pause