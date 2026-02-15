#!/bin/bash

echo "🚀 Запуск CRM..."

# 1. Docker (PostgreSQL, Redis, MinIO)
echo "📦 Docker..."
cd ~/crm
docker compose up -d

# Ждём пока базы будут ready
echo "⏳ Ожидание PostgreSQL..."
until docker exec crm-postgres pg_isready -U crm_user -d crm_db > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL готов"

# 2. Backend (порт 3001)
echo "⚙️ Backend..."
cd ~/crm/backend
npm run start:dev > ~/crm/logs/backend.log 2>&1 &
echo $! > ~/crm/logs/backend.pid

until curl -s http://localhost:3001 > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Backend — http://localhost:3001"

# 3. Frontend (порт 3000)
echo "🎨 Frontend..."
cd ~/crm/frontend
npm run dev > ~/crm/logs/frontend.log 2>&1 &
echo $! > ~/crm/logs/frontend.pid

sleep 3
echo "✅ Frontend — http://localhost:3000"

# 4. Prisma Studio (порт 5555)
echo "🗄️ Prisma Studio..."
cd ~/crm/backend
npx prisma studio --port 5555 > ~/crm/logs/prisma-studio.log 2>&1 &
echo $! > ~/crm/logs/prisma-studio.pid

sleep 2
echo "✅ Prisma Studio — http://localhost:5555"

echo ""
echo "🟢 CRM запущена!"
echo ""
echo "   🎨 Frontend:       http://localhost:3000"
echo "   ⚙️  Backend API:    http://localhost:3001"
echo "   🗄️  Prisma Studio:  http://localhost:5555"
echo "   📁 MinIO Console:  http://localhost:9001"
echo ""
echo "Логи: tail -f ~/crm/logs/backend.log"
echo "Остановить: ~/crm/stop.sh"
