#!/bin/bash

# 引数がなければデフォルトのメッセージを使う
COMMIT_MSG=${1:-"fix: update project"}

echo "---------------------------------------"
echo "🍎 [1/4] ファイルを保存中 (Mac)..."
git add .

echo "🍎 [2/4] コミット中: \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

echo "🍎 [3/4] GitHubへプッシュ中..."
git push origin main

echo "🍎 [4/4] Vercelへ本番デプロイ中..."
npx vercel --prod --yes

echo "---------------------------------------"
echo "🎉 デプロイ完了！"
echo "https://karinto-castmanager.vercel.app"