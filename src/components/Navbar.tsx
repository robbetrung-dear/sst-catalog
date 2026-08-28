import React, { useState } from 'react';
import { ShoppingCart, Menu, X, Shield, PhoneCall, Search, Layers, BookOpen, Building2, HelpCircle } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export const Navbar: React.FC = () => {
  const {
    siteSettings,
    storeProfile,
    totalCartItems,
    setIsCartOpen,
    setIsAdminOpen,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    setSelectedBrand,
    setSelectedType,
  } = useCatalog();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: Layers },
    { id: 'kategori', label: 'Kategori', icon: Layers },
    { id: 'info-trend', label: 'Info & Trend', icon: BookOpen },
    { id: 'tentang-kami', label: 'Tentang Kami', icon: Building2 },
    { id: 'hubungi-kami', label: 'Hubungi Kami', icon: HelpCircle },
  ] as const;

  const handleNavClick = (tabId: typeof navItems[number]['id']) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    if (tabId === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cleanPhone = storeProfile.nomorWhatsApp.replace(/[^0-9]/g, '');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      {/* Top emergency announcement bar */}
      <div className="bg-[#135A62] text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-between">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <span className="truncate">
            ✨ <strong>Katalog Resmi:</strong> Melayani Pesanan Grosir & Eceran Seluruh Indonesia
          </span>
          <div className="hidden md:flex items-center space-x-4 shrink-0 text-slate-100">
            <span>⏰ {storeProfile.jamOperasional.split('|')[0] || 'Senin - Sabtu: 08:00 - 17:00'}</span>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-1 font-semibold text-emerald-300"
            >
              <PhoneCall className="w-3.5 h-3.5" /> WA Admin
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3">
          {/* Logo & Store Name */}
          <div
            id="nav-brand-logo"
            onClick={() => handleNavClick('beranda')}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
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
              <div className="w-10 h-10 rounded-xl bg-[#135A62] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {storeProfile.namaToko.charAt(0) || 'K'}
              </div>
            )}

            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight leading-tight">
                {storeProfile.namaToko}
              </span>
              <span className="text-xs text-slate-500 line-clamp-1 hidden sm:block">
                {storeProfile.slogan}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm text-slate-700">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#135A62]/10 text-[#135A62] font-semibold'
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Quick Search Toggle / Input */}
            <div className="relative">
              {showSearchInput ? (
                <div className="flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-300 w-48 sm:w-64 animate-in fade-in duration-150">
                  <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari produk..."
                    autoFocus
                    className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-800"
                  />
                  <button
                    onClick={() => {
                      setShowSearchInput(false);
                      if (!searchQuery) {
                        setSearchQuery('');
                      }
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="nav-search-btn"
                  onClick={() => {
                    setShowSearchInput(true);
                    if (activeTab !== 'beranda') setActiveTab('beranda');
                  }}
                  className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#135A62] transition-colors"
                  title="Cari Produk"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Cart Button with Count Badge */}
            <button
              id="nav-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-lg bg-emerald-50 text-[#135A62] hover:bg-emerald-100 transition-colors flex items-center justify-center font-semibold text-sm gap-1.5"
              title="Lihat Keranjang Belanja"
            >
              <ShoppingCart className="w-5 h-5 text-[#135A62]" />
              <span className="hidden sm:inline">Keranjang</span>
              {totalCartItems > 0 && (
                <span className="min-w-5 h-5 px-1.5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-xs animate-pulse">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Admin Panel Button */}
            <button
              id="nav-admin-btn"
              onClick={() => setIsAdminOpen(true)}
              className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Panel Kelola Admin & CSV"
            >
              <Shield className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              id="nav-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="mb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'beranda') setActiveTab('beranda');
                }}
                placeholder="Cari produk di katalog..."
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-lg text-sm border border-slate-200 outline-none focus:border-[#135A62]"
              />
            </div>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg font-medium text-sm flex items-center justify-between ${
                activeTab === item.id
                  ? 'bg-[#135A62] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Admin Mega Teknik</span>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAdminOpen(true);
              }}
              className="text-[#135A62] font-semibold underline"
            >
              Buka Panel Admin
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
