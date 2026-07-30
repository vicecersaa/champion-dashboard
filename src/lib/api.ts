import type {
  Product,
  Category,
  CategoryListResponse,
  CategoryQueryParams,
  CategoryFormPayload,
  Customer,
  Order,
  OrderListResponse,
  OrderQueryParams,
  OrderStatus,
  PaymentStatus,
  ShippingStatus,
  Admin,
  InventoryHistory,
  ProductListResponse,
  ProductQueryParams,
  ProductFormPayload,
  Banner,
  BannerListResponse,
  BannerQueryParams,
  BannerFormPayload,
  Coupon,
  CouponListResponse,
  CouponQueryParams,
  CouponFormPayload,
  Warranty,
  WarrantyFormPayload,  
  HomepageContent,
  HomepageFormState,
} from "./types";


const API_BASE_URL =
  "https://forland-backend-production.up.railway.app/api/v1";

export interface DashboardSummary {
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStock: number;
}

export interface SalesChartItem {
  date: string;
  revenue: number;
}

export interface OrderStatusItem {
  status: "pending" | "processing" | "completed" | "cancelled";
  count: number;
}

export interface DashboardRecentOrder {
  _id: string;
  orderNumber: string;
  shippingAddress?: Record<string, any> | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface BestSellingProduct {
  _id: string | null;
  name: string;
  thumbnail: string | null;
  sold: number;
  revenue: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  salesChart: SalesChartItem[];
  orderStatus: OrderStatusItem[];
  recentOrders: DashboardRecentOrder[];
  bestSellingProducts: BestSellingProduct[];
}

// =======================
// Helper Functions
// =======================

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {

  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || `Request gagal (${res.status})`);
  }

  return (json?.data ?? json) as T;
}

function buildHomepageFormData(form: HomepageFormState): FormData {
  const fd = new FormData();

  const appendImage = (key: string, value: string | File): string | null => {
    if (value instanceof File) {
      fd.append(key, value);
      return null; // null = "ada file baru diunggah di slot ini", backend isi dari file
    }
    return value; // string url lama, tidak berubah
  };

  const metaHero = { ...form.hero, image: appendImage('heroImage', form.hero.image) };

  const metaPromoCards = form.promoCards.map((c, i) => ({
    ...c,
    image: appendImage(`promoImage${i}`, c.image),
  }));

  const metaCollection = {
    ...form.collection,
    items: form.collection.items.map((it, i) => ({
      ...it,
      image: appendImage(`collectionImage${i}`, it.image),
    })),
  };

  const metaPhilosophy = { ...form.philosophy, image: appendImage('philosophyImage', form.philosophy.image) };
  const metaCraftsmanship = { ...form.craftsmanship, image: appendImage('craftImage', form.craftsmanship.image) };
  const metaMaterialStudy = { ...form.materialStudy, image: appendImage('materialImage', form.materialStudy.image) };

  const metaGallery = {
    ...form.gallery,
    images: form.gallery.images.map((img, i) => appendImage(`galleryImage${i}`, img)),
  };

  const meta = {
    hero: metaHero,
    promoCards: metaPromoCards,
    collection: metaCollection,
    philosophy: metaPhilosophy,
    craftsmanship: metaCraftsmanship,
    materialStudy: metaMaterialStudy,
    gallery: metaGallery,
    testimonials: form.testimonials,
    newsletter: form.newsletter,
  };

  fd.append('content', JSON.stringify(meta));

  return fd;
}

function buildProductFormData(
  payload: Partial<ProductFormPayload>
): FormData {

  const formData = new FormData();

  if (payload.name !== undefined)
    formData.append("name", payload.name);

  if (payload.description !== undefined)
    formData.append("description", payload.description);

  if (payload.category !== undefined)
    formData.append("category", payload.category);

  if (payload.price != null)
    formData.append("price", String(payload.price));

  if (payload.stock != null)
    formData.append("stock", String(payload.stock));

  if (payload.sku !== undefined)
    formData.append("sku", payload.sku);

  if (payload.isActive !== undefined)
    formData.append("isActive", String(payload.isActive));

  if (payload.variants !== undefined)
    formData.append("variants", JSON.stringify(payload.variants));

  payload.images?.forEach((file) => {
    formData.append("images", file);
  });

  if (payload.video) {
    formData.append("video", payload.video);
  }

  return formData;
}

function buildCategoryFormData(payload: Partial<CategoryFormPayload>): FormData {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append('name', payload.name);
  if (payload.description !== undefined) formData.append('description', payload.description);
  if (payload.sortOrder !== undefined) formData.append('sortOrder', String(payload.sortOrder));
  if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive));
  if (payload.image) formData.append('image', payload.image);

  return formData;
}

