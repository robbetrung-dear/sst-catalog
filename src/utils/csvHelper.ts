import Papa from 'papaparse';
import { Product } from '../types';

/**
 * Normalizes keys to handle various casing, spaces, underscores, and slight typos in CSV headers
 */
function normalizeHeader(header: string): string {
  return String(header || '')
    .toLowerCase()
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\s\-_./\\]+/g, '_');
}

/**
 * Clean numeric strings (e.g. "Rp 150.000", "150,000.50", "25.000", "10%")
 */
export function parseCleanNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim();
  // Remove currency prefixes & letters
  str = str.replace(/^(rp|idr|usd|sgd|\$)\.?\s*/i, '').trim();
  
  // If format is like "150.000,00" (Indonesian format with thousand dot and comma decimal)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    // Format like "150,000.00" (US format)
    str = str.replace(/,/g, '');
  } else {
    // General cleanup
    str = str.replace(/[^0-9.-]/g, '');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Sanitize and validate single product object
 */
export function sanitizeProductData(p: any, index = 0): Product {
  const rawId = p.id || p.kode || p.code || p.sku || p.kode_barang || p.kode_produk || p.item_id || p.product_id || p.no || p.nomor;
  const safeId = String(rawId || `PRD-${Date.now()}-${index + 1}`)
    .trim()
    .replace(/[\/\\]+/g, '-')
    .replace(/^[\.]+|[\.]+$/g, '');

  const nama = String(
    p.nama || p.nama_produk || p.name || p.product_name || p.item_name || p.produk || 
    p.barang || p.nama_barang || p.title || p.judul || p.item || `Produk #${index + 1}`
  ).trim();
  
  const merk = String(
    p.merk || p.brand || p.merek || p.manufacturer || p.pabrikan || p.vendor || p.merk_brand || 'Umum'
  ).trim();
  
  const kategori = String(
    p.kategori || p.category || p.kategori_produk || p.kelompok || p.group || p.jenis || p.kategori_barang || 'Lain-lain'
  ).trim();
  
  const type = String(
    p.type || p.tipe || p.model || p.model_tipe || p.model_type || p.series || p.seri || 
    p.varian || p.variant || p.ukuran || p.size || p.tipe_produk || 'Standard'
  ).trim();

  const harga = parseCleanNumber(
    p.harga ?? p.price ?? p.harga_jual ?? p.harga_satuan ?? p.unit_price ?? p.selling_price ?? p.harga_pokok ?? p.harga_net
  );
  
  const rawDiskon = p.harga_diskon ?? p.diskon ?? p.discount_price ?? p.harga_promo ?? p.promo_price ?? p.promo ?? p.discount;
  let harga_diskon: number | undefined = undefined;
  if (rawDiskon !== undefined && rawDiskon !== null && rawDiskon !== '') {
    if (typeof rawDiskon === 'string' && rawDiskon.includes('%')) {
      const pct = parseCleanNumber(rawDiskon);
      if (pct > 0 && pct < 100 && harga > 0) {
        harga_diskon = Math.round(harga * (1 - pct / 100));
      }
    } else {
      const dVal = parseCleanNumber(rawDiskon);
      if (dVal > 0 && dVal < harga) {
        harga_diskon = dVal;
      }
    }
  }

  const deskripsi = String(
    p.deskripsi || p.description || p.keterangan || p.detail || p.spesifikasi || 
    p.spek || p.specs || p.ket || p.info || p.catatan || ''
  ).trim();
  
  const rawStok = p.jumlah_stok ?? p.stok ?? p.stock ?? p.qty ?? p.quantity ?? p.jumlah ?? 
    p.saldo_stok ?? p.tersedia ?? p.sisa ?? p.stok_tersedia ?? p.stok_barang ?? p.stok_akhir;
  const jumlah_stok = Math.max(0, Math.floor(parseCleanNumber(rawStok)));

  const rawPieces = p.jumlah_pieces_packing ?? p.packing_qty ?? p.isi_kemasan ?? p.pcs_per_pack ?? 
    p.isi ?? p.qty_pack ?? p.isi_dus ?? p.per_pack ?? p.isi_per_dus ?? p.jumlah_isi;
  const jumlah_pieces_packing = Math.max(1, Math.floor(parseCleanNumber(rawPieces)) || 1);

  const satuan_packing = String(
    p.satuan_packing || p.satuan || p.kemasan || p.unit || p.uom || p.packaging || p.satuan_barang || 'Pcs'
  ).trim();

  const rawFav = p.angka_produk_favorit ?? p.favorit ?? p.favorite ?? p.rating ?? p.priority ?? p.urutan ?? p.urutan_rekomendasi;
  const parsedFav = parseCleanNumber(rawFav);
  const angka_produk_favorit = parsedFav > 0 ? Math.min(50, Math.max(1, Math.floor(parsedFav))) : 25;

  const url_foto = String(
    p.url_foto || p.foto || p.gambar || p.image || p.image_url || p.photo || p.picture || 
    p.img || p.link_foto || p.link_gambar || p.url_gambar ||
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
  ).trim();

  const productObj: Product = {
    id: safeId || `prd_${Date.now()}_${index + 1}`,
    nama,
    merk,
    kategori,
    type,
    harga,
    deskripsi,
    jumlah_stok,
    jumlah_pieces_packing,
    satuan_packing,
    angka_produk_favorit,
    url_foto,
  };

  if (harga_diskon !== undefined && harga_diskon > 0 && harga_diskon < harga) {
    productObj.harga_diskon = harga_diskon;
  }

  return productObj;
}

/**
 * Universal Parser for CSV or JSON string into array of Product objects.
 * Handles CSV with comma, semicolon, tab, and JSON arrays.
 */
export function parseProductsFile(fileContent: string): Product[] {
  const trimmed = fileContent.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return [];

  // Check if content is JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      let rawList: any[] = [];
      if (Array.isArray(parsedJson)) {
        rawList = parsedJson;
      } else if (parsedJson && typeof parsedJson === 'object') {
        if (Array.isArray(parsedJson.products)) rawList = parsedJson.products;
        else if (Array.isArray(parsedJson.items)) rawList = parsedJson.items;
        else if (Array.isArray(parsedJson.data)) rawList = parsedJson.data;
        else if (Array.isArray(parsedJson.produk)) rawList = parsedJson.produk;
      }

      if (rawList.length > 0) {
        return rawList.map((item, idx) => sanitizeProductData(item, idx));
      }
    } catch {
      // If JSON parse fails, fallback to CSV parsing
    }
  }

  // Parse as CSV
  const result = Papa.parse(trimmed, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normalizeHeader,
  });

  const products: Product[] = [];

  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((row: any, index: number) => {
      // Check if row has at least one non-empty value
      if (!row || typeof row !== 'object') return;
      const hasAnyVal = Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
      if (!hasAnyVal) return;

      const product = sanitizeProductData(row, index);
      if (product.nama) {
        products.push(product);
      }
    });
  }

  return products;
}

/**
 * Backward compatible wrapper for parseProductsCSV
 */
export function parseProductsCSV(csvText: string): Product[] {
  return parseProductsFile(csvText);
}

/**
 * Export products array to CSV string
 */
export function exportProductsToCSV(products: Product[]): string {
  const csvData = products.map((p) => ({
    id: p.id,
    nama: p.nama,
    merk: p.merk,
    kategori: p.kategori,
    type: p.type,
    harga: p.harga,
    harga_diskon: p.harga_diskon !== undefined ? p.harga_diskon : '',
    deskripsi: p.deskripsi,
    jumlah_stok: p.jumlah_stok,
    jumlah_pieces_packing: p.jumlah_pieces_packing,
    satuan_packing: p.satuan_packing,
    angka_produk_favorit: p.angka_produk_favorit,
    url_foto: p.url_foto,
  }));

  return Papa.unparse(csvData, {
    quotes: true,
    header: true,
  });
}

/**
 * Trigger browser file download for CSV or JSON
 */
export function downloadFile(content: string, filename: string, type: 'text/csv' | 'application/json' = 'text/csv') {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency to Indonesian Rupiah (IDR)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
