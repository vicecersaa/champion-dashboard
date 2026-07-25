import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, FolderTree, Pencil, Trash2, Package, X, Calendar, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { FileUpload } from '../components/ui/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Category } from '../lib/types';
import { formatDate, slugify } from '../lib/utils';

interface FormState {
  name: string;
  slug: string;
  description: string;
  image: string[];
}

const emptyForm: FormState = { name: '', slug: '', description: '', image: [] };

export function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCategories();
      setCategories(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', image: cat.image ? [cat.image] : [] });
    setSlugTouched(true);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setSlugTouched(false);
  }, []);

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug: slugify(value) }));
  };

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      toast('Nama kategori wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        image: form.image[0] || null,
      };
      if (editing) {
        const updated = await api.updateCategory(editing.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast('Kategori berhasil diperbarui', 'success');
      } else {
        const created = await api.createCategory(payload);
        setCategories((prev) => [created, ...prev]);
        toast('Kategori berhasil ditambahkan', 'success');
      }
      closeForm();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan kategori', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, editing, toast, closeForm]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast('Kategori berhasil dihapus', 'success');
      setDeleteTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menghapus kategori', 'error');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, toast]);

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Input
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:w-64"
        />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="aspect-video skeleton bg-gray-100 dark:bg-gray-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-32 skeleton bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-24 skeleton bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card>
          <EmptyState
            icon={<X className="h-7 w-7" />}
            title="Gagal memuat kategori"
            description={error}
            action={<Button onClick={loadCategories} variant="outline" size="sm">Coba lagi</Button>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FolderTree className="h-7 w-7" />}
            title={search ? 'Tidak ada kategori ditemukan' : 'Belum ada kategori'}
            description={search ? 'Coba kata kunci lain.' : 'Mulai dengan menambahkan kategori pertama Anda.'}
            action={!search && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Kategori</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <Card key={cat.id} hover className="overflow-hidden flex flex-col">
              {/* Image / placeholder (16:9) */}
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
                    <FolderTree className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge color="gray" className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                    <Package className="h-3 w-3" />
                    {cat.product_count ?? 0} produk
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{cat.name}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">/{cat.slug}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 dark:text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(cat.created_at)}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteTarget(cat)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit Kategori' : 'Tambah Kategori'}
        subtitle={editing ? 'Perbarui informasi kategori' : 'Buat kategori produk baru'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FileUpload
            type="image"
            value={form.image}
            onChange={(urls) => setForm((prev) => ({ ...prev, image: urls }))}
            label="Gambar Kategori"
          />
          <Input
            label="Nama Kategori"
            placeholder="mis. Elektronik"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
          <Input
            label="Slug"
            placeholder="otomatis-dari-nama"
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            hint="Slug akan terisi otomatis dari nama, namun dapat diubah"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deskripsi</label>
            <textarea
              placeholder="Deskripsi singkat tentang kategori ini..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Kategori"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Apakah Anda yakin ingin menghapus kategori <span className="font-semibold">{deleteTarget?.name}</span>?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
