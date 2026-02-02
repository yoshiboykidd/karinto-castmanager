@echo off
set COMPUTERNAME=Karinto-PC
git add .
git commit -m "update"
git push
:: これだけで、GitHubが勝手にVercelに伝えてくれます