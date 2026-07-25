import { useEffect, useState, useCallback, useMemo } from 'react';
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
import type { Product, Category, Variant, Size } from '../lib/types';
import { formatCurrency, formatNumber, formatDate, generateId } from '../lib/utils';

const PAGE_SIZE = 8;

export function ProductsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let r = [...products];
    if (search) r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== 'all') r = r.filter((p) => p.category_id === categoryFilter);
    if (statusFilter !== 'all') r = r.filter((p) => p.status === statusFilter);
    return r;
  }, [products, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSave = async (data: Partial<Product>) => {
    if (editingProduct) {
      await api.updateProduct(editingProduct.id, data);
      toast('Produk berhasil diperbarui', 'success');
    } else {
      await api.createProduct(data);
      toast('Produk berhasil dibuat', 'success');
    }
    setModalOpen(false);
    setEditingProduct(null);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteProduct(deleteTarget.id);
    toast('Produk berhasil dihapus', 'success');
    setDeleteTarget(null);
    loadData();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
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
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-auto whitespace-nowrap">
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </Select>
        </div>
        <Button onClick={() => { setEditingProduct(null); setModalOpen(true); }} className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : pageData.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="Tidak ada produk"
            description="Coba sesuaikan filter atau tambahkan produk baru."
            action={<Button onClick={() => { setEditingProduct(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Tambah Produk</Button>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Produk</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Kategori</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Range Harga</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Total Stok</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Dibuat</th>
                    <th className="px-4 py-3 w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((product) => {
                    const stock = getProductTotalStock(product);
                    const priceRange = getProductPriceRange(product);
                    return (
                      <tr key={product.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.has_variant ? `${product.variants.length} variant` : 'Tanpa variant'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">{product.category?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">{priceRange}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${stock === 0 ? 'text-red-500' : stock <= 10 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {formatNumber(stock)}
                          </span>
                        </td>
                        <td className="px-4 py-3"><Badge color={product.status === 'active' ? 'green' : 'gray'} dot>{product.status === 'active' ? 'Aktif' : 'Nonaktif'}</Badge></td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{formatDate(product.created_at)}</td>
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

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {pageData.map((product) => {
                const stock = getProductTotalStock(product);
                return (
                  <div key={product.id} className="px-4 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category?.name || '-'} - {product.has_variant ? `${product.variants.length} variant` : 'Tanpa variant'}</p>
                      </div>
                      <Badge color={product.status === 'active' ? 'green' : 'gray'} dot>{product.status === 'active' ? 'Aktif' : 'Nonaktif'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">Stok: <span className={`font-medium ${stock === 0 ? 'text-red-500' : stock <= 10 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>{formatNumber(stock)}</span></span>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <span className="text-gray-500 text-xs">{formatDate(product.created_at)}</span>
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

        {/* Pagination */}
        {!loading && pageData.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 hidden sm:block">
              Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} produk
            </p>
            <div className="flex items-center gap-1 ml-auto sm:ml-0">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Product Form Modal */}
      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Produk"
        size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button><Button variant="danger" onClick={handleDelete}>Hapus</Button></>}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Yakin ingin menghapus <span className="font-semibold text-gray-900 dark:text-gray-100">{deleteTarget?.name}</span>? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}

// ===== Helpers =====
function getProductTotalStock(p: Product): number {
  if (p.has_variant) {
    return p.variants.reduce((sum, v) => sum + (v.has_size ? v.sizes.reduce((s, sz) => s + sz.stock, 0) : (v.stock ?? 0)), 0);
  }
  return p.stock ?? 0;
}

function getProductPriceRange(p: Product): string {
  const prices: number[] = [];
  if (p.has_variant) {
    p.variants.forEach((v) => {
      if (v.has_size) v.sizes.forEach((s) => prices.push(s.price));
      else if (v.price != null) prices.push(v.price);
    });
  } else if (p.price != null) {
    prices.push(p.price);
  }
  if (prices.length === 0) return '-';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

// ===== Product Form Modal (3-level nesting) =====
interface FormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
}

function ProductFormModal({ product, categories, onClose, onSave }: FormModalProps) {
  const { toast } = useToast();
  // Level 1 - Product
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [description, setDescription] = useState(product?.description || '');
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [video, setVideo] = useState<string[]>(product?.video ? [product.video] : []);
  const [hasVariant, setHasVariant] = useState(product?.has_variant || false);
  const [productSku, setProductSku] = useState(product?.sku || '');
  const [productPrice, setProductPrice] = useState(String(product?.price ?? ''));
  const [productStock, setProductStock] = useState(String(product?.stock ?? ''));
  const [status, setStatus] = useState<Product['status']>(product?.status || 'active');
  const [variants, setVariants] = useState<Variant[]>(product?.variants || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Accordion state
  const [openVariant, setOpenVariant] = useState<string | null>(null);
  const [openSize, setOpenSize] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'variant' | 'size'; variantId?: string; sizeId?: string; name: string } | null>(null);

  const addVariant = () => {
    const v: Variant = {
      id: generateId(), name: '', sku: '', images: [], status: 'active',
      has_size: false, price: null, stock: null, sizes: [],
    };
    setVariants((prev) => [...prev, v]);
    setOpenVariant(v.id);
  };

  const updateVariant = (id: string, updates: Partial<Variant>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const addSize = (variantId: string) => {
    const sz: Size = { id: generateId(), name: '', sku: '', price: 0, stock: 0, images: [], status: 'active' };
    setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, sizes: [...v.sizes, sz] } : v)));
    setOpenSize(`${variantId}-${sz.id}`);
  };

  const updateSize = (variantId: string, sizeId: string, updates: Partial<Size>) => {
    setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, sizes: v.sizes.map((s) => (s.id === sizeId ? { ...s, ...updates } : s)) } : v)));
  };

  const removeSize = (variantId: string, sizeId: string) => {
    setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, sizes: v.sizes.filter((s) => s.id !== sizeId) } : v)));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama produk harus diisi';
    if (!categoryId) e.category = 'Kategori harus dipilih';
    if (!hasVariant) {
      if (!productSku.trim()) e.productSku = 'SKU produk harus diisi';
      if (!productPrice) e.productPrice = 'Harga produk harus diisi';
    }
    variants.forEach((v) => {
      if (!v.name.trim()) e[`variant-name-${v.id}`] = 'Nama variant harus diisi';
      if (!v.sku.trim()) e[`variant-sku-${v.id}`] = 'SKU variant harus diisi';
      if (!v.has_size && v.price == null) e[`variant-price-${v.id}`] = 'Harga variant harus diisi';
      v.sizes.forEach((s) => {
        if (!s.name.trim()) e[`size-name-${s.id}`] = 'Nama size harus diisi';
        if (!s.sku.trim()) e[`size-sku-${s.id}`] = 'SKU size harus diisi';
        if (!s.price) e[`size-price-${s.id}`] = 'Harga size harus diisi';
      });
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast('Periksa kembali data yang diisi', 'error'); return; }
    setSaving(true);
    await onSave({
      name: name.trim(), category_id: categoryId, description: description.trim(),
      images, video: video[0] || null, has_variant: hasVariant, status,
      sku: hasVariant ? null : productSku.trim(),
      price: hasVariant ? null : parseFloat(productPrice) || null,
      stock: hasVariant ? null : parseInt(productStock) || 0,
      variants: hasVariant ? variants : [],
    });
    setSaving(false);
  };

  return (
    <>
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
          {/* Product Images & Video */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FileUpload type="image" multiple value={images} onChange={setImages} label="Gambar Produk" maxFiles={8} />
            <FileUpload type="video" value={video} onChange={setVideo} label="Video Produk (opsional)" />
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input label="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Headphone Wireless" error={errors.name} />
            </div>
            <div>
              <Select label="Kategori" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Pilih kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>
          </div>
          <Textarea label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Deskripsi produk..." />

          {/* Variant Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Produk Memiliki Variant</p>
              <p className="text-xs text-gray-500 mt-0.5">Aktifkan jika produk memiliki varian seperti warna/ukuran</p>
            </div>
            <button
              type="button"
              onClick={() => setHasVariant(!hasVariant)}
              className={`relative h-6 w-11 rounded-full transition-colors overflow-hidden ${hasVariant ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${hasVariant ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* No Variant: Product SKU, Price, Stock */}
          {!hasVariant && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
              <Input label="SKU Produk" value={productSku} onChange={(e) => setProductSku(e.target.value)} placeholder="cth. AP-HP-001" error={errors.productSku} />
              <Input label="Harga (Rp)" type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="0" error={errors.productPrice} />
              <Input label="Stok" type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} placeholder="0" />
            </div>
          )}

          {/* Has Variant: Variant accordion */}
          {hasVariant && (
            <div className="space-y-3 animate-fade-in">
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

              {variants.map((variant, vIdx) => (
                <div key={variant.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Variant Header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                    <button onClick={() => setOpenVariant(openVariant === variant.id ? null : variant.id)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {openVariant === variant.id ? <ChevronDown className="h-4 w-4" /> : <ChevronR className="h-4 w-4" />}
                    </button>
                    <span className="text-xs font-bold text-gray-400">V{vIdx + 1}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 truncate">{variant.name || 'Variant tanpa nama'}</span>
                    {variant.has_size && <Badge color="blue">{variant.sizes.length} size</Badge>}
                    <Badge color={variant.status === 'active' ? 'green' : 'gray'}>{variant.status === 'active' ? 'Aktif' : 'Nonaktif'}</Badge>
                    <button onClick={() => setConfirmDelete({ type: 'variant', variantId: variant.id, name: variant.name || `Variant ${vIdx + 1}` })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Variant Body */}
                  {openVariant === variant.id && (
                    <div className="p-4 space-y-4 animate-slide-up">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nama Variant" value={variant.name} onChange={(e) => updateVariant(variant.id, { name: e.target.value })} placeholder="cth. Hitam, Merah" error={errors[`variant-name-${variant.id}`]} />
                        <Input label="SKU Variant" value={variant.sku} onChange={(e) => updateVariant(variant.id, { sku: e.target.value })} placeholder="cth. AP-HP-BLK" error={errors[`variant-sku-${variant.id}`]} />
                      </div>

                      <FileUpload type="image" multiple value={variant.images} onChange={(urls) => updateVariant(variant.id, { images: urls })} label="Gambar Variant" maxFiles={5} />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                          <Select value={variant.status} onChange={(e) => updateVariant(variant.id, { status: e.target.value as 'active' | 'inactive' })}>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center justify-between w-full rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Gunakan Size</p>
                              <p className="text-xs text-gray-500">Aktifkan untuk ukuran</p>
                            </div>
                            <button type="button" onClick={() => updateVariant(variant.id, { has_size: !variant.has_size })} className={`relative h-6 w-11 rounded-full transition-colors overflow-hidden ${variant.has_size ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${variant.has_size ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Without size: price & stock */}
                      {!variant.has_size && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                          <Input label="Harga Variant (Rp)" type="number" value={String(variant.price ?? '')} onChange={(e) => updateVariant(variant.id, { price: parseFloat(e.target.value) || null })} placeholder="0" error={errors[`variant-price-${variant.id}`]} />
                          <Input label="Stok Variant" type="number" value={String(variant.stock ?? '')} onChange={(e) => updateVariant(variant.id, { stock: parseInt(e.target.value) || 0 })} placeholder="0" />
                        </div>
                      )}

                      {/* With size: Size accordion */}
                      {variant.has_size && (
                        <div className="space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</h5>
                            <Button size="sm" variant="outline" onClick={() => addSize(variant.id)}><Plus className="h-3.5 w-3.5" /> Tambah Size</Button>
                          </div>

                          {variant.sizes.map((size, sIdx) => (
                            <div key={size.id} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/30">
                                <button onClick={() => setOpenSize(openSize === `${variant.id}-${size.id}` ? null : `${variant.id}-${size.id}`)} className="p-1 text-gray-400">
                                  {openSize === `${variant.id}-${size.id}` ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronR className="h-3.5 w-3.5" />}
                                </button>
                                <span className="text-xs font-bold text-gray-400">S{sIdx + 1}</span>
                                <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">{size.name || 'Size tanpa nama'}</span>
                                <Badge color={size.status === 'active' ? 'green' : 'gray'}>{size.status === 'active' ? 'Aktif' : 'Nonaktif'}</Badge>
                                <button onClick={() => setConfirmDelete({ type: 'size', variantId: variant.id, sizeId: size.id, name: size.name || `Size ${sIdx + 1}` })} className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              {openSize === `${variant.id}-${size.id}` && (
                                <div className="p-3 space-y-3 animate-slide-up">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input label="Nama Size" value={size.name} onChange={(e) => updateSize(variant.id, size.id, { name: e.target.value })} placeholder="cth. 42mm, XL" error={errors[`size-name-${size.id}`]} />
                                    <Input label="SKU Size" value={size.sku} onChange={(e) => updateSize(variant.id, size.id, { sku: e.target.value })} placeholder="cth. AP-HP-BLK-42" error={errors[`size-sku-${size.id}`]} />
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input label="Harga Size (Rp)" type="number" value={String(size.price)} onChange={(e) => updateSize(variant.id, size.id, { price: parseFloat(e.target.value) || 0 })} placeholder="0" error={errors[`size-price-${size.id}`]} />
                                    <Input label="Stok Size" type="number" value={String(size.stock)} onChange={(e) => updateSize(variant.id, size.id, { stock: parseInt(e.target.value) || 0 })} placeholder="0" />
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Select label="Status" value={size.status} onChange={(e) => updateSize(variant.id, size.id, { status: e.target.value as 'active' | 'inactive' })}>
                                      <option value="active">Aktif</option>
                                      <option value="inactive">Nonaktif</option>
                                    </Select>
                                  </div>
                                  <FileUpload type="image" multiple value={size.images} onChange={(urls) => updateSize(variant.id, size.id, { images: urls })} label="Gambar Size" maxFiles={3} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Product Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status Produk</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as Product['status'])}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation for Variant/Size */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={confirmDelete?.type === 'variant' ? 'Hapus Variant' : 'Hapus Size'}
        size="sm"
        footer={<><Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button><Button variant="danger" onClick={() => {
          if (confirmDelete?.type === 'variant' && confirmDelete.variantId) removeVariant(confirmDelete.variantId);
          else if (confirmDelete?.type === 'size' && confirmDelete.variantId && confirmDelete.sizeId) removeSize(confirmDelete.variantId, confirmDelete.sizeId);
          toast(`${confirmDelete?.type === 'variant' ? 'Variant' : 'Size'} dihapus`, 'success');
          setConfirmDelete(null);
        }}>Hapus</Button></>}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Yakin ingin menghapus <span className="font-semibold text-gray-900 dark:text-gray-100">{confirmDelete?.name}</span>?
        </p>
      </Modal>
    </>
  );
}
