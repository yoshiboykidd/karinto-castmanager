#!/bin/bash

echo "---------------------------------------"
echo "🍎 [1/3] ファイルを保存中 (Mac)..."
git add .

echo "🍎 [2/3] コミット中..."
git commit -m "fix: sync hydration guards and specific date UI"

echo "🍎 [3/3] Vercelへ本番デプロイ中..."
# npx を使うことで、環境に依存せず確実に Vercel CLI を実行します
npx vercel --prod --yes

echo "---------------------------------------"
echo "🎉 デプロイ完了！"
echo "karinto-castmanager.vercel.app"