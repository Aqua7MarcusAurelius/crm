# Установка с нуля

Сервер: Ubuntu 24.04 LTS. Все команды от пользователя deployer (кроме начальной настройки).

---

## 1. Сервер

```bash
# Обновление (от root)
apt update && apt upgrade -y && reboot

# Утилиты
apt install -y curl wget git nano htop ncdu tree unzip ufw fail2ban

# Пользователь
adduser deployer && usermod -aG sudo deployer
```

SSH-ключ (Windows PowerShell):
```powershell
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh deployer@IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

SSH hardening (`/etc/ssh/sshd_config.d/hardened.conf`):
```
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deployer
```

⚠️ Ubuntu 24.04 — порт через socket:
```bash
sudo systemctl edit ssh.socket
# Вставить:
# [Socket]
# ListenStream=
# ListenStream=0.0.0.0:2222
# ListenStream=[::]:2222
sudo systemctl daemon-reload && sudo systemctl restart ssh.socket
```

Firewall:
```bash
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw allow 2222/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
```

Fail2ban (`/etc/fail2ban/jail.local`):
```
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 3600
```

```bash
sudo systemctl enable fail2ban && sudo systemctl restart fail2ban
sudo timedatectl set-timezone UTC
```

Swap:
```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 2. Docker

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deployer
# Перелогиниться
```

## 3. Проект

```bash
mkdir -p ~/crm/{docker/postgres,docker/redis,docker/minio,docker/nginx,backend,frontend,scripts,backups,logs,docs}
```

Сгенерировать пароли и создать `~/crm/.env`:
```
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=...
POSTGRES_DB=crm_db
REDIS_PASSWORD=...
MINIO_ROOT_USER=crm_admin
MINIO_ROOT_PASSWORD=...
```

`docker-compose.yml` — PostgreSQL 16, Redis 7, MinIO (все на 127.0.0.1).

```bash
cd ~/crm && docker compose up -d
```

## 4. Backend

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc && nvm install --lts
npm install -g @nestjs/cli

cd ~/crm && nest new backend-temp --package-manager npm --strict
mv backend-temp/* backend-temp/.* backend/ 2>/dev/null && rmdir backend-temp

cd ~/crm/backend
npm install prisma --save-dev && npm install @prisma/client
npx prisma init

# Пакеты
npm install zod bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/config
npm install @types/bcrypt @types/passport-jwt --save-dev
npm install @nestjs/bullmq bullmq nodemailer nestjs-pino pino pino-http pino-pretty
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @prisma/adapter-pg pg && npm install @types/pg --save-dev
```

`backend/.env`:
```
DATABASE_URL="postgresql://crm_user:ПАРОЛЬ@localhost:5432/crm_db?schema=public"
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

```bash
npx prisma migrate dev --name init
```

## 5. Frontend

```bash
cd ~/crm
npx create-next-app@latest frontend-temp --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
mv frontend-temp/* frontend-temp/.* frontend/ 2>/dev/null && rmdir frontend-temp

cd ~/crm/frontend
npm install react-hook-form @hookform/resolvers zod @tanstack/react-query zustand socket.io-client papaparse
npm install @types/papaparse --save-dev

npx shadcn@latest init
npx shadcn@latest add button input card label sonner table badge sheet select separator dialog
```

## 6. Запуск

```bash
~/crm/start.sh   # Docker → Backend → Frontend → Prisma Studio
~/crm/stop.sh    # Остановка всех
```

| Сервис | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| Prisma Studio | http://localhost:5555 |
| MinIO Console | http://localhost:9001 |
