'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Имя минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия минимум 2 символа'),
  username: z.string().min(3, 'Ник минимум 3 символа').regex(
    /^[a-zA-Z0-9_]+$/,
    'Только латиница, цифры и _',
  ),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
  phone: z.string().min(7, 'Некорректный телефон'),
  telegram: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    setLoading(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: data,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Заявка отправлена ✓</CardTitle>
            <CardDescription>
              Ожидайте одобрения администратором. Вам напишут в Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Вернуться к входу
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Заявка на доступ</CardTitle>
          <CardDescription>
            Заполните данные. После одобрения вы сможете войти.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input id="firstName" placeholder="Иван" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input id="lastName" placeholder="Иванов" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Ник (для входа)</Label>
              <Input id="username" placeholder="ivanov" {...register('username')} />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input id="phone" placeholder="+7 999 123 45 67" {...register('phone')} />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (необязательно)</Label>
              <Input id="telegram" placeholder="@username" {...register('telegram')} />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить заявку'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Войти
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}