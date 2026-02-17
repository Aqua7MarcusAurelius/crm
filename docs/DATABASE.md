# База данных

ORM: Prisma 7 | БД: PostgreSQL 16
Конфиг подключения: `backend/prisma.config.ts` (не в schema.prisma)

## Модели

### User (users)
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| firstName | String | Имя |
| lastName | String | Фамилия |
| username | String (unique) | Логин (trim + lowercase) |
| password | String | Bcrypt хеш |
| phone | String | Телефон |
| telegram | String? | Telegram |
| isAdmin | Boolean | Админ (default: false) |
| status | UserStatus | Статус (default: PENDING) |
| projectId | → Project? | Назначенный проект |
| positionId | → Position? | Должность |
| emailId | → CorporateEmail? (unique) | Корп. email |
| permissions | → UserPermission[] | Права доступа |
| clients | → Client[] | Созданные клиенты |

### Client (clients)
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| firstName, lastName | String | ФИО |
| status | String? | Статус (текст, default: "Новый") |
| dob | Date? | Дата рождения |
| gender | String? | Пол |
| country, city, address | String? | Локация |
| email, mobile | String? | Контакты |
| instagram, whatsapp, zoom | String? | Мессенджеры |
| tgUsername | String? | TG username |
| tgUserId | String? | TG user ID |
| tgBio | String? | TG био |
| tgLastVisitStatus | String? | TG last visit |
| tgPremiumAccount | Boolean | TG Premium (default: false) |
| tgGifts | String? | TG подарки |
| tgAccountTechStatus | String? | TG тех. статус |
| bio, addInfo | String? | Доп. информация |
| createdBy | → User? | Кто создал |

### Permission (permissions)
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| code | String (unique) | Код (`clients.view`, `clients.create`...) |
| name | String | Название |
| category | String | Категория |

### UserPermission (user_permissions)
Связка User ↔ Permission (many-to-many). PK: `[userId, permissionId]`. Cascade delete.

### CorporateEmail (corporate_emails)
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| email | String (unique) | Адрес |
| status | EmailStatus | AVAILABLE / ASSIGNED |

### Project (projects)
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| name | String (unique) | Название |
| positions | → Position[] | Должности в проекте |

### Position (positions)
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| name | String | Название |
| projectId | → Project | Проект |
Unique constraint: `[name, projectId]`

## Enums

- **UserStatus**: `PENDING | ACTIVE | REJECTED | BLOCKED`
- **EmailStatus**: `AVAILABLE | ASSIGNED`

## Миграции

1. `init` — User, Permission, UserPermission, CorporateEmail, Project, Position
2. `add_clients` — Client

## Связи

```
User → Project (many-to-one)
User → Position (many-to-one)
User → CorporateEmail (one-to-one)
User ↔ Permission (many-to-many через UserPermission)
Client → User (created_by)
Position → Project (many-to-one)
```
