#!/bin/bash

echo "🛑 Остановка CRM..."

# Frontend
if [ -f ~/crm/logs/frontend.pid ]; then
  kill $(cat ~/crm/logs/frontend.pid) 2>/dev/null
  rm ~/crm/logs/frontend.pid
  echo "✅ Frontend остановлен"
fi

# Backend
if [ -f ~/crm/logs/backend.pid ]; then
  kill $(cat ~/crm/logs/backend.pid) 2>/dev/null
  rm ~/crm/logs/backend.pid
  echo "✅ Backend остановлен"
fi

# Prisma Studio
if [ -f ~/crm/logs/prisma-studio.pid ]; then
  kill $(cat ~/crm/logs/prisma-studio.pid) 2>/dev/null
  rm ~/crm/logs/prisma-studio.pid
  echo "✅ Prisma Studio остановлен"
fi

# Docker
read -p "Остановить Docker (PostgreSQL, Redis, MinIO)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd ~/crm && docker compose down
  echo "✅ Docker остановлен"
fi

echo "🔴 CRM остановлена"
