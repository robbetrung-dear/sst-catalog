import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Calendar, FileText, Download, ArrowRight, X, ExternalLink, Tag, User } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { InfoTrendItem } from '../types';

export const InfoTrendView: React.FC = () => {
  const { infoTrends } = useCatalog();
  const [searchTrendQuery, setSearchTrendQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<InfoTrendItem | null>(null);

  const filteredArticles = useMemo(() => {
    if (!searchTrendQuery.trim()) return infoTrends;
    const q = searchTrendQuery.toLowerCase().trim();
    return infoTrends.filter(
      (item) =>
        item.judul.toLowerCase().includes(q) ||
        item.ringkasan.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
    );
  }, [infoTrends, searchTrendQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header & Search Bar */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#135A62]/10 text-[#135A62] text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Wawasan & Berita Industri</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Info & Trend Teknik Industri
        </h2>
        <p className="text-sm text-slate-500">
          Kumpulan artikel panduan teknis, tips pengadaan material, standar keselamatan K3, dan katalog brosur PDF terkini.
        </p>

        {/* Search bar: "Cari Judul Info & Trend" */}
        <div className="max-w-xl mx-auto pt-2">
          <div className="relative flex items-center bg-white border border-slate-300 rounded-2xl shadow-xs px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#135A62]/30 focus-within:border-[#135A62]">
            <Search className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
            <input
              id="search-info-trend-input"
              type="text"
              value={searchTrendQuery}
              onChange={(e) => setSearchTrendQuery(e.target.value)}
              placeholder="Cari judul info & trend, topik baut, las, safety..."
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {searchTrendQuery && (
              <button
                onClick={() => setSearchTrendQuery('')}
                className="text-xs text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded bg-slate-100"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Article Cover Image */}
                <div
                  className="relative aspect-16/9 bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <img
                    src={article.url_gambar || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'}
                    alt={article.judul}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-[#135A62]/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{article.tag || 'Industri'}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {article.tanggal}
                    </span>
                    {article.penulis && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {article.penulis}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedArticle(article)}
                    className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#135A62] cursor-pointer transition-colors line-clamp-2"
                  >
                    {article.judul}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {article.ringkasan}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-4">
                <button
                  onClick={() => setSelectedArticle(article)}
                  className="text-xs font-bold text-[#135A62] hover:underline flex items-center gap-1.5"
                >
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {article.url_pdf && (
                  <a
                    href={article.url_pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
          <p className="text-slate-600 font-medium">Tidak ada artikel yang cocok dengan &quot;{searchTrendQuery}&quot;</p>
          <button
            onClick={() => setSearchTrendQuery('')}
            className="text-xs text-[#135A62] font-semibold underline"
          >
            Tampilkan semua artikel
          </button>
        </div>
      )}

      {/* Article Detail Reading Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-[#135A62]/10 text-[#135A62] text-xs font-bold px-2.5 py-1 rounded-md">
                  {selectedArticle.tag}
                </span>
                <span className="text-xs text-slate-500">{selectedArticle.tanggal}</span>
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {selectedArticle.judul}
              </h2>

              {selectedArticle.url_gambar && (
                <div className="rounded-2xl overflow-hidden aspect-16/9 bg-slate-100">
                  <img
                    src={selectedArticle.url_gambar}
                    alt={selectedArticle.judul}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
                {selectedArticle.konten || selectedArticle.ringkasan}
              </div>

              {/* PDF brochure section if present */}
              {selectedArticle.url_pdf && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Dokumen & Brosur Teknis PDF</h4>
                      <p className="text-xs text-slate-500">Tersedia dokumen spesifikasi resmi untuk artikel ini.</p>
                    </div>
                  </div>

                  <a
                    href={selectedArticle.url_pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 shrink-0 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Buka / Unduh PDF</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
              >
                Tutup Artikel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
