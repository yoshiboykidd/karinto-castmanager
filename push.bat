@echo off
chcp 65001 > nul

git add .
git commit -m "fix: specific date UI and junction path deployment"

npx vercel --prod --yes --token "ft2H1u3JFi1rtE856gt1aLki"
pause