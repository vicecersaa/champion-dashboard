// ===== Types for E-Commerce Admin Dashboard =====

// ---- Product & Category (sudah sesuai backend) ----

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  items: Category[];
  pagination: PaginationInfo;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}

export interface CategoryFormPayload {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  image: File | null;
}

export interface Banner {
  _id: string;
  image: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerListResponse {
  items: Banner[];
  pagination: PaginationInfo;
}

export interface BannerQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  sort?: string;
}

export interface BannerFormPayload {
  link: string;
  sortOrder: number;
  isActive: boolean;
  image: File | null;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumPurchase: number;
  maximumDiscount: number;
  usageLimit: number;
  usedCount: number;
  usagePerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponListResponse {
  items: Coupon[];
  pagination: PaginationInfo;
}

export interface CouponQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}

export interface CouponFormPayload {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumPurchase: number;
  maximumDiscount: number;
  usageLimit: number;
  usagePerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ProductSize {
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface ProductVariant {
  name: string;
  sku: string;
  price: number | null;
  stock: number | null;
  sizes: ProductSize[];
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: Category;
  description: string;
  images: string[];
  thumbnail: string;
  video: string;
  price: number | null;
  stock: number | null;
  sku: string;
  variants: ProductVariant[];
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: Product[];
  pagination: PaginationInfo;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}

export interface ProductFormPayload {
  name: string;
  description: string;
  category: string;

  sku: string;

  price: number | null;
  stock: number | null;

  variants: ProductVariant[];

  isActive: boolean;

  images: File[];
  video: File | null;
}

// ---- Order (sudah sesuai backend) ----

export interface OrderItem {
  product: string;
  name: string;
  thumbnail: string;
  variant: string;
  size: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'failed';
export type ShippingStatus = 'unfulfilled' | 'shipped' | 'delivered';

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string | null;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  items: Order[];
  pagination: PaginationInfo;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  sort?: string;
}

// ---- Belum disambungkan ke backend (masih placeholder lama) ----

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  total_spending: number;
  total_orders: number;
  created_at: string;
}

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  role: 'admin';
  status: 'active' | 'suspended';
  last_login: string | null;
  created_at: string;
}

export interface InventoryHistory {
  id: string;
  product_id: string;
  change_type: 'restock' | 'sale' | 'adjustment' | 'return';
  quantity_change: number;
  new_stock: number;
  note: string | null;
  created_at: string;
  product?: { id: string; name: string; images: string[] };
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  entity_type: string | null;
  entity_name: string | null;
  created_at: string;
}