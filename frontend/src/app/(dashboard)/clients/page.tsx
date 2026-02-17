'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

const CSV_HEADERS = [
  'firstName', 'lastName', 'status', 'dob', 'gender',
  'country', 'city', 'address', 'email', 'mobile',
  'instagram', 'whatsapp', 'zoom',
  'tgUsername', 'tgUserId', 'tgBio', 'tgLastVisitStatus',
  'tgPremiumAccount', 'tgGifts', 'tgAccountTechStatus',
  'bio', 'addInfo',
];

export default function ClientsPage() {
  const token = useAuthStore((s) => s.token);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [saving, setSaving] = useState(false);

  // Импорт
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchClients = useCallback(async () => {
    if (!token) return;
    try {
      const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
      const data = await api<Client[]>(`/clients${params}`, { token });
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch]);

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

  // ─── Импорт CSV ───

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setImportPreview(result.data.slice(0, 5));
      },
      error: () => {
        alert('Ошибка чтения файла');
      },
    });
  };

  const handleImport = async () => {
    if (!token || !importFile) return;
    setImporting(true);
    setImportResult(null);

    Papa.parse(importFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const res = await api<{ created: number; errors: string[] }>('/clients/bulk', {
            method: 'POST',
            token,
            body: { clients: result.data },
          });
          setImportResult(res);
          await fetchClients();
        } catch (err: any) {
          alert(err.message);
        } finally {
          setImporting(false);
        }
      },
    });
  };

  const downloadTemplate = () => {
    const csv = CSV_HEADERS.join(',') + '\nИван,Иванов,Новый,1990-01-15,М,Россия,Москва,,ivan@mail.ru,+79991234567,,,,,,,,,,,';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportPreview([]);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            📥 Пакетный импорт
          </Button>
          <Button onClick={openNew}>+ Добавить клиента</Button>
        </div>
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

      {/* Диалог импорта */}
      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) closeImport(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Пакетный импорт клиентов</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm text-gray-600 block mb-2">
                Выберите CSV файл с данными клиентов
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>

            {importPreview.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium mb-2">
                  Предпросмотр (первые {importPreview.length} строк):
                </p>
                <div className="overflow-x-auto max-h-40">
                  <table className="text-xs">
                    <thead>
                      <tr>
                        {Object.keys(importPreview[0]).slice(0, 5).map((h) => (
                          <th key={h} className="px-2 py-1 text-left font-medium text-gray-500">{h}</th>
                        ))}
                        <th className="px-2 py-1 text-gray-400">...</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).slice(0, 5).map((val, j) => (
                            <td key={j} className="px-2 py-1">{String(val || '—')}</td>
                          ))}
                          <td className="px-2 py-1 text-gray-400">...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importResult && (
              <div className={`rounded-lg p-3 ${importResult.errors.length > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                <p className="text-sm font-medium">
                  ✅ Создано: {importResult.created}
                  {importResult.errors.length > 0 && ` | ⚠️ Ошибки: ${importResult.errors.length}`}
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="text-xs text-red-600 mt-1 max-h-24 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-600 hover:underline"
              >
                📄 Скачать CSV шаблон
              </button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeImport}>
                  Закрыть
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                >
                  {importing ? 'Импорт...' : 'Импортировать'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Боковая панель */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">
              {isNew ? 'Новый клиент' : `${selectedClient?.firstName} ${selectedClient?.lastName}`}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
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

            <div className="space-y-2 pt-2">
              <Button onClick={handleSave} disabled={saving || !form.firstName || !form.lastName} className="w-full">
                {saving ? 'Сохранение...' : isNew ? 'Создать клиента' : 'Сохранить'}
              </Button>
              {!isNew && selectedClient && (
                <Button variant="destructive" className="w-full" onClick={() => handleDelete(selectedClient.id)}>
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