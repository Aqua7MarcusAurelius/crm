import { z } from 'zod';

export const LoginSchema = z.object({
  login: z.string().min(1, 'Введите ник или email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export type LoginDto = z.infer<typeof LoginSchema>;