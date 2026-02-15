'use client';

import { useAuthStore } from '@/lib/auth-store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Добро пожаловать, {user.firstName}!
      </h1>
      <p className="text-gray-500">
        Выберите раздел в меню слева.
      </p>
    </div>
  );
}