import React, { useState } from 'react';
import { Building2, Clock, Truck, ShieldCheck, MapPin, Phone, Mail, Instagram, Facebook, Video, Image, MessageCircle, ExternalLink, ArrowRight, FileText } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export const StoreProfileView: React.FC = () => {
  const { storeProfile } = useCatalog();
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);

  const cleanPhone = storeProfile.nomorWhatsApp.replace(/[^0-9]/g, '');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in duration-200">
      {/* Hero Store Profile */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#135A62] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Building2 className="w-3.5 h-3.5" />
            <span>Profil Resmi Perusahaan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{storeProfile.namaToko}</h1>
          <p className="text-emerald-200 font-medium text-base sm:text-lg">{storeProfile.slogan}</p>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-2">
            {storeProfile.konteks}
          </p>

          {/* Direct CTA */}
          <div className="pt-4 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-slate-950" />
              <span>Hubungi Tim Sales Langsung</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2 Column Details: Visi Misi & Operational Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Visi Misi & Pelayanan */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#135A62]" />
              <span>Visi, Misi & Komitmen Kualitas</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {storeProfile.visiMisi}
            </p>
          </div>

          {/* Social Media Links */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kanal Media Sosial & Official Store
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {storeProfile.medsos.instagram && (
                <a
                  href={storeProfile.medsos.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-pink-50 text-pink-700 font-semibold hover:bg-pink-100 flex items-center gap-1.5 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}
              {storeProfile.medsos.facebook && (
                <a
                  href={storeProfile.medsos.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
              )}
              {storeProfile.medsos.tiktok && (
                <a
                  href={storeProfile.medsos.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <span>TikTok Official</span>
                </a>
              )}
              {storeProfile.medsos.tokopedia && (
                <a
                  href={storeProfile.medsos.tokopedia}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                >
                  <span>Tokopedia Store</span>
                </a>
              )}
              {storeProfile.medsos.shopee && (
                <a
                  href={storeProfile.medsos.shopee}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-orange-50 text-orange-800 font-semibold hover:bg-orange-100 flex items-center gap-1.5 transition-colors"
                >
                  <span>Shopee Store</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: Operational Hours & Shipping Logistics */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#135A62]" />
              <span>Jam Operasional Layanan</span>
            </h3>
            <div className="p-4 bg-slate-50 rounded-2xl text-xs sm:text-sm text-slate-700 border border-slate-100 font-medium">
              {storeProfile.jamOperasional}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#135A62]" />
              <span>Pengiriman & Mitra Ekspedisi</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {storeProfile.jadwalPengiriman}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {storeProfile.ekspedisi.map((exp, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-teal-50 text-teal-900 border border-teal-200/60 rounded-xl text-xs font-semibold"
                >
                  🚚 {exp}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Media Gallery Section */}
      {storeProfile.galeriMedia && storeProfile.galeriMedia.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Galeri Fasilitas & Stok Gudang</h3>
              <p className="text-xs text-slate-500">
                Dokumentasi operasional, fasilitas gudang, dan penanganan produk kami.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {storeProfile.galeriMedia.map((media, index) => (
              <div
                key={media.id || index}
                className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs hover:shadow-md transition-all"
              >
                <div 
                  className="w-full h-full cursor-pointer"
                  onClick={() => setActiveMediaIndex(index)}
                >
                  {media.tipe === 'video' ? (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt={media.caption || 'Foto Galeri'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {media.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-3 text-white text-xs font-medium">
                      {media.caption}
                    </div>
                  )}
                </div>
                
                {media.pdfUrl && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={media.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Lihat Detail (PDF)"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-white/90 hover:bg-white text-emerald-700 rounded-lg shadow-sm backdrop-blur-xs transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
