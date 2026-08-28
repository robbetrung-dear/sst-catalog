import React from 'react';
import { Shield, Phone, Mail, MapPin, Layers, BookOpen, Building2, HelpCircle, Heart } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export const Footer: React.FC = () => {
  const {
    siteSettings,
    storeProfile,
    allCategories,
    setSelectedCategory,
    setActiveTab,
    setIsAdminOpen,
  } = useCatalog();

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setActiveTab('beranda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (tab: any) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1 & 2: Store Info & Logo */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {siteSettings.logoUrl ? (
                <img
                  src={siteSettings.logoUrl}
                  alt={storeProfile.namaToko}
                  referrerPolicy="no-referrer"
                  style={{
                    width: `${siteSettings.logoWidth || 160}px`,
                    height: `${siteSettings.logoHeight || 44}px`,
                  }}
                  className="object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#135A62] text-white flex items-center justify-center font-black text-xl shadow-xs">
                  {storeProfile.namaToko.charAt(0) || 'K'}
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg text-white leading-tight">{storeProfile.namaToko}</h3>
                <p className="text-xs text-emerald-400">{storeProfile.slogan}</p>
              </div>
            </div>

            {siteSettings.footerText && !siteSettings.footerText.includes('Mitra terpercaya pengadaan barang teknik industri') && (
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
                {siteSettings.footerText}
              </p>
            )}

            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{storeProfile.alamat}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{storeProfile.telepon}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{storeProfile.email}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider text-emerald-400">
              {siteSettings.footerCol2Title || 'Navigasi Cepat'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => handleNavClick('beranda')}
                  className="hover:text-white transition-colors"
                >
                  Beranda Katalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('kategori')}
                  className="hover:text-white transition-colors"
                >
                  Semua Kategori
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('info-trend')}
                  className="hover:text-white transition-colors"
                >
                  Info & Trend Industri
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('tentang-kami')}
                  className="hover:text-white transition-colors"
                >
                  Tentang Kami
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('hubungi-kami')}
                  className="hover:text-white transition-colors"
                >
                  Hubungi Kami & Order WA
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Kategori Terpopuler */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider text-emerald-400">
              {siteSettings.footerCol3Title || 'Kategori Unggulan'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {((siteSettings.popularCategories && siteSettings.popularCategories.length > 0) 
                 ? siteSettings.popularCategories 
                 : allCategories.slice(0, 5)
                ).map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Jam Kerja & Admin */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider text-emerald-400">
              {siteSettings.footerCol4Title || 'Jam Operasional'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {storeProfile.jamOperasional}
            </p>

            <div className="pt-3">
              <button
                onClick={() => setIsAdminOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panel Pengelola Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{siteSettings.footerCopyright || '© 2026 Mega Teknik Industri. All Rights Reserved.'}</p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>{siteSettings.footerBottomText || 'Dioptimalkan untuk'}</span>
            <span className="font-semibold text-emerald-400">Cloudflare Pages & GitHub</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
