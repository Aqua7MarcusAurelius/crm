import { z } from 'zod';

export const RegisterSchema = z.object({
  firstName: z.string().min(2, 'Имя минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия минимум 2 символа'),
  username: z.string().min(3, 'Ник минимум 3 символа').regex(
    /^[a-zA-Z0-9_]+$/,
    'Ник: только латиница, цифры и _',
  ),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
  phone: z.string({ required_error: 'Телефон обязателен' }).min(7, 'Некорректный телефон'),
  telegram: z.string().optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;