import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, CartItem, CategoryMeta, InfoTrendItem, StoreProfile, SiteSettings, StockNotification } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_INFO_TRENDS, INITIAL_STORE_PROFILE, INITIAL_SITE_SETTINGS, INITIAL_NOTIFICATIONS } from '../data/initialData';
import { 
  listenToProducts, 
  listenToStoreData, 
  saveProductToDb, 
  deleteProductFromDb, 
  saveProductsBatch, 
  saveStoreDataToDb, 
  resetDbToDefault, 
  initializeFirebaseData 
} from '../firebase/db';

interface CatalogContextType {
  // Data
  products: Product[];
  cart: CartItem[];
  categoriesMeta: CategoryMeta[];
  infoTrends: InfoTrendItem[];
  notifications: StockNotification[];
  storeProfile: StoreProfile;
  siteSettings: SiteSettings;

  // View state
  activeTab: 'beranda' | 'kategori' | 'info-trend' | 'tentang-kami' | 'hubungi-kami';
  setActiveTab: (tab: 'beranda' | 'kategori' | 'info-trend' | 'tentang-kami' | 'hubungi-kami') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
  setSortBy: (sort: 'popular' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc') => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  
  // Modals
  selectedProductDetail: Product | null;
  setSelectedProductDetail: (product: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  adminRole: 'super_admin' | 'admin' | null;

  // Computed
  allCategories: string[];
  allBrands: string[];
  allTypes: string[];
  filteredProducts: Product[];
  paginatedProducts: Product[];
  totalPages: number;
  totalCartItems: number;
  totalCartPrice: number;

  // Actions
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (productId: string | number) => void;
  updateCartQuantity: (productId: string | number, qty: number) => void;
  clearCart: () => void;
  
  // Admin Product Actions
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string | number) => void;
  bulkImportProducts: (newProducts: Product[], replace?: boolean) => void;
  resetToDefaultData: () => void;

  // Admin Config Actions
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => void;
  updateStoreProfile: (newProfile: Partial<StoreProfile>) => void;
  updateCategoryMeta: (categoryName: string, iconUrl: string, deskripsi: string) => void;
  addInfoTrend: (item: InfoTrendItem) => void;
  updateInfoTrend: (item: InfoTrendItem) => void;
  deleteInfoTrend: (id: string) => void;
  addNotification: (notif: StockNotification) => void;
  deleteNotification: (id: string) => void;
  toggleNotification: (id: string) => void;

  // Security
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  changeAdminPassword: (oldPass: string, newPass: string) => { success: boolean; message: string };
  
  // Notifications toast message
  activeToast: string | null;
  showToast: (msg: string) => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'megateknik_products_v1',
  CART: 'megateknik_cart_v1',
  CATEGORIES: 'megateknik_categories_v1',
  INFO_TRENDS: 'megateknik_info_trends_v1',
  STORE_PROFILE: 'megateknik_store_profile_v1',
  SITE_SETTINGS: 'megateknik_site_settings_v1',
  NOTIFICATIONS: 'megateknik_notifications_v1',
  ADMIN_AUTH: 'megateknik_admin_auth_v1',
};

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use defaults
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [categoriesMeta, setCategoriesMeta] = useState<CategoryMeta[]>(INITIAL_CATEGORIES);
  const [infoTrends, setInfoTrends] = useState<InfoTrendItem[]>(INITIAL_INFO_TRENDS);
  const [notifications, setNotifications] = useState<StockNotification[]>(INITIAL_NOTIFICATIONS);
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(INITIAL_STORE_PROFILE);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);

  // UI state
  const [activeTab, setActiveTab] = useState<'beranda' | 'kategori' | 'info-trend' | 'tentang-kami' | 'hubungi-kami'>('beranda');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedBrand, setSelectedBrand] = useState<string>('Semua');
  const [selectedType, setSelectedType] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('popular');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10; // strictly 10 products per page as requested

  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<'super_admin' | 'admin' | null>(() => {
    return sessionStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH) as any || null;
  });

  const [activeToast, setActiveToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => {
      setActiveToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Initialize Firebase listeners
  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;
    let unsubInfoTrends: (() => void) | undefined;
    let unsubNotifications: (() => void) | undefined;
    let unsubProfile: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    const init = async () => {
      try {
        await initializeFirebaseData();
      } catch (err) {
        console.error("Firebase init failed", err);
      }
      
      unsubProducts = listenToProducts(setProducts);
      unsubCategories = listenToStoreData<CategoryMeta[]>('categories', setCategoriesMeta, true);
      unsubInfoTrends = listenToStoreData<InfoTrendItem[]>('infoTrends', setInfoTrends, true);
      unsubNotifications = listenToStoreData<StockNotification[]>('notifications', setNotifications, true);
      unsubProfile = listenToStoreData<StoreProfile>('storeProfile', setStoreProfile, false);
      unsubSettings = listenToStoreData<SiteSettings>('siteSettings', setSiteSettings, false);
    };

    init();

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubCategories) unsubCategories();
      if (unsubInfoTrends) unsubInfoTrends();
      if (unsubNotifications) unsubNotifications();
      if (unsubProfile) unsubProfile();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  // Sync state changes with localStorage (only CART is still local)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // Apply primary color directly to CSS variable
    document.documentElement.style.setProperty('--primary-color', siteSettings.primaryColor || '#135A62');
  }, [siteSettings]);

  // Derived Lists
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.kategori) set.add(p.kategori.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.merk) set.add(p.merk.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  const allTypes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.type) set.add(p.type.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search matches name, merk, type, kategori, deskripsi
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.nama.toLowerCase().includes(q);
        const matchMerk = p.merk.toLowerCase().includes(q);
        const matchType = p.type.toLowerCase().includes(q);
        const matchKat = p.kategori.toLowerCase().includes(q);
        const matchDesc = p.deskripsi.toLowerCase().includes(q);
        if (!matchName && !matchMerk && !matchType && !matchKat && !matchDesc) {
          return false;
        }
      }

      // Filter Category
      if (selectedCategory && selectedCategory !== 'Semua') {
        if (p.kategori.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Filter Brand
      if (selectedBrand && selectedBrand !== 'Semua') {
        if (p.merk.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }
      }

      // Filter Type
      if (selectedType && selectedType !== 'Semua') {
        if (p.type.toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'popular') {
        const favA = (a.angka_produk_favorit && a.angka_produk_favorit > 0) ? a.angka_produk_favorit : Number.MAX_SAFE_INTEGER;
        const favB = (b.angka_produk_favorit && b.angka_produk_favorit > 0) ? b.angka_produk_favorit : Number.MAX_SAFE_INTEGER;
        
        if (favA !== favB) {
          return favA - favB;
        }
        // Fallback for non-favorite products (sort alphabetically by name to maintain consistent order)
        return a.nama.localeCompare(b.nama);
      }
      if (sortBy === 'price-asc') {
        const priceA = a.harga_diskon || a.harga;
        const priceB = b.harga_diskon || b.harga;
        return priceA - priceB;
      }
      if (sortBy === 'price-desc') {
        const priceA = a.harga_diskon || a.harga;
        const priceB = b.harga_diskon || b.harga;
        return priceB - priceA;
      }
      if (sortBy === 'name-asc') {
        return a.nama.localeCompare(b.nama);
      }
      if (sortBy === 'name-desc') {
        return b.nama.localeCompare(a.nama);
      }
      return 0;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedType, sortBy]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, selectedType, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Cart totals
  const totalCartItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    return cart.reduce((sum, item) => {
      const activePrice = item.product.harga_diskon || item.product.harga;
      return sum + activePrice * item.quantity;
    }, 0);
  }, [cart]);

  // Cart operations (with Max 20 items / products per transaction rule)
  const addToCart = (product: Product, quantity = 1) => {
    const existing = cart.find((item) => String(item.product.id) === String(product.id));
    const currentUniqueCount = cart.length;

    if (!existing && currentUniqueCount >= 20) {
      showToast('⚠️ Batas maksimal keranjang tercapai (Maksimal 20 jenis produk per transaksi)');
      return { success: false, message: 'Maksimal 20 item produk per transaksi.' };
    }

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          String(item.product.id) === String(product.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
      showToast(`🛒 Ditambahkan ke keranjang: ${product.nama} (+${quantity})`);
      return { success: true, message: 'Jumlah produk diperbarui di keranjang.' };
    } else {
      setCart((prev) => [...prev, { product, quantity }]);
      showToast(`🛒 Produk masuk keranjang: ${product.nama}`);
      return { success: true, message: 'Produk berhasil ditambahkan ke keranjang.' };
    }
  };

  const removeFromCart = (productId: string | number) => {
    setCart((prev) => prev.filter((item) => String(item.product.id) !== String(productId)));
    showToast('🗑️ Produk dihapus dari keranjang.');
  };

  const updateCartQuantity = (productId: string | number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        String(item.product.id) === String(productId) ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Product CRUD
  const addProduct = async (product: Product) => {
    try {
      await saveProductToDb(product);
      showToast(`✅ Produk baru ditambahkan: ${product.nama}`);
    } catch (e) {
      showToast(`❌ Gagal menyimpan: ${e}`);
    }
  };

  const updateProduct = async (updated: Product) => {
    try {
      await saveProductToDb(updated);
      showToast(`✅ Data produk ${updated.nama} berhasil diperbarui.`);
    } catch (e) {
      showToast(`❌ Gagal memperbarui: ${e}`);
    }
  };

  const deleteProduct = async (id: string | number) => {
    try {
      await deleteProductFromDb(id);
      showToast('🗑️ Produk berhasil dihapus dari katalog.');
    } catch (e) {
      showToast(`❌ Gagal menghapus: ${e}`);
    }
  };

  const bulkImportProducts = async (newProducts: Product[], replace = false) => {
    try {
      showToast(`⏳ Menyimpan ${newProducts.length} produk ke database...`);
      await saveProductsBatch(newProducts, replace);
      if (replace) {
        showToast(`📥 Berhasil mengimpor ${newProducts.length} produk baru (menggantikan katalog lama).`);
      } else {
        showToast(`📥 Berhasil menambahkan ${newProducts.length} produk ke dalam katalog.`);
      }
    } catch (e) {
      showToast(`❌ Gagal import massal: ${e}`);
    }
  };

  const resetToDefaultData = async () => {
    try {
      showToast('⏳ Mereset data...');
      await resetDbToDefault();
      showToast('🔄 Semua data berhasil di-reset ke sample bawaan.');
    } catch (e) {
      showToast(`❌ Gagal reset: ${e}`);
    }
  };

  // Site Settings
  const updateSiteSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      const updated = { ...siteSettings, ...newSettings };
      await saveStoreDataToDb('siteSettings', updated, false);
      showToast('⚙️ Pengaturan tampilan berhasil disimpan.');
    } catch (e) {
      showToast(`❌ Gagal menyimpan pengaturan: ${e}`);
    }
  };

  const updateStoreProfile = async (newProfile: Partial<StoreProfile>) => {
    try {
      const updated = { ...storeProfile, ...newProfile };
      await saveStoreDataToDb('storeProfile', updated, false);
      showToast('🏢 Profil toko berhasil diperbarui.');
    } catch (e) {
      showToast(`❌ Gagal memperbarui profil: ${e}`);
    }
  };

  const updateCategoryMeta = async (categoryName: string, iconUrl: string, deskripsi: string) => {
    try {
      let next = [...categoriesMeta];
      const idx = next.findIndex((c) => c.nama.toLowerCase() === categoryName.toLowerCase());
      if (idx >= 0) {
        next[idx] = { nama: categoryName, iconUrl, deskripsi };
      } else {
        next.push({ nama: categoryName, iconUrl, deskripsi });
      }
      await saveStoreDataToDb('categories', next, true);
      showToast(`📁 Info kategori "${categoryName}" berhasil disimpan.`);
    } catch (e) {
      showToast(`❌ Gagal menyimpan kategori: ${e}`);
    }
  };

  const addInfoTrend = async (item: InfoTrendItem) => {
    try {
      const next = [item, ...infoTrends];
      await saveStoreDataToDb('infoTrends', next, true);
      showToast(`📰 Artikel Info & Trend "${item.judul}" berhasil diterbitkan.`);
    } catch (e) {
      showToast(`❌ Gagal menerbitkan artikel: ${e}`);
    }
  };

  const updateInfoTrend = async (item: InfoTrendItem) => {
    try {
      const next = infoTrends.map((it) => (it.id === item.id ? item : it));
      await saveStoreDataToDb('infoTrends', next, true);
      showToast(`📰 Artikel "${item.judul}" berhasil diperbarui.`);
    } catch (e) {
      showToast(`❌ Gagal memperbarui artikel: ${e}`);
    }
  };

  const deleteInfoTrend = async (id: string) => {
    try {
      const next = infoTrends.filter((it) => it.id !== id);
      await saveStoreDataToDb('infoTrends', next, true);
      showToast('🗑️ Artikel berhasil dihapus.');
    } catch (e) {
      showToast(`❌ Gagal menghapus artikel: ${e}`);
    }
  };

  const addNotification = async (notif: StockNotification) => {
    try {
      const next = [notif, ...notifications];
      await saveStoreDataToDb('notifications', next, true);
      showToast('📢 Notifikasi siaran baru ditambahkan.');
    } catch (e) {
      showToast(`❌ Gagal menambahkan notifikasi: ${e}`);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const next = notifications.filter((n) => n.id !== id);
      await saveStoreDataToDb('notifications', next, true);
    } catch (e) {
      showToast(`❌ Gagal menghapus notifikasi: ${e}`);
    }
  };

  const toggleNotification = async (id: string) => {
    try {
      const next = notifications.map((n) => (n.id === id ? { ...n, aktif: !n.aktif } : n));
      await saveStoreDataToDb('notifications', next, true);
    } catch (e) {
      showToast(`❌ Gagal toggle notifikasi: ${e}`);
    }
  };

  // Admin Auth
  const loginAdmin = (pass: string): boolean => {
    if (pass === siteSettings.adminPasswordHash) {
      setAdminRole('super_admin');
      sessionStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH, 'super_admin');
      showToast('🔓 Login Super Admin Berhasil. Selamat datang!');
      return true;
    } else if (siteSettings.restrictedPasswords?.includes(pass)) {
      setAdminRole('admin');
      sessionStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH, 'admin');
      showToast('🔓 Login Admin Terbatas Berhasil. Selamat datang!');
      return true;
    }
    showToast('❌ Password admin salah.');
    return false;
  };

  const logoutAdmin = () => {
    setAdminRole(null);
    sessionStorage.removeItem(LOCAL_STORAGE_KEYS.ADMIN_AUTH);
    showToast('🔒 Sesi Admin telah keluar.');
  };

  const changeAdminPassword = async (oldPass: string, newPass: string) => {
    if (oldPass !== siteSettings.adminPasswordHash) {
      return { success: false, message: 'Password lama tidak sesuai.' };
    }
    if (!newPass || newPass.length < 4) {
      return { success: false, message: 'Password baru minimal 4 karakter.' };
    }
    try {
      const updated = { ...siteSettings, adminPasswordHash: newPass };
      await saveStoreDataToDb('siteSettings', updated, false);
      return { success: true, message: 'Password Admin berhasil diubah!' };
    } catch (e) {
      return { success: false, message: `Gagal mengubah password: ${e}` };
    }
  };

  return (
    <CatalogContext.Provider
      value={{
        products,
        cart,
        categoriesMeta,
        infoTrends,
        notifications,
        storeProfile,
        siteSettings,
        activeTab,
        setActiveTab,
        selectedCategory,
        setSelectedCategory,
        selectedBrand,
        setSelectedBrand,
        selectedType,
        setSelectedType,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        selectedProductDetail,
        setSelectedProductDetail,
        isCartOpen,
        setIsCartOpen,
        isAdminOpen,
        setIsAdminOpen,
        adminRole,
        allCategories,
        allBrands,
        allTypes,
        filteredProducts,
        paginatedProducts,
        totalPages,
        totalCartItems,
        totalCartPrice,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkImportProducts,
        resetToDefaultData,
        updateSiteSettings,
        updateStoreProfile,
        updateCategoryMeta,
        addInfoTrend,
        updateInfoTrend,
        deleteInfoTrend,
        addNotification,
        deleteNotification,
        toggleNotification,
        loginAdmin,
        logoutAdmin,
        changeAdminPassword,
        activeToast,
        showToast,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
