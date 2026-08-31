import React, { useState } from 'react';
import {
  X, Lock, Unlock, Settings, UploadCloud, Database, Layers, BookOpen,
  Building2, Bell, Shield, Key, Download, Plus, Trash2, Edit2, Check,
  AlertCircle, FileSpreadsheet, RefreshCw, Eye, Sparkles, ExternalLink, HelpCircle,
  CheckCircle2, CloudLightning, Server, Terminal, Copy, Globe
} from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { Product, InfoTrendItem } from '../types';
import { parseProductsFile, exportProductsToCSV, downloadFile, formatRupiah } from '../utils/csvHelper';
import {
  currentFirebaseProjectId,
  currentDatabaseId,
  activeConfigOrigin,
  isUsingCustomFirebase,
  firebaseConfig,
  db
} from '../firebase/config';
import { doc, setDoc, getDoc, writeBatch, collection } from 'firebase/firestore';

export const AdminModal: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    adminRole,
    loginAdmin,
    logoutAdmin,
    changeAdminPassword,
    resetAdminPassword,
    siteSettings,
    updateSiteSettings,
    storeProfile,
    updateStoreProfile,
    products,
    allCategories,
    categoriesMeta,
    updateCategoryMeta,
    infoTrends,
    addInfoTrend,
    updateInfoTrend,
    deleteInfoTrend,
    notifications,
    addNotification,
    deleteNotification,
    toggleNotification,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkImportProducts,
    resetToDefaultData,
    showToast,
  } = useCatalog();

  // Local login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password reset verification state
  const [isResetVerificationOpen, setIsResetVerificationOpen] = useState(false);
  const [resetAnswerInput, setResetAnswerInput] = useState('');
  const [resetVerificationError, setResetVerificationError] = useState('');
  const [isResettingLoading, setIsResettingLoading] = useState(false);

  // Active admin tab
  const [adminTab, setAdminTab] = useState<
    'tampilan' | 'produk-csv' | 'kategori' | 'info-trend' | 'profil-toko' | 'notifikasi' | 'keamanan' | 'firebase' | 'deploy-guide'
  >('produk-csv');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Firebase Configuration Manager state
  const [fbProjectId, setFbProjectId] = useState(firebaseConfig.projectId || '');
  const [fbApiKey, setFbApiKey] = useState(firebaseConfig.apiKey || '');
  const [fbAppId, setFbAppId] = useState(firebaseConfig.appId || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(firebaseConfig.authDomain || '');
  const [fbStorageBucket, setFbStorageBucket] = useState(firebaseConfig.storageBucket || '');
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(firebaseConfig.messagingSenderId || '');
  const [fbMeasurementId, setFbMeasurementId] = useState(firebaseConfig.measurementId || '');
  const [fbDatabaseId, setFbDatabaseId] = useState(currentDatabaseId !== '(default)' ? currentDatabaseId : '');
  const [fbSnippetInput, setFbSnippetInput] = useState('');
  const [fbTestStatus, setFbTestStatus] = useState<{ loading?: boolean; success?: boolean; message: string; details?: string } | null>(null);
  const [fbSeedStatus, setFbSeedStatus] = useState<{ loading?: boolean; success?: boolean; message: string } | null>(null);

  // CSV Drag and drop state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Product[] | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isParsing, setIsParsing] = useState(false);

  // Single product edit / create modal inside admin
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productAdminSearch, setProductAdminSearch] = useState('');

  // Info trend article edit / create inside admin
  const [editingArticle, setEditingArticle] = useState<InfoTrendItem | null>(null);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);

  // New notification state
  const [newNotifText, setNewNotifText] = useState('');
  const [newNotifType, setNewNotifType] = useState<'stok' | 'promo' | 'info' | 'berita' | 'tips'>('stok');

  const [newRestrictedPassword, setNewRestrictedPassword] = useState('');

  if (!isAdminOpen) return null;

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(passwordInput)) {
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('Password tidak sesuai. Silakan periksa kembali.');
    }
  };

  // Handle Verify & Reset Password to Default
  const handleVerifyAndResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetAnswerInput.trim() !== '2226') {
      setResetVerificationError('Jawaban verifikasi tidak sesuai.');
      return;
    }

    setIsResettingLoading(true);
    setResetVerificationError('');
    try {
      await resetAdminPassword();
      setPasswordInput('Dear2226');
      setLoginError('');
      setIsResetVerificationOpen(false);
    } catch (err: any) {
      setResetVerificationError(`Gagal memverifikasi: ${err?.message || err}`);
    } finally {
      setIsResettingLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }
    const res = await changeAdminPassword(oldPassword, newPassword);
    if (res.success) {
      setPasswordMessage({ type: 'success', text: res.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: res.message });
    }
  };

  // Handle File Selected (CSV or JSON)
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      try {
        const parsed = parseProductsFile(text);
        if (!parsed || parsed.length === 0) {
          throw new Error('Tidak ada data produk yang berhasil terbaca dari file. Pastikan kolom nama dan format data sesuai.');
        }
        setParsedPreview(parsed);
        showToast(`🔍 Terbaca ${parsed.length} produk dari file ${file.name}.`);
      } catch (err: any) {
        showToast(`❌ Gagal membaca file: ${err.message || err}`);
        setParsedPreview(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      showToast(`❌ Terjadi kesalahan saat membaca file.`);
      setIsParsing(false);
      setParsedPreview(null);
    };
    reader.readAsText(file);
  };

  const handleApplyCSV = () => {
    if (!parsedPreview || parsedPreview.length === 0) {
      showToast('❌ Tidak ada data produk yang siap diimpor.');
      return;
    }
    bulkImportProducts(parsedPreview, replaceExisting);
    setParsedPreview(null);
    setCsvFile(null);
  };

  const handleDownloadCSV = () => {
    const csvContent = exportProductsToCSV(products);
    downloadFile(csvContent, 'produk.csv', 'text/csv');
    showToast('📥 File produk.csv berhasil diunduh.');
  };

  const handleDownloadJSON = () => {
    const jsonContent = JSON.stringify(products, null, 2);
    downloadFile(jsonContent, 'produk.json', 'application/json');
    showToast('📥 File produk.json berhasil diunduh.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        id="admin-dashboard-modal"
        className="relative bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[95vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#135A62] text-white flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Panel Kendali Admin & CSV</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  v2.0 Cloudflare Static Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola CSV produk, tampilan web, kategori, info & trend, notifikasi, dan profil toko
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminRole && (
              <button
                onClick={logoutAdmin}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Keluar Admin</span>
              </button>
            )}
            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!adminRole ? (
          isResetVerificationOpen ? (
            /* Verification Screen to Reset Password to Default */
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto my-auto animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-[#135A62]/10 text-[#135A62] flex items-center justify-center">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">Verifikasi Super Admin</h4>
                <p className="text-xs text-slate-500">
                  Berapa 4 digit terakhir password super admin?
                </p>
              </div>

              {resetVerificationError && (
                <div className="w-full p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{resetVerificationError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyAndResetSubmit} className="w-full space-y-3">
                <input
                  type="text"
                  required
                  placeholder=""
                  value={resetAnswerInput}
                  onChange={(e) => {
                    setResetAnswerInput(e.target.value);
                    if (resetVerificationError) setResetVerificationError('');
                  }}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-center font-mono outline-none focus:ring-2 focus:ring-[#135A62]/30 focus:border-[#135A62]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetVerificationOpen(false);
                      setResetVerificationError('');
                    }}
                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingLoading}
                    className="flex-1 py-3 bg-[#135A62] hover:bg-[#0e444a] text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isResettingLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : null}
                    <span>Lanjutkan</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Password Authentication Prompt */
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto my-auto">
              <button
                type="button"
                onClick={() => {
                  setIsResetVerificationOpen(true);
                  setResetAnswerInput('');
                  setResetVerificationError('');
                }}
                className="w-16 h-16 rounded-2xl bg-[#135A62]/10 text-[#135A62] flex items-center justify-center focus:outline-none cursor-pointer"
              >
                <Lock className="w-8 h-8" />
              </button>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">Akses Terkunci Admin</h4>
                <p className="text-xs text-slate-500">
                  Masukkan kata sandi akses administrator untuk mengelola database CSV dan pengaturan situs.
                </p>
              </div>

              {loginError && (
                <div className="w-full p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="w-full space-y-3">
                <input
                  type="password"
                  required
                  placeholder="Masukkan Password Admin..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono outline-none focus:ring-2 focus:ring-[#135A62]/30 focus:border-[#135A62]"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#135A62] hover:bg-[#0e444a] text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Panel Admin</span>
                </button>
              </form>
            </div>
          )
        ) : (
          /* Authenticated Dashboard Tabs & Views */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1">
              {[
                { id: 'produk-csv', label: '1. Kelola Produk & CSV', icon: FileSpreadsheet, superAdminOnly: false },
                { id: 'tampilan', label: '2. Tampilan & Brand', icon: Settings, superAdminOnly: true },
                { id: 'kategori', label: '3. Kelola Kategori', icon: Layers, superAdminOnly: false },
                { id: 'info-trend', label: '4. Info & Trend (CMS)', icon: BookOpen, superAdminOnly: false },
                { id: 'profil-toko', label: '5. Profil Toko & Medsos', icon: Building2, superAdminOnly: false },
                { id: 'notifikasi', label: '6. Notifikasi Siaran', icon: Bell, superAdminOnly: false },
                { id: 'keamanan', label: '7. Keamanan & Akses', icon: Key, superAdminOnly: true },
                { id: 'firebase', label: '8. Database & Firebase', icon: Database, superAdminOnly: true },
                { id: 'deploy-guide', label: '9. Panduan Cloudflare', icon: HelpCircle, superAdminOnly: true },
              ].filter(tab => adminRole === 'super_admin' || !tab.superAdminOnly).map((tab) => {
                const Icon = tab.icon;
                const isActive = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id as any)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all shrink-0 ${
                      isActive
                        ? 'bg-[#135A62] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Content Area per Tab */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-50/50">
              {/* TAB 1: Kelola Produk & CSV */}
              {adminTab === 'produk-csv' && (
                <div className="space-y-8 animate-in fade-in duration-150">
                  {/* CSV Upload / Drag & Drop Box */}
                  {adminRole === 'super_admin' && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <UploadCloud className="w-5 h-5 text-[#135A62]" />
                          <span>Import / Upload File Produk (CSV atau JSON)</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Mendukung ribuan produk, pemisah koma/titik-koma, format harga rupiah, dan verifikasi otomatis.
                        </p>
                      </div>

                      {/* Download current CSV & JSON */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDownloadCSV}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#135A62]" />
                          <span>Download produk.csv</span>
                        </button>
                        <button
                          onClick={handleDownloadJSON}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Download JSON</span>
                        </button>
                      </div>
                    </div>

                    {/* Upload Dropzone */}
                    <div className="border-2 border-dashed border-slate-300 hover:border-[#135A62] rounded-2xl p-6 sm:p-8 text-center bg-slate-50 transition-colors relative">
                      <input
                        type="file"
                        accept=".csv,text/csv,application/json,.json,text/plain"
                        onChange={handleCSVUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-xs text-[#135A62] flex items-center justify-center mx-auto">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">
                          {csvFile ? `File Terpilih: ${csvFile.name}` : 'Klik atau Drag & Drop file CSV atau JSON produk di sini'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Format kolom fleksibel: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">id, nama, merk, kategori, type, harga, harga_diskon, deskripsi, jumlah_stok, satuan_packing, url_foto</code>
                        </p>
                      </div>
                    </div>

                    {/* Parsed Preview Table & Apply Buttons */}
                    {parsedPreview && (
                      <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-teal-900 text-sm">
                              Pratinjau File: {parsedPreview.length} Produk Berhasil Diverifikasi
                            </span>
                            <p className="text-xs text-teal-700">
                              Data telah dinormalisasi & divalidasi dengan aman sebelum disimpan ke database.
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-semibold text-teal-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={replaceExisting}
                                onChange={(e) => setReplaceExisting(e.target.checked)}
                                className="rounded text-[#135A62]"
                              />
                              <span>Gantikan Seluruh Produk Lama</span>
                            </label>

                            <button
                              onClick={handleApplyCSV}
                              className="px-5 py-2.5 rounded-xl bg-[#135A62] text-white text-xs font-bold hover:bg-[#0e444a] shadow-md flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>Simpan ke Database Web</span>
                            </button>
                          </div>
                        </div>

                        {/* Top 3 rows snippet */}
                        <div className="overflow-x-auto bg-white rounded-xl border border-teal-100 text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                              <tr>
                                <th className="p-2">Nama</th>
                                <th className="p-2">Merk/Tipe</th>
                                <th className="p-2">Kategori</th>
                                <th className="p-2">Harga</th>
                                <th className="p-2">Kemasan</th>
                                <th className="p-2">Stok</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {parsedPreview.slice(0, 5).map((p, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 font-medium">{p.nama}</td>
                                  <td className="p-2">{p.merk} ({p.type})</td>
                                  <td className="p-2">{p.kategori}</td>
                                  <td className="p-2">{formatRupiah(p.harga)}</td>
                                  <td className="p-2">{p.jumlah_pieces_packing} {p.satuan_packing}</td>
                                  <td className="p-2">{p.jumlah_stok > 0 ? 'Tersedia' : 'Tanya Admin'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Manual Product CRUD Management List */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-black text-slate-900">
                          Daftar Produk Aktif ({products.length} Produk)
                        </h4>
                        <p className="text-xs text-slate-500">
                          Ubah atau tambah produk satuan langsung tanpa edit CSV secara manual.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsCreatingProduct(true);
                            setEditingProduct({
                              id: `PRD-${Date.now()}`,
                              nama: '',
                              merk: '',
                              kategori: allCategories[0] || 'Umum',
                              type: '',
                              harga: 0,
                              deskripsi: '',
                              jumlah_stok: 10,
                              jumlah_pieces_packing: 1,
                              satuan_packing: 'Dus',
                              angka_produk_favorit: 25,
                              url_foto: '',
                            });
                          }}
                          className="px-4 py-2 bg-[#135A62] hover:bg-[#0e444a] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Tambah Produk Manual</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Apakah Anda yakin ingin mereset seluruh database produk & pengaturan ke data sampel bawaan?')) {
                              resetToDefaultData();
                            }
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                          title="Reset ke database demo bawaan"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Demo</span>
                        </button>
                      </div>
                    </div>

                    {/* Search inside Admin */}
                    <div className="max-w-md">
                      <input
                        type="text"
                        placeholder="Cari nama, merk, kategori di admin..."
                        value={productAdminSearch}
                        onChange={(e) => setProductAdminSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#135A62]"
                      />
                    </div>

                    {/* Product list table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Foto</th>
                            <th className="p-3">Nama Produk</th>
                            <th className="p-3">Merk & Tipe</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3">Harga Satuan</th>
                            <th className="p-3">Kemasan</th>
                            <th className="p-3">Stok Publik</th>
                            <th className="p-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {products
                            .filter((p) => {
                              if (!productAdminSearch) return true;
                              const q = productAdminSearch.toLowerCase();
                              return (
                                p.nama.toLowerCase().includes(q) ||
                                p.merk.toLowerCase().includes(q) ||
                                p.kategori.toLowerCase().includes(q)
                              );
                            })
                            .slice(0, 50)
                            .map((product) => (
                              <tr key={product.id} className="hover:bg-slate-50">
                                <td className="p-2.5">
                                  <img
                                    src={product.url_foto || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=80'}
                                    alt={product.nama}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                                  />
                                </td>
                                <td className="p-2.5 font-bold text-slate-900 max-w-xs truncate">
                                  {product.nama}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {product.merk} <span className="text-slate-400">({product.type})</span>
                                </td>
                                <td className="p-2.5">{product.kategori}</td>
                                <td className="p-2.5 font-bold text-[#135A62]">
                                  {formatRupiah(product.harga_diskon || product.harga)}
                                  {product.harga_diskon && (
                                    <span className="block text-[10px] text-red-500 line-through font-normal">
                                      {formatRupiah(product.harga)}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {product.jumlah_pieces_packing} Pcs/{product.satuan_packing}
                                </td>
                                <td className="p-2.5">
                                  {product.jumlah_stok > 0 ? (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px]">
                                      Tersedia ({product.jumlah_stok})
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-full text-[10px]">
                                      Tanya Admin
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setIsCreatingProduct(false);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-[#135A62] hover:bg-slate-100 rounded-lg"
                                    title="Edit Produk"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Hapus produk "${product.nama}"?`)) {
                                        deleteProduct(product.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Hapus Produk"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Tampilan & Brand */}
              {adminTab === 'tampilan' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      Edit Tampilan Antarmuka Halaman Utama
                    </h4>
                    <p className="text-xs text-slate-500">
                      Sesuaikan logo, warna dasar brand (#135A62), judul banner, latar belakang, dan footer.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
                    {/* Primary Color Picker & Banner Transparency Slider */}
                    <div className="space-y-3">
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        Warna Utama / Brand Color (Hex Code):
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={siteSettings.primaryColor || '#135A62'}
                          onChange={(e) => updateSiteSettings({ primaryColor: e.target.value })}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 shadow-xs"
                        />
                        <input
                          type="text"
                          value={siteSettings.primaryColor}
                          onChange={(e) => updateSiteSettings({ primaryColor: e.target.value })}
                          placeholder="#135A62"
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => updateSiteSettings({ primaryColor: '#135A62' })}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-700"
                        >
                          Default #135A62
                        </button>
                      </div>

                      {/* Slider Transparansi Warna Utama di Banner */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            Transparansi Warna Utama di Banner:
                          </span>
                          <span className="font-mono font-bold text-[#135A62] bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                            {siteSettings.bannerColorOpacity ?? 75}%
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={siteSettings.bannerColorOpacity ?? 75}
                            onChange={(e) => updateSiteSettings({ bannerColorOpacity: parseInt(e.target.value, 10) })}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#135A62]"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span>0% (Bening / Gambar Jelas)</span>
                          <span>50% (Sedang)</span>
                          <span>100% (Pekat / Solid)</span>
                        </div>
                      </div>
                    </div>

                    {/* Store Name & Slogan */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">Nama Toko:</label>
                      <input
                        type="text"
                        value={storeProfile.namaToko}
                        onChange={(e) => updateStoreProfile({ namaToko: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">Slogan Singkat:</label>
                      <input
                        type="text"
                        value={storeProfile.slogan}
                        onChange={(e) => updateStoreProfile({ slogan: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                      />
                    </div>

                    {/* WhatsApp Admin Phone Number */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        Nomor WhatsApp Admin (Format 628xxx):
                      </label>
                      <input
                        type="text"
                        value={storeProfile.nomorWhatsApp}
                        onChange={(e) => updateStoreProfile({ nomorWhatsApp: e.target.value })}
                        placeholder="6287853370999"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono"
                      />
                    </div>

                    {/* Logo URL & Sizes */}
                    <div className="sm:col-span-2 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <label className="block font-semibold text-slate-800">
                        URL Logo Toko (Cloudinary / Direct Image Link):
                      </label>
                      <input
                        type="text"
                        value={siteSettings.logoUrl}
                        onChange={(e) => updateSiteSettings({ logoUrl: e.target.value })}
                        placeholder="https://res.cloudinary.com/... atau kosongkan untuk logo teks otomatis"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Lebar Logo (px): {siteSettings.logoWidth}px
                          </label>
                          <input
                            type="range"
                            min="80"
                            max="300"
                            value={siteSettings.logoWidth}
                            onChange={(e) => updateSiteSettings({ logoWidth: parseInt(e.target.value, 10) })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Tinggi Logo (px): {siteSettings.logoHeight}px
                          </label>
                          <input
                            type="range"
                            min="24"
                            max="80"
                            value={siteSettings.logoHeight}
                            onChange={(e) => updateSiteSettings({ logoHeight: parseInt(e.target.value, 10) })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Hero Title & Subtitle */}
                    <div className="sm:col-span-2 space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1.5">
                          Teks Judul Utama (Hero Title):
                        </label>
                        <input
                          type="text"
                          value={siteSettings.heroTitle}
                          onChange={(e) => updateSiteSettings({ heroTitle: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1.5">
                          Sub-Judul Hero (Subtitle):
                        </label>
                        <textarea
                          rows={2}
                          value={siteSettings.heroSubtitle}
                          onChange={(e) => updateSiteSettings({ heroSubtitle: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Hero Banner Media URL & Live Preview */}
                    <div className="sm:col-span-2 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block font-semibold text-slate-800">
                          Background Hero Banner (Gambar / Video MP4):
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Opasitas Brand: {siteSettings.bannerColorOpacity ?? 75}%
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={siteSettings.heroBannerMediaType}
                          onChange={(e) => updateSiteSettings({ heroBannerMediaType: e.target.value as any })}
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                        >
                          <option value="image">Gambar (JPG/PNG)</option>
                          <option value="video">Video (MP4/WebM)</option>
                        </select>
                        <input
                          type="text"
                          value={siteSettings.heroBannerUrl}
                          onChange={(e) => updateSiteSettings({ heroBannerUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                        />
                      </div>

                      {/* Mini Live Preview Banner Box */}
                      <div className="relative h-28 rounded-xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center text-white">
                        {siteSettings.heroBannerUrl ? (
                          siteSettings.heroBannerMediaType === 'video' ? (
                            <video
                              src={siteSettings.heroBannerUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={siteSettings.heroBannerUrl}
                              alt="Preview Banner"
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="absolute inset-0 bg-slate-800" />
                        )}

                        {/* Tint & Blend overlay preview */}
                        <div
                          className="absolute inset-0 transition-opacity duration-150"
                          style={{
                            backgroundColor: siteSettings.primaryColor || '#135A62',
                            opacity: (siteSettings.bannerColorOpacity ?? 75) / 100,
                            mixBlendMode: 'multiply',
                          }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, ${((siteSettings.bannerColorOpacity ?? 75) / 100) * 0.7}) 100%)`
                          }}
                        />

                        <div className="relative z-10 text-center px-4">
                          <p className="font-bold text-sm drop-shadow-sm">
                            {siteSettings.heroTitle || 'Judul Banner Hero'}
                          </p>
                          <p className="text-[11px] text-slate-200 opacity-90 drop-shadow-xs line-clamp-1">
                            {siteSettings.heroSubtitle || 'Subjudul deskripsi katalog'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Settings */}
                    <div className="sm:col-span-2 space-y-4 pt-4 border-t border-slate-200">
                      <h5 className="font-bold text-slate-900">Pengaturan Teks & Hak Cipta Footer</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Deskripsi Ringkas Footer (Kolom 1):
                          </label>
                          <textarea
                            rows={3}
                            value={siteSettings.footerText}
                            onChange={(e) => updateSiteSettings({ footerText: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs"
                          />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Judul Kolom 2 (Default: Navigasi Cepat):
                            </label>
                            <input
                              type="text"
                              value={siteSettings.footerCol2Title || ''}
                              onChange={(e) => updateSiteSettings({ footerCol2Title: e.target.value })}
                              placeholder="Navigasi Cepat"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Judul Kolom 3 (Kategori Unggulan):
                            </label>
                            <input
                              type="text"
                              value={siteSettings.footerCol3Title || ''}
                              onChange={(e) => updateSiteSettings({ footerCol3Title: e.target.value })}
                              placeholder="Kategori Produk"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Judul Kolom 4 (Kontak/Operasional):
                            </label>
                            <input
                              type="text"
                              value={siteSettings.footerCol4Title || ''}
                              onChange={(e) => updateSiteSettings({ footerCol4Title: e.target.value })}
                              placeholder="Jam Operasional"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                          Pilih Kategori Unggulan (Akan ditampilkan di Banner Atas & Footer):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {allCategories.map(cat => {
                            const isSelected = (siteSettings.popularCategories || []).includes(cat);
                            return (
                              <label key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const current = siteSettings.popularCategories || [];
                                    if (e.target.checked) {
                                      updateSiteSettings({ popularCategories: [...current, cat] });
                                    } else {
                                      updateSiteSettings({ popularCategories: current.filter(c => c !== cat) });
                                    }
                                  }}
                                  className="rounded text-[#135A62]"
                                />
                                <span className="text-xs font-medium text-slate-700">{cat}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Teks Bawah Kiri (Dioptimalkan untuk...):
                          </label>
                          <input
                            type="text"
                            value={siteSettings.footerBottomText || ''}
                            onChange={(e) => updateSiteSettings({ footerBottomText: e.target.value })}
                            placeholder="Dioptimalkan untuk Cloudflare Pages"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Teks Copyright:
                          </label>
                          <input
                            type="text"
                            value={siteSettings.footerCopyright}
                            onChange={(e) => updateSiteSettings({ footerCopyright: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Kelola Kategori */}
              {adminTab === 'kategori' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      Kelola Icon & Deskripsi Kategori
                    </h4>
                    <p className="text-xs text-slate-500">
                      Nama kategori disinkronisasi secara otomatis dari CSV produk ({allCategories.length} kategori terdeteksi). Anda dapat mengunggah URL icon/gambar dan deskripsi singkat untuk masing-masing kategori di bawah ini.
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {allCategories.map((catName) => {
                      if (!catName || typeof catName !== 'string') return null;
                      const trimmedCat = catName.trim();
                      const lowerCat = trimmedCat.toLowerCase();
                      const meta = Array.isArray(categoriesMeta)
                        ? categoriesMeta.find(
                            (c) => c && typeof c.nama === 'string' && c.nama.trim().toLowerCase() === lowerCat
                          )
                        : undefined;
                      const currentIcon = meta?.iconUrl || '';
                      const currentDesc = meta?.deskripsi || '';
                      const count = Array.isArray(products)
                        ? products.filter((p) => p && typeof p.kategori === 'string' && p.kategori.trim().toLowerCase() === lowerCat).length
                        : 0;

                      return (
                        <div
                          key={trimmedCat}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{trimmedCat}</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                              {count} produk terdaftar
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block font-medium text-slate-600 mb-1">
                                URL Icon / Foto Sampul Kategori:
                              </label>
                              <input
                                type="text"
                                defaultValue={currentIcon}
                                placeholder="https://images.unsplash.com/..."
                                onBlur={(e) => updateCategoryMeta(trimmedCat, e.target.value, currentDesc)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block font-medium text-slate-600 mb-1">
                                Deskripsi Singkat:
                              </label>
                              <input
                                type="text"
                                defaultValue={currentDesc}
                                placeholder="Tuliskan spesifikasi umum kategori ini..."
                                onBlur={(e) => updateCategoryMeta(trimmedCat, currentIcon, e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: Info & Trend CMS */}
              {adminTab === 'info-trend' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        Manajemen Info & Trend (Blog & Katalog PDF)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Kelola artikel, berita industri, serta lampiran tautan PDF dokumen statis.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsCreatingArticle(true);
                        setEditingArticle({
                          id: `TRD-${Date.now()}`,
                          judul: '',
                          ringkasan: '',
                          konten: '',
                          url_gambar: '',
                          url_pdf: '',
                          tanggal: new Date().toISOString().split('T')[0],
                          tag: 'Teknis & Industri',
                          penulis: 'Admin Katalog',
                        });
                      }}
                      className="px-4 py-2 bg-[#135A62] hover:bg-[#0e444a] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Buat Artikel Baru</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {infoTrends.map((art) => (
                      <div
                        key={art.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={art.url_gambar || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=80'}
                            alt={art.judul}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover bg-slate-200 shrink-0"
                          />
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-900 text-sm line-clamp-1">
                              {art.judul}
                            </h5>
                            <p className="text-xs text-slate-500 line-clamp-1">{art.ringkasan}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>{art.tanggal}</span>
                              <span>•</span>
                              <span className="text-[#135A62] font-semibold">{art.tag}</span>
                              {art.url_pdf && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-bold">📄 Ada PDF</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditingArticle(art);
                              setIsCreatingArticle(false);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus artikel "${art.judul}"?`)) {
                                deleteInfoTrend(art.id);
                              }
                            }}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Profil Toko & Medsos */}
              {adminTab === 'profil-toko' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      Edit Profil Toko, Jam Kerja & Ekspedisi
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tampilan tentang kami yang unik untuk memberikan kepercayaan penuh pada pelanggan.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Konteks Toko / Sejarah Singkat:
                      </label>
                      <textarea
                        rows={3}
                        value={storeProfile.konteks}
                        onChange={(e) => updateStoreProfile({ konteks: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Visi & Misi:</label>
                      <textarea
                        rows={3}
                        value={storeProfile.visiMisi}
                        onChange={(e) => updateStoreProfile({ visiMisi: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Jam Operasional:
                        </label>
                        <input
                          type="text"
                          value={storeProfile.jamOperasional}
                          onChange={(e) => updateStoreProfile({ jamOperasional: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Jadwal Pengiriman:
                        </label>
                        <input
                          type="text"
                          value={storeProfile.jadwalPengiriman}
                          onChange={(e) => updateStoreProfile({ jadwalPengiriman: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Alamat Kantor/Gudang:
                        </label>
                        <input
                          type="text"
                          value={storeProfile.alamat}
                          onChange={(e) => updateStoreProfile({ alamat: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Telepon / Call Center:
                        </label>
                        <input
                          type="text"
                          value={storeProfile.telepon || ''}
                          onChange={(e) => updateStoreProfile({ telepon: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Email Resmi:
                        </label>
                        <input
                          type="email"
                          value={storeProfile.email}
                          onChange={(e) => updateStoreProfile({ email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                        />
                      </div>
                    </div>

                    {/* Social links */}
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <h5 className="font-bold text-slate-900">Tautan Media Sosial & Toko Online</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Instagram URL"
                          value={storeProfile.medsos.instagram || ''}
                          onChange={(e) =>
                            updateStoreProfile({
                              medsos: { ...storeProfile.medsos, instagram: e.target.value },
                            })
                          }
                          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Facebook URL"
                          value={storeProfile.medsos.facebook || ''}
                          onChange={(e) =>
                            updateStoreProfile({
                              medsos: { ...storeProfile.medsos, facebook: e.target.value },
                            })
                          }
                          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="TikTok URL"
                          value={storeProfile.medsos.tiktok || ''}
                          onChange={(e) =>
                            updateStoreProfile({
                              medsos: { ...storeProfile.medsos, tiktok: e.target.value },
                            })
                          }
                          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Tokopedia Store URL"
                          value={storeProfile.medsos.tokopedia || ''}
                          onChange={(e) =>
                            updateStoreProfile({
                              medsos: { ...storeProfile.medsos, tokopedia: e.target.value },
                            })
                          }
                          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Shopee Store URL"
                          value={storeProfile.medsos.shopee || ''}
                          onChange={(e) =>
                            updateStoreProfile({
                              medsos: { ...storeProfile.medsos, shopee: e.target.value },
                            })
                          }
                          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    {/* Gallery & PDF Manager */}
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-slate-900">Galeri Media & Dokumen PDF</h5>
                          <p className="text-[11px] text-slate-500">Maksimal 10 item. Sertakan link PDF jika ada brosur/dokumen.</p>
                        </div>
                        <button
                          onClick={() => {
                            if (storeProfile.galeriMedia.length >= 10) {
                              showToast('⚠️ Maksimal 10 media galeri.');
                              return;
                            }
                            updateStoreProfile({
                              galeriMedia: [
                                ...storeProfile.galeriMedia,
                                { id: `GAL-${Date.now()}`, tipe: 'image', url: '', caption: '', pdfUrl: '' }
                              ]
                            });
                          }}
                          className="px-3 py-1.5 bg-[#135A62] hover:bg-[#0e444a] text-white text-[11px] font-bold rounded-lg transition-colors"
                        >
                          + Tambah Media
                        </button>
                      </div>

                      <div className="space-y-3">
                        {storeProfile.galeriMedia.map((media, idx) => (
                          <div key={media.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 text-xs">Item Galeri #{idx + 1}</span>
                              <button
                                onClick={() => {
                                  updateStoreProfile({
                                    galeriMedia: storeProfile.galeriMedia.filter(m => m.id !== media.id)
                                  });
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="URL Gambar / Video"
                                value={media.url}
                                onChange={(e) => {
                                  const updated = [...storeProfile.galeriMedia];
                                  updated[idx].url = e.target.value;
                                  updateStoreProfile({ galeriMedia: updated });
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Deskripsi Singkat"
                                value={media.caption || ''}
                                onChange={(e) => {
                                  const updated = [...storeProfile.galeriMedia];
                                  updated[idx].caption = e.target.value;
                                  updateStoreProfile({ galeriMedia: updated });
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="URL File PDF (Opsional)"
                                value={media.pdfUrl || ''}
                                onChange={(e) => {
                                  const updated = [...storeProfile.galeriMedia];
                                  updated[idx].pdfUrl = e.target.value;
                                  updateStoreProfile({ galeriMedia: updated });
                                }}
                                className="w-full sm:col-span-2 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: Notifikasi Siaran Real-time */}
              {adminTab === 'notifikasi' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      Notifikasi Siaran & Pembaruan Stok
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pesan siaran yang akan muncul berkala sebagai floating toast kepada pengunjung website.
                    </p>
                  </div>

                  {/* Add notification form */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-slate-800 text-xs">Tambah Pesan Siaran Baru</h5>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={newNotifType}
                        onChange={(e) => setNewNotifType(e.target.value as any)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        <option value="stok">📦 Update Stok</option>
                        <option value="promo">🔥 Promo / Diskon</option>
                        <option value="info">ℹ️ Info Layanan</option>
                        <option value="berita">📰 Berita Hari Ini</option>
                        <option value="tips">💡 Tips Baru</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Contoh: 📦 Stok Baru Masuk: Baut M10 x 50mm siap kirim!"
                        value={newNotifText}
                        onChange={(e) => setNewNotifText(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                      />
                      <button
                        onClick={() => {
                          if (!newNotifText.trim()) return;
                          addNotification({
                            id: `NOTIF-${Date.now()}`,
                            pesan: newNotifText.trim(),
                            waktu: 'Baru saja',
                            aktif: true,
                            tipe: newNotifType,
                          });
                          setNewNotifText('');
                        }}
                        className="px-4 py-2 bg-[#135A62] text-white text-xs font-bold rounded-xl hover:bg-[#0e444a]"
                      >
                        Terbitkan Siaran
                      </button>
                    </div>
                  </div>

                  {/* List of broadcasts */}
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              notif.aktif ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                            }`}
                          />
                          <span className="font-medium text-slate-800">{notif.pesan}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleNotification(notif.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                              notif.aktif
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {notif.aktif ? 'Aktif Tayang' : 'Non-aktif'}
                          </button>
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: Ganti Password Admin */}
              {adminTab === 'keamanan' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 max-w-lg mx-auto animate-in fade-in duration-150">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Key className="w-5 h-5 text-[#135A62]" />
                      <span>Ubah Password Akses Admin</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Kata sandi bawaan pertama kali adalah <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Dear2226</code>. Pastikan mengganti dengan kata sandi rahasia Anda.
                    </p>
                  </div>

                  {passwordMessage && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                        passwordMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Password Lama:
                      </label>
                      <input
                        type="password"
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#135A62]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Password Baru:
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#135A62]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Ulangi Password Baru:
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#135A62]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#135A62] hover:bg-[#0e444a] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors"
                    >
                      Simpan Password Baru
                    </button>
                  </form>

                  <div className="pt-6 border-t border-slate-200 mt-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900">Kelola Password Admin Akses Terbatas</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Admin dengan akses terbatas hanya bisa mengelola produk, kategori, info, profil, dan notifikasi. Tidak bisa upload CSV atau ubah tampilan.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {(siteSettings.restrictedPasswords || []).map((pass, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="font-mono text-sm tracking-wider">{pass}</span>
                          <button
                            onClick={() => {
                              const newPasses = (siteSettings.restrictedPasswords || []).filter((_, i) => i !== idx);
                              updateSiteSettings({ restrictedPasswords: newPasses });
                              showToast('🗑️ Password akses terbatas dihapus.');
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Password Baru..."
                          value={newRestrictedPassword}
                          onChange={(e) => setNewRestrictedPassword(e.target.value)}
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#135A62]"
                        />
                        <button
                          onClick={() => {
                            if (!newRestrictedPassword.trim()) return;
                            const current = siteSettings.restrictedPasswords || [];
                            updateSiteSettings({ restrictedPasswords: [...current, newRestrictedPassword.trim()] });
                            setNewRestrictedPassword('');
                            showToast('✅ Password akses terbatas ditambahkan.');
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-colors"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: Database & Firebase Connection Manager */}
              {adminTab === 'firebase' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#135A62]" />
                        <span>Koneksi Database Cloud Firestore (Firebase)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Kelola integrasi project Firebase untuk sinkronisasi data katalog secara real-time.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        isUsingCustomFirebase
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-teal-100 text-teal-800 border border-teal-300'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{isUsingCustomFirebase ? 'Custom Firebase Aktif' : 'Default Applet'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Active Connection Info Card */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5" />
                        <span>Informasi Database Aktif</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        Sumber: {activeConfigOrigin}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
                      <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                        <span className="text-slate-400 text-[10px] block font-sans">Firebase Project ID:</span>
                        <strong className="text-emerald-300 text-sm truncate block">{currentFirebaseProjectId}</strong>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                        <span className="text-slate-400 text-[10px] block font-sans">Firestore Database ID:</span>
                        <strong className="text-teal-300 text-sm truncate block">{currentDatabaseId}</strong>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                        <span className="text-slate-400 text-[10px] block font-sans">Status Sinkronisasi:</span>
                        <strong className="text-emerald-400 text-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terhubung</span>
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting / Firebase Setup Checklist Box */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-xs text-amber-900">
                    <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Panduan Menghubungkan ke Project Firebase sst-catalog</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                      <li>
                        Buka Firebase Console: <a href="https://console.firebase.google.com/project/sst-catalog" target="_blank" rel="noreferrer" className="font-bold underline text-[#135A62]">console.firebase.google.com/project/sst-catalog</a>.
                      </li>
                      <li>
                        Di menu kiri <strong>Build / Databases & Storage</strong>, klik <strong>Firestore Database</strong> (Pastikan memilih Cloud Firestore, bukan Realtime Database).
                      </li>
                      <li>
                        Klik tombol <strong>Create database</strong>, pilih lokasi server (misal <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">asia-southeast2 (Jakarta)</code>), dan pilih <strong>Start in test mode</strong> lalu klik <strong>Enable</strong>.
                      </li>
                      <li>
                        Buka menu <strong>Project Settings (⚙️)</strong> &gt; Tab <strong>General</strong> &gt; Bagian <strong>Your apps</strong> &gt; pilih Web App <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">sst-catalog</code>.
                      </li>
                      <li>
                        Salin konfigurasi <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">firebaseConfig = &#123; ... &#125;</code> lalu tempelkan pada kotak formulir di bawah ini.
                      </li>
                    </ol>
                  </div>

                  {/* Form Konfigurasi Kustom */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-[#135A62]" />
                        <span>Formulir Kredensial Firebase SDK</span>
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        Bisa ditempel langsung atau diisi manual
                      </span>
                    </div>

                    {/* Quick Paste Snippet Area */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Tempel Cepat Kode SDK / Objek JSON (Opsional):
                      </label>
                      <textarea
                        rows={3}
                        placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "sst-catalog",\n  appId: "1:..."\n};`}
                        value={fbSnippetInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFbSnippetInput(val);
                          if (!val.trim()) return;
                          try {
                            const apiKeyMatch = val.match(/apiKey\s*:\s*["']([^"']+)["']/);
                            const projectIdMatch = val.match(/projectId\s*:\s*["']([^"']+)["']/);
                            const appIdMatch = val.match(/appId\s*:\s*["']([^"']+)["']/);
                            const authDomainMatch = val.match(/authDomain\s*:\s*["']([^"']+)["']/);
                            const storageBucketMatch = val.match(/storageBucket\s*:\s*["']([^"']+)["']/);
                            const messagingSenderIdMatch = val.match(/messagingSenderId\s*:\s*["']([^"']+)["']/);
                            const measurementIdMatch = val.match(/measurementId\s*:\s*["']([^"']+)["']/);

                            if (apiKeyMatch) setFbApiKey(apiKeyMatch[1]);
                            if (projectIdMatch) setFbProjectId(projectIdMatch[1]);
                            if (appIdMatch) setFbAppId(appIdMatch[1]);
                            if (authDomainMatch) setFbAuthDomain(authDomainMatch[1]);
                            if (storageBucketMatch) setFbStorageBucket(storageBucketMatch[1]);
                            if (messagingSenderIdMatch) setFbMessagingSenderId(messagingSenderIdMatch[1]);
                            if (measurementIdMatch) setFbMeasurementId(measurementIdMatch[1]);
                            showToast('✅ Berhasil mengekstrak konfigurasi Firebase.');
                          } catch {
                            // ignore
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono outline-none focus:border-[#135A62]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Project ID *</label>
                        <input
                          type="text"
                          required
                          placeholder="sst-catalog"
                          value={fbProjectId}
                          onChange={(e) => setFbProjectId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#135A62]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">API Key *</label>
                        <input
                          type="text"
                          required
                          placeholder="AIzaSy..."
                          value={fbApiKey}
                          onChange={(e) => setFbApiKey(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#135A62]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">App ID *</label>
                        <input
                          type="text"
                          placeholder="1:414630016876:web:..."
                          value={fbAppId}
                          onChange={(e) => setFbAppId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#135A62]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Auth Domain</label>
                        <input
                          type="text"
                          placeholder="sst-catalog.firebaseapp.com"
                          value={fbAuthDomain}
                          onChange={(e) => setFbAuthDomain(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#135A62]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Storage Bucket</label>
                        <input
                          type="text"
                          placeholder="sst-catalog.firebasestorage.app"
                          value={fbStorageBucket}
                          onChange={(e) => setFbStorageBucket(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#135A62]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Messaging Sender ID</label>
                        <input
                          type="text"
                          placeholder="414630016876"
                          value={fbMessagingSenderId}
                          onChange={(e) => setFbMessagingSenderId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#135A62]"
                        />
                      </div>
                    </div>

                    {/* Test & Status Messages */}
                    {fbTestStatus && (
                      <div className={`p-4 rounded-2xl text-xs space-y-1.5 ${
                        fbTestStatus.success
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-red-50 text-red-900 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 font-bold">
                          {fbTestStatus.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span>{fbTestStatus.message}</span>
                        </div>
                        {fbTestStatus.details && (
                          <p className="text-[11px] text-slate-600 font-mono bg-white/70 p-2 rounded-lg border border-slate-200">
                            {fbTestStatus.details}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin mereset konfigurasi Firebase ke bawaan awal?')) {
                              localStorage.removeItem('sst_firebase_custom_config');
                              localStorage.removeItem('tjs_firebase_custom_config');
                              showToast('🔄 Konfigurasi Firebase direset ke default. Halaman akan dimuat ulang.');
                              setTimeout(() => window.location.reload(), 800);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          Reset ke Bawaan
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Send / Seed initial data to database */}
                        <button
                          type="button"
                          disabled={fbSeedStatus?.loading}
                          onClick={async () => {
                            if (!confirm(`Kirim ${products.length} produk dan pengaturan saat ini ke database Firestore ${currentFirebaseProjectId}?`)) {
                              return;
                            }
                            setFbSeedStatus({ loading: true, message: 'Menghubungkan ke Cloud Firestore...' });
                            try {
                              // Wrap batch write in a timeout to detect blocked rules or connection issues
                              const seedPromise = (async () => {
                                setFbSeedStatus({ loading: true, message: '1/2 Menyimpan profil toko, kategori & pengaturan...' });
                                const batch = writeBatch(db);
                                const storeDataRef = collection(db, 'storeData');
                                batch.set(doc(storeDataRef, 'siteSettings'), siteSettings);
                                batch.set(doc(storeDataRef, 'storeProfile'), storeProfile);
                                batch.set(doc(storeDataRef, 'categories'), { items: allCategories });
                                batch.set(doc(storeDataRef, 'categoriesMeta'), { items: categoriesMeta });
                                batch.set(doc(storeDataRef, 'infoTrends'), { items: infoTrends });
                                batch.set(doc(storeDataRef, 'notifications'), { items: notifications });
                                await batch.commit();

                                setFbSeedStatus({ loading: true, message: `2/2 Menyimpan ${products.length} data produk...` });
                                // Seed products in chunks of 300 (Firestore limit is 500 per batch)
                                const chunkSize = 300;
                                for (let i = 0; i < products.length; i += chunkSize) {
                                  const chunk = products.slice(i, i + chunkSize);
                                  const pBatch = writeBatch(db);
                                  chunk.forEach((p) => {
                                    pBatch.set(doc(db, 'products', String(p.id)), p);
                                  });
                                  await pBatch.commit();
                                }
                              })();

                              const timeoutPromise = new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout koneksi (15 detik). Pastikan Cloud Firestore di Firebase Console sudah dibuat dan Rules mengizinkan tulis (allow read, write: if true;).')), 15000)
                              );

                              await Promise.race([seedPromise, timeoutPromise]);

                              setFbSeedStatus({ success: true, message: `✅ Selesai! ${products.length} produk & pengaturan berhasil disimpan ke Firestore ${currentFirebaseProjectId}.` });
                              showToast(`🚀 Data berhasil disinkronkan ke Firestore ${currentFirebaseProjectId}!`);
                            } catch (err: any) {
                              console.error('Seed error:', err);
                              const errMsg = err.message || String(err);
                              let hint = '';
                              if (errMsg.toLowerCase().includes('permission-denied') || errMsg.toLowerCase().includes('permission')) {
                                hint = ' [Solusi: Buka Firebase Console > Firestore Database > Rules > ubah menjadi: allow read, write: if true; lalu klik Publish]';
                              }
                              setFbSeedStatus({ success: false, message: `Gagal: ${errMsg}${hint}` });
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <CloudLightning className="w-4 h-4" />
                          <span>{fbSeedStatus?.loading ? 'Sedang Mengirim...' : 'Kirim Data ke Firestore'}</span>
                        </button>

                        {/* Save & Apply Configuration */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!fbProjectId.trim() || !fbApiKey.trim()) {
                              alert('Project ID dan API Key wajib diisi.');
                              return;
                            }

                            const cleanDbId = fbDatabaseId.trim();
                            const isCustomNamedDb = cleanDbId && 
                              cleanDbId !== '(default)' && 
                              !cleanDbId.includes('ai-studio');

                            const newConfig = {
                              projectId: fbProjectId.trim(),
                              apiKey: fbApiKey.trim(),
                              appId: fbAppId.trim(),
                              authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
                              storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.firebasestorage.app`,
                              messagingSenderId: fbMessagingSenderId.trim(),
                              measurementId: fbMeasurementId.trim(),
                              firestoreDatabaseId: isCustomNamedDb ? cleanDbId : undefined,
                            };

                            localStorage.setItem('sst_firebase_custom_config', JSON.stringify(newConfig));
                            setFbTestStatus({
                              success: true,
                              message: `✅ Kredensial Firebase ${newConfig.projectId} berhasil disimpan!`,
                              details: 'Halaman akan disegarkan dalam 1.5 detik untuk menghubungkan SDK ke project Firebase baru Anda...'
                            });

                            showToast(`✅ Firebase beralih ke project ${newConfig.projectId}!`);
                            setTimeout(() => {
                              window.location.reload();
                            }, 1500);
                          }}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#135A62] hover:bg-[#0e444a] text-white flex items-center gap-1.5 shadow-md transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Simpan & Terapkan Kredensial</span>
                        </button>
                      </div>
                    </div>

                    {fbSeedStatus && (
                      <div className={`p-3 rounded-xl text-xs ${
                        fbSeedStatus.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {fbSeedStatus.message}
                      </div>
                    )}

                    {/* Cloudflare Pages / Hosting Multi-Device Sync Card */}
                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3 text-xs text-sky-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm text-sky-950">
                          <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>Sinkronisasi Multi-Device & Hosting (Cloudflare Pages)</span>
                        </div>
                      </div>
                      <p className="text-sky-800 text-[11px] leading-relaxed">
                        Agar database Firebase terhubung otomatis di <strong>semua device (HP, Laptop lain)</strong> saat diakses via domain <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">pages.dev</code> tanpa perlu input admin manual di tiap device, masukkan variabel lingkungan ini ke pengaturan Cloudflare Pages Anda:
                      </p>
                      
                      <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] space-y-1 relative group overflow-x-auto">
                        <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-700 font-sans flex justify-between items-center">
                          <span>Environment Variables untuk Cloudflare Pages</span>
                          <button
                            type="button"
                            onClick={() => {
                              const envText = `VITE_FIREBASE_PROJECT_ID=${fbProjectId || currentFirebaseProjectId}\nVITE_FIREBASE_API_KEY=${fbApiKey}\nVITE_FIREBASE_APP_ID=${fbAppId}\nVITE_FIREBASE_AUTH_DOMAIN=${fbAuthDomain || `${fbProjectId || currentFirebaseProjectId}.firebaseapp.com`}\nVITE_FIREBASE_STORAGE_BUCKET=${fbStorageBucket || `${fbProjectId || currentFirebaseProjectId}.firebasestorage.app`}\nVITE_FIREBASE_MESSAGING_SENDER_ID=${fbMessagingSenderId}\nVITE_FIREBASE_MEASUREMENT_ID=${fbMeasurementId}`;
                              navigator.clipboard.writeText(envText);
                              showToast('📋 Format .env untuk Cloudflare Pages berhasil disalin!');
                            }}
                            className="text-sky-300 hover:text-sky-100 underline text-[10px] cursor-pointer"
                          >
                            Salin Semua
                          </button>
                        </div>
                        <p>VITE_FIREBASE_PROJECT_ID={fbProjectId || currentFirebaseProjectId}</p>
                        <p>VITE_FIREBASE_API_KEY={fbApiKey || '(API_KEY_ANDA)'}</p>
                        <p>VITE_FIREBASE_APP_ID={fbAppId || '(APP_ID_ANDA)'}</p>
                        <p>VITE_FIREBASE_AUTH_DOMAIN={fbAuthDomain || `${fbProjectId || currentFirebaseProjectId}.firebaseapp.com`}</p>
                        <p>VITE_FIREBASE_STORAGE_BUCKET={fbStorageBucket || `${fbProjectId || currentFirebaseProjectId}.firebasestorage.app`}</p>
                        <p>VITE_FIREBASE_MESSAGING_SENDER_ID={fbMessagingSenderId || ''}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const jsonConfig = {
                              projectId: fbProjectId || currentFirebaseProjectId,
                              appId: fbAppId,
                              apiKey: fbApiKey,
                              authDomain: fbAuthDomain || `${fbProjectId || currentFirebaseProjectId}.firebaseapp.com`,
                              firestoreDatabaseId: "(default)",
                              storageBucket: fbStorageBucket || `${fbProjectId || currentFirebaseProjectId}.firebasestorage.app`,
                              messagingSenderId: fbMessagingSenderId,
                              measurementId: fbMeasurementId
                            };
                            const blob = new Blob([JSON.stringify(jsonConfig, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'firebase-applet-config.json';
                            a.click();
                            showToast('📥 File firebase-applet-config.json berhasil diunduh!');
                          }}
                          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download firebase-applet-config.json</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: Panduan Deploy ke Cloudflare Pages */}
              {adminTab === 'deploy-guide' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      Panduan Deploy dari GitHub ke Cloudflare Pages (100% Gratis & Super Cepat)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Aplikasi ini dirancang sebagai katalog statis ultra-ringan tanpa backend berat sehingga dapat langsung di-hosting di jaringan global Cloudflare Pages.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h5 className="font-bold text-slate-900 text-sm">
                        Langkah 1: Simpan Source Code ke Repository GitHub
                      </h5>
                      <p>
                        Export atau unduh kode sumber project ini, lalu push ke repository GitHub baru (contoh: <code className="bg-slate-200 px-1 py-0.5 rounded">https://github.com/username/katalog-produk-statis</code>).
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h5 className="font-bold text-slate-900 text-sm">
                        Langkah 2: Hubungkan ke Cloudflare Pages
                      </h5>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Buka dashboard <strong>Cloudflare</strong> (<a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-[#135A62] underline">dash.cloudflare.com</a>).</li>
                        <li>Pilih menu <strong>Workers & Pages</strong> &gt; <strong>Create application</strong> &gt; Tab <strong>Pages</strong> &gt; <strong>Connect to Git</strong>.</li>
                        <li>Pilih akun GitHub Anda dan pilih repository katalog ini.</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
                      <h5 className="font-bold text-teal-950 text-sm">
                        Langkah 3: Konfigurasi Build Settings Cloudflare Pages
                      </h5>
                      <div className="space-y-1 font-mono text-xs text-teal-900 bg-white/80 p-3 rounded-xl border border-teal-100">
                        <p><strong>Framework preset:</strong> Vite (atau None)</p>
                        <p><strong>Build command:</strong> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-bold">npm run build</span></p>
                        <p><strong>Build output directory:</strong> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-bold">dist</span></p>
                        <p><strong>Node.js Version (Environment variable):</strong> NODE_VERSION = 20</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h5 className="font-bold text-slate-900 text-sm">
                        Langkah 4: Cara Update Data Produk CSV di Masa Depan
                      </h5>
                      <p className="text-xs">
                        Ada 2 cara mudah:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                        <li><strong>Melalui Admin Web Ini:</strong> Buka Admin &gt; Upload CSV baru &gt; Data langsung tersimpan di browser Anda & dapat didownload ulang.</li>
                        <li><strong>Melalui GitHub:</strong> Cukup commit/replace file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">src/data/initialData.ts</code> atau letakkan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">public/produk.csv</code> lalu commit. Cloudflare Pages akan otomatis mendeteksi dan men-deploy pembaruan dalam hitungan detik!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Sub-Editor: Create / Edit Single Product */}
        {editingProduct && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-base text-slate-900">
                  {isCreatingProduct ? 'Tambah Produk Baru' : `Edit Produk: ${editingProduct.nama}`}
                </h4>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nama}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nama: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Merk / Brand</label>
                  <input
                    type="text"
                    value={editingProduct.merk}
                    onChange={(e) => setEditingProduct({ ...editingProduct, merk: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Tipe / Seri</label>
                  <input
                    type="text"
                    value={editingProduct.type}
                    onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Kategori</label>
                  <input
                    type="text"
                    value={editingProduct.kategori}
                    onChange={(e) => setEditingProduct({ ...editingProduct, kategori: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Harga Standar (Rp) *</label>
                  <input
                    type="number"
                    value={editingProduct.harga}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, harga: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Harga Diskon (Rp, Kosongkan jika tanpa diskon):
                  </label>
                  <input
                    type="number"
                    value={editingProduct.harga_diskon || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        harga_diskon: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Jumlah Stok (0 = &quot;Tanya Admin&quot;, &gt;0 = &quot;Tersedia&quot;)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.jumlah_stok}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, jumlah_stok: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Isi Pieces Kemasan</label>
                  <input
                    type="number"
                    value={editingProduct.jumlah_pieces_packing}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        jumlah_pieces_packing: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Satuan Kemasan (Dus, Box, Set, dll)</label>
                  <input
                    type="text"
                    value={editingProduct.satuan_packing}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, satuan_packing: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Angka Favorit (1-50)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editingProduct.angka_produk_favorit}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        angka_produk_favorit: parseInt(e.target.value, 10) || 25,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">URL Foto (Cloudinary / Image URL)</label>
                  <input
                    type="text"
                    value={editingProduct.url_foto}
                    onChange={(e) => setEditingProduct({ ...editingProduct, url_foto: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Deskripsi Lengkap</label>
                  <textarea
                    rows={3}
                    value={editingProduct.deskripsi}
                    onChange={(e) => setEditingProduct({ ...editingProduct, deskripsi: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!editingProduct.nama) {
                      alert('Nama produk wajib diisi.');
                      return;
                    }
                    if (isCreatingProduct) {
                      addProduct(editingProduct);
                    } else {
                      updateProduct(editingProduct);
                    }
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#135A62] text-white hover:bg-[#0e444a]"
                >
                  Simpan Produk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sub-Editor: Create / Edit Article Info & Trend */}
        {editingArticle && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-base text-slate-900">
                  {isCreatingArticle ? 'Tulis Artikel Info & Trend Baru' : 'Edit Artikel'}
                </h4>
                <button
                  onClick={() => setEditingArticle(null)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Judul Artikel *</label>
                  <input
                    type="text"
                    value={editingArticle.judul}
                    onChange={(e) => setEditingArticle({ ...editingArticle, judul: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Tag / Kategori Artikel</label>
                    <input
                      type="text"
                      value={editingArticle.tag}
                      onChange={(e) => setEditingArticle({ ...editingArticle, tag: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Penulis</label>
                    <input
                      type="text"
                      value={editingArticle.penulis || ''}
                      onChange={(e) => setEditingArticle({ ...editingArticle, penulis: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">URL Gambar Sampul (Cover)</label>
                  <input
                    type="text"
                    value={editingArticle.url_gambar}
                    onChange={(e) => setEditingArticle({ ...editingArticle, url_gambar: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    URL Dokumen PDF Brosur / Katalog (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="https://...link-pdf-katalog.pdf"
                    value={editingArticle.url_pdf || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, url_pdf: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Ringkasan Singkat *</label>
                  <textarea
                    rows={2}
                    value={editingArticle.ringkasan}
                    onChange={(e) => setEditingArticle({ ...editingArticle, ringkasan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Konten Lengkap Artikel</label>
                  <textarea
                    rows={6}
                    value={editingArticle.konten}
                    onChange={(e) => setEditingArticle({ ...editingArticle, konten: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!editingArticle.judul) {
                      alert('Judul artikel wajib diisi.');
                      return;
                    }
                    if (isCreatingArticle) {
                      addInfoTrend(editingArticle);
                    } else {
                      updateInfoTrend(editingArticle);
                    }
                    setEditingArticle(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#135A62] text-white hover:bg-[#0e444a]"
                >
                  Simpan Artikel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
