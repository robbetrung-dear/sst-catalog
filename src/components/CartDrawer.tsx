import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, Send, AlertTriangle, ArrowRight, Package, FileText, CheckCircle } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { formatRupiah } from '../utils/csvHelper';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    totalCartItems,
    totalCartPrice,
    storeProfile,
  } = useCatalog();

  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('sst_customer_name') || '';
  });
  const [customerAddress, setCustomerAddress] = useState(() => {
    return localStorage.getItem('sst_customer_address') || '';
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    return localStorage.getItem('sst_customer_phone') || '';
  });
  const [customerCode, setCustomerCode] = useState(() => {
    return localStorage.getItem('sst_customer_code') || 'Pelanggan Tunai';
  });
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [formError, setFormError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  if (!isCartOpen) return null;

  const validateForm = () => {
    if (!customerName.trim() || !customerAddress.trim() || !customerCode.trim()) {
      setFormError('Semua Data Pemesan (Nama, Alamat, dan Nomor Pelanggan) wajib diisi.');
      return false;
    }
    setFormError('');
    return true;
  };

  const getCheckoutMessage = (includeInvoiceRef = false) => {
    // Generate formatted item lines
    const itemLines = cart
      .map((item, index) => {
        const activePrice = item.product.harga_diskon || item.product.harga;
        const subtotal = activePrice * item.quantity;
        return (
          `${index + 1}. *${item.product.nama}*\n` +
          `   - Merk/Tipe: ${item.product.merk} (${item.product.type})\n` +
          `   - Kemasan: ${item.product.jumlah_pieces_packing} Pcs/${item.product.satuan_packing}\n` +
          `   - Qty: ${item.quantity} ${item.product.satuan_packing} @ ${formatRupiah(activePrice)}\n` +
          `   - Subtotal: ${formatRupiah(subtotal)}`
        );
      })
      .join('\n\n');

    let message = storeProfile.waTemplate ||
      'Halo Admin {NAMA_TOKO}, saya ingin memesan produk dari katalog website:\n\n{DAFTAR_PESANAN}\n\n*Total Estimasi:* {TOTAL_HARGA}\n\n*Data Pemesan:*\n- Nama: {NAMA}\n- Alamat / Kota: {ALAMAT}\n- Catatan Khusus: {CATATAN}\n\nMohon konfirmasi ketersediaan stok & total ongkir. Terima kasih!';

    const customerNotes = customerPhone.trim()
      ? `${customerCode.trim()}\n- No. WhatsApp: ${customerPhone.trim()}`
      : customerCode.trim();

    message = message
      .replace(/{NAMA_TOKO}/g, storeProfile.namaToko)
      .replace(/{DAFTAR_PESANAN}/g, itemLines)
      .replace(/{TOTAL_HARGA}/g, formatRupiah(totalCartPrice))
      .replace(/{NAMA}/g, customerName.trim().toUpperCase())
      .replace(/{ALAMAT}/g, customerAddress.trim())
      .replace(/{CATATAN}/g, customerNotes);

    if (includeInvoiceRef) {
      message = `Halo Admin ${storeProfile.namaToko}, saya telah membuat Draft Pesanan / Invoice untuk pesanan saya.\n\n*Nama:* ${customerName.trim().toUpperCase()}\n*Total Estimasi:* ${formatRupiah(totalCartPrice)}\n\n📎 *Catatan:* File rincian pesanan (format CSV) telah diunduh ke perangkat dan saya lampirkan pada chat ini.\n\nBerikut adalah rincian pesanannya:\n\n` + message;
    }

    return message;
  };

  const handleCheckoutWhatsApp = () => {
    if (!validateForm()) return;
    if (cart.length === 0) return;

    const message = getCheckoutMessage(false);
    const cleanPhone = storeProfile.nomorWhatsApp.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    window.open(waUrl, '_blank');
  };

  const generateCSV = () => {
    let csv = "No.,SST DO (DELIVERY ORDER) & INVOICE,Jumlah,Harga,Disc.%,Total\n";
    cart.forEach((item, index) => {
       const hasDiscount = Boolean(item.product.harga_diskon && item.product.harga_diskon < item.product.harga);
       const activePrice = hasDiscount ? item.product.harga_diskon! : item.product.harga;
       const lineTotal = activePrice * item.quantity;
       let discPercent = 0;
       if (hasDiscount && item.product.harga > 0) {
          discPercent = Math.round(((item.product.harga - activePrice) / item.product.harga) * 100);
       }
       
       const cleanName = `"${item.product.nama.replace(/"/g, '""')}"`;
       csv += `${index + 1},${cleanName},${item.quantity},${activePrice},${discPercent > 0 ? discPercent + '%' : ''},${lineTotal}\n`;
    });
    
    // Formula Tax: nilai Tax = nilai Jumlah Total / (1+ nilai Tax Rate/100) dengan pembulatan dua angka desimal
    const taxRate = 11;
    const taxValue = (totalCartPrice / (1 + taxRate / 100)).toFixed(2);

    // Customer info in Column A
    const nameColA = `"${customerName.trim().toUpperCase().replace(/"/g, '""')}"`;
    const addressColA = `"${customerAddress.trim().replace(/"/g, '""')}"`;
    const codeDisplay = customerCode.trim() ? customerCode.trim().toUpperCase() : 'PELANGGAN TUNAI';
    const codeColA = `"${codeDisplay.replace(/"/g, '""')}"`;
    const phoneColA = `"${customerPhone.trim().replace(/"/g, '""')}"`;

    // 4 commas shift the labels to Column E (under Disc.%) and values to Column F (under Total)
    csv += `\n${nameColA},,,,Jumlah Total:,${totalCartPrice}\n`;
    csv += `${addressColA},,,,Tax Rate:,11%\n`;
    csv += `${codeColA},,,,Tax:,${taxValue}\n`;
    csv += `${phoneColA},,,,TOTAL:,${totalCartPrice}\n`;

    // Baris terakhir: keterangan informasi lokasi kota/kabupaten, tanggal (lengkap) dan waktu (lengkap) send by whatsapp (semua dalam satu baris)
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const tanggalLengkap = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const waktuLengkap = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`;
    const lokasiKotaKab = customerAddress.trim() || 'Surabaya';
    const infoSendByWA = `Lokasi (Kota/Kabupaten): ${lokasiKotaKab} | Tanggal: ${tanggalLengkap} | Waktu: ${waktuLengkap} | Send by WhatsApp`;

    csv += `"${infoSendByWA.replace(/"/g, '""')}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Invoice_SST_${customerName.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckoutWhatsAppWithInvoice = () => {
    if (!validateForm()) return;
    if (cart.length === 0) return;

    setIsGenerating(true);
    try {
      // 1. Instantly generate & download the CSV invoice
      generateCSV();

      // 2. Open WhatsApp in a new tab with prepared message
      const message = getCheckoutMessage(true);
      const cleanPhone = storeProfile.nomorWhatsApp.replace(/[^0-9]/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      // 3. Show a clear instruction toast in the drawer
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 9000);
    } catch (err) {
       console.error("Gagal membuat CSV", err);
       alert("Gagal mengunduh file invoice CSV. Silakan coba checkout WhatsApp biasa.");
    } finally {
       setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
        <div
          id="cart-drawer-panel"
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 relative"
        >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#135A62] text-white flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Keranjang Belanja</h3>
              <p className="text-xs text-slate-500">
                {cart.length} Jenis Produk ({totalCartItems} total item)
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Limit Warning (Max 20 Items per Transaction) */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Maksimal 20 item produk per transaksi
          </span>
          <span className="font-bold px-2 py-0.5 bg-amber-200/60 rounded text-amber-950">
            {cart.length}/20 Item
          </span>
        </div>

        {/* Body: Cart List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">Keranjang Anda Masih Kosong</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Jelajahi katalog dan klik tombol &quot;+ Keranjang&quot; pada produk yang ingin Anda pesan.
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#135A62] text-white text-xs font-semibold hover:bg-[#0e444a] transition-colors"
              >
                Mulai Belanja Sekarang
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const activePrice = item.product.harga_diskon || item.product.harga;
              const subtotal = activePrice * item.quantity;

              return (
                <div key={item.product.id} className="pt-3 first:pt-0 flex gap-3 items-start">
                  <img
                    src={item.product.url_foto || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80'}
                    alt={item.product.nama}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 leading-snug">
                      {item.product.nama}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {item.product.merk} • {item.product.jumlah_pieces_packing} Pcs/{item.product.satuan_packing}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-extrabold text-[#135A62]">
                        {formatRupiah(activePrice)}
                      </span>
                      {item.product.harga_diskon && (
                        <span className="text-[10px] text-red-500 line-through">
                          {formatRupiah(item.product.harga)}
                        </span>
                      )}
                    </div>

                    {/* Stepper + Remove */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.product.jumlah_stok || 9999}
                          value={item.quantity}
                          onChange={(e) => {
                             let val = parseInt(e.target.value) || 1;
                             if (val < 1) val = 1;
                             updateCartQuantity(item.product.id, val);
                          }}
                          className="w-10 px-1 py-0.5 text-xs font-bold text-slate-900 text-center outline-none bg-transparent appearance-none"
                        />
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">
                          {formatRupiah(subtotal)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Hapus item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Customer Form & Checkout Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-4">
            {/* Customer Inputs */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Data Pemesan <span className="text-red-500">*</span></span>
                <button onClick={clearCart} className="text-red-600 hover:underline font-normal">
                  Kosongkan Keranjang
                </button>
              </div>
              {formError && (
                <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 flex items-start gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <input
                type="text"
                placeholder="Nama Anda / Perusahaan (contoh: CV Bintang Teknik) *"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  localStorage.setItem('sst_customer_name', e.target.value);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#135A62]"
              />
              <input
                type="text"
                placeholder="Alamat Pengiriman / Kota (contoh: Rungkut, Surabaya) *"
                value={customerAddress}
                onChange={(e) => {
                  setCustomerAddress(e.target.value);
                  localStorage.setItem('sst_customer_address', e.target.value);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#135A62]"
              />
              <input
                type="tel"
                placeholder="Nomor WhatsApp Anda (contoh: 081234567890)"
                value={customerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9+\s-]/g, '');
                  setCustomerPhone(val);
                  localStorage.setItem('sst_customer_phone', val);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#135A62]"
              />
              <div className="relative">
                <input
                  type="text"
                  value={customerCode}
                  onFocus={() => {
                    if (customerCode === 'Pelanggan Tunai') setCustomerCode('');
                    setIsCodeFocused(true);
                  }}
                  onBlur={() => {
                    if (!customerCode.trim()) setCustomerCode('Pelanggan Tunai');
                    setIsCodeFocused(false);
                    localStorage.setItem('sst_customer_code', customerCode.trim() || 'Pelanggan Tunai');
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCustomerCode(val);
                    localStorage.setItem('sst_customer_code', val || 'Pelanggan Tunai');
                  }}
                  className={`w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#135A62] ${customerCode === 'Pelanggan Tunai' ? 'font-bold' : 'font-bold tracking-widest'}`}
                />
                {customerCode === 'Pelanggan Tunai' && !isCodeFocused && (
                  <span className="absolute left-28 top-[9px] text-slate-400 text-[10px] pointer-events-none">
                    (atau Klik dan Ketikan Nomor Pelanggan)
                  </span>
                )}
              </div>
            </div>

            {/* Total Price breakdown */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Estimasi Belanja:</p>
                <p className="text-xl font-black text-[#135A62]">{formatRupiah(totalCartPrice)}</p>
              </div>
              <span className="text-[11px] text-slate-400 text-right">
                *Belum termasuk ongkir
              </span>
            </div>

            {/* Checkout WhatsApp Button */}
            <div className="flex flex-col gap-2">
              <button
                id="btn-checkout-whatsapp"
                onClick={handleCheckoutWhatsApp}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 select-none"
              >
                <Send className="w-4 h-4" />
                <span>Checkout WhatsApp Admin ({storeProfile.nomorWhatsApp})</span>
              </button>
              <button
                onClick={handleCheckoutWhatsAppWithInvoice}
                disabled={isGenerating}
                className="w-full py-3.5 px-4 rounded-xl bg-[#135A62] hover:bg-[#0e444a] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 select-none disabled:opacity-70"
              >
                <FileText className="w-4 h-4" />
                <span>Checkout Whatsapp With Invoice draft (CSV)</span>
              </button>

              {downloadSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-bold text-emerald-950">File CSV Berhasil Diunduh!</p>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      File rincian pesanan telah tersimpan di perangkat Anda. Silakan klik tombol lampiran (ikon 📎) pada chat WhatsApp yang terbuka untuk mengirimkan file ke Admin.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};
