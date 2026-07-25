import type {
  Product, Category, Customer, Order, Admin,
  InventoryHistory, ActivityLog,
} from './types';
import { generateId, slugify } from './utils';

// ===== Simulated API layer using localStorage =====
// Replace these functions with real API calls when backend is ready.

const STORAGE_KEY = 'ecommerce_admin_data_v2';

interface DBData {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  admins: Admin[];
  inventory_history: InventoryHistory[];
  activity_logs: ActivityLog[];
}

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadData(): DBData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw) as DBData; } catch { /* fall through to seed */ }
  }
  const seeded = seedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveData(data: DBData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function logActivity(actor: string, action: string, entityType: string, entityName: string, data: DBData): void {
  data.activity_logs.unshift({
    id: generateId(),
    actor,
    action,
    entity_type: entityType,
    entity_name: entityName,
    created_at: new Date().toISOString(),
  });
  if (data.activity_logs.length > 50) data.activity_logs = data.activity_logs.slice(0, 50);
}

function seedData(): DBData {
  const now = new Date();
  const cats: Category[] = [
    { id: 'cat-1', name: 'Elektronik', slug: 'elektronik', description: 'Perangkat elektronik dan gadget terbaru.', image: null, created_at: now.toISOString() },
    { id: 'cat-2', name: 'Fashion', slug: 'fashion', description: 'Pakaian, sepatu, dan aksesoris tren terkini.', image: null, created_at: now.toISOString() },
    { id: 'cat-3', name: 'Rumah & Living', slug: 'rumah-living', description: 'Perabot dan dekorasi untuk rumah nyaman.', image: null, created_at: now.toISOString() },
    { id: 'cat-4', name: 'Olahraga', slug: 'olahraga', description: 'Peralatan olahraga dan aktivitas luar ruangan.', image: null, created_at: now.toISOString() },
    { id: 'cat-5', name: 'Kecantikan', slug: 'kecantikan', description: 'Produk perawatan kulit dan kecantikan.', image: null, created_at: now.toISOString() },
  ];

  const pImg = (url: string) => `https://images.pexels.com/photos/${url}?auto=compress&cs=tinysrgb&w=400`;

  const products: Product[] = [
    {
      id: 'prod-1', name: 'Headphone Wireless Noise-Cancelling', category_id: 'cat-1',
      description: 'Headphone premium dengan active noise cancellation dan baterai 30 jam.',
      images: [pImg('3394650/pexels-photo-3394650')], video: null,
      has_variant: false, sku: 'AP-HP-001', price: 2999000, stock: 45,
      variants: [], status: 'active',
      created_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
    },
    {
      id: 'prod-2', name: 'Smartwatch Series 7', category_id: 'cat-1',
      description: 'Pelacakan kebugaran, monitor detak jantung, GPS. Tahan air 50m.',
      images: [pImg('437037/pexels-photo-437037')], video: null,
      has_variant: true, sku: null, price: null, stock: null,
      variants: [
        {
          id: 'var-1', name: 'Midnight', sku: 'SW-7-MD', images: [pImg('437037/pexels-photo-437037')],
          status: 'active', has_size: true, price: null, stock: null,
          sizes: [
            { id: 'sz-1', name: '42mm', sku: 'SW-7-MD-42', price: 3999000, stock: 15, images: [], status: 'active' },
            { id: 'sz-2', name: '46mm', sku: 'SW-7-MD-46', price: 4499000, stock: 8, images: [], status: 'active' },
          ],
        },
        {
          id: 'var-2', name: 'Silver', sku: 'SW-7-SL', images: [pImg('437037/pexels-photo-437037')],
          status: 'active', has_size: true, price: null, stock: null,
          sizes: [
            { id: 'sz-3', name: '42mm', sku: 'SW-7-SL-42', price: 3999000, stock: 5, images: [], status: 'active' },
          ],
        },
      ],
      status: 'active',
      created_at: new Date(now.getTime() - 8 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 8 * 86400000).toISOString(),
    },
    {
      id: 'prod-3', name: 'Kaos Katun Organik', category_id: 'cat-2',
      description: '100% katun organik, lembut dan adem. Tersedia berbagai warna.',
      images: [pImg('996329/pexels-photo-996329')], video: null,
      has_variant: true, sku: null, price: null, stock: null,
      variants: [
        {
          id: 'var-3', name: 'Putih', sku: 'TS-PWH', images: [pImg('996329/pexels-photo-996329')],
          status: 'active', has_size: false, price: 199000, stock: 50, sizes: [],
        },
        {
          id: 'var-4', name: 'Hitam', sku: 'TS-HTM', images: [pImg('996329/pexels-photo-996329')],
          status: 'active', has_size: false, price: 199000, stock: 38, sizes: [],
        },
      ],
      status: 'active',
      created_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: 'prod-4', name: 'Lampu Meja Minimalis', category_id: 'cat-3',
      description: 'Lampu LED dengan kecerahan dan suhu warna yang dapat disesuaikan.',
      images: [pImg('1112597/pexels-photo-1112597')], video: null,
      has_variant: false, sku: 'LM-DL-200', price: 549000, stock: 12,
      variants: [], status: 'active',
      created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: 'prod-5', name: 'Sepatu Lari Pro', category_id: 'cat-4',
      description: 'Sepatu lari ringan dengan bantalan responsif dan upper mesh bernapas.',
      images: [pImg('2529148/pexels-photo-2529148')], video: null,
      has_variant: true, sku: null, price: null, stock: null,
      variants: [
        {
          id: 'var-5', name: 'Merah', sku: 'SP-LR-MR', images: [pImg('2529148/pexels-photo-2529148')],
          status: 'active', has_size: true, price: null, stock: null,
          sizes: [
            { id: 'sz-4', name: '40', sku: 'SP-LR-MR-40', price: 899000, stock: 10, images: [], status: 'active' },
            { id: 'sz-5', name: '41', sku: 'SP-LR-MR-41', price: 899000, stock: 7, images: [], status: 'active' },
            { id: 'sz-6', name: '42', sku: 'SP-LR-MR-42', price: 899000, stock: 3, images: [], status: 'active' },
          ],
        },
      ],
      status: 'active',
      created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 'prod-6', name: 'Serum Vitamin C', category_id: 'cat-5',
      description: 'Serum pencerah wajah dengan 20% Vitamin C dan hyaluronic acid.',
      images: [pImg('3373736/pexels-photo-3373736')], video: null,
      has_variant: false, sku: 'GL-VS-050', price: 279000, stock: 89,
      variants: [], status: 'active',
      created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: 'prod-7', name: 'Keyboard Mekanik', category_id: 'cat-1',
      description: 'Keyboard mekanik hot-swappable dengan RGB backlight dan frame aluminium.',
      images: [pImg('2115256/pexels-photo-2115256')], video: null,
      has_variant: false, sku: 'KF-MK-75', price: 1299000, stock: 5,
      variants: [], status: 'active',
      created_at: new Date(now.getTime() - 12 * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - 12 * 3600000).toISOString(),
    },
    {
      id: 'prod-8', name: 'Lilin Aromaterapi Set', category_id: 'cat-3',
      description: 'Set 3 lilin soy: Lavender, Vanilla, Sandalwood. Burning time 40 jam.',
      images: [pImg('3270223/pexels-photo-3270223')], video: null,
      has_variant: false, sku: 'AC-SC-003', price: 199000, stock: 0,
      variants: [], status: 'inactive',
      created_at: new Date(now.getTime() - 6 * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - 6 * 3600000).toISOString(),
    },
  ];

  const customers: Customer[] = [
    { id: 'cus-1', full_name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+62-812-001', address: 'Jl. Maple 123', city: 'Jakarta', country: 'Indonesia', total_spending: 12470000, total_orders: 8, created_at: new Date(now.getTime() - 60 * 86400000).toISOString() },
    { id: 'cus-2', full_name: 'Michael Chen', email: 'michael.c@email.com', phone: '+62-812-002', address: 'Jl. Oak 456', city: 'Bandung', country: 'Indonesia', total_spending: 8925000, total_orders: 5, created_at: new Date(now.getTime() - 50 * 86400000).toISOString() },
    { id: 'cus-3', full_name: 'Emily Rodriguez', email: 'emily.r@email.com', phone: '+62-812-003', address: 'Jl. Pine 789', city: 'Surabaya', country: 'Indonesia', total_spending: 21560000, total_orders: 12, created_at: new Date(now.getTime() - 45 * 86400000).toISOString() },
    { id: 'cus-4', full_name: 'James Wilson', email: 'james.w@email.com', phone: '+62-812-004', address: 'Jl. Cedar 321', city: 'Medan', country: 'Indonesia', total_spending: 4450000, total_orders: 3, created_at: new Date(now.getTime() - 30 * 86400000).toISOString() },
    { id: 'cus-5', full_name: 'Olivia Brown', email: 'olivia.b@email.com', phone: '+62-812-005', address: 'Jl. Birch 654', city: 'Bali', country: 'Indonesia', total_spending: 17890000, total_orders: 9, created_at: new Date(now.getTime() - 20 * 86400000).toISOString() },
    { id: 'cus-6', full_name: 'Daniel Kim', email: 'daniel.k@email.com', phone: '+62-812-006', address: 'Jl. Spruce 987', city: 'Jakarta', country: 'Indonesia', total_spending: 6340000, total_orders: 4, created_at: new Date(now.getTime() - 15 * 86400000).toISOString() },
    { id: 'cus-7', full_name: 'Sophia Martinez', email: 'sophia.m@email.com', phone: '+62-812-007', address: 'Jl. Elm 147', city: 'Yogyakarta', country: 'Indonesia', total_spending: 32100000, total_orders: 15, created_at: new Date(now.getTime() - 10 * 86400000).toISOString() },
    { id: 'cus-8', full_name: 'Benjamin Lee', email: 'benjamin.l@email.com', phone: '+62-812-008', address: 'Jl. Redwood 741', city: 'Semarang', country: 'Indonesia', total_spending: 1450000, total_orders: 1, created_at: new Date(now.getTime() - 5 * 86400000).toISOString() },
  ];

  const statuses: Order['order_status'][] = ['pending', 'processing', 'completed', 'cancelled'];
  const payStatuses: Order['payment_status'][] = ['paid', 'pending', 'failed'];
  const shipStatuses: Order['shipping_status'][] = ['unfulfilled', 'shipped', 'delivered'];

  const orders: Order[] = [];
  for (let i = 0; i < 20; i++) {
    const cust = customers[i % customers.length];
    const total = 500000 + Math.floor(Math.random() * 5000000);
    const subtotal = Math.round(total / 1.11);
    const tax = total - subtotal;
    const discount = Math.random() > 0.7 ? 50000 : 0;
    orders.push({
      id: `ord-${i + 1}`,
      order_number: `ORD-${String(i + 1).padStart(5, '0')}`,
      customer_id: cust.id,
      customer_name: cust.full_name,
      items: [{ product_id: null, name: 'Produk Contoh', quantity: 1, price: subtotal }],
      subtotal,
      discount,
      tax,
      shipping: 99000,
      total: total - discount,
      order_status: statuses[i % statuses.length],
      payment_status: payStatuses[i % payStatuses.length],
      shipping_status: shipStatuses[i % shipStatuses.length],
      tracking_number: i % 3 === 0 ? `TRK${String(i * 137).padStart(10, '0')}` : null,
      shipping_address: `${cust.address}, ${cust.city}, ${cust.country}`,
      coupon_code: discount > 0 ? 'HEMAT50' : null,
      created_at: new Date(now.getTime() - i * 6 * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - i * 6 * 3600000).toISOString(),
      customer: cust,
    });
  }

  const admins: Admin[] = [
    { id: 'adm-1', full_name: 'Alex Morgan', email: 'admin@commerce.id', role: 'admin', status: 'active', last_login: new Date(now.getTime() - 2 * 3600000).toISOString(), created_at: new Date(now.getTime() - 90 * 86400000).toISOString() },
    { id: 'adm-2', full_name: 'Jessica Adams', email: 'jessica@commerce.id', role: 'admin', status: 'active', last_login: new Date(now.getTime() - 24 * 3600000).toISOString(), created_at: new Date(now.getTime() - 60 * 86400000).toISOString() },
    { id: 'adm-3', full_name: 'Robert Clark', email: 'robert@commerce.id', role: 'admin', status: 'active', last_login: new Date(now.getTime() - 3 * 3600000).toISOString(), created_at: new Date(now.getTime() - 40 * 86400000).toISOString() },
    { id: 'adm-4', full_name: 'Maria Santos', email: 'maria@commerce.id', role: 'admin', status: 'active', last_login: new Date(now.getTime() - 5 * 3600000).toISOString(), created_at: new Date(now.getTime() - 30 * 86400000).toISOString() },
    { id: 'adm-5', full_name: 'Laura White', email: 'laura@commerce.id', role: 'admin', status: 'active', last_login: new Date(now.getTime() - 30 * 60000).toISOString(), created_at: new Date(now.getTime() - 20 * 86400000).toISOString() },
  ];

  const inventory_history: InventoryHistory[] = [
    { id: 'inv-1', product_id: 'prod-1', change_type: 'restock', quantity_change: 50, new_stock: 45, note: 'Stok awal', created_at: new Date(now.getTime() - 10 * 86400000).toISOString() },
    { id: 'inv-2', product_id: 'prod-4', change_type: 'sale', quantity_change: -5, new_stock: 12, note: 'Penjualan ORD-00003', created_at: new Date(now.getTime() - 2 * 86400000).toISOString() },
    { id: 'inv-3', product_id: 'prod-7', change_type: 'adjustment', quantity_change: 3, new_stock: 5, note: 'Koreksi stok', created_at: new Date(now.getTime() - 1 * 86400000).toISOString() },
    { id: 'inv-4', product_id: 'prod-6', change_type: 'restock', quantity_change: 40, new_stock: 89, note: 'Restock dari supplier', created_at: new Date(now.getTime() - 12 * 3600000).toISOString() },
    { id: 'inv-5', product_id: 'prod-8', change_type: 'sale', quantity_change: -3, new_stock: 0, note: 'Penjualan ORD-00010', created_at: new Date(now.getTime() - 6 * 3600000).toISOString() },
  ];

  const activity_logs: ActivityLog[] = [
    { id: 'act-1', actor: 'Alex Morgan', action: 'membuat', entity_type: 'produk', entity_name: 'Keyboard Mekanik', created_at: new Date(now.getTime() - 10 * 60000).toISOString() },
    { id: 'act-2', actor: 'Jessica Adams', action: 'memperbarui', entity_type: 'pesanan', entity_name: 'ORD-00015', created_at: new Date(now.getTime() - 25 * 60000).toISOString() },
    { id: 'act-3', actor: 'Robert Clark', action: 'menambah stok', entity_type: 'inventory', entity_name: 'Smartwatch Series 7', created_at: new Date(now.getTime() - 60 * 60000).toISOString() },
    { id: 'act-4', actor: 'Maria Santos', action: 'membuat', entity_type: 'kategori', entity_name: 'Kecantikan', created_at: new Date(now.getTime() - 2 * 3600000).toISOString() },
    { id: 'act-5', actor: 'Alex Morgan', action: 'mempublikasikan', entity_type: 'produk', entity_name: 'Sepatu Lari Pro', created_at: new Date(now.getTime() - 3 * 3600000).toISOString() },
    { id: 'act-6', actor: 'Laura White', action: 'memperbarui', entity_type: 'pelanggan', entity_name: 'Sophia Martinez', created_at: new Date(now.getTime() - 5 * 3600000).toISOString() },
  ];

  return { categories: cats, products, customers, orders, admins, inventory_history, activity_logs };
}

// ===== API Functions =====

export const api = {
  // --- Auth ---
  async login(email: string, password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
    await delay(500);
    const data = loadData();
    const admin = data.admins.find((a) => a.email === email);
    if (!admin) return { success: false, error: 'Email tidak ditemukan' };
    if (password !== 'admin123') return { success: false, error: 'Kata sandi salah' };
    admin.last_login = new Date().toISOString();
    saveData(data);
    return { success: true, admin };
  },

  // --- Dashboard ---
  async getDashboard(): Promise<{
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
  }> {
    await delay();
    const data = loadData();
    const today = new Date().toDateString();
    const todayOrders = data.orders.filter((o) => new Date(o.created_at).toDateString() === today);
    const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0);

    const lowStockProducts = data.products.filter((p) => {
      if (p.has_variant) {
        return p.variants.some((v) => v.has_size ? v.sizes.some((s) => s.stock <= 10) : (v.stock ?? 0) <= 10);
      }
      return (p.stock ?? 0) <= 10;
    });

    const dayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toLocaleDateString('id-ID', { weekday: 'short' }), 0);
    }
    data.orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('id-ID', { weekday: 'short' });
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) || 0) + o.total);
    });

    const statusColors: Record<string, string> = { pending: '#f59e0b', processing: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };
    const statusLabels: Record<string, string> = { pending: 'Pending', processing: 'Diproses', completed: 'Selesai', cancelled: 'Dibatalkan' };
    const orderStatusCounts = (['pending', 'processing', 'completed', 'cancelled'] as const).map((s) => ({
      label: statusLabels[s], value: data.orders.filter((o) => o.order_status === s).length, color: statusColors[s],
    }));

    const recentOrders = [...data.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    // Best sellers - calculate from variant/size stock logic (simulate units sold)
    const bestSellers = data.products
      .filter((p) => p.status === 'active')
      .slice(0, 5)
      .map((p) => {
        const unitsSold = p.has_variant
          ? p.variants.reduce((s, v) => s + (v.has_size ? v.sizes.reduce((ss, sz) => ss + sz.stock, 0) : (v.stock ?? 0)), 0)
          : (p.stock ?? 0);
        return {
          id: p.id, name: p.name, image: p.images[0] || '',
          unitsSold: Math.max(50 - unitsSold, 5), revenue: (p.price ?? 3999000) * Math.max(50 - unitsSold, 5),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      revenueToday, totalOrders: data.orders.length, totalProducts: data.products.length,
      totalCustomers: data.customers.length, pendingOrders: data.orders.filter((o) => o.order_status === 'pending').length,
      lowStockCount: lowStockProducts.length,
      revenueChart: Array.from(dayMap.entries()).map(([label, value]) => ({ label, value })),
      orderStatusCounts, recentOrders, bestSellers,
    };
  },

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    await delay();
    const data = loadData();
    return data.categories.map((c) => ({ ...c, product_count: data.products.filter((p) => p.category_id === c.id).length }));
  },
  async createCategory(cat: Partial<Category>): Promise<Category> {
    await delay();
    const data = loadData();
    const newCat: Category = {
      id: generateId(), name: cat.name || '', slug: cat.slug || slugify(cat.name || ''),
      description: cat.description ?? null, image: cat.image || null, created_at: new Date().toISOString(),
    };
    data.categories.push(newCat);
    logActivity('Admin', 'membuat', 'kategori', newCat.name, data);
    saveData(data);
    return newCat;
  },
  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    await delay();
    const data = loadData();
    const idx = data.categories.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Kategori tidak ditemukan');
    data.categories[idx] = { ...data.categories[idx], ...cat, slug: cat.slug || slugify(cat.name || data.categories[idx].name) };
    logActivity('Admin', 'memperbarui', 'kategori', data.categories[idx].name, data);
    saveData(data);
    return data.categories[idx];
  },
  async deleteCategory(id: string): Promise<void> {
    await delay();
    const data = loadData();
    const cat = data.categories.find((c) => c.id === id);
    data.categories = data.categories.filter((c) => c.id !== id);
    if (cat) logActivity('Admin', 'menghapus', 'kategori', cat.name, data);
    saveData(data);
  },

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    await delay();
    const data = loadData();
    return data.products.map((p) => ({ ...p, category: data.categories.find((c) => c.id === p.category_id) }));
  },
  async createProduct(prod: Partial<Product>): Promise<Product> {
    await delay();
    const data = loadData();
    const newProd: Product = {
      id: generateId(), name: prod.name || '', category_id: prod.category_id || null,
      description: prod.description || '', images: prod.images || [], video: prod.video || null,
      has_variant: prod.has_variant || false, sku: prod.sku || null, price: prod.price ?? null, stock: prod.stock ?? null,
      variants: prod.variants || [], status: prod.status || 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    data.products.unshift(newProd);
    logActivity('Admin', 'membuat', 'produk', newProd.name, data);
    saveData(data);
    return newProd;
  },
  async updateProduct(id: string, prod: Partial<Product>): Promise<Product> {
    await delay();
    const data = loadData();
    const idx = data.products.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Produk tidak ditemukan');
    data.products[idx] = { ...data.products[idx], ...prod, updated_at: new Date().toISOString() };
    logActivity('Admin', 'memperbarui', 'produk', data.products[idx].name, data);
    saveData(data);
    return data.products[idx];
  },
  async deleteProduct(id: string): Promise<void> {
    await delay();
    const data = loadData();
    const prod = data.products.find((p) => p.id === id);
    data.products = data.products.filter((p) => p.id !== id);
    if (prod) logActivity('Admin', 'menghapus', 'produk', prod.name, data);
    saveData(data);
  },

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
    await delay();
    const data = loadData();
    return data.orders.map((o) => ({ ...o, customer: data.customers.find((c) => c.id === o.customer_id) }));
  },
  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    await delay();
    const data = loadData();
    const idx = data.orders.findIndex((o) => o.id === id);
    if (idx < 0) throw new Error('Pesanan tidak ditemukan');
    data.orders[idx] = { ...data.orders[idx], ...updates, updated_at: new Date().toISOString() };
    logActivity('Admin', 'memperbarui', 'pesanan', data.orders[idx].order_number, data);
    saveData(data);
    return data.orders[idx];
  },

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    await delay();
    const data = loadData();
    return data.customers;
  },
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    await delay();
    const data = loadData();
    return data.orders.filter((o) => o.customer_id === customerId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  async createCustomer(cust: Partial<Customer>): Promise<Customer> {
    await delay();
    const data = loadData();
    const newCust: Customer = {
      id: generateId(), full_name: cust.full_name || '', email: cust.email || '',
      phone: cust.phone || null, address: cust.address || null, city: cust.city || null,
      country: cust.country || 'Indonesia', total_spending: 0, total_orders: 0,
      created_at: new Date().toISOString(),
    };
    data.customers.push(newCust);
    logActivity('Admin', 'membuat', 'pelanggan', newCust.full_name, data);
    saveData(data);
    return newCust;
  },

  // --- Admins ---
  async getAdmins(): Promise<Admin[]> {
    await delay();
    const data = loadData();
    return data.admins;
  },
  async createAdmin(admin: Partial<Admin>): Promise<Admin> {
    await delay();
    const data = loadData();
    const newAdmin: Admin = {
      id: generateId(), full_name: admin.full_name || '', email: admin.email || '',
      role: 'admin', status: 'active', last_login: null, created_at: new Date().toISOString(),
    };
    data.admins.push(newAdmin);
    logActivity('Admin', 'menambah', 'admin', newAdmin.full_name, data);
    saveData(data);
    return newAdmin;
  },

  // --- Inventory ---
  async getInventoryHistory(): Promise<InventoryHistory[]> {
    await delay();
    const data = loadData();
    return data.inventory_history.map((h) => ({ ...h, product: { id: h.product_id, name: data.products.find((p) => p.id === h.product_id)?.name || 'Tidak diketahui', images: data.products.find((p) => p.id === h.product_id)?.images || [] } }));
  },
  async restockProduct(productId: string, changeType: 'restock' | 'adjustment' | 'return', quantity: number, note: string): Promise<void> {
    await delay();
    const data = loadData();
    const prod = data.products.find((p) => p.id === productId);
    if (!prod) throw new Error('Produk tidak ditemukan');
    const newStock = (prod.stock ?? 0) + (changeType === 'adjustment' ? quantity : Math.abs(quantity));
    prod.stock = newStock;
    prod.updated_at = new Date().toISOString();
    data.inventory_history.unshift({
      id: generateId(), product_id: productId, change_type: changeType,
      quantity_change: changeType === 'adjustment' ? quantity : Math.abs(quantity),
      new_stock: newStock, note: note || null, created_at: new Date().toISOString(),
    });
    if (data.inventory_history.length > 50) data.inventory_history = data.inventory_history.slice(0, 50);
    logActivity('Admin', 'menambah stok', 'inventory', prod.name, data);
    saveData(data);
  },
};
