import type { CatalogProduct, CatalogSort } from './catalog-types';
import { TAG_LABELS } from './catalog-types';

export function resolveCatalogImage(path: string): string {
  const trimmed = path.replace(/^\.?\//, '');
  if (trimmed.startsWith('http')) return trimmed;
  const rel = trimmed.replace(/^images\//, '');
  return `./catalog/images/${encodeURI(rel)}`;
}

export function buildPlaceholderSvg(title: string, subtitle: string): string {
  const t = title.slice(0, 28);
  const s = subtitle.slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <rect width="640" height="480" fill="#FDF6EE"/>
    <rect x="24" y="24" width="592" height="432" rx="16" fill="#fff" stroke="#E8E4DE"/>
    <text x="320" y="220" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#D98236">${t}</text>
    <text x="320" y="260" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#888">${s}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getPrimaryImage(p: CatalogProduct): string {
  const imgs = (p.images ?? []).filter(Boolean);
  if (imgs.length > 0) return resolveCatalogImage(imgs[0]);
  return buildPlaceholderSvg(p.name, p.code);
}

export function getProductImages(p: CatalogProduct): string[] {
  const imgs = (p.images ?? []).filter(Boolean);
  if (imgs.length > 0) return imgs.map(resolveCatalogImage);
  return [
    buildPlaceholderSvg(p.name, p.code),
    buildPlaceholderSvg('詳情', p.category),
  ];
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function productMatchesQuery(p: CatalogProduct, q: string): boolean {
  if (!q) return true;
  const hay = normalizeText(
    [
      p.code,
      p.name,
      p.category,
      (p.tags ?? []).map((t) => TAG_LABELS[t] ?? t).join(' '),
      p.desc,
      p.note,
      p.factory,
      p.packaging,
      ...(p.specLines ?? []),
    ].join(' '),
  );
  return hay.includes(normalizeText(q));
}

export function getCategories(products: CatalogProduct[]): string[] {
  const set = new Set(products.map((p) => p.category).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
}

export function getAllTags(products: CatalogProduct[]): string[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const t of p.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

export function filterAndSortProducts(
  products: CatalogProduct[],
  opts: {
    category: string;
    query: string;
    tags: Set<string>;
    showOos: boolean;
    sort: CatalogSort;
  },
): CatalogProduct[] {
  let list = products.slice();

  if (opts.category !== 'all') {
    list = list.filter((p) => p.category === opts.category);
  }
  if (!opts.showOos) {
    list = list.filter((p) => p.available !== false);
  }
  if (opts.tags.size > 0) {
    list = list.filter((p) => (p.tags ?? []).some((t) => opts.tags.has(t)));
  }
  if (opts.query) {
    list = list.filter((p) => productMatchesQuery(p, opts.query));
  }

  const byCodeAsc = (a: CatalogProduct, b: CatalogProduct) =>
    a.code.localeCompare(b.code, 'zh-Hant');
  const byCodeDesc = (a: CatalogProduct, b: CatalogProduct) =>
    b.code.localeCompare(a.code, 'zh-Hant');
  const byPopular = (a: CatalogProduct, b: CatalogProduct) =>
    (b.popularity ?? 0) - (a.popularity ?? 0);
  const byNewest = (a: CatalogProduct, b: CatalogProduct) =>
    (b.releaseTs ?? 0) - (a.releaseTs ?? 0);

  if (opts.sort === 'popular') list.sort(byPopular);
  else if (opts.sort === 'codeAsc') list.sort(byCodeAsc);
  else if (opts.sort === 'codeDesc') list.sort(byCodeDesc);
  else list.sort(byNewest);

  return list;
}

export function getProductPill(p: CatalogProduct): { text: string; cls: string } | null {
  if (p.available === false) return { text: '售罄', cls: 'oos' };
  const tags = p.tags ?? [];
  if (tags.includes('NEW')) return { text: '新品', cls: 'new' };
  if (tags.includes('HOT')) return { text: '熱門', cls: 'hot' };
  return null;
}

export function buildWhatsAppText(p: CatalogProduct): string {
  const priceStr =
    p.priceLines && p.priceLines.length > 0
      ? p.priceLines.join('\n')
      : p.price ?? '';
  return `我想訂購以下產品：\n產品：${p.name}\n編號：${p.code}\n價格：\n${priceStr}\n箱數：（請填寫）\n交貨期：（請填寫）`;
}

export function buildWhatsAppUrl(p: CatalogProduct, phone = '85294110350'): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppText(p))}`;
}
