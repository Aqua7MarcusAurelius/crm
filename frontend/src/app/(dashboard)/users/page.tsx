'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  telegram: string | null;
  status: string;
  isAdmin: boolean;
  project: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  email: { id: string; email: string } | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  positions: { id: string; name: string }[];
}

interface CorpEmail {
  id: string;
  email: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Заявка', variant: 'outline' },
  ACTIVE: { label: 'Активен', variant: 'default' },
  REJECTED: { label: 'Отклонён', variant: 'destructive' },
  BLOCKED: { label: 'Заблокирован', variant: 'secondary' },
};

const statusFilters = [
  { value: 'ALL', label: 'Все' },
  { value: 'PENDING', label: 'Заявки' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'BLOCKED', label: 'Заблокированные' },
  { value: 'REJECTED', label: 'Отклонённые' },
];

export default function UsersPage() {
  const token = useAuthStore((s) => s.token);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Справочники
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableEmails, setAvailableEmails] = useState<CorpEmail[]>([]);

  // Выбранные значения в форме
  const [selProjectId, setSelProjectId] = useState<string>('');
  const [selPositionId, setSelPositionId] = useState<string>('');
  const [selEmailId, setSelEmailId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const data = await api<User[]>(`/users?${params}`, { token });
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchReferences = async () => {
    if (!token) return;
    try {
      const [proj, emails] = await Promise.all([
        api<Project[]>('/users/projects', { token }),
        api<CorpEmail[]>('/users/emails/available', { token }),
      ]);
      setProjects(proj);
      setAvailableEmails(emails);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (userId: string, action: string) => {
    try {
      await api(`/users/${userId}/${action}`, { method: 'PATCH', token: token! });
      await fetchUsers();
      if (selectedUser?.id === userId) {
        const updated = await api<User>(`/users/${userId}`, { token: token! });
        setSelectedUser(updated);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openSheet = async (user: User) => {
    setSelectedUser(user);
    setSelProjectId(user.project?.id || '');
    setSelPositionId(user.position?.id || '');
    setSelEmailId(user.email?.id || '');
    setSheetOpen(true);
    await fetchReferences();
  };

  const handleSave = async () => {
    if (!selectedUser || !token) return;
    setSaving(true);
    try {
      const updated = await api<User>(`/users/${selectedUser.id}`, {
        method: 'PATCH',
        token,
        body: {
          projectId: selProjectId || null,
          positionId: selPositionId || null,
          emailId: selEmailId || null,
        },
      });
      setSelectedUser(updated);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Должности текущего проекта
  const currentPositions = projects.find((p) => p.id === selProjectId)?.positions || [];

  // При смене проекта сбрасываем должность
  const handleProjectChange = (value: string) => {
    setSelProjectId(value);
    setSelPositionId('');
  };

  const pendingCount = users.filter((u) => u.status === 'PENDING').length;

  // Проверяем изменились ли назначения
  const hasChanges =
    (selProjectId || '') !== (selectedUser?.project?.id || '') ||
    (selPositionId || '') !== (selectedUser?.position?.id || '') ||
    (selEmailId || '') !== (selectedUser?.email?.id || '');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Пользователи</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              Новых заявок: {pendingCount}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Поиск по имени, нику, телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Ник</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Корп. email</TableHead>
              <TableHead>Проект</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Нет пользователей
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => openSheet(user)}
                >
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>@{user.username}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.telegram || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[user.status]?.variant || 'outline'}>
                      {statusConfig[user.status]?.label || user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.email?.email || '—'}</TableCell>
                  <TableCell>{user.project?.name || '—'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {user.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleAction(user.id, 'approve')}>
                          Одобрить
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(user.id, 'reject')}>
                          Отклонить
                        </Button>
                      </div>
                    )}
                    {user.status === 'ACTIVE' && (
                      <Button size="sm" variant="outline" onClick={() => handleAction(user.id, 'block')}>
                        Заблокировать
                      </Button>
                    )}
                    {(user.status === 'BLOCKED' || user.status === 'REJECTED') && (
                      <Button size="sm" variant="outline" onClick={() => handleAction(user.id, 'activate')}>
                        Активировать
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">
              {selectedUser?.firstName} {selectedUser?.lastName}
            </SheetTitle>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* Информация */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Ник</span>
                  <span className="text-sm font-medium">@{selectedUser.username}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Телефон</span>
                  <span className="text-sm font-medium">{selectedUser.phone}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Telegram</span>
                  <span className="text-sm font-medium">{selectedUser.telegram || '—'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Статус</span>
                  <Badge variant={statusConfig[selectedUser.status]?.variant || 'outline'}>
                    {statusConfig[selectedUser.status]?.label || selectedUser.status}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Дата заявки</span>
                  <span className="text-sm font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString('ru', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Назначения — выпадающие списки */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Назначения</h3>

                <div className="space-y-1">
                  <label className="text-sm text-gray-500">Проект</label>
                  <Select value={selProjectId} onValueChange={handleProjectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Не назначен" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-500">Должность</label>
                  <Select
                    value={selPositionId}
                    onValueChange={setSelPositionId}
                    disabled={!selProjectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selProjectId ? 'Не назначена' : 'Сначала выберите проект'} />
                    </SelectTrigger>
                    <SelectContent>
                      {currentPositions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </SelectItem>
                      ))}
                      {currentPositions.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          Нет должностей для этого проекта
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-500">Корп. email</label>
                  <Select value={selEmailId} onValueChange={setSelEmailId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Не назначен" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedUser.email && (
                        <SelectItem value={selectedUser.email.id}>
                          {selectedUser.email.email} (текущий)
                        </SelectItem>
                      )}
                      {availableEmails.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.email}
                        </SelectItem>
                      ))}
                      {availableEmails.length === 0 && !selectedUser.email && (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          Нет свободных email
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {hasChanges && (
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? 'Сохранение...' : 'Сохранить назначения'}
                  </Button>
                )}
              </div>

              {/* Действия */}
              <div className="space-y-2 pt-2">
                {selectedUser.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={() => handleAction(selectedUser.id, 'approve')}>
                      Одобрить
                    </Button>
                    <Button className="flex-1" variant="destructive" onClick={() => handleAction(selectedUser.id, 'reject')}>
                      Отклонить
                    </Button>
                  </div>
                )}
                {selectedUser.status === 'ACTIVE' && (
                  <Button variant="outline" className="w-full" onClick={() => handleAction(selectedUser.id, 'block')}>
                    Заблокировать
                  </Button>
                )}
                {(selectedUser.status === 'BLOCKED' || selectedUser.status === 'REJECTED') && (
                  <Button className="w-full" onClick={() => handleAction(selectedUser.id, 'activate')}>
                    Активировать
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}