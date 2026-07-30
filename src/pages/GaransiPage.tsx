import { useCallback, useState } from 'react';
import { Search, ShieldCheck, Pencil, Phone, User, MapPin, Package, CalendarClock, StickyNote, AlertCircle, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Warranty, WarrantyStatus } from '../lib/types';
import { formatDate } from '../lib/utils';

interface FormState {
  phone: string;
  customerName: string;
  address: string;
  productName: string;
  variant: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  status: WarrantyStatus;
  notes: string;
}

const emptyForm = (): FormState => ({
  phone: '',
  customerName: '',
  address: '',
  productName: '',
  variant: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  warrantyStart: new Date().toISOString().slice(0, 10),
  warrantyEnd: '',
  status: 'active',
  notes: '',
});

function toDateInputValue(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function statusColor(status: WarrantyStatus): 'green' | 'gray' | 'blue' | 'red' {
  switch (status) {
    case 'active': return 'green';
    case 'claimed': return 'blue';
    case 'void': return 'red';
    default: return 'gray';
  }
}

function statusLabel(status: WarrantyStatus) {
  switch (status) {
    case 'active': return 'Aktif';
    case 'expired': return 'Kadaluarsa';
    case 'claimed': return 'Sudah Diklaim';
    case 'void': return 'Dibatalkan';
  }
}

export function GaransiPage() {
  const { toast } = useToast();
  const [phoneInput, setPhoneInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<Warranty | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = phoneInput.trim();
    if (!trimmed) {
      toast('Masukkan nomor HP terlebih dahulu', 'warning');
      return;
    }
    setSearching(true);
    setSearched(false);
    try {
      const found = await api.searchWarrantyByPhone(trimmed);
      setResult(found);
      setSearched(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal mencari data garansi', 'error');
    } finally {
      setSearching(false);
    }
  }, [phoneInput, toast]);

  const openCreate = useCallback(() => {
    setFormMode('create');
    setForm(emptyForm());
    setFormOpen(true);
  }, []);

  const openEdit = useCallback(() => {
    if (!result) return;
    setFormMode('edit');
    setForm({
      phone: result.phone,
      customerName: result.customerName,
      address: result.address,
      productName: result.productName,
      variant: result.variant || '',
      purchaseDate: toDateInputValue(result.purchaseDate),
      warrantyStart: toDateInputValue(result.warrantyStart),
      warrantyEnd: toDateInputValue(result.warrantyEnd),
      status: result.status,
      notes: result.notes || '',
    });
    setFormOpen(true);
  }, [result]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setForm(null);
  }, []);

  const validateForm = useCallback((f: FormState, requirePhone: boolean) => {
    if (requirePhone && !f.phone.trim()) {
      toast('Nomor HP wajib diisi', 'warning');
      return false;
    }
    if (!f.customerName.trim() || !f.productName.trim()) {
      toast('Nama pelanggan dan nama produk wajib diisi', 'warning');
      return false;
    }
    if (!f.warrantyStart || !f.warrantyEnd) {
      toast('Periode garansi wajib diisi', 'warning');
      return false;
    }
    return true;
  }, [toast]);

  const handleSave = useCallback(async () => {
    if (!form) return;

    if (formMode === 'create') {
      if (!validateForm(form, true)) return;
      setSaving(true);
      try {
        const created = await api.createWarranty({
          phone: form.phone.trim(),
          customerName: form.customerName.trim(),
          address: form.address.trim(),
          productName: form.productName.trim(),
          variant: form.variant.trim(),
          purchaseDate: form.purchaseDate,
          warrantyStart: form.warrantyStart,
          warrantyEnd: form.warrantyEnd,
          status: form.status,
          notes: form.notes.trim(),
        });
        setResult(created);
        setPhoneInput(created.phone);
        setSearched(true);
        toast('Garansi baru berhasil ditambahkan', 'success');
        closeForm();
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Gagal menambahkan garansi', 'error');
      } finally {
        setSaving(false);
      }
      return;
    }

    // edit mode
    if (!result) return;
    if (!validateForm(form, false)) return;

    setSaving(true);
    try {
      const updated = await api.updateWarranty(result._id, {
        customerName: form.customerName.trim(),
        address: form.address.trim(),
        productName: form.productName.trim(),
        variant: form.variant.trim(),
        purchaseDate: form.purchaseDate,
        warrantyStart: form.warrantyStart,
        warrantyEnd: form.warrantyEnd,
        status: form.status,
        notes: form.notes.trim(),
      });
      setResult(updated);
      toast('Data garansi berhasil diperbarui', 'success');
      closeForm();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan data garansi', 'error');
    } finally {
      setSaving(false);
    }
  }, [formMode, result, form, toast, closeForm, validateForm]);

  return (
    <div className="space-y-4">
      {/* Toolbar: search + add button (no card wrapper, no label — matches Kategori page pattern) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="tel"
            placeholder="Cari nomor HP..."
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <Button onClick={handleSearch} disabled={searching} variant="secondary">
          <Search className="h-4 w-4" />
          {searching ? 'Mencari...' : 'Cari'}
        </Button>

        <div className="sm:ml-auto">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Garansi Baru
          </Button>
        </div>
      </div>

      {/* Result */}
      {searching ? (
        <Card>
          <div className="space-y-3">
            <div className="h-5 w-40 skeleton bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-4 w-full skeleton bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-4 w-2/3 skeleton bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </Card>
      ) : searched && !result ? (
        <Card>
          <EmptyState
            icon={<AlertCircle className="h-7 w-7" />}
            title="Data garansi tidak ditemukan"
            description={`Tidak ada data garansi terdaftar untuk nomor "${phoneInput.trim()}".`}
          />
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Daftarkan Garansi untuk Nomor Ini
            </Button>
          </div>
        </Card>
      ) : searched && result ? (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{result.productName}</p>
                  <Badge color={statusColor(result.status)} dot>{statusLabel(result.status)}</Badge>
                </div>
                {result.variant && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Varian: {result.variant}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-2.5">
              <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Nama Pelanggan</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{result.customerName || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Nomor HP</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{result.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:col-span-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Alamat</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{result.address || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Package className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Tanggal Pembelian</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{formatDate(result.purchaseDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarClock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Masa Garansi</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {formatDate(result.warrantyStart)} &ndash; {formatDate(result.warrantyEnd)}
                </p>
              </div>
            </div>
            {result.notes && (
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <StickyNote className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Catatan Admin</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{result.notes}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<ShieldCheck className="h-7 w-7" />}
            title="Cek Klaim Garansi"
            description="Masukkan nomor HP pelanggan untuk melihat detail garansi produk yang terdaftar, atau tambahkan garansi baru untuk pembelian yang masuk lewat WA."
          />
        </Card>
      )}

      {/* Create/Edit Modal */}
      {form && (
        <Modal
          open={formOpen}
          onClose={closeForm}
          title={formMode === 'create' ? 'Tambah Garansi Baru' : 'Edit Data Garansi'}
          subtitle={
            formMode === 'create'
              ? 'Input data pembelian & garansi untuk pelanggan baru'
              : `Perbarui informasi garansi untuk ${form.phone}`
          }
          footer={
            <>
              <Button variant="secondary" onClick={closeForm}>Batal</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : formMode === 'create' ? 'Simpan Garansi' : 'Simpan Perubahan'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Pelanggan"
                value={form.customerName}
                onChange={(e) => setForm((f) => f && { ...f, customerName: e.target.value })}
              />
              {formMode === 'create' ? (
                <Input
                  label="Nomor HP"
                  placeholder="Mis. 081234567890"
                  value={form.phone}
                  onChange={(e) => setForm((f) => f && { ...f, phone: e.target.value })}
                />
              ) : (
                <Input
                  label="Nomor HP"
                  value={form.phone}
                  disabled
                  hint="Nomor HP tidak dapat diubah"
                />
              )}
            </div>

            <Input
              label="Alamat"
              value={form.address}
              onChange={(e) => setForm((f) => f && { ...f, address: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Produk"
                value={form.productName}
                onChange={(e) => setForm((f) => f && { ...f, productName: e.target.value })}
              />
              <Input
                label="Varian"
                placeholder="Opsional"
                value={form.variant}
                onChange={(e) => setForm((f) => f && { ...f, variant: e.target.value })}
              />
            </div>

            <Input
              type="date"
              label="Tanggal Pembelian"
              value={form.purchaseDate}
              onChange={(e) => setForm((f) => f && { ...f, purchaseDate: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Garansi Mulai"
                value={form.warrantyStart}
                onChange={(e) => setForm((f) => f && { ...f, warrantyStart: e.target.value })}
              />
              <Input
                type="date"
                label="Garansi Berakhir"
                value={form.warrantyEnd}
                onChange={(e) => setForm((f) => f && { ...f, warrantyEnd: e.target.value })}
              />
            </div>

            <Select
              label="Status Garansi"
              value={form.status}
              onChange={(e) => setForm((f) => f && { ...f, status: e.target.value as WarrantyStatus })}
            >
              <option value="active">Aktif</option>
              <option value="expired">Kadaluarsa</option>
              <option value="claimed">Sudah Diklaim</option>
              <option value="void">Dibatalkan</option>
            </Select>

            <Input
              label="Catatan Admin"
              placeholder="Catatan internal (opsional)"
              value={form.notes}
              onChange={(e) => setForm((f) => f && { ...f, notes: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}