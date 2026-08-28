import React from 'react';
import { Layers, ArrowRight, PackageCheck, Sparkles } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export const CategoryView: React.FC = () => {
  const {
    allCategories,
    categoriesMeta,
    products,
    setSelectedCategory,
    setActiveTab,
  } = useCatalog();

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setActiveTab('beranda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#135A62]/10 text-[#135A62] text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" />
          <span>Eksplorasi Berdasarkan Kategori</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Kategori Produk & Spesialisasi
        </h2>
        <p className="text-sm text-slate-500">
          Pilih kategori yang Anda cari untuk meninjau seluruh varian produk, spesifikasi kemasan, dan harga grosir terbaik.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {allCategories.map((catName) => {
          const meta = categoriesMeta.find((c) => c.nama.toLowerCase() === catName.toLowerCase());
          const productCount = products.filter((p) => p.kategori === catName).length;
          const iconUrl = meta?.iconUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
          const desc = meta?.deskripsi || `Koleksi lengkap produk ${catName} dengan standar industri berkualitas tinggi.`;

          return (
            <div
              key={catName}
              id={`cat-card-${catName}`}
              onClick={() => handleSelectCategory(catName)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-[#135A62]/50 p-5 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Category Icon / Image */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs group-hover:scale-105 transition-transform">
                  <img
                    src={iconUrl}
                    alt={catName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-[#135A62] transition-colors">
                      {catName}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                      {productCount} Produk
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                    {desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#135A62] group-hover:translate-x-1 transition-transform">
                <span>Lihat Semua Produk</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
