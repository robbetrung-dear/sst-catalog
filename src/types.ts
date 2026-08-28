export interface Product {
  id: string | number;
  nama: string;
  merk: string;
  kategori: string;
  type: string;
  harga: number;
  harga_diskon?: number;
  deskripsi: string;
  jumlah_stok: number;
  jumlah_pieces_packing: number;
  satuan_packing: string;
  angka_produk_favorit: number; // 1-50
  url_foto: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CategoryMeta {
  nama: string;
  iconUrl: string;
  deskripsi: string;
}

export interface InfoTrendItem {
  id: string;
  judul: string;
  ringkasan: string;
  konten: string;
  url_gambar: string;
  url_pdf?: string;
  tanggal: string;
  tag: string;
  penulis?: string;
}

export interface StockNotification {
  id: string;
  pesan: string;
  waktu: string;
  aktif: boolean;
  tipe: 'info' | 'promo' | 'stok' | 'berita' | 'tips';
}

export interface StoreProfile {
  namaToko: string;
  slogan: string;
  konteks: string;
  visiMisi: string;
  nomorWhatsApp: string;
  waTemplate: string;
  alamat: string;
  telepon: string;
  email: string;
  jamOperasional: string;
  jadwalPengiriman: string;
  ekspedisi: string[];
  medsos: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    tokopedia?: string;
    shopee?: string;
  };
  galeriMedia: Array<{
    id: string;
    tipe: 'image' | 'video';
    url: string;
    caption?: string;
    pdfUrl?: string;
  }>;
}

export interface SiteSettings {
  primaryColor: string; // Default #135A62
  bannerColorOpacity?: number; // 0 - 100 percentage for brand color overlay transparency on banner
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl: string;
  heroBannerMediaType: 'image' | 'video';
  pageBackgroundUrl: string;
  pagePattern: 'none' | 'dots' | 'grid' | 'mesh';
  logoUrl: string;
  logoWidth: number; // in px
  logoHeight: number; // in px
  footerText: string;
  footerCol2Title?: string; // Navigasi Cepat
  footerCol3Title?: string; // Kategori Unggulan
  footerCol4Title?: string; // Jam Operasional
  footerBottomText?: string; // Dioptimalkan untuk...
  popularCategories?: string[];
  footerCopyright: string;
  adminPasswordHash: string; // default "Dear2226"
  restrictedPasswords?: string[];
}