function buildBannerFormData(payload: Partial<BannerFormPayload>): FormData {
  const formData = new FormData();

  if (payload.link !== undefined) formData.append('link', payload.link);
  if (payload.sortOrder !== undefined) formData.append('sortOrder', String(payload.sortOrder));
  if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive));
  if (payload.image) formData.append('image', payload.image);

  return formData;
}

// ===== API Functions =====

export const api = {
  // --- Auth ---
  async login(email: string, password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        return { success: false, error: json.message || 'Gagal masuk' };
      }

      const backendUser = json.data.user;
      const admin: Admin = {
        id: backendUser.id,
        full_name: backendUser.email, // backend belum punya field nama, sementara pakai email
        email: backendUser.email,
        role: backendUser.role,
        status: 'active',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      return { success: true, admin };
    } catch {
      return { success: false, error: 'Tidak bisa terhubung ke server' };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // gagal pun tetap lanjut clear state di frontend
    }
  },

  async getMe(): Promise<{ success: boolean; admin?: Admin }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) return { success: false };

      const json = await res.json();
      const backendUser = json.data;

      const admin: Admin = {
        id: backendUser.id,
        full_name: backendUser.email,
        email: backendUser.email,
        role: backendUser.role,
        status: 'active',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      return { success: true, admin };
    } catch {
      return { success: false };
    }
  },

  // --- Dashboard ---
  async getDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>('/admin/dashboard');
  },

  // ==================================================================
  // NOTE: fungsi di bawah ini (Categories, Products, Orders, Customers,
  // Admins, Inventory) MASIH pakai localStorage lama (belum disambungkan
  // ke backend). Kita beresin satu-satu setelah kirim model/controller
  // masing-masing resource, biar tipenya bisa disesuaikan persis kayak
  // Dashboard di atas. Jangan dipakai dulu buat data asli sebelum
  // diganti — masih placeholder.
  // ==================================================================

  async getCategories(params: CategoryQueryParams = {}): Promise<CategoryListResponse> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  const result = await apiFetch<Category[] | CategoryListResponse>(`/admin/categories${qs ? `?${qs}` : ''}`);

  // Fallback kalau backend belum konsisten kirim pagination
  if (Array.isArray(result)) {
    return {
      items: result,
      pagination: {
        page: params.page || 1,
        limit: params.limit || result.length,
        totalItems: result.length,
        totalPages: 1,
      },
    };
  }
  return result;
},

  async createCategory(payload: CategoryFormPayload): Promise<Category> {
    const formData = buildCategoryFormData(payload);
    return apiFetch<Category>('/admin/categories', {
      method: 'POST',
      body: formData,
    });
  },

  async updateCategory(id: string, payload: Partial<CategoryFormPayload>): Promise<Category> {
    const formData = buildCategoryFormData(payload);
    return apiFetch<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async deleteCategory(id: string): Promise<Category> {
    return apiFetch<Category>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  async restoreCategory(id: string): Promise<Category> {
    return apiFetch<Category>(`/admin/categories/${id}/restore`, {
      method: 'PATCH',
    });
  },

  async getBanners(params: BannerQueryParams = {}): Promise<BannerListResponse> {
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    return apiFetch<BannerListResponse>(`/admin/banners${qs ? `?${qs}` : ''}`);
  },

  async createBanner(payload: BannerFormPayload): Promise<Banner> {
    const formData = buildBannerFormData(payload);
    return apiFetch<Banner>('/admin/banners', {
      method: 'POST',
      body: formData,
    });
  },

  async updateBanner(id: string, payload: Partial<BannerFormPayload>): Promise<Banner> {
    const formData = buildBannerFormData(payload);
    return apiFetch<Banner>(`/admin/banners/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async deleteBanner(id: string): Promise<void> {
    return apiFetch<void>(`/admin/banners/${id}`, {
      method: 'DELETE',
    });
  },

  async getCoupons(params: CouponQueryParams = {}): Promise<CouponListResponse> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  return apiFetch<CouponListResponse>(`/admin/coupons${qs ? `?${qs}` : ''}`);
},

async createCoupon(payload: CouponFormPayload): Promise<Coupon> {
  return apiFetch<Coupon>('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
},

async updateCoupon(id: string, payload: Partial<CouponFormPayload>): Promise<Coupon> {
  return apiFetch<Coupon>(`/admin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
},

async deleteCoupon(id: string): Promise<void> {
  return apiFetch<void>(`/admin/coupons/${id}`, {
    method: 'DELETE',
  });
},

// --- Warranty ---
async createWarranty(payload: WarrantyFormPayload): Promise<Warranty> {
  return apiFetch<Warranty>('/admin/warranty', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
},

async getAllWarranty(params?: {
    page?: number;
    limit?: number;
}) {

    const query = new URLSearchParams();

    if (params?.page)
        query.set("page", String(params.page));

    if (params?.limit)
        query.set("limit", String(params.limit));

    return apiFetch<{
        items: Warranty[];
        pagination: {
            page: number;
            totalPages: number;
            totalItems: number;
            limit: number;
        };
    }>(`/admin/warranty?${query.toString()}`);

},

async searchWarrantyByPhone(phone: string): Promise<Warranty | null> {
  const res = await fetch(
    `${API_BASE_URL}/admin/warranty/search?phone=${encodeURIComponent(phone)}`,
    { credentials: 'include' }
  );

  if (res.status === 404) return null;

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || `Request gagal (${res.status})`);
  }

  return (json?.data ?? json) as Warranty;
},

async updateWarranty(id: string, payload: Partial<WarrantyFormPayload>): Promise<Warranty> {
  return apiFetch<Warranty>(`/admin/warranty/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
},

// --- Homepage Content ---
async getHomepageContent(): Promise<HomepageContent> {
  return apiFetch<HomepageContent>('/admin/homepage');
},

async updateHomepageContent(form: HomepageFormState): Promise<HomepageContent> {
  const formData = buildHomepageFormData(form);
  return apiFetch<HomepageContent>('/admin/homepage', {
    method: 'PUT',
    body: formData,
  });
},

  async getProducts(
  params: ProductQueryParams = {}
): Promise<ProductListResponse> {

  const query = new URLSearchParams();

  if (params.page)
    query.set("page", String(params.page));

  if (params.limit)
    query.set("limit", String(params.limit));

  if (params.search)
    query.set("search", params.search);

  if (params.isActive !== undefined)
    query.set("isActive", String(params.isActive));

  if (params.sort)
    query.set("sort", params.sort);

  const qs = query.toString();

  return apiFetch<ProductListResponse>(
    `/admin/products${qs ? `?${qs}` : ""}`
  );

},
async getProductById(id: string): Promise<Product> {

  return apiFetch<Product>(
    `/admin/products/${id}`
  );

},
async bulkDeleteProducts(ids: string[]): Promise<void> {
    return apiFetch<void>('/admin/products', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },
  async createProduct(
  payload: ProductFormPayload
): Promise<Product> {

  const formData =
    buildProductFormData(payload);

  return apiFetch<Product>(
    "/admin/products",
    {
      method: "POST",
      body: formData,
    }
  );

},
  async updateProduct(
  id: string,
  payload: Partial<ProductFormPayload>
): Promise<Product> {

  const formData =
    buildProductFormData(payload);

  return apiFetch<Product>(
    `/admin/products/${id}`,
    {
      method: "PUT",
      body: formData,
    }
  );

},
  async deleteProduct(
  id: string
): Promise<Product> {

  return apiFetch<Product>(
    `/admin/products/${id}`,
    {
      method: "DELETE",
    }
  );

},

  async getOrders(
    params: OrderQueryParams = {}
  ): Promise<OrderListResponse> {
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    return apiFetch<OrderListResponse>(`/admin/orders${qs ? `?${qs}` : ''}`);
  },

  async getOrderById(id: string): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}`);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    });
  },

  async updateOrderShippingStatus(id: string, shippingStatus: ShippingStatus): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}/shipping`, {
      method: 'PATCH',
      body: JSON.stringify({ shippingStatus }),
    });
  },

  async cancelOrder(id: string): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  async getCustomers(): Promise<Customer[]> {
    throw new Error('Belum disambungkan ke backend — customer = User dengan role user?');
  },
  async getCustomerOrders(_customerId: string): Promise<Order[]> {
    throw new Error('Belum disambungkan ke backend');
  },
  async createCustomer(_cust: Partial<Customer>): Promise<Customer> {
    throw new Error('Belum disambungkan ke backend');
  },

  async getAdmins(): Promise<Admin[]> {
    throw new Error('Belum disambungkan ke backend');
  },
  async createAdmin(_admin: Partial<Admin>): Promise<Admin> {
    throw new Error('Belum disambungkan ke backend');
  },

  async getInventoryHistory(): Promise<InventoryHistory[]> {
    throw new Error('Belum disambungkan ke backend — apakah ada inventory history di product model?');
  },
  async restockProduct(_productId: string, _changeType: 'restock' | 'adjustment' | 'return', _quantity: number, _note: string): Promise<void> {
    throw new Error('Belum disambungkan ke backend');
  },
  async removeProductImage(id: string, index: number): Promise<Product> {
    return apiFetch<Product>(
      `/admin/products/${id}/images/${index}`,
      {
        method: 'DELETE',
      }
  );
},
async removeProductVideo(id: string): Promise<Product> {
  return apiFetch<Product>(
    `/admin/products/${id}/video`,
    {
      method: 'DELETE',
    }
  );
},
async setProductThumbnail(id: string, image: string): Promise<Product> {
  return apiFetch<Product>(
    `/admin/products/${id}/thumbnail/${encodeURIComponent(image)}`,
    {
      method: "PATCH",
    }
  );
}
};