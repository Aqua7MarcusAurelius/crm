# Текущее состояние

Обновлено: 16.02.2026

## Версии

| Компонент | Версия |
|---|---|
| Node.js | v24.13.0 |
| NestJS CLI | 11.0.16 |
| Prisma | 7.x |
| Zod | 4.x |
| Next.js | 16.x |
| Tailwind | v4 |
| Docker Compose | v5.0.2 |

## Порты

| Сервис | Порт |
|---|---|
| Frontend | localhost:3000 |
| Backend API | localhost:3001 |
| Prisma Studio | localhost:5555 |
| PostgreSQL | 127.0.0.1:5432 |
| Redis | 127.0.0.1:6379 |
| MinIO API | 127.0.0.1:9000 |
| MinIO Console | 127.0.0.1:9001 |

## Что работает

### ✅ Инфраструктура
- Сервер настроен и захардён (SSH, UFW, fail2ban)
- Docker: PostgreSQL, Redis, MinIO — все healthy
- Git + GitHub репозиторий
- start.sh / stop.sh скрипты
- VS Code Remote SSH

### ✅ Аутентификация
- Регистрация с Zod валидацией (русские ошибки, 400 Bad Request)
- Логин → JWT токен (7 дней)
- Input sanitization (trim + lowercase)
- Workflow: регистрация → статус PENDING → админ одобряет → ACTIVE
- Админ: Marcus Aurelius (isAdmin: true)

### ✅ Пользователи (админ-панель)
- Таблица с поиском и фильтрами по статусу
- Боковая панель с деталями
- Одобрение / отклонение / блокировка / активация
- Выпадающие списки: проект, должность, корп. email
- Должности фильтруются по проекту

### ✅ Клиенты
- Таблица с поиском
- Создание / редактирование / удаление (боковая панель)
- 22 поля: основное, локация, контакты, Telegram, доп. инфо
- Пакетный импорт из CSV (предпросмотр, отчёт об ошибках)
- Скачивание CSV-шаблона
- Доступ по пермишенам (clients.view/create/edit/delete)

### ✅ Система доступа
- JWT гард
- IsAdmin гард
- Permissions гард + декоратор @RequirePermissions()
- Sidebar фильтрует пункты по правам

## shadcn/ui компоненты

button, input, card, label, sonner, table, badge, sheet, select, separator, dialog

## Git

Репозиторий: https://github.com/Aqua7MarcusAurelius/crm
