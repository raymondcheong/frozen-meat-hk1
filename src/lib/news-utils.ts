import {
  localizeTitle,
  localizeSource,
  isTitleReadable,
  buildElderlyHeadline,
} from './overseas-zh-tw';
import { buildArticleSummaryFromSource } from './article-summary';

export type RegionTier = 'hk' | 'mainland' | 'asia' | 'overseas';
export type RegionFilter = 'all' | 'hk' | 'mainland' | 'overseas';

export interface NewsArticleKeyInfo {
  products: string[];
  regions: string[];
  impactLevel: string;
  impactDesc: string;
  priceChanges: Array<{
    from?: number;
    to?: number;
    value?: number;
    unit?: string;
    change?: number;
    changePercent?: string;
  }>;
  percentChanges: Array<{ percent: number; direction: string }>;
  futureOutlook: string;
  briefReason: string;
  hasTariff: boolean;
  hasLogistics: boolean;
  aiGenerated?: boolean;
}

export interface NewsArticleLike {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  category: string;
  keyInfo: NewsArticleKeyInfo;
  publishDate: string;
}

const MAINLAND_REGIONS = ['內地', '中國'];
const ASIA_REGIONS = ['台灣', '亞洲', '東南亞', '日本', '韓國'];

export function getRegionTier(regions: string[] = []): RegionTier {
  if (regions.includes('香港')) return 'hk';
  if (regions.some((r) => MAINLAND_REGIONS.includes(r))) return 'mainland';
  if (regions.some((r) => ASIA_REGIONS.includes(r))) return 'asia';
  return 'overseas';
}

export function getRegionTierLabel(tier: RegionTier): string {
  return { hk: '香港', mainland: '內地', asia: '亞太', overseas: '海外' }[tier];
}

export function isPoultryArticle(article: NewsArticleLike): boolean {
  return article.category === 'poultry';
}

export function isRelevantArticle(article: NewsArticleLike): boolean {
  if (isPoultryArticle(article)) return false;
  return ['meat', 'seafood', 'logistics'].includes(article.category);
}

export function articlePriorityScore(article: NewsArticleLike): number {
  const tier = getRegionTier(article.keyInfo?.regions);
  let score = { hk: 30, mainland: 20, asia: 10, overseas: 0 }[tier];

  const category = article.category;
  if (category === 'meat' || category === 'seafood') score += 5;
  else if (category === 'logistics') score += 2;

  const impact = { high: 3, medium: 2, low: 1 }[article.keyInfo?.impactLevel] || 0;
  score += impact;

  const published = new Date(article.publishDate).getTime();
  if (!Number.isNaN(published)) {
    const days = (Date.now() - published) / 86400000;
    if (days <= 1) score += 2;
    else if (days <= 7) score += 1;
  }

  if (article.id?.startsWith('fehd-')) score += 1000;

  return score;
}

export function sortNewsArticles<T extends NewsArticleLike>(articles: T[]): T[] {
  return [...articles].sort((a, b) => {
    const scoreDiff = articlePriorityScore(b) - articlePriorityScore(a);
    if (scoreDiff) return scoreDiff;
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });
}

export function matchesRegionFilter(article: NewsArticleLike, filter: RegionFilter): boolean {
  if (filter === 'all') return true;
  const tier = getRegionTier(article.keyInfo?.regions);
  if (filter === 'hk') return tier === 'hk';
  if (filter === 'mainland') return tier === 'mainland';
  return tier === 'asia' || tier === 'overseas';
}

export function countHkRelated(articles: NewsArticleLike[]): number {
  return articles.filter((a) => getRegionTier(a.keyInfo?.regions) === 'hk').length;
}

export function regionTagClassName(region: string): string {
  if (region === '香港') return 'text-[#D98236] font-semibold';
  if (MAINLAND_REGIONS.includes(region)) return 'text-[#B56A28] font-medium';
  return 'text-[#888888]';
}

export function categoryLabel(category: string): string {
  return (
    {
      meat: '肉類',
      seafood: '海產',
      logistics: '物流',
      poultry: '家禽',
    }[category] || '其他'
  );
}

export function categoryBadgeClass(category: string): string {
  if (category === 'meat') return 'bg-[#FFF8E7] text-[#E8A317]';
  if (category === 'seafood') return 'bg-[#FDF6EE] text-[#D98236]';
  return 'bg-[#E6F5EF] text-[#00875A]';
}

export function getArticleDisplay(article: NewsArticleLike): {
  headline: string;
  englishNote: string | null;
} {
  if (article.id?.startsWith('fehd-')) {
    return { headline: localizeTitle(article.title), englishNote: null };
  }

  // AI 已生成繁中標題，不再走標點替換以免 9.66 → 9，66
  if (article.id?.startsWith('ai-') || article.keyInfo?.aiGenerated) {
    return { headline: article.title.trim(), englishNote: null };
  }

  const polished = localizeTitle(article.title);
  const headline = isTitleReadable(polished) ? polished : buildElderlyHeadline(article);
  return { headline, englishNote: null };
}

function refineFehdSummary(article: NewsArticleLike): string {
  const reason = article.keyInfo.briefReason ?? '';
  const avg = reason.match(/平均價([\d,]+)元/);
  const high = reason.match(/最高價([\d,]+)元/);
  const supply = reason.match(/今日供應([\d,]+)頭/);
  const tomorrow = reason.match(/明日預計([\d,]+)頭/);
  const pc = article.keyInfo.priceChanges[0];
  const parts: string[] = [];

  if (avg) {
    let line = `均價 ${avg[1]} 元/擔`;
    if (pc?.changePercent) {
      const n = pc.changePercent.replace(/^[+-]/, '');
      line += pc.changePercent.startsWith('-') ? `（跌 ${n}%）` : `（升 ${n}%）`;
    }
    parts.push(line);
  } else if (high) {
    parts.push(`最高 ${high[1]} 元/擔`);
  }
  if (supply) parts.push(`今日 ${supply[1]} 頭`);
  if (tomorrow) parts.push(`明日 ${tomorrow[1]} 頭`);

  return parts.join(' · ') || buildArticleSummaryFromSource(article, 120);
}

/** 從原文提煉摘要，只陳述事實不作判斷 */
export function getArticleSummary(article: NewsArticleLike): string {
  if (article.id?.startsWith('fehd-')) {
    return refineFehdSummary(article);
  }

  if (article.id?.startsWith('ai-') || article.keyInfo?.aiGenerated) {
    const summary = (article.keyInfo.briefReason ?? '').trim();
    if (summary.length >= 8) return summary.endsWith('。') ? summary : `${summary}。`;
  }

  return buildArticleSummaryFromSource(article, 120);
}

export function getBriefReasonDisplay(article: NewsArticleLike): string {
  return getArticleSummary(article);
}

export function getSourceDisplay(source: string): string {
  return localizeSource(source);
}

export function tierBadgeClass(tier: RegionTier): string {
  if (tier === 'hk') return 'bg-[#FDF6EE] text-[#D98236]';
  if (tier === 'mainland') return 'bg-[#FFF8E7] text-[#B56A28]';
  return 'bg-[#F7F5F2] text-[#888888]';
}
