import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Eye, ShoppingCart, Package, MapPin, Tag, Truck, X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Order } from '../lib/types';
import { formatCurrency, formatDate, formatDateTime, getInitials } from '../lib/utils';

type OrderStatus = Order['order_status'];
type PaymentStatus = Order['payment_status'];
type ShippingStatus = Order['shipping_status'];

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
const ORDER_STATUS_COLOR: Record<OrderStatus, 'amber' | 'blue' | 'green' | 'red'> = {
  pending: 'amber',
  processing: 'blue',
  completed: 'green',
  cancelled: 'red',
};
const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Lunas',
  pending: 'Pending',
  failed: 'Gagal',
};
const PAYMENT_STATUS_COLOR: Record<PaymentStatus, 'green' | 'amber' | 'red'> = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
};
const PER_PAGE = 8;

export function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Order | null>(null);
  const [detailOrderStatus, setDetailOrderStatus] = useState<OrderStatus>('pending');
  const [detailPaymentStatus, setDetailPaymentStatus] = useState<PaymentStatus>('pending');
  const [detailShippingStatus, setDetailShippingStatus] = useState<ShippingStatus>('unfulfilled');
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrders();
      setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [filtered, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const openDetail = useCallback((order: Order) => {
    setSelected(order);
    setDetailOrderStatus(order.order_status);
    setDetailPaymentStatus(order.payment_status);
    setDetailShippingStatus(order.shipping_status);
  }, []);

  const closeDetail = useCallback(() => {
    setSelected(null);
  }, []);

  const hasChanges = useMemo(() => {
    if (!selected) return false;
    return (
      detailOrderStatus !== selected.order_status ||
      detailPaymentStatus !== selected.payment_status ||
      detailShippingStatus !== selected.shipping_status
    );
  }, [selected, detailOrderStatus, detailPaymentStatus, detailShippingStatus]);

  const handleSave = useCallback(async () => {
    if (!selected || !hasChanges) return;
    setSaving(true);
    try {
      const updated = await api.updateOrder(selected.id, {
        order_status: detailOrderStatus,
        payment_status: detailPaymentStatus,
        shipping_status: detailShippingStatus,
      });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelected(updated);
      toast('Perubahan pesanan berhasil disimpan', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan perubahan', 'error');
    } finally {
      setSaving(false);
    }
  }, [selected, hasChanges, detailOrderStatus, detailPaymentStatus, detailShippingStatus, toast]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Cari nomor pesanan / pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:w-64"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
          className="sm:w-44"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Diproses</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </Select>
      </div>

      <Card>
        <CardHeader
          title="Daftar Pesanan"
          subtitle={`${filtered.length} pesanan ditemukan`}
        />

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : error ? (
          <EmptyState
            icon={<X className="h-7 w-7" />}
            title="Gagal memuat pesanan"
            description={error}
            action={<Button onClick={loadOrders} variant="outline" size="sm">Coba lagi</Button>}
          />
        ) : paged.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-7 w-7" />}
            title="Belum ada pesanan"
            description={search || statusFilter !== 'all' ? 'Tidak ada pesanan yang sesuai dengan filter Anda.' : 'Pesanan pelanggan akan muncul di sini.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    <th className="px-5 py-3">Nomor Pesanan</th>
                    <th className="px-5 py-3">Pelanggan</th>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Status Pesanan</th>
                    <th className="px-5 py-3">Status Pembayaran</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paged.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{o.order_number}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-xs font-semibold text-white shrink-0">
                            {getInitials(o.customer_name || '?')}
                          </div>
                          <span className="text-gray-700 dark:text-gray-200 truncate max-w-[160px]">{o.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(o.created_at)}</td>
                      <td className="px-5 py-3">
                        <Badge color={ORDER_STATUS_COLOR[o.order_status]} dot>{ORDER_STATUS_LABEL[o.order_status]}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={PAYMENT_STATUS_COLOR[o.payment_status]} dot>{PAYMENT_STATUS_LABEL[o.payment_status]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(o.total)}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => openDetail(o)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          aria-label="Lihat detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {paged.map((o) => (
                <button
                  key={o.id}
                  onClick={() => openDetail(o)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{o.order_number}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(o.total)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-[10px] font-semibold text-white shrink-0">
                      {getInitials(o.customer_name || '?')}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{o.customer_name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge color={ORDER_STATUS_COLOR[o.order_status]} dot>{ORDER_STATUS_LABEL[o.order_status]}</Badge>
                    <Badge color={PAYMENT_STATUS_COLOR[o.payment_status]} dot>{PAYMENT_STATUS_LABEL[o.payment_status]}</Badge>
                    <span className="text-xs text-gray-400">{formatDate(o.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Halaman {safePage} dari {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={closeDetail}
        title={selected ? `Detail ${selected.order_number}` : 'Detail Pesanan'}
        subtitle={selected ? formatDateTime(selected.created_at) : undefined}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeDetail}>Tutup</Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-6">
            {/* Customer & Shipping info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Informasi Pelanggan</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-sm font-semibold text-white shrink-0">
                    {getInitials(selected.customer_name || '?')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{selected.customer_name}</p>
                    {selected.customer?.email && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selected.customer.email}</p>}
                  </div>
                </div>
                {selected.customer?.phone && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selected.customer.phone}</p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Alamat Pengiriman
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {selected.shipping_address || 'Alamat pengiriman belum tersedia'}
                </p>
                {selected.tracking_number && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 px-3 py-2">
                    <Truck className="h-4 w-4 text-purple-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wide">Nomor Resi</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{selected.tracking_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
                <Package className="h-4 w-4" /> Item Pesanan
              </h4>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2.5">Produk</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Harga</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selected.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.name}</td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order summary */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Ringkasan Pesanan</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(selected.subtotal)}</span>
                </div>
                {selected.coupon_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> Kupon
                    </span>
                    <span className="text-brand-600 dark:text-brand-400 font-medium">{selected.coupon_code}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Diskon</span>
                  <span className="text-red-600 dark:text-red-400">- {formatCurrency(selected.discount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Pajak</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(selected.tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Ongkir</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(selected.shipping)}</span>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(selected.total)}</span>
                </div>
              </div>
            </div>

            {/* Status selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Status Pesanan" value={detailOrderStatus} onChange={(e) => setDetailOrderStatus(e.target.value as OrderStatus)}>
                <option value="pending">Pending</option>
                <option value="processing">Diproses</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </Select>
              <Select label="Status Pembayaran" value={detailPaymentStatus} onChange={(e) => setDetailPaymentStatus(e.target.value as PaymentStatus)}>
                <option value="paid">Lunas</option>
                <option value="pending">Pending</option>
                <option value="failed">Gagal</option>
              </Select>
              <Select label="Status Pengiriman" value={detailShippingStatus} onChange={(e) => setDetailShippingStatus(e.target.value as ShippingStatus)}>
                <option value="unfulfilled">Belum Dikirim</option>
                <option value="shipped">Dikirim</option>
                <option value="delivered">Tiba</option>
              </Select>
            </div>
            {!hasChanges && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">Tidak ada perubahan yang belum disimpan</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
