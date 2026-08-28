import React from 'react';
import { Search, Sparkles, CheckCircle2, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export const HeroBanner: React.FC = () => {
  const {
    siteSettings,
    storeProfile,
    searchQuery,
    setSearchQuery,
    products,
    allCategories,
    allBrands,
    setSelectedCategory,
    setActiveTab,
  } = useCatalog();

  const isVideo = siteSettings.heroBannerMediaType === 'video' && siteSettings.heroBannerUrl;
  const brandColor = siteSettings.primaryColor || '#135A62';
  const rawOpacity = typeof siteSettings.bannerColorOpacity === 'number' ? siteSettings.bannerColorOpacity : 75;
  const overlayOpacity = Math.max(0, Math.min(100, rawOpacity)) / 100;

  return (
    <section 
      className="relative overflow-hidden text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 shadow-xl border border-slate-800"
      style={{ backgroundColor: brandColor }}
    >
      {/* Background Media & Brand Color Overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        {isVideo ? (
          <video
            src={siteSettings.heroBannerUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={
              siteSettings.heroBannerUrl ||
              'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&auto=format&fit=crop&q=80'
            }
            alt="Hero Background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform scale-105 transition-transform duration-700"
          />
        )}

        {/* Dynamic Brand Color Overlay (Warna Utama) with customizable transparency */}
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundColor: brandColor,
            opacity: overlayOpacity,
            mixBlendMode: 'multiply'
          }}
        />

        {/* Dynamic Secondary Color Tint layer */}
        <div 
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            backgroundColor: brandColor,
            opacity: overlayOpacity * 0.45
          }}
        />

        {/* Text Readability Gradient Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, ${0.35 + overlayOpacity * 0.45}) 55%, rgba(15, 23, 42, 0.2) 100%)`
          }}
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 lg:py-20 flex flex-col justify-center">
        <div className="max-w-3xl space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Katalog Resmi Terlengkap & Terpercaya</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {siteSettings.heroTitle || 'Katalog Produk Teknik & Industri Terlengkap'}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
            {siteSettings.heroSubtitle ||
              'Pusat pengadaan fastener, perlengkapan las, perkakas tangan, dan alat safety dengan harga distributor langsung.'}
          </p>

          {/* Main Search Bar inside Hero */}
          <div className="pt-2">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-2xl border border-white/20 flex flex-col sm:flex-row gap-2 items-center text-slate-800">
              <div className="flex items-center flex-1 w-full px-3 py-1.5">
                <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                <input
                  id="hero-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama baut, kawat las, merk, tipe gerinda, atau spesifikasi..."
                  className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded bg-slate-100"
                  >
                    Bersihkan
                  </button>
                )}
              </div>
              <button
                id="hero-search-btn"
                onClick={() => {
                  const target = document.getElementById('catalog-product-list');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ backgroundColor: brandColor }}
                className="w-full sm:w-auto px-6 py-3 hover:brightness-110 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Cari Produk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Category Chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Kategori Populer:</span>
              {((siteSettings.popularCategories && siteSettings.popularCategories.length > 0)
                 ? siteSettings.popularCategories
                 : allCategories.slice(0, 5)
                ).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    const target = document.getElementById('catalog-product-list');
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-all text-xs font-medium backdrop-blur-xs"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Value Props stats */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-base">{products.length}+</p>
                <p className="text-slate-400 text-xs">Produk Terdaftar</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-base">{allBrands.length} Merk</p>
                <p className="text-slate-400 text-xs">Original & Bergaransi</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-base">Siap Kirim</p>
                <p className="text-slate-400 text-xs">Seluruh Indonesia</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-base">Cloudflare</p>
                <p className="text-slate-400 text-xs">Ultra Fast Static Web</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
