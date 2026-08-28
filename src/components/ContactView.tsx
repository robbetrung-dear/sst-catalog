import React, { useState } from 'react';
import { HelpCircle, Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export const ContactView: React.FC = () => {
  const { storeProfile } = useCatalog();
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const cleanPhone = storeProfile.nomorWhatsApp.replace(/[^0-9]/g, '');

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderMessage) return;

    const text = encodeURIComponent(
      `Halo Admin ${storeProfile.namaToko}, ada pesan konsultasi baru dari formulir kontak web:\n\n` +
      `*Nama:* ${senderName}\n` +
      `*No Telp/WA:* ${senderPhone || '-'}\n` +
      `*Pesan / Permintaan Penawaran:* \n${senderMessage}\n\n` +
      `Mohon dibantu informasinya. Terima kasih!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#135A62]/10 text-[#135A62] text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Layanan Konsultasi & Pemesanan</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Hubungi Kami
        </h2>
        <p className="text-sm text-slate-500">
          Tim customer service dan teknis kami siap membantu kebutuhan penawaran harga, ketersediaan produk khusus, maupun permintaan faktur pajak.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Direct Contact Cards */}
        <div className="space-y-4 lg:col-span-1">
          {/* WhatsApp Card */}
          <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 text-emerald-950 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">WhatsApp Resmi (Fast Response)</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Chat langsung dengan admin pengadaan untuk cek stok riil, faktur, dan diskon partai besar.
            </p>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Chat WhatsApp: +{cleanPhone}</span>
            </a>
          </div>

          {/* Office Phone & Email */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#135A62] flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 text-sm">Telepon Kantor</p>
                <p className="text-slate-600 mt-0.5">{storeProfile.telepon}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#135A62] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 text-sm">Email Resmi</p>
                <p className="text-slate-600 mt-0.5">{storeProfile.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#135A62] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 text-sm">Alamat Pergudangan & Kantor</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{storeProfile.alamat}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Message Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Kirim Pertanyaan / Permintaan Penawaran</h3>
            <p className="text-xs text-slate-500 mt-1">
              Isi data di bawah ini, kami akan merespons langsung melalui WhatsApp Anda.
            </p>
          </div>

          {sentSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pesan Anda sedang dibuka di aplikasi WhatsApp... Terima kasih!</span>
            </div>
          )}

          <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Nama Lengkap / Perusahaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Pratama"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-[#135A62]/20 focus:border-[#135A62]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-[#135A62]/20 focus:border-[#135A62]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Rincian Pertanyaan / Kebutuhan Produk *</label>
              <textarea
                required
                rows={5}
                placeholder="Tuliskan nama produk, spesifikasi khusus, perkiraan kuantitas kemasan, atau pertanyaan lainnya..."
                value={senderMessage}
                onChange={(e) => setSenderMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 outline-none focus:bg-white focus:ring-2 focus:ring-[#135A62]/20 focus:border-[#135A62]"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-[#135A62] hover:bg-[#0e444a] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pesan ke WhatsApp Admin</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
