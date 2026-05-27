import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  X,
  MessageCircle,
  Package,
  RotateCcw,
  Ship,
  ChevronRight,
} from 'lucide-react';
import { CATALOG_PRODUCTS } from '../data/catalog-products';
import {
  TAG_LABELS,
  CATALOG_REMARK,
  type CatalogProduct,
  type CatalogSort,
} from '../lib/catalog-types';
import {
  filterAndSortProducts,
  getAllTags,
  getCategories,
  getPrimaryImage,
  getProductImages,
  getProductPill,
  buildWhatsAppUrl,
} from '../lib/catalog-utils';

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'newest', label: '最新上架' },
  { value: 'popular', label: '熱門' },
  { value: 'codeAsc', label: '款號 A→Z' },
  { value: 'codeDesc', label: '款號 Z→A' },
];

function ProductModal({
  product,
  onClose,
}: {
  product: CatalogProduct;
  onClose: () => void;
}) {
  const images = getProductImages(product);
  const [activeIdx, setActiveIdx] = useState(0);
  const pill = getProductPill(product);

  useEffect(() => {
    setActiveIdx(0);
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [product.code, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="關閉"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#E8E4DE]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-[#E8E4DE]">
          <div>
            <p className="text-sm font-semibold text-[#D98236]">{product.code}</p>
            <h3 id="catalog-modal-title" className="text-xl font-bold text-[#1C1C1C]">
              {product.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-lg hover:bg-[#F7F5F2] min-h-[3rem] min-w-[3rem] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F7F5F2] border border-[#E8E4DE]">
                <img
                  src={images[activeIdx]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getPrimaryImage(product);
                  }}
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {images.map((src, idx) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === activeIdx ? 'border-[#D98236]' : 'border-[#E8E4DE]'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {pill && (
                  <span
                    className={`nfh-badge ${
                      pill.cls === 'oos'
                        ? 'bg-[#888]/15 text-[#666]'
                        : pill.cls === 'new'
                          ? 'bg-[#E6F5EF] text-[#00875A]'
                          : 'bg-[#FDF6EE] text-[#D98236]'
                    }`}
                  >
                    {pill.text}
                  </span>
                )}
                {(product.tags ?? []).map((t) => (
                  <span key={t} className="nfh-badge bg-[#F7F5F2] text-[#555]">
                    {TAG_LABELS[t] ?? t}
                  </span>
                ))}
                {product.logistics && (
                  <span className="nfh-badge bg-[#E8F4FF] text-[#1a6fb0]">
                    <Ship className="w-3.5 h-3.5" />
                    在途
                  </span>
                )}
              </div>

              <dl className="space-y-2.5 text-base">
                {[
                  ['品類', product.category],
                  ['規格', (product.specLines ?? []).join('；') || '—'],
                  ['交期', product.leadTime || '—'],
                  ['工廠', product.factory || '—'],
                  ['包裝', product.packaging || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="shrink-0 w-14 text-[#888] font-medium">{label}</dt>
                    <dd className="text-[#1C1C1C] font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="nfh-card-accent p-5">
            <p className="text-sm font-semibold text-[#888] mb-2">階梯報價</p>
            <ul className="space-y-1.5">
              {(product.priceLines ?? [product.price ?? '—']).map((line) => (
                <li key={line} className="text-lg font-bold text-[#D98236]">
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {product.note && (
            <p className="text-base text-[#555] bg-[#FFF8E7] rounded-lg px-4 py-3 border border-[#E8A317]/30">
              {product.note}
            </p>
          )}

          <p className="text-sm text-[#888] leading-relaxed">{CATALOG_REMARK}</p>

          <a
            href={buildWhatsAppUrl(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="nfh-btn-primary w-full text-lg"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp 詢盤
          </a>
        </div>
      </div>
    </div>
  );
}

export default function FuturesCatalog() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [showOos, setShowOos] = useState(false);
  const [sort, setSort] = useState<CatalogSort>('popular');
  const [selected, setSelected] = useState<CatalogProduct | null>(null);

  const categories = useMemo(() => getCategories(CATALOG_PRODUCTS), []);
  const allTags = useMemo(() => getAllTags(CATALOG_PRODUCTS), []);

  const filtered = useMemo(
    () =>
      filterAndSortProducts(CATALOG_PRODUCTS, {
        category,
        query,
        tags,
        showOos,
        sort,
      }),
    [category, query, tags, showOos, sort],
  );

  const resetFilters = () => {
    setCategory('all');
    setQuery('');
    setTags(new Set());
    setShowOos(false);
    setSort('popular');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    const p = CATALOG_PRODUCTS.find((x) => x.code === code);
    if (p) setSelected(p);
  }, []);

  const toggleTag = (tag: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <section id="futures-catalog" className="py-10 sm:py-14">
      <div className="nfh-container">
        <div className="mb-8">
          <p className="text-[#D98236] font-semibold text-lg mb-1">凍品水產部</p>
          <h2 className="nfh-section-title">期貨報價目錄</h2>
          <p className="nfh-section-subtitle max-w-2xl">
            冷凍肉品 · 水產批發 · 階梯報價一目了然。點選產品可查看規格、交期，並透過 WhatsApp 直接詢盤。
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          <aside className="space-y-4">
            <div className="nfh-card p-5 space-y-5 lg:sticky lg:top-28">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">篩選商品</h3>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#D98236] hover:underline min-h-[2.5rem] px-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重設
                </button>
              </div>

              <div>
                <label htmlFor="catalog-search" className="block text-sm font-semibold text-[#555] mb-2">
                  搜尋
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888]" />
                  <input
                    id="catalog-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="編號、品名、產地…"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#E8E4DE] text-base min-h-[3rem] focus:outline-none focus:border-[#D98236] focus:ring-2 focus:ring-[#D98236]/20"
                  />
                </div>
                <p className="text-sm text-[#888] mt-1.5">支援產品編號、品名、部位、標籤</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#555] mb-2">品類</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('all')}
                    className={`px-4 py-2.5 rounded-lg text-base font-semibold min-h-[2.75rem] transition-colors ${
                      category === 'all'
                        ? 'bg-[#D98236] text-white'
                        : 'bg-[#F7F5F2] text-[#555] hover:bg-[#FDF6EE]'
                    }`}
                  >
                    全部
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2.5 rounded-lg text-base font-semibold min-h-[2.75rem] transition-colors ${
                        category === cat
                          ? 'bg-[#D98236] text-white'
                          : 'bg-[#F7F5F2] text-[#555] hover:bg-[#FDF6EE]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {allTags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[#555] mb-2">標籤</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold min-h-[2.5rem] transition-colors ${
                          tags.has(tag)
                            ? 'bg-[#D98236] text-white'
                            : 'bg-[#F7F5F2] text-[#555] hover:bg-[#FDF6EE]'
                        }`}
                      >
                        {TAG_LABELS[tag] ?? tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer min-h-[3rem]">
                <input
                  type="checkbox"
                  checked={showOos}
                  onChange={(e) => setShowOos(e.target.checked)}
                  className="w-5 h-5 rounded border-[#E8E4DE] accent-[#D98236]"
                />
                <span className="text-base font-medium text-[#555]">顯示已售罄產品</span>
              </label>
            </div>

            <div className="nfh-card p-5 bg-[#FDF6EE] border-[#D98236]/20 hidden lg:block">
              <p className="font-bold text-lg text-[#1C1C1C] mb-2">需要報價／現貨？</p>
              <p className="text-base text-[#555] mb-4">
                點開產品詳情後，按 WhatsApp 詢盤即可快速聯絡業務。
              </p>
              <a
                href={buildWhatsAppUrl(CATALOG_PRODUCTS[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="nfh-btn-primary w-full"
              >
                <MessageCircle className="w-5 h-5" />
                立即詢盤
              </a>
            </div>
          </aside>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <p className="text-lg font-semibold text-[#1C1C1C]">
                共 <span className="text-[#D98236]">{filtered.length}</span> 件商品
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="catalog-sort" className="text-base font-medium text-[#555] shrink-0">
                  排序
                </label>
                <select
                  id="catalog-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as CatalogSort)}
                  className="px-4 py-3 rounded-lg border border-[#E8E4DE] text-base min-h-[3rem] bg-white focus:outline-none focus:border-[#D98236]"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="nfh-card p-10 text-center">
                <Package className="w-12 h-12 text-[#D98236] mx-auto mb-4" />
                <p className="text-xl font-bold mb-2">找不到符合條件的產品</p>
                <p className="text-base text-[#555] mb-6">
                  可試清除篩選、縮短關鍵字，或改用產品編號搜尋。
                </p>
                <button type="button" onClick={resetFilters} className="nfh-btn-outline">
                  清除篩選
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((p) => {
                  const pill = getProductPill(p);
                  const img = getPrimaryImage(p);
                  const topPrice = p.priceLines?.[0] ?? p.price ?? '';

                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => setSelected(p)}
                      className="nfh-card text-left overflow-hidden group hover:border-[#D98236]/40 transition-all"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F5F2]">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = img;
                          }}
                        />
                        {pill && (
                          <span
                            className={`absolute top-3 left-3 nfh-badge shadow-sm ${
                              pill.cls === 'oos'
                                ? 'bg-[#888] text-white'
                                : pill.cls === 'new'
                                  ? 'bg-[#00875A] text-white'
                                  : 'bg-[#D98236] text-white'
                            }`}
                          >
                            {pill.text}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-[#888] mb-1">{p.code}</p>
                        <h3 className="text-lg font-bold text-[#1C1C1C] leading-snug mb-1 line-clamp-2">
                          {p.name}
                        </h3>
                        <p className="text-sm text-[#888] mb-2">{p.category}</p>
                        {topPrice && (
                          <p className="text-base font-bold text-[#D98236] mb-2">{topPrice}</p>
                        )}
                        {p.leadTime && (
                          <p className="text-sm text-[#555]">交期：{p.leadTime}</p>
                        )}
                        <span className="inline-flex items-center gap-1 mt-3 text-base font-semibold text-[#D98236] group-hover:gap-2 transition-all">
                          查看報價
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
