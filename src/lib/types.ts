// ===== Types for E-Commerce Admin Dashboard =====

export interface Size {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  images: string[];
  status: 'active' | 'inactive';
}

export interface Variant {
  id: string;
  name: string;
  sku: string;
  images: string[];
  status: 'active' | 'inactive';
  has_size: boolean;
  price: number | null;
  stock: number | null;
  sizes: Size[];
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  description: string;
  images: string[];
  video: string | null;
  has_variant: boolean;
  sku: string | null;
  price: number | null;
  stock: number | null;
  variants: Variant[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  created_at: string;
  product_count?: number;
}

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

export interface OrderItem {
  product_id: string | null;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status: 'paid' | 'pending' | 'failed';
  shipping_status: 'unfulfilled' | 'shipped' | 'delivered';
  tracking_number: string | null;
  shipping_address: string | null;
  coupon_code: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
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
