@echo off

git add .

git commit -m "update v2.8.0"

git push

npx vercel --prod --token JBHlJKE6lvunwyiwyXiYokea --org team_LeEOFVqgpSOToSYVJZqqVrIw --project prj_qQnOy6pnoPn8OwUmWqza1fnTFUSb