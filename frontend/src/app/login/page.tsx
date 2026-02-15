'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuthStore } from '@/lib/auth-store';

const loginSchema = z.object({
  login: z.string().min(1, 'Введите ник или email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      const res = await api<{
        accessToken: string;
        user: any;
      }>('/auth/login', {
        method: 'POST',
        body: data,
      });
      setAuth(res.accessToken, res.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Вход в CRM</CardTitle>
          <CardDescription>Введите ник или корп. email и пароль</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Ник или Email</Label>
              <Input
                id="login"
                placeholder="username или email@company.com"
                {...register('login')}
              />
              {errors.login && (
                <p className="text-sm text-red-500">{errors.login.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Подать заявку
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}