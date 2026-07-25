import { ReactNode, useState } from 'react';
import { Sidebar, PageKey } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

const pageMeta: Record<PageKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Selamat datang kembali, berikut ringkasan toko Anda' },
  products: { title: 'Produk', subtitle: 'Kelola katalog produk Anda' },
  orders: { title: 'Pesanan', subtitle: 'Lacak dan proses pesanan pelanggan' },
  customers: { title: 'Pelanggan', subtitle: 'Lihat dan kelola data pelanggan' },
  categories: { title: 'Kategori', subtitle: 'Atur produk ke dalam kategori' },
  inventory: { title: 'Inventory', subtitle: 'Pantau level stok dan riwayat perubahan' },
  admins: { title: 'Manajemen Admin', subtitle: 'Kelola akun admin' },
  settings: { title: 'Pengaturan', subtitle: 'Konfigurasi tampilan dashboard' },
};

export function Layout({ current, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = pageMeta[current];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar
        current={current}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
