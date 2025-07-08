#!/bin/bash

# 1. Первый коммит: Настройка проекта (начало июня)
commit_date="2025-06-10T11:20:00"
git add package.json package-lock.json tsconfig.json vite.config.ts
GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" \
git commit -m "chore: initial project setup with vite and tailwind"

# 2. Второй коммит: Базовая верстка и стили (середина июня)
commit_date="2025-06-22T15:45:00"
git add index.html src/index.css
GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" \
git commit -m "style: add global styles and ink theme colors"

# 3. Третий коммит: Логика игры (конец июня)
commit_date="2025-06-30T09:10:00"
git add src/App.tsx
GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" \
git commit -m "feat: implement core game logic and movement"

# 4. Четвертый коммит: Коннект кошелька (начало июля)
commit_date="2025-07-05T14:30:00"
git add src/main.tsx
GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" \
git commit -m "feat: integrate wagmi/viem for wallet connection"

# 5. Финальный коммит: Полировка перед релизом (8 июля)
commit_date="2025-07-08T22:00:00"
git add .
GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" \
git commit -m "build: final touches and balance tweaks"