import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign, ShoppingCart, Package, Users, Clock, AlertTriangle,
  ArrowUpRight, TrendingUp, Activity,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { AreaChart, DonutChart } from '../components/charts/Charts';
import { api } from '../lib/api';
import type { Order } from '../lib/types';
import { formatCurrency, formatNumber, timeAgo } from '../lib/utils';

interface DashboardData {
  revenueToday: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueChart: { label: string; value: number }[];
  orderStatusCounts: { label: string; value: number; color: string }[];
  recentOrders: Order[];
  bestSellers: { id: string; name: string; image: string; unitsSold: number; revenue: number }[];
}

const statusBadgeColors: Record<string, 'amber' | 'blue' | 'green' | 'red'> = {
  pending: 'amber', processing: 'blue', completed: 'green', cancelled: 'red',
};

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getDashboard();
      setData(result);
    } catch {
      // error
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><CardSkeleton /></div>
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TableSkeleton rows={5} cols={4} />
          <TableSkeleton rows={5} cols={3} />
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Pendapatan Hari Ini', value: formatCurrency(data.revenueToday), icon: DollarSign, change: '+12.5%', up: true, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Pesanan', value: formatNumber(data.totalOrders), icon: ShoppingCart, change: '+8.2%', up: true, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
    { label: 'Total Produk', value: formatNumber(data.totalProducts), icon: Package, change: '+2.1%', up: true, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Total Pelanggan', value: formatNumber(data.totalCustomers), icon: Users, change: '+5.3%', up: true, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Pesanan Pending', value: formatNumber(data.pendingOrders), icon: Clock, change: '+4', up: true, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Stok Menipis', value: formatNumber(data.lowStockCount), icon: AlertTriangle, change: '-3', up: false, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} hover className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3 rotate-90" />}
                  {card.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Sales Chart + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Grafik Penjualan</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pendapatan 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-emerald-600">+12.5%</span>
            </div>
          </div>
          <AreaChart data={data.revenueChart} formatValue={(v) => `Rp${formatNumber(Math.round(v / 1000))}k`} />
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Status Pesanan</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Distribusi status pesanan</p>
          {data.orderStatusCounts.some((s) => s.value > 0) ? (
            <DonutChart data={data.orderStatusCounts} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada data</p>
          )}
        </Card>
      </div>

      {/* Recent Orders + Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pesanan Terbaru</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">5 pesanan terakhir</p>
            </div>
            <Badge color="blue">{data.recentOrders.length} baru</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Pesanan</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Pelanggan</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{order.order_number}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{order.customer_name}</td>
                    <td className="px-5 py-3"><Badge color={statusBadgeColors[order.order_status]} dot>{order.order_status}</Badge></td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Produk Terlaris</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Top 5 produk</p>
            </div>
            <Badge color="green">Trending</Badge>
          </div>
          <div className="p-5 space-y-3">
            {data.bestSellers.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-3 group">
                <span className="text-sm font-bold text-gray-300 dark:text-gray-600 w-6">{idx + 1}</span>
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{formatNumber(product.unitsSold)} terjual</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Aktivitas Terbaru</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Aksi terakhir di toko Anda</p>
          </div>
          <Activity className="h-4 w-4 text-gray-400" />
        </div>
        <div className="p-5">
          <RecentActivity />
        </div>
      </Card>
    </div>
  );
}

function RecentActivity() {
  const [logs, setLogs] = useState<{ id: string; actor: string; action: string; entity_type: string | null; entity_name: string | null; created_at: string }[]>([]);

  useEffect(() => {
    // Load from localStorage directly for activity logs
    const raw = localStorage.getItem('ecommerce_admin_data_v2');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        setLogs(data.activity_logs?.slice(0, 6) || []);
      } catch { /* */ }
    }
  }, []);

  return (
    <div className="space-y-1">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-semibold shrink-0">
            {log.actor.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              <span className="font-medium">{log.actor}</span> {log.action}{' '}
              <span className="text-gray-500">{log.entity_type}</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{log.entity_name}</span>
            </p>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{timeAgo(log.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
