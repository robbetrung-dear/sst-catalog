import React, { useState, useEffect } from 'react';
import { Bell, X, Sparkles, Package } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export const StockNotificationToast: React.FC = () => {
  const { notifications, activeToast } = useCatalog();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const activeNotifs = notifications.filter((n) => n.aktif);

  // Cycle notifications every 10 seconds if multiple exist
  useEffect(() => {
    if (activeNotifs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeNotifs.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeNotifs.length]);

  const currentBroadcast = activeNotifs[currentIndex];

  return (
    <>
      {/* Action Toast for user clicks (e.g. added to cart, copied link, etc.) */}
      {activeToast && (
        <div className="fixed bottom-20 right-4 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>{activeToast}</span>
        </div>
      )}

      {/* Real-time Periodic Stock Broadcast Bar */}
      {currentBroadcast && !isDismissed && (
        <div className="fixed bottom-4 left-4 z-40 max-w-md bg-white/95 backdrop-blur-md text-slate-900 p-3.5 rounded-2xl shadow-2xl border border-emerald-300/80 flex items-start gap-3 text-xs animate-in slide-in-from-bottom-3 duration-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            {currentBroadcast.tipe === 'stok' ? (
              <Package className="w-4 h-4 text-emerald-700" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-700" />
            )}
          </div>

          <div className="flex-1 space-y-0.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-800">
                Pembaruan Siaran Real-Time
              </span>
              <span className="text-[10px] text-slate-400">{currentBroadcast.waktu}</span>
            </div>
            <p className="text-slate-700 font-medium leading-snug">
              {currentBroadcast.pesan}
            </p>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-slate-700 p-0.5"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
