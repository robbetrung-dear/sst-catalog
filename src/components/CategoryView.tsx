import React, { useState, useMemo } from 'react';
import { Layers, ArrowRight, Package, Search, Sparkles, Filter, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export const CategoryView: React.FC = () => {
  const {
    allCategories,
    categoriesMeta,
    products,
    setSelectedCategory,
    setActiveTab,
    setSearchQuery,
    setSortBy: setCatalogSortBy,
    setSelectedBrand,
    setSelectedType
  } = useCatalog();

  const [searchCat, setSearchCat] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'count-desc' | 'count-asc' | 'relevance'>('count-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSelectCategory = (catName: string) => {
    if (!catName) return;
    setSelectedCategory(catName);
    setActiveTab('beranda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe category list with product counts and metadata
  const enrichedCategories = useMemo(() => {
    const safeCategories = Array.isArray(allCategories) ? allCategories : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeMetaList = Array.isArray(categoriesMeta) ? categoriesMeta : [];

    return safeCategories
      .filter((catName) => typeof catName === 'string' && catName.trim().length > 0)
      .map((catName) => {
        const trimmed = catName.trim();
        const lowerName = trimmed.toLowerCase();

        // Safe search meta
        const meta = safeMetaList.find(
          (c) => c && typeof c.nama === 'string' && c.nama.trim().toLowerCase() === lowerName
        );

        // Safe product count
        const productCount = safeProducts.filter((p) => {
          if (!p || typeof p.kategori !== 'string') return false;
          return p.kategori.trim().toLowerCase() === lowerName;
        }).length;

        const defaultIcon = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80';
        const iconUrl = meta?.iconUrl && meta.iconUrl.trim() ? meta.iconUrl.trim() : defaultIcon;
        const desc = meta?.deskripsi && meta.deskripsi.trim() 
          ? meta.deskripsi.trim() 
          : `Koleksi lengkap produk ${trimmed} dengan standar industri berkualitas tinggi.`;

        return {
          name: trimmed,
          productCount,
          iconUrl,
          desc,
        };
      });
  }, [allCategories, products, categoriesMeta]);

  // Filtered & Sorted categories
  const filteredCategories = useMemo(() => {
    return enrichedCategories
      .filter((cat) => {
        if (!searchCat.trim()) return true;
        const queryWords = searchCat.toLowerCase().trim().split(/\s+/);
        const textToSearch = `${cat.name} ${cat.desc}`.toLowerCase();
        
        return queryWords.every(qw => textToSearch.includes(qw));
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'name-desc') {
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'count-desc' || sortBy === 'relevance') {
          if (b.productCount !== a.productCount) {
            return b.productCount - a.productCount;
          }
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'count-asc') {
          if (a.productCount !== b.productCount) {
            return a.productCount - b.productCount;
          }
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        }
        return 0;
      });
  }, [enrichedCategories, searchCat, sortBy]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchCat]);

  const productSuggestion = useMemo(() => {
    if (filteredCategories.length > 0 || !searchCat.trim() || sortBy !== 'relevance') {
      return null;
    }
    
    const queryWords = searchCat.toLowerCase().trim().split(/\s+/);
    
    // Find the first product that matches the query well
    const match = products.find(p => {
       const textToSearch = `${p.nama} ${p.merk} ${p.type} ${p.kategori} ${p.deskripsi}`.toLowerCase();
       // Basic fuzzy: all query words exist in the text
       return queryWords.every(qw => textToSearch.includes(qw));
    });

    if (match) {
      return {
         kategori: match.kategori || 'Semua',
         merk: match.merk || 'Semua',
         tipe: match.type || 'Semua',
      };
    }
    return null;
  }, [filteredCategories.length, searchCat, sortBy, products]);

  const totalProductsCount = Array.isArray(products) ? products.length : 0;

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
          Pilih kategori yang Anda butuhkan untuk meninjau seluruh varian produk ({totalProductsCount} item terdaftar), spesifikasi teknis, dan penawaran terbaik.
        </p>
      </div>

      {/* Filter and Search Bar for Categories */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchCat}
            onChange={(e) => setSearchCat(e.target.value)}
            placeholder="Cari nama kategori atau spesifikasi..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#135A62] focus:bg-white transition-all"
          />
          {searchCat && (
            <button
              onClick={() => setSearchCat('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 px-2 py-0.5 rounded"
            >
              Bersihkan
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-[#135A62] cursor-pointer"
          >
            <option value="relevance">Produk Terkait (Pencarian Cerdas)</option>
            <option value="count-desc">Produk Terbanyak</option>
            <option value="count-asc">Produk Paling Sedikit</option>
            <option value="name-asc">Nama Kategori (A - Z)</option>
            <option value="name-desc">Nama Kategori (Z - A)</option>
          </select>
        </div>
      </div>

      {/* Summary Badge */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Menampilkan <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredCategories.length)}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredCategories.length)}</strong> dari <strong>{filteredCategories.length}</strong> Kategori
        </span>
        <span>Total <strong>{totalProductsCount}</strong> Produk Aktif</span>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((cat) => (
            <div
              key={cat.name}
              id={`cat-card-${cat.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
              onClick={() => handleSelectCategory(cat.name)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-[#135A62]/50 p-5 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Category Icon / Image */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs group-hover:scale-105 transition-transform">
                  <img
                    src={cat.iconUrl}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-[#135A62] transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full shrink-0">
                      {cat.productCount} Produk
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                    {cat.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#135A62] group-hover:translate-x-1 transition-transform">
                <span>Lihat Semua Produk</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : productSuggestion ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs space-y-6 max-w-lg mx-auto animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-[#135A62]/10 text-[#135A62] rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-slate-800">Mungkin Maksud Anda Adalah Produk?</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Produk yang Anda cari mungkin ada dalam kategori <strong className="text-slate-900">"{productSuggestion.kategori}"</strong>, merk <strong className="text-slate-900">"Semua Merk"</strong>, dan tipe <strong className="text-slate-900">"{productSuggestion.tipe}"</strong>.
            </p>
            <p className="text-sm text-slate-600">
              Apakah Anda ingin melanjutkan pencarian ke halaman produk?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setSearchCat('')}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
            >
              Tidak
            </button>
            <button
              onClick={() => {
                setSearchQuery(searchCat);
                setCatalogSortBy('relevance');
                setSelectedCategory(productSuggestion.kategori);
                setSelectedBrand('Semua');
                setSelectedType(productSuggestion.tipe);
                setActiveTab('beranda');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#135A62] text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Lanjutkan <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-800">Kategori Tidak Ditemukan</h4>
            <p className="text-xs text-slate-500">
              Tidak ada kategori yang cocok dengan kata kunci &quot;{searchCat}&quot;.
            </p>
          </div>
          <button
            onClick={() => setSearchCat('')}
            className="px-4 py-2 bg-[#135A62] text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredCategories.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.ceil(filteredCategories.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  currentPage === page 
                    ? 'bg-[#135A62] text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredCategories.length / itemsPerPage), p + 1))}
            disabled={currentPage === Math.ceil(filteredCategories.length / itemsPerPage)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
