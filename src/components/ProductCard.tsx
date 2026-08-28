import React from 'react';
import { ShoppingCart, Eye, Package, Star, CheckCircle, HelpCircle } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../utils/csvHelper';
import { useCatalog } from '../context/CatalogContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { setSelectedProductDetail, addToCart } = useCatalog();

  const isAvailable = product.jumlah_stok > 0;
  const hasDiscount = Boolean(product.harga_diskon && product.harga_diskon < product.harga);
  const activePrice = hasDiscount ? product.harga_diskon! : product.harga;

  // Calculate discount percentage
  const discountPercent = hasDiscount
    ? Math.round(((product.harga - product.harga_diskon!) / product.harga) * 100)
    : 0;

  return (
    <div
      id={`product-card-${product.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#135A62]/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
    >
      {/* Top Media Area */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedProductDetail(product)}>
        <img
          src={product.url_foto || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'}
          alt={product.nama}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Favorite Rank Badge (1-50) */}
        {product.angka_produk_favorit && product.angka_produk_favorit >= 35 && (
          <div className="absolute top-2.5 left-2.5 bg-amber-500/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-white" />
            <span>Top Favorit #{product.angka_produk_favorit}</span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            Hemat {discountPercent}%
          </div>
        )}

        {/* Brand & Type Pills Overlay */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md tracking-wider uppercase">
            {product.merk}
          </span>
          <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
            {product.type}
          </span>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Category Tag */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-[#135A62] bg-[#135A62]/10 px-2 py-0.5 rounded text-[11px]">
              {product.kategori}
            </span>

            {/* Strict Stock Status Rule: "Tersedia" vs "Tanya Admin" */}
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Tersedia
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                <HelpCircle className="w-3 h-3 text-amber-600" />
                Tanya Admin
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3
            onClick={() => setSelectedProductDetail(product)}
            className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-[#135A62] cursor-pointer transition-colors pt-1"
            title={product.nama}
          >
            {product.nama}
          </h3>

          {/* Short Description */}
          {product.deskripsi && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {product.deskripsi}
            </p>
          )}

          {/* Packing Information */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Isi Kemasan: <strong>{product.jumlah_pieces_packing} Pcs</strong> / {product.satuan_packing}
            </span>
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="pt-4 mt-3 border-t border-slate-100 space-y-3">
          {/* Price: 2 prices with red strike-through if discount, or 1 price */}
          <div>
            {hasDiscount ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 line-through font-medium">
                    {formatRupiah(product.harga)}
                  </span>
                </div>
                <span className="text-lg sm:text-xl font-extrabold text-[#135A62]">
                  {formatRupiah(activePrice)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-normal">Harga Standar</span>
                <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {formatRupiah(product.harga)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id={`btn-detail-${product.id}`}
              onClick={() => setSelectedProductDetail(product)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detail</span>
            </button>

            <button
              id={`btn-cart-${product.id}`}
              onClick={() => addToCart(product, 1)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#135A62] hover:bg-[#0e444a] transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>+ Keranjang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
