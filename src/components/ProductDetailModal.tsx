import React, { useState } from 'react';
import { X, ShoppingCart, MessageCircle, Package, CheckCircle, HelpCircle, Star, ShieldCheck, Share2, Copy, Check } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { formatRupiah } from '../utils/csvHelper';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProductDetail,
    setSelectedProductDetail,
    addToCart,
    storeProfile,
    showToast,
  } = useCatalog();

  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  if (!selectedProductDetail) return null;

  const product = selectedProductDetail;
  const isAvailable = product.jumlah_stok > 0;
  const hasDiscount = Boolean(product.harga_diskon && product.harga_diskon < product.harga);
  const activePrice = hasDiscount ? product.harga_diskon! : product.harga;
  const discountPercent = hasDiscount
    ? Math.round(((product.harga - product.harga_diskon!) / product.harga) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setSelectedProductDetail(null);
  };

  const handleDirectWA = () => {
    const cleanPhone = storeProfile.nomorWhatsApp.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Halo Admin ${storeProfile.namaToko}, saya ingin memesan langsung produk berikut:\n\n` +
      `*Nama Produk:* ${product.nama}\n` +
      `*Merk:* ${product.merk} (${product.type})\n` +
      `*Kategori:* ${product.kategori}\n` +
      `*Harga Satuan:* ${formatRupiah(activePrice)}\n` +
      `*Jumlah Pesanan:* ${quantity} ${product.satuan_packing}\n` +
      `*Total Estimasi:* ${formatRupiah(activePrice * quantity)}\n\n` +
      `Mohon info ketersediaan stok & ongkir ke lokasi saya. Terima kasih!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleShare = () => {
    const shareText = `${product.nama} (${product.merk}) - ${formatRupiah(activePrice)} di ${storeProfile.namaToko}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setCopied(true);
      showToast('🔗 Info produk berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        id="product-detail-modal"
        className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedProductDetail(null)}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 shadow-md transition-colors"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image & Badges */}
          <div className="relative bg-slate-100 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
            <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden shadow-xs bg-white">
              <img
                src={product.url_foto || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'}
                alt={product.nama}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
                }}
              />

              {hasDiscount && (
                <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-md">
                  Diskon {discountPercent}%
                </div>
              )}

              {product.angka_produk_favorit && (
                <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>Favorit #{product.angka_produk_favorit}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between w-full text-xs text-slate-500">
              <span className="font-mono text-slate-400">ID: {product.id}</span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 font-medium text-[#135A62] hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Bagikan Produk'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Details & Order Controls */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category, Brand, Type */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#135A62]/10 text-[#135A62] text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {product.kategori}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                  Merk: <strong>{product.merk}</strong>
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                  Tipe: <strong>{product.type}</strong>
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {product.nama}
              </h2>

              {/* Stock Status Badge */}
              <div>
                {isAvailable ? (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Status Stok: Tersedia Siap Kirim</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Status Stok: Tanya Admin (Hubungi untuk indent/jadwal masuk)</span>
                  </div>
                )}
              </div>

              {/* Price display */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Harga Grosir / Satuan:</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#135A62]">
                    {formatRupiah(activePrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm sm:text-base text-red-500 line-through font-semibold">
                      {formatRupiah(product.harga)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    🎉 Anda hemat {formatRupiah(product.harga - product.harga_diskon!)} per kemasan!
                  </p>
                )}
              </div>

              {/* Packing specs */}
              <div className="flex items-center gap-2 p-3 bg-teal-50/60 rounded-xl text-xs text-teal-900 border border-teal-100">
                <Package className="w-4 h-4 text-[#135A62] shrink-0" />
                <span>
                  Informasi Kemasan: <strong>{product.jumlah_pieces_packing} Pcs</strong> per{' '}
                  <strong>{product.satuan_packing}</strong>
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Deskripsi Produk</h4>
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed max-h-36 overflow-y-auto pr-2">
                  {product.deskripsi || 'Tidak ada keterangan tambahan untuk produk ini.'}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              {/* Quantity Stepper */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Jumlah Pesanan:</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-slate-900 min-w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  id="modal-add-cart-btn"
                  onClick={handleAddToCart}
                  className="w-full py-3 px-4 rounded-xl bg-[#135A62] hover:bg-[#0e444a] text-white font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Keranjang</span>
                </button>

                <button
                  id="modal-wa-direct-btn"
                  onClick={handleDirectWA}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
