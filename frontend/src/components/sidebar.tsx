'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  permission?: string;
}

const navItems: NavItem[] = [
  { href: '/', label: '🏠 Главная' },
  { href: '/users', label: '👥 Пользователи', adminOnly: true },
  { href: '/clients', label: '📇 Клиенты', permission: 'clients.view' },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && !user.isAdmin) return false;
    if (item.permission && !user.isAdmin && !user.permissions.includes(item.permission)) return false;
    return true;
  });

  return (
    <aside className="w-56 border-r bg-white flex flex-col h-screen">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold">CRM</h1>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {visibleItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm ${
                isActive
                  ? 'bg-gray-100 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
        <p className="text-xs text-gray-500">@{user.username}</p>
      </div>
    </aside>
  );
}