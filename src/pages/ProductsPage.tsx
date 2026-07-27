import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, ChevronLeft, ChevronRight, Package, Edit, Trash2,
  ChevronDown, ChevronRight as ChevronR, Save,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { FileUpload } from '../components/ui/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Product, Category, ProductVariant, ProductSize } from '../lib/types';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';

const PAGE_SIZE = 8;

export function ProductsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // --- Bulk delete state ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodResult, catResult] = await Promise.all([
  api.getProducts({ page, limit: PAGE_SIZE, search: search || undefined }),
  api.getCategories({ limit: 100 }),
]);
setProducts(prodResult.items);
setTotalItems(prodResult.pagination.totalItems);
setCategories(catResult.items);
      setSelectedIds([]); // reset seleksi tiap kali data reload
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal memuat produk', 'error');
    }
    setLoading(false);
  }, [page, search, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const displayedProducts = categoryFilter === 'all'
    ? products
    : products.filter((p) => p.category?._id === categoryFilter);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const handleSave = async (formPayload: {
    name: string; description: string; category: string;
    isVariantMode: boolean; sku: string; price: string; stock: string;
    variants: ProductVariant[];
    newImages: File[]; existingImages: string[];
    newVideo: File | null; removeVideo: boolean;
  }) => {
    try {
      const payload = {
        name: formPayload.name,
        description: formPayload.description,
        category: formPayload.category,
        sku: formPayload.isVariantMode ? '' : formPayload.sku,
        price: formPayload.isVariantMode ? null : (parseFloat(formPayload.price) || 0),
        stock: formPayload.isVariantMode ? null : (parseInt(formPayload.stock, 10) || 0),
        variants: formPayload.isVariantMode ? formPayload.variants : [],
        isActive: true,
        images: formPayload.newImages,
        video: formPayload.newVideo,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct._id, payload);
        toast('Produk berhasil diperbarui', 'success');
      } else {
        await api.createProduct(payload);
        toast('Produk berhasil dibuat', 'success');
      }
      setModalOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan produk', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteProduct(deleteTarget._id);
      toast('Produk berhasil dihapus', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus produk', 'error');
    }
  };

  // --- Bulk delete handlers ---
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedProducts.map((p) => p._id));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await api.bulkDeleteProducts(selectedIds);
      toast(`${selectedIds.length} produk berhasil dihapus`, 'success');
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus produk', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="w-auto whitespace-nowrap">
            <option value="all">Semua Kategori</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              onClick={() => setBulkDeleteOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => { setEditingProduct(null); setModalOpen(true); }} className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4" /> Tambah Produk
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : displayedProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="Tidak ada produk"
            description="Coba sesuaikan filter atau tambahkan produk baru."
            action={<Button onClick={() => { setEditingProduct(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Tambah Produk</Button>}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={displayedProducts.length > 0 && selectedIds.length === displayedProducts.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Produk</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Kategori</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Range Harga</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Total Stok</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Dibuat</th>
                    <th className="px-4 py-3 w-20 text-white">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((product) => {
                    const hasVariant = product.variants.length > 0;
                    const priceRange = product.minPrice === product.maxPrice
                      ? formatCurrency(product.minPrice)
                      : `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`;
                    return (
                      <tr key={product._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(product._id)}
                            onChange={() => toggleSelect(product._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                              {product.thumbnail ? (
                                <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                              <p className="text-xs text-gray-400">{hasVariant ? `${product.variants.length} variant` : 'Tanpa variant'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">{product.category?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">{priceRange}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${product.totalStock === 0 ? 'text-red-500' : product.totalStock <= 10 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {formatNumber(product.totalStock)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{formatDate(product.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingProduct(product); setModalOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(product)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {displayedProducts.map((product) => {
                const hasVariant = product.variants.length > 0;
                return (
                  <div key={product._id} className="px-4 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product._id)}
                        onChange={() => toggleSelect(product._id)}
                        className="rounded border-gray-300 mt-1 shrink-0"
                      />
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category?.name || '-'} - {hasVariant ? `${product.variants.length} variant` : 'Tanpa variant'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">Stok: <span className={`font-medium ${product.totalStock === 0 ? 'text-red-500' : product.totalStock <= 10 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>{formatNumber(product.totalStock)}</span></span>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <span className="text-gray-500 text-xs">{formatDate(product.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingProduct(product); setModalOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(product)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading && displayedProducts.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 hidden sm:block">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} dari {totalItems} produk
            </p>
            <div className="flex items-center gap-1 ml-auto sm:ml-0">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
          onSave={handleSave}
        />
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Produk"
        size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button><Button variant="danger" onClick={handleDelete}>Hapus</Button></>}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Yakin ingin menghapus <span className="font-semibold text-gray-900 dark:text-gray-100">{deleteTarget?.name}</span>? Produk akan dinonaktifkan (bisa dipulihkan lagi nanti).
        </p>
      </Modal>

      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Hapus Produk Terpilih"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Batal</Button>
            <Button variant="danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Yakin ingin menghapus <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedIds.length} produk</span> yang dipilih? Produk akan dinonaktifkan (bisa dipulihkan lagi nanti).
        </p>
      </Modal>
    </div>
  );
}

interface FormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: {
    name: string; description: string; category: string;
    isVariantMode: boolean; sku: string; price: string; stock: string;
    variants: ProductVariant[];
    newImages: File[]; existingImages: string[];
    newVideo: File | null; removeVideo: boolean;
  }) => void;
}

function ProductFormModal({ product, categories, onClose, onSave }: FormModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.category?._id || '');
  const [description, setDescription] = useState(product?.description || '');

  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [removedImageIndexes, setRemovedImageIndexes] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newVideo, setNewVideo] = useState<File[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(product?.video || null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [thumbnail, setThumbnail] = useState(product?.thumbnail || "");
  const [isVariantMode, setIsVariantMode] = useState((product?.variants?.length ?? 0) > 0);
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [stock, setStock] = useState(String(product?.stock ?? ''));
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [openVariantIdx, setOpenVariantIdx] = useState<number | null>(null);

  const addVariant = () => {
    setVariants((prev) => [...prev, { name: '', sku: '', price: null, stock: null, sizes: [], isActive: true }]);
    setOpenVariantIdx(variants.length);
  };

  const updateVariant = (idx: number, updates: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...updates } : v)));
  };

  const removeVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSize = (variantIdx: number) => {
    setVariants((prev) => prev.map((v, i) => (i === variantIdx
      ? { ...v, sizes: [...v.sizes, { name: '', sku: '', price: 0, stock: 0, isActive: true }] }
      : v)));
  };

  const updateSize = (variantIdx: number, sizeIdx: number, updates: Partial<ProductSize>) => {
    setVariants((prev) => prev.map((v, i) => (i === variantIdx
      ? { ...v, sizes: v.sizes.map((s, si) => (si === sizeIdx ? { ...s, ...updates } : s)) }
      : v)));
  };

  const removeSize = (variantIdx: number, sizeIdx: number) => {
    setVariants((prev) => prev.map((v, i) => (i === variantIdx
      ? { ...v, sizes: v.sizes.filter((_, si) => si !== sizeIdx) }
      : v)));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama produk harus diisi';
    if (!categoryId) e.category = 'Kategori harus dipilih';

    if (!isVariantMode) {
      if (!sku.trim()) e.sku = 'SKU produk harus diisi';
      if (!price) e.price = 'Harga produk harus diisi';
    } else {
      variants.forEach((v, idx) => {
        if (!v.name.trim()) e[`variant-name-${idx}`] = 'Nama variant harus diisi';
        if (v.sizes.length === 0) {
          if (!v.sku.trim()) e[`variant-sku-${idx}`] = 'SKU variant harus diisi';
          if (v.price == null) e[`variant-price-${idx}`] = 'Harga variant harus diisi';
        }
        v.sizes.forEach((s, sIdx) => {
          if (!s.name.trim()) e[`size-name-${idx}-${sIdx}`] = 'Nama size harus diisi';
          if (!s.sku.trim()) e[`size-sku-${idx}-${sIdx}`] = 'SKU size harus diisi';
          if (!s.price) e[`size-price-${idx}-${sIdx}`] = 'Harga size harus diisi';
        });
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
  if (!validate()) {
    toast('Periksa kembali data yang diisi', 'error');
    return;
  }

  setSaving(true);

  try {
    if (product) {
      // Hapus gambar yang di-X
      for (const index of removedImageIndexes.sort((a, b) => b - a)) {
        await api.removeProductImage(product._id, index);
      }

      // Hapus video HANYA jika user benar-benar menekan tombol X
      if (removeVideo) {
        await api.removeProductVideo(product._id);
      }
    }

    await onSave({
      name: name.trim(),
      description: description.trim(),
      category: categories.find((c) => c._id === categoryId)?.name || '',
      isVariantMode,
      sku: sku.trim(),
      price,
      stock,
      variants,
      newImages,
      existingImages,
      newVideo: newVideo[0] || null,
      removeVideo,
    });

    setRemoveVideo(false);
  } finally {
    setSaving(false);
  }
};

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? 'Edit Produk' : 'Tambah Produk'}
      subtitle={product ? product.name : 'Buat produk baru dalam katalog'}
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Menyimpan...' : <><Save className="h-4 w-4" /> Simpan Produk</>}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FileUpload
          type="image"
          multiple
          maxFiles={10}
          label="Gambar Produk"
          files={newImages}
          onFilesChange={setNewImages}
          existing={existingImages}
          thumbnail={thumbnail}
          onSetThumbnail={async (url: string) => {
            if (!product) return;

            await api.setProductThumbnail(product._id, url);
            setThumbnail(url);
          }}
          onRemoveExisting={(url) => {
            const index = existingImages.indexOf(url);

            if (index !== -1) {
              setRemovedImageIndexes(prev => [...prev, index]);
            }

            setExistingImages(prev => prev.filter(u => u !== url));
          }}
        />
          <FileUpload
            type="video"
            label="Video Produk (opsional)"
            files={newVideo}
            onFilesChange={setNewVideo}
            existing={existingVideo ? [existingVideo] : []}
            onRemoveExisting={() => {
              setExistingVideo(null);
              setRemoveVideo(true);
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Headphone Wireless" error={errors.name} />
          <div>
            <Select label="Kategori" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Pilih kategori</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>
        </div>
        <Textarea label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Deskripsi produk..." />

        <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Produk Memiliki Variant</p>
            <p className="text-xs text-gray-500 mt-0.5">Aktifkan jika produk memiliki varian seperti warna/ukuran</p>
          </div>
          <button
            type="button"
            onClick={() => setIsVariantMode(!isVariantMode)}
            className={`relative h-6 w-11 rounded-full transition-colors overflow-hidden ${isVariantMode ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isVariantMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {!isVariantMode && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="SKU Produk" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="cth. AP-HP-001" error={errors.sku} />
            <Input label="Harga (Rp)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" error={errors.price} />
            <Input label="Stok" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
          </div>
        )}

        {isVariantMode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Variant Produk</h4>
              <Button size="sm" variant="outline" onClick={addVariant}><Plus className="h-4 w-4" /> Tambah Variant</Button>
            </div>

            {variants.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Belum ada variant. Klik "Tambah Variant" untuk memulai.</p>
              </div>
            )}

            {variants.map((variant, vIdx) => {
              if (!variant.sizes) {
                variant.sizes = [];
              }
              const hasSize = variant.sizes.length > 0;
              
              return (
                <div key={vIdx} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                    <button onClick={() => setOpenVariantIdx(openVariantIdx === vIdx ? null : vIdx)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {openVariantIdx === vIdx ? <ChevronDown className="h-4 w-4" /> : <ChevronR className="h-4 w-4" />}
                    </button>
                    <span className="text-xs font-bold text-gray-400">V{vIdx + 1}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 truncate">{variant.name || 'Variant tanpa nama'}</span>
                    {hasSize ? (
                      <Badge color="blue">{variant.sizes.length} size</Badge>
                    ) : (
                      variant.price != null && <span className="text-xs text-gray-500">{formatCurrency(variant.price)}</span>
                    )}
                    <button onClick={() => removeVariant(vIdx)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {openVariantIdx === vIdx && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nama Variant" value={variant.name} onChange={(e) => updateVariant(vIdx, { name: e.target.value })} placeholder="cth. Hitam, Merah" error={errors[`variant-name-${vIdx}`]} />
                        {!hasSize && (
                          <Input label="SKU Variant" value={variant.sku} onChange={(e) => updateVariant(vIdx, { sku: e.target.value })} placeholder="cth. AP-HP-BLK" error={errors[`variant-sku-${vIdx}`]} />
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Varian ini punya Ukuran</p>
                          <p className="text-xs text-gray-500">Aktifkan jika varian ini memiliki ukuran (S, M, L, dll)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateVariant(
                              vIdx,
                              hasSize
                                ? {
                                    sizes: [],
                                  }
                                : {
                                    sku: '',          // <-- tambahin
                                    price: null,
                                    stock: null,
                                    sizes: [
                                      {
                                        name: '',
                                        sku: '',
                                        price: 0,
                                        stock: 0,
                                        isActive: true,
                                      },
                                    ],
                              }
                            )
                          }
                          className={`relative h-6 w-11 rounded-full transition-colors overflow-hidden shrink-0 ${hasSize ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${hasSize ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {!hasSize && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input label="Harga Variant (Rp)" type="number" value={String(variant.price ?? '')} onChange={(e) => updateVariant(vIdx, { price: parseFloat(e.target.value) || null })} placeholder="0" error={errors[`variant-price-${vIdx}`]} />
                          <Input label="Stok Variant" type="number" value={String(variant.stock ?? '')} onChange={(e) => updateVariant(vIdx, { stock: parseInt(e.target.value, 10) || 0 })} placeholder="0" />
                        </div>
                      )}

                      {hasSize && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ukuran</h5>
                            <Button size="sm" variant="outline" onClick={() => addSize(vIdx)}><Plus className="h-3.5 w-3.5" /> Tambah Size</Button>
                          </div>

                          {variant.sizes.map((size, sIdx) => (
                            <div key={sIdx} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-800/30">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-gray-400 shrink-0">S{sIdx + 1}</span>
                                <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">{size.name || 'Ukuran'}</span>
                                <button onClick={() => removeSize(vIdx, sIdx)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <Input label="Ukuran" value={size.name} onChange={(e) => updateSize(vIdx, sIdx, { name: e.target.value })} placeholder="cth. S, M, L, XL" error={errors[`size-name-${vIdx}-${sIdx}`]} />
                                <Input label="SKU" value={size.sku} onChange={(e) => updateSize(vIdx, sIdx, { sku: e.target.value })} placeholder="cth. AP-HP-BLK-S" error={errors[`size-sku-${vIdx}-${sIdx}`]} />
                                <Input label="Harga (Rp)" type="number" value={String(size.price)} onChange={(e) => updateSize(vIdx, sIdx, { price: parseFloat(e.target.value) || 0 })} placeholder="0" error={errors[`size-price-${vIdx}-${sIdx}`]} />
                                <Input label="Stok" type="number" value={String(size.stock)} onChange={(e) => updateSize(vIdx, sIdx, { stock: parseInt(e.target.value, 10) || 0 })} placeholder="0" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
