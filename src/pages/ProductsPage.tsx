import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodResult, catResult] = await Promise.all([
        api.getProducts({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        }),
        api.getCategories({ limit: 100 }),
      ]);
      setProducts(prodResult.items);
      setTotalItems(prodResult.pagination.totalItems);
      setCategories(catResult.items);
      setSelectedIds([]);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal memuat produk', 'error');
    }
    setLoading(false);
  }, [page, search, statusFilter, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const displayedProducts = categoryFilter === 'all'
    ? products
    : products.filter((p) => p.category?._id === categoryFilter);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const handleSave = async (formPayload: {
    
    name: string; description: string; category: string;
    isVariantMode: boolean; sku: string; price: string; stock: string;
    variants: ProductVariant[];
    newImages: File[]; existingImages: string[]; imageOrder: string[];
    newVideo: File | null; removeVideo: boolean;
    isActive: boolean;
    
  }) => {
    console.log('category yang dikirim:', formPayload.category);
    try {
      const payload = {
        name: formPayload.name,
        description: formPayload.description,
        category: formPayload.category,
        sku: formPayload.isVariantMode ? '' : formPayload.sku,
        price: formPayload.isVariantMode ? null : (parseFloat(formPayload.price) || 0),
        stock: formPayload.isVariantMode ? null : (parseInt(formPayload.stock, 10) || 0),
        variants: formPayload.isVariantMode ? formPayload.variants : [],
        isActive: formPayload.isActive,
        images: formPayload.newImages,
        video: formPayload.newVideo,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct._id, payload);
        if (formPayload.imageOrder.length > 0) {
          await api.reorderProductImages(editingProduct._id, formPayload.imageOrder);
        }
        toast(formPayload.isActive ? 'Produk berhasil dipublish' : 'Produk disimpan sebagai draft', 'success');
      } else {
        await api.createProduct(payload);
        toast(formPayload.isActive ? 'Produk berhasil dipublish' : 'Produk disimpan sebagai draft', 'success');
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
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'draft'); setPage(1); }} className="w-auto whitespace-nowrap">
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="draft">Draft</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <Button variant="danger" onClick={() => setBulkDeleteOpen(true)} className="shrink-0">
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
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-[35%]">Produk</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell w-28">Kategori</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell w-44">Range Harga</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-24">Total Stok</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell w-28">Dibuat</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell w-28">Edit</th>
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
                        <td className="px-4 py-3 max-w-0">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                              {product.thumbnail ? (
                                <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={product.name}>{product.name}</p>
                                {!product.isActive && (
                                  <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Draft
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{hasVariant ? `${product.variants.length} variant` : 'Tanpa variant'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">{product.category?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">{priceRange}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${product.totalStock === 0 ? 'text-red-500' : product.totalStock <= 10 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {formatNumber(product.totalStock)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{formatDate(product.createdAt)}</td>
                        <td className="px-4 py-3 w-20 shrink-0">
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                          {!product.isActive && (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Draft
                            </span>
                          )}
                        </div>
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

// ─────────────────────────────────────────────
// Currency input helper
// ─────────────────────────────────────────────
function parseCurrencyInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return digits === '' ? '' : String(parseInt(digits, 10));
}

interface CurrencyInputProps {
  label: string;
  value: string;
  onChange: (cleanValue: string) => void;
  placeholder?: string;
  error?: string;
}

function CurrencyInput({ label, value, onChange, placeholder = '0', error }: CurrencyInputProps) {
  const displayValue = value === '' ? '' : parseInt(value, 10).toLocaleString('id-ID');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseCurrencyInput(e.target.value));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    onChange(parseCurrencyInput(e.clipboardData.getData('text')));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={`w-full h-10 rounded-lg border px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all [color-scheme:light] dark:[color-scheme:dark] ${
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
            : 'border-gray-200 dark:border-gray-700'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// BulkStockSetter
// ─────────────────────────────────────────────
function BulkStockSetter({ onApply }: { onApply: (val: number) => void }) {
  const [bulkStock, setBulkStock] = useState('');
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    const val = parseInt(bulkStock, 10);
    if (isNaN(val) || val < 0) return;
    onApply(val);
    setApplied(true);
    setTimeout(() => setApplied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 px-3 py-2">
      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium shrink-0">Set semua stok:</span>
      <input
        type="number"
        min={0}
        value={bulkStock}
        onChange={(e) => { setBulkStock(e.target.value); setApplied(false); }}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        placeholder="0"
        className="w-20 h-7 rounded-md border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-900 px-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
      />
      <button
        type="button"
        onClick={handleApply}
        disabled={bulkStock === ''}
        className={`h-7 px-3 rounded-md text-xs font-semibold transition-all shrink-0 ${
          applied ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40'
        }`}
      >
        {applied ? '✓ Diterapkan' : 'Terapkan'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Unsaved changes guard hook
// ─────────────────────────────────────────────
function useUnsavedGuard(isDirty: boolean) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingCallback = useRef<(() => void) | null>(null);

  const guardedClose = useCallback((onConfirm: () => void) => {
    if (isDirty) {
      pendingCallback.current = onConfirm;
      setConfirmOpen(true);
    } else {
      onConfirm();
    }
  }, [isDirty]);

  const confirmLeave = () => {
    setConfirmOpen(false);
    pendingCallback.current?.();
    pendingCallback.current = null;
  };

  const cancelLeave = () => {
    setConfirmOpen(false);
    pendingCallback.current = null;
  };

  return { confirmOpen, guardedClose, confirmLeave, cancelLeave };
}

// ─────────────────────────────────────────────
// Draggable image type
// ─────────────────────────────────────────────
interface DraggableImage {
  type: 'existing' | 'new';
  url: string;
  file?: File;
  originalUrl?: string;
}

interface FormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: {
    name: string; description: string; category: string;
    isVariantMode: boolean; sku: string; price: string; stock: string;
    variants: ProductVariant[];
    newImages: File[]; existingImages: string[]; imageOrder: string[];
    newVideo: File | null; removeVideo: boolean;
    isActive: boolean;
  }) => void;
}

function ProductFormModal({ product, categories, onClose, onSave }: FormModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.category?._id || '');
  const [description, setDescription] = useState(product?.description || '');

  const [imageList, setImageList] = useState<DraggableImage[]>(() =>
    (product?.images || []).map((url) => ({ type: 'existing', url, originalUrl: url }))
  );
  const [removedImageIndexes, setRemovedImageIndexes] = useState<number[]>([]);
  const dragIndexRef = useRef<number | null>(null);

  const handleImageFiles = (files: File[]) => {
    const newEntries: DraggableImage[] = files.map((file) => ({
      type: 'new',
      url: URL.createObjectURL(file),
      file,
    }));
    setImageList((prev) => [...prev, ...newEntries]);
  };

  const handleRemoveImage = (idx: number) => {
    const item = imageList[idx];
    if (item.type === 'existing' && item.originalUrl) {
      const origIdx = (product?.images || []).indexOf(item.originalUrl);
      if (origIdx !== -1) {
        setRemovedImageIndexes((prev) => [...prev, origIdx]);
      }
    } else if (item.type === 'new' && item.url) {
      URL.revokeObjectURL(item.url);
    }
    setImageList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => { dragIndexRef.current = idx; };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === idx) return;
    setImageList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    dragIndexRef.current = idx;
  };

  const handleDragEnd = () => { dragIndexRef.current = null; };

  const [newVideo, setNewVideo] = useState<File[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(product?.video || null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [thumbnail, setThumbnail] = useState(product?.thumbnail || '');
  const [isVariantMode, setIsVariantMode] = useState((product?.variants?.length ?? 0) > 0);
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [stock, setStock] = useState(String(product?.stock ?? ''));
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);

  useEffect(() => {
  console.log('=== PRODUCT VARIANTS ===');
  console.log(variants);
}, [variants]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [openVariantIdx, setOpenVariantIdx] = useState<number | null>(null);

  const initialSnapshot = useRef({
    name: product?.name || '',
    categoryId: product?.category?._id || '',
    description: product?.description || '',
    price: String(product?.price ?? ''),
    stock: String(product?.stock ?? ''),
    sku: product?.sku || '',
    imageListLength: (product?.images || []).length,
    variantsJson: JSON.stringify(product?.variants || []),
  });

  const isDirty = (() => {
    const s = initialSnapshot.current;
    return (
      name !== s.name ||
      categoryId !== s.categoryId ||
      description !== s.description ||
      price !== s.price ||
      stock !== s.stock ||
      sku !== s.sku ||
      imageList.length !== s.imageListLength ||
      JSON.stringify(variants) !== s.variantsJson ||
      newVideo.length > 0 ||
      removeVideo
    );
  })();

  const { confirmOpen, guardedClose, confirmLeave, cancelLeave } = useUnsavedGuard(isDirty);
  const handleClose = () => guardedClose(onClose);

  const addVariant = () => {
    setVariants((prev) => [...prev, { name: '', sku: '', price: null, stock: null, sizes: [], isActive: true, image: '', imageKey: '' }]);
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

  const handleSubmit = async (submitAsActive: boolean) => {
    if (!validate()) {
      toast('Periksa kembali data yang diisi', 'error');
      return;
    }

    setSaving(true);
    try {
      if (product) {
        for (const index of removedImageIndexes.sort((a, b) => b - a)) {
          await api.removeProductImage(product._id, index);
        }
        if (removeVideo) {
          await api.removeProductVideo(product._id);
        }
      }

      const orderedExistingUrls = imageList
        .filter((img) => img.type === 'existing')
        .map((img) => img.originalUrl as string);

      const orderedNewFiles = imageList
        .filter((img) => img.type === 'new')
        .map((img) => img.file as File);

      await onSave({
        name: name.trim(),
        description: description.trim(),
        category: categoryId,
        isVariantMode,
        sku: sku.trim(),
        price,
        stock,
        variants,
        newImages: orderedNewFiles,
        existingImages: orderedExistingUrls,
        imageOrder: orderedExistingUrls,
        newVideo: newVideo[0] || null,
        removeVideo,
        isActive: submitAsActive,
      });

      setRemoveVideo(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open
        onClose={handleClose}
        title={product ? 'Edit Produk' : 'Tambah Produk'}
        subtitle={product ? product.name : 'Buat produk baru dalam katalog'}
        size="xl"
        footer={
          <div className="flex items-center justify-between gap-2 w-full">
            <Button variant="outline" onClick={handleClose}>Batal</Button>
            <div className="flex items-center gap-2">
              {product && product.isActive ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(false)}
                    disabled={saving}
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    Arsipkan ke Draft
                  </Button>
                  <Button onClick={() => handleSubmit(true)} disabled={saving}>
                    {saving ? 'Menyimpan...' : <><Save className="h-4 w-4" /> Simpan</>}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => handleSubmit(false)} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Draft'}
                  </Button>
                  <Button onClick={() => handleSubmit(true)} disabled={saving}>
                    {saving ? 'Menyimpan...' : <><Save className="h-4 w-4" /> Publish</>}
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6 pb-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gambar Produk
                <span className="ml-1 text-gray-400 font-normal">(drag untuk ubah urutan)</span>
              </label>

              {imageList.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {imageList.map((img, idx) => {
                    const isThumbnail = img.type === 'existing' && img.originalUrl === thumbnail;
                    return (
                      <div
                        key={img.url}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className="relative group aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-400 cursor-grab active:cursor-grabbing transition-all select-none"
                        style={{ boxShadow: isThumbnail ? '0 0 0 2px #6366f1' : undefined }}
                      >
                        <img src={img.url} alt="" className="h-full w-full object-cover pointer-events-none" />

                        {isThumbnail && (
                          <span className="absolute bottom-0 left-0 right-0 bg-brand-600/80 text-white text-[10px] text-center py-0.5 font-medium">
                            Thumbnail
                          </span>
                        )}

                        {img.type === 'existing' && !isThumbnail && product && (
                          <button
                            onClick={async () => {
                              await api.setProductThumbnail(product._id, img.originalUrl!);
                              setThumbnail(img.originalUrl!);
                            }}
                            className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set thumbnail
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                        >
                          ×
                        </button>

                        <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <FileUpload
                type="image"
                multiple
                maxFiles={10 - imageList.length}
                label=""
                files={[]}
                onFilesChange={handleImageFiles}
                existing={[]}
                thumbnail={undefined}
                onSetThumbnail={() => {}}
                onRemoveExisting={() => {}}
              />
            </div>

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
              <CurrencyInput label="Harga (Rp)" value={price} onChange={setPrice} placeholder="0" error={errors.price} />
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
                if (!variant.sizes) variant.sizes = [];
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
                        <div className="flex items-center gap-4">

                          {/* Gambar Variant */}
                          <div className="shrink-0">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Gambar
                            </label>
                            <div className="relative h-20 w-20 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 group cursor-pointer">
                              {!variant.image && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                                  <Package className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                                  <span className="text-[9px] text-gray-400 font-medium text-center leading-tight px-1">Gambar</span>
                                </div>
                              )}

                              {variant.image && (
  <img
    src={(variant.image as any) instanceof File ? URL.createObjectURL(variant.image as any) : variant.image}
    alt=""
    className="h-full w-full object-cover"
  />
)}

                              {variant.image && (
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    if (product) {
  try {
    await api.removeVariantImage(product._id, vIdx);
    toast('Gambar dihapus', 'success');
  } catch {
    toast('Gagal menghapus gambar', 'error');
  }
}
                                    updateVariant(vIdx, { image: '', imageKey: '' });
                                  }}
                                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold z-10"
                                >
                                  ×
                                </button>
                              )}

                              {/* ── FIXED: hanya satu handler upload, cek _id untuk bedakan persisted vs baru ── */}
                              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const isPersistedVariant = Boolean(product?._id);

                                    console.log('CHECK VARIANT:', {
                                      productId: product?._id,
                                      variantId: variant._id,
                                      isPersistedVariant,
                                    });

                                    if (isPersistedVariant && product) {
                                      // Variant sudah tersimpan di DB → upload langsung
                                      try {
                                        const result = await api.setVariantImage(product._id, vIdx, file);
                                        console.log('UPLOAD VARIANT RESULT:', result);
                                        updateVariant(vIdx, {
                                          image: result.variants[vIdx].image,
                                          imageKey: result.variants[vIdx].imageKey,
                                        });
                                        toast('Gambar variant berhasil diupload', 'success');
                                      } catch {
                                        toast('Gagal upload gambar variant', 'error');
                                      }
                                    } else {
                                      // Variant baru belum disave → simpan preview lokal dulu
                                      updateVariant(vIdx, { image: file as any, imageKey: '' });
                                      toast('Gambar akan diupload saat produk disimpan', 'info');
                                    }

                                    e.target.value = '';
                                  }}
                                />
                                {variant.image ? (
                                  <Edit className="h-4 w-4 text-white" />
                                ) : (
                                  <Plus className="h-4 w-4 text-white" />
                                )}
                              </label>
                            </div>
                          </div>

                          {/* Fields variant */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Nama Variant"
                              value={variant.name}
                              onChange={(e) => updateVariant(vIdx, { name: e.target.value })}
                              placeholder="cth. Hitam, Merah"
                              error={errors[`variant-name-${vIdx}`]}
                            />
                            {!hasSize && (
                              <Input
                                label="SKU Variant"
                                value={variant.sku}
                                onChange={(e) => updateVariant(vIdx, { sku: e.target.value })}
                                placeholder="cth. AP-HP-BLK"
                                error={errors[`variant-sku-${vIdx}`]}
                              />
                            )}
                          </div>
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
                                  ? { sizes: [] }
                                  : { sku: '', price: null, stock: null, sizes: [{ name: '', sku: '', price: 0, stock: 0, isActive: true }] }
                              )
                            }
                            className={`relative h-6 w-11 rounded-full transition-colors overflow-hidden shrink-0 ${hasSize ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                          >
                            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${hasSize ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {!hasSize && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CurrencyInput
                              label="Harga Variant (Rp)"
                              value={String(variant.price ?? '')}
                              onChange={(v) => updateVariant(vIdx, { price: v === '' ? null : parseInt(v, 10) })}
                              placeholder="0"
                              error={errors[`variant-price-${vIdx}`]}
                            />
                            <Input
                              label="Stok Variant"
                              type="number"
                              value={String(variant.stock ?? '')}
                              onChange={(e) => updateVariant(vIdx, { stock: parseInt(e.target.value, 10) || 0 })}
                              placeholder="0"
                            />
                          </div>
                        )}

                        {hasSize && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ukuran</h5>
                              <Button size="sm" variant="outline" onClick={() => addSize(vIdx)}><Plus className="h-3.5 w-3.5" /> Tambah Size</Button>
                            </div>

                            <BulkStockSetter
                              onApply={(val) => {
                                setVariants((prev) =>
                                  prev.map((v, i) =>
                                    i === vIdx ? { ...v, sizes: v.sizes.map((s) => ({ ...s, stock: val })) } : v
                                  )
                                );
                              }}
                            />

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
                                  <CurrencyInput
                                    label="Harga (Rp)"
                                    value={String(size.price || '')}
                                    onChange={(v) => updateSize(vIdx, sIdx, { price: v === '' ? 0 : parseInt(v, 10) })}
                                    placeholder="0"
                                    error={errors[`size-price-${vIdx}-${sIdx}`]}
                                  />
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

      <Modal
        open={confirmOpen}
        onClose={cancelLeave}
        title="Keluar tanpa menyimpan?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={cancelLeave}>Tetap di sini</Button>
            <Button variant="danger" onClick={confirmLeave}>Keluar</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Kamu punya perubahan yang belum disimpan. Kalau keluar sekarang, semua perubahan akan hilang.
        </p>
      </Modal>
    </>
  );
}