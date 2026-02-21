@echo off
chcp 65001 > nul

git add .
git commit -m "fix: restore specific date UI"

npx vercel --prod --yes --token "ft2H1u3JFi1rtE856gt1aLki"

pause