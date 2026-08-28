/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CatalogProvider, useCatalog } from './context/CatalogContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCatalog } from './components/ProductCatalog';
import { CategoryView } from './components/CategoryView';
import { InfoTrendView } from './components/InfoTrendView';
import { StoreProfileView } from './components/StoreProfileView';
import { ContactView } from './components/ContactView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminModal } from './components/AdminModal';
import { StockNotificationToast } from './components/StockNotificationToast';
import { Footer } from './components/Footer';

const MainCatalogApp: React.FC = () => {
  const { activeTab, siteSettings } = useCatalog();

  React.useEffect(() => {
    document.title = 'SST Catalog';
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 font-sans selection:bg-[#135A62] selection:text-white"
      style={{
        backgroundImage: siteSettings.pageBackgroundUrl
          ? `url(${siteSettings.pageBackgroundUrl})`
          : undefined,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
      }}
    >
      {/* Sticky Header Navbar */}
      <Navbar />

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {activeTab === 'beranda' && (
          <div className="space-y-6">
            <HeroBanner />
            <ProductCatalog />
          </div>
        )}

        {activeTab === 'kategori' && <CategoryView />}

        {activeTab === 'info-trend' && <InfoTrendView />}

        {activeTab === 'tentang-kami' && <StoreProfileView />}

        {activeTab === 'hubungi-kami' && <ContactView />}
      </main>

      {/* Product Detail Popup Modal */}
      <ProductDetailModal />

      {/* Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Admin Panel Modal (with password & CSV Manager) */}
      <AdminModal />

      {/* Real-time Periodic Stock Notification Toast */}
      <StockNotificationToast />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <CatalogProvider>
      <MainCatalogApp />
    </CatalogProvider>
  );
}
