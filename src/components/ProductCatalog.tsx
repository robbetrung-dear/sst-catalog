import React, { useRef } from 'react';
import { Filter, ChevronLeft, ChevronRight, RotateCcw, Search, Sparkles, Grid, SlidersHorizontal } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { ProductCard } from './ProductCard';

export const ProductCatalog: React.FC = () => {
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const {
    products,
    filteredProducts,
    paginatedProducts,
    allCategories,
    allBrands,
    allTypes,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
  } = useCatalog();

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setSelectedBrand('Semua');
    setSelectedType('Semua');
    setSearchQuery('');
    setSortBy('popular');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory !== 'Semua' ||
    selectedBrand !== 'Semua' ||
    selectedType !== 'Semua' ||
    searchQuery.trim() !== '' ||
    sortBy !== 'popular';

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  return (
    <section id="catalog-product-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Filter and Control Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Top bar: Category horizontal chips */}
        <div className="relative flex items-center group">
          <button
            onClick={() => scrollCategories('left')}
            className="absolute left-0 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#135A62] hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 -ml-3"
            aria-label="Scroll Kiri"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div ref={categoryScrollRef} className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-4 w-full scroll-smooth">
            <button
              onClick={() => setSelectedCategory('Semua')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                selectedCategory === 'Semua'
                  ? 'bg-[#135A62] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Kategori ({products.length})
            </button>
            {allCategories.map((cat) => {
              const count = products.filter((p) => p.kategori === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#135A62] text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollCategories('right')}
            className="absolute right-0 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#135A62] hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 -mr-3"
            aria-label="Scroll Kanan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Filter Row: Brand, Type, Sort, and Search Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Brand Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter Merk / Brand:</label>
            <select
              id="filter-brand-select"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#135A62]/30 focus:border-[#135A62] outline-none"
            >
              <option value="Semua">Semua Merk ({allBrands.length})</option>
              {allBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter Tipe / Seri:</label>
            <select
              id="filter-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#135A62]/30 focus:border-[#135A62] outline-none"
            >
              <option value="Semua">Semua Tipe Produk</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Urutan Harga / Nama:</label>
            <select
              id="filter-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#135A62]/30 focus:border-[#135A62] outline-none"
            >
              <option value="popular">⭐ Paling Favorit / Rekomendasi</option>
              <option value="price-asc">💵 Harga: Termurah ke Termahal</option>
              <option value="price-desc">💰 Harga: Termahal ke Termurah</option>
              <option value="name-asc">🔤 Nama Produk: A ke Z</option>
              <option value="name-desc">🔤 Nama Produk: Z ke A</option>
            </select>
          </div>

          {/* Reset Filters & Count Summary */}
          <div className="flex flex-col justify-end">
            {hasActiveFilters ? (
              <button
                id="filter-reset-btn"
                onClick={handleResetFilters}
                className="w-full py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Semua Filter</span>
              </button>
            ) : (
              <div className="text-xs text-slate-500 py-2 flex items-center gap-1.5 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-[#135A62]" />
                <span>Filter aktif responsif instan</span>
              </div>
            )}
          </div>
        </div>

        {/* Results summary header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">
              {filteredProducts.length > 0
                ? `Menampilkan ${startIndex} - ${endIndex} dari ${filteredProducts.length} produk ditemukan`
                : 'Tidak ada produk yang cocok'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">
              Total Database: <strong>{products.length}</strong> produk
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Paginasi 10 per halaman)
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Produk Tidak Ditemukan</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Tidak ada produk yang cocok dengan kata kunci &quot;{searchQuery}&quot; atau filter yang dipilih. Silakan coba kata kunci lain atau reset filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 rounded-xl bg-[#135A62] text-white font-semibold text-sm hover:bg-[#0e444a] transition-colors inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tampilkan Semua Produk</span>
          </button>
        </div>
      )}

      {/* Pagination Controls (Paginasi 10 per halaman) */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <button
            id="pagination-prev-btn"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(Math.max(1, currentPage - 1));
              const target = document.getElementById('catalog-product-list');
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              // Show first, last, and around current page
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
              ) {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      const target = document.getElementById('catalog-product-list');
                      if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`min-w-9 h-9 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-[#135A62] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                return (
                  <span key={pageNum} className="text-slate-400 px-1 text-xs">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            id="pagination-next-btn"
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage(Math.min(totalPages, currentPage + 1));
              const target = document.getElementById('catalog-product-list');
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#135A62] text-white hover:bg-[#0e444a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
