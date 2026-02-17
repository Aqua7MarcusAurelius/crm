# Архитектура

## Общая схема

```
Браузер → Next.js (:3000) → NestJS API (:3001) → PostgreSQL / Redis / MinIO
```

## Структура проекта

```
~/crm/
├── backend/src/
│   ├── auth/           # Регистрация, логин, JWT, гарды, декораторы
│   ├── users/          # Управление пользователями, справочники
│   ├── clients/        # CRUD клиентов, пакетный импорт
│   ├── prisma/         # PrismaService (глобальный)
│   └── common/         # ZodValidationPipe
├── frontend/src/
│   ├── app/
│   │   ├── login/      # Страница логина
│   │   ├── register/   # Страница регистрации
│   │   └── (dashboard)/
│   │       ├── page.tsx      # Главная
│   │       ├── users/        # Управление пользователями
│   │       └── clients/      # Клиенты
│   ├── components/
│   │   ├── sidebar.tsx       # Навигация с фильтрацией по правам
│   │   └── ui/               # shadcn/ui компоненты
│   └── lib/
│       ├── api.ts            # HTTP-клиент с JWT
│       └── auth-store.ts     # Zustand (токен, юзер)
├── docker-compose.yml
├── start.sh / stop.sh
└── docs/
```

## Backend модули

### AuthModule
- `POST /auth/register` — регистрация (Zod pipe, русские ошибки)
- `POST /auth/login` — логин → JWT токен

Гарды: `JwtAuthGuard`, `IsAdminGuard`, `PermissionsGuard`
Декораторы: `@CurrentUser()`, `@RequirePermissions()`

### UsersModule (JWT + IsAdmin)
- `GET /users` — список (фильтр status, search)
- `GET /users/:id` — детали
- `PATCH /users/:id` — обновить назначения (project, position, email)
- `PATCH /users/:id/approve|reject|block|activate` — смена статуса
- `GET /users/projects` — справочник проектов
- `GET /users/emails/available` — свободные email
- `POST /users/projects|positions|emails` — создание справочников

### ClientsModule (JWT + Permissions)
- `GET /clients` — список (search)
- `GET /clients/:id` — детали
- `POST /clients` — создать (perm: `clients.create`)
- `POST /clients/bulk` — пакетный импорт CSV (perm: `clients.create`)
- `PATCH /clients/:id` — редактировать (perm: `clients.edit`)
- `DELETE /clients/:id` — удалить (perm: `clients.delete`)

## Frontend страницы

| Путь | Доступ | Описание |
|---|---|---|
| `/login` | Публичная | Форма логина |
| `/register` | Публичная | Форма регистрации |
| `/` | Авторизован | Главная |
| `/users` | isAdmin | Таблица + боковая панель + выпадающие списки |
| `/clients` | perm: clients.view | Таблица + CRUD + импорт CSV |

## Система доступа

1. **JWT** — токен в заголовке `Authorization: Bearer ...`
2. **isAdmin** — полный доступ, обходит проверку пермишенов
3. **Permissions** — гранулярный доступ (`clients.view`, `clients.create`, `clients.edit`, `clients.delete`)
4. **Sidebar** — фильтрует пункты меню по `adminOnly` и `permission`
