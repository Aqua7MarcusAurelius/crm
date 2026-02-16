'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';

interface Client {
  id: string;
  status: string | null;
  firstName: string;
  lastName: string;
  dob: string | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  mobile: string | null;
  instagram: string | null;
  whatsapp: string | null;
  zoom: string | null;
  tgUsername: string | null;
  tgUserId: string | null;
  tgBio: string | null;
  tgLastVisitStatus: string | null;
  tgPremiumAccount: boolean;
  tgGifts: string | null;
  tgAccountTechStatus: string | null;
  bio: string | null;
  addInfo: string | null;
  creator: { firstName: string; lastName: string } | null;
  createdAt: string;
}

const emptyClient = {
  firstName: '',
  lastName: '',
  status: 'Новый',
  dob: '',
  gender: '',
  country: '',
  city: '',
  address: '',
  email: '',
  mobile: '',
  instagram: '',
  whatsapp: '',
  zoom: '',
  tgUsername: '',
  tgUserId: '',
  tgBio: '',
  tgLastVisitStatus: '',
  tgPremiumAccount: false,
  tgGifts: '',
  tgAccountTechStatus: '',
  bio: '',
  addInfo: '',
};

export default function ClientsPage() {
  const token = useAuthStore((s) => s.token);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!token) return;
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await api<Client[]>(`/clients${params}`, { token });
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openNew = () => {
    setForm(emptyClient);
    setSelectedClient(null);
    setIsNew(true);
    setSheetOpen(true);
  };

  const openEdit = (client: Client) => {
    setSelectedClient(client);
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      status: client.status || '',
      dob: client.dob ? client.dob.split('T')[0] : '',
      gender: client.gender || '',
      country: client.country || '',
      city: client.city || '',
      address: client.address || '',
      email: client.email || '',
      mobile: client.mobile || '',
      instagram: client.instagram || '',
      whatsapp: client.whatsapp || '',
      zoom: client.zoom || '',
      tgUsername: client.tgUsername || '',
      tgUserId: client.tgUserId || '',
      tgBio: client.tgBio || '',
      tgLastVisitStatus: client.tgLastVisitStatus || '',
      tgPremiumAccount: client.tgPremiumAccount,
      tgGifts: client.tgGifts || '',
      tgAccountTechStatus: client.tgAccountTechStatus || '',
      bio: client.bio || '',
      addInfo: client.addInfo || '',
    });
    setIsNew(false);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const body: any = { ...form };
      body.dob = body.dob || null;
      // Пустые строки → null
      Object.keys(body).forEach((key) => {
        if (body[key] === '') body[key] = null;
      });
      body.tgPremiumAccount = form.tgPremiumAccount;

      if (isNew) {
        await api('/clients', { method: 'POST', token, body });
      } else if (selectedClient) {
        await api(`/clients/${selectedClient.id}`, { method: 'PATCH', token, body });
      }
      setSheetOpen(false);
      await fetchClients();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Удалить клиента?')) return;
    try {
      await api(`/clients/${id}`, { method: 'DELETE', token });
      setSheetOpen(false);
      await fetchClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <Button onClick={openNew}>+ Добавить клиента</Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Поиск по имени, телефону, email, Telegram..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Страна</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Создал</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Нет клиентов
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => openEdit(client)}
                >
                  <TableCell className="font-medium">
                    {client.firstName} {client.lastName}
                  </TableCell>
                  <TableCell>{client.mobile || '—'}</TableCell>
                  <TableCell>{client.email || '—'}</TableCell>
                  <TableCell>{client.tgUsername ? `@${client.tgUsername}` : '—'}</TableCell>
                  <TableCell>{client.country || '—'}</TableCell>
                  <TableCell>{client.status || '—'}</TableCell>
                  <TableCell>
                    {client.creator
                      ? `${client.creator.firstName} ${client.creator.lastName}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">
              {isNew ? 'Новый клиент' : `${selectedClient?.firstName} ${selectedClient?.lastName}`}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Основное */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Основное</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Имя *</label>
                  <Input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Фамилия *</label>
                  <Input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Дата рождения</label>
                  <Input type="date" value={form.dob} onChange={(e) => updateField('dob', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Пол</label>
                  <Input value={form.gender} onChange={(e) => updateField('gender', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Статус</label>
                <Input value={form.status} onChange={(e) => updateField('status', e.target.value)} />
              </div>
            </div>

            {/* Локация */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Локация</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Страна</label>
                  <Input value={form.country} onChange={(e) => updateField('country', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Город</label>
                  <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Адрес</label>
                <Input value={form.address} onChange={(e) => updateField('address', e.target.value)} />
              </div>
            </div>

            {/* Контакты */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Контакты</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Телефон</label>
                  <Input value={form.mobile} onChange={(e) => updateField('mobile', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <Input value={form.email} onChange={(e) => updateField('email', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Instagram</label>
                  <Input value={form.instagram} onChange={(e) => updateField('instagram', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">WhatsApp</label>
                  <Input value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Zoom</label>
                <Input value={form.zoom} onChange={(e) => updateField('zoom', e.target.value)} />
              </div>
            </div>

            {/* Telegram */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Telegram</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Username</label>
                  <Input value={form.tgUsername} onChange={(e) => updateField('tgUsername', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">User ID</label>
                  <Input value={form.tgUserId} onChange={(e) => updateField('tgUserId', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Bio</label>
                <Input value={form.tgBio} onChange={(e) => updateField('tgBio', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Last Visit Status</label>
                  <Input value={form.tgLastVisitStatus} onChange={(e) => updateField('tgLastVisitStatus', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Tech Status</label>
                  <Input value={form.tgAccountTechStatus} onChange={(e) => updateField('tgAccountTechStatus', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Gifts</label>
                  <Input value={form.tgGifts} onChange={(e) => updateField('tgGifts', e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    checked={form.tgPremiumAccount}
                    onChange={(e) => updateField('tgPremiumAccount', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label className="text-sm text-gray-700">Premium аккаунт</label>
                </div>
              </div>
            </div>

            {/* Доп. информация */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Дополнительно</h3>
              <div>
                <label className="text-xs text-gray-500">Bio клиента</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  className="w-full border rounded-md p-2 text-sm min-h-[60px]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Доп. информация</label>
                <textarea
                  value={form.addInfo}
                  onChange={(e) => updateField('addInfo', e.target.value)}
                  className="w-full border rounded-md p-2 text-sm min-h-[60px]"
                />
              </div>
            </div>

            {/* Кнопки */}
            <div className="space-y-2 pt-2">
              <Button onClick={handleSave} disabled={saving || !form.firstName || !form.lastName} className="w-full">
                {saving ? 'Сохранение...' : isNew ? 'Создать клиента' : 'Сохранить'}
              </Button>
              {!isNew && selectedClient && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDelete(selectedClient.id)}
                >
                  Удалить клиента
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}