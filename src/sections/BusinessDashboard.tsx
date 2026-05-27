import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Scale,
  Package,
  Beef,
  Fish,
  Ship,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  sortNewsArticles,
  isRelevantArticle,
  getRegionTier,
  getRegionTierLabel,
  countHkRelated,
  categoryLabel,
  categoryBadgeClass,
  tierBadgeClass,
  getArticleDisplay,
  getArticleSummary,
  getSourceDisplay,
} from '../lib/news-utils';

gsap.registerPlugin(ScrollTrigger);

interface PriceChange {
  from?: number;
  to?: number;
  value?: number;
  unit: string;
  change?: number;
  changePercent?: string;
}

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  category: string;
  keyInfo: {
    products: string[];
    regions: string[];
    impactLevel: string;
    impactDesc: string;
    priceChanges: PriceChange[];
    percentChanges: Array<{ percent: number; direction: 'up' | 'down' }>;
    futureOutlook: string;
    briefReason: string;
    hasTariff: boolean;
    hasLogistics: boolean;
  };
  publishDate: string;
}

interface NewsData {
  generatedAt: string;
  summary: {
    totalArticles: number;
    highImpactCount: number;
    priceChangeCount: number;
    tariffRelatedCount: number;
    logisticsRelatedCount: number;
    hkRelatedCount?: number;
  };
  priorityArticles: NewsArticle[];
}

const CATEGORY_FILTERS = [
  { key: 'all', label: '全部', icon: Package },
  { key: 'meat', label: '肉類', icon: Beef },
  { key: 'seafood', label: '海產', icon: Fish },
  { key: 'logistics', label: '物流', icon: Ship },
];

export default function BusinessDashboard() {
  const sectionRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState('all');
  const [showTariff, setShowTariff] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    fetch('/data/news-articles.json?t=' + Date.now())
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: NewsData) => {
        setNewsData(d);
        setLastUpdate(new Date(d.generatedAt).toLocaleString('zh-HK'));
      })
      .catch(() => setError('無法加載最新新聞'))
      .finally(() => setIsLoading(false));
  }, []);

  const allRelevant = useMemo(
    () => (newsData?.priorityArticles || []).filter(isRelevantArticle),
    [newsData]
  );

  const hkCount = newsData?.summary?.hkRelatedCount ?? countHkRelated(allRelevant);

  const articles = useMemo(() => {
    const filtered = allRelevant.filter((a) => {
      if (filter !== 'all' && a.category !== filter) return false;
      if (showTariff && !a.keyInfo.hasTariff) return false;
      if (showLogistics && !a.keyInfo.hasLogistics) return false;
      return true;
    });
    return sortNewsArticles(filtered);
  }, [allRelevant, filter, showTariff, showLogistics]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.dashboard-card',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [filter, showTariff, showLogistics, articles.length]);

  const openLink = (url?: string) => url && window.open(url, '_blank', 'noopener,noreferrer');

  if (isLoading) {
    return (
      <section ref={sectionRef} className="py-16 text-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#D98236] mx-auto mb-4" />
        <p className="text-lg text-[#666666]">加載中...</p>
      </section>
    );
  }

  return (
    <section id="business-dashboard" ref={sectionRef} className="py-10 bg-white">
      <div className="nfh-container max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="nfh-section-title text-3xl sm:text-4xl">市場情報</h2>
            <p className="nfh-section-subtitle text-lg sm:text-xl mt-2">
              AI 聯網搜索總結，保留近 3 天
            </p>
          {error && <p className="text-base text-[#E8A317] mt-3 font-medium">{error}</p>}
          {lastUpdate && (
            <p className="text-base text-[#00875A] mt-2 font-medium">上次更新：{lastUpdate}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="nfh-card px-4 py-3 text-center min-w-[96px] flex-1 sm:flex-none">
            <p className="text-2xl font-bold text-[#D98236]">{hkCount}</p>
            <p className="text-sm text-[#666666] mt-1">香港相關</p>
          </div>
          <div className="nfh-card px-4 py-3 text-center min-w-[96px] flex-1 sm:flex-none">
            <p className="text-2xl font-bold text-[#00875A]">{newsData?.summary?.priceChangeCount || 0}</p>
            <p className="text-sm text-[#666666] mt-1">含價格數據</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`nfh-tab inline-flex items-center gap-2 text-base py-2.5 px-4 ${filter === c.key ? 'nfh-tab-active' : ''}`}
            >
              <c.icon className="w-5 h-5" />
              <span>{c.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowTariff(!showTariff)}
            className={`nfh-tab inline-flex items-center gap-2 text-base py-2.5 px-4 ${showTariff ? 'nfh-tab-active' : ''}`}
          >
            <Scale className="w-5 h-5" />
            <span>關稅</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLogistics(!showLogistics)}
            className={`nfh-tab inline-flex items-center gap-2 text-base py-2.5 px-4 ${showLogistics ? 'nfh-tab-active' : ''}`}
          >
            <Ship className="w-5 h-5" />
            <span>物流</span>
          </button>
        </div>

        <div className="grid gap-5">
          {articles.length === 0 ? (
            <div className="text-center py-16 nfh-card">
              <h3 className="text-xl text-[#1C1C1C] mb-2">暫無相關資訊</h3>
              <p className="text-lg text-[#666666]">請嘗試調整篩選</p>
            </div>
          ) : (
            articles.map((a) => {
              const tier = getRegionTier(a.keyInfo.regions);
              const tierLabel = getRegionTierLabel(tier);
              const { headline } = getArticleDisplay(a);
              const summary = getArticleSummary(a);
              const sourceLabel = getSourceDisplay(a.source);

              return (
                <article
                  key={a.id}
                  className="dashboard-card nfh-card-accent p-5 sm:p-6 border-2 border-[#E8E4DE]"
                >
                  <p className="text-base font-semibold text-[#555555] mb-3 flex flex-wrap items-center gap-2">
                    <span className={`nfh-badge text-sm ${tierBadgeClass(tier)}`}>{tierLabel}</span>
                    <span className={`nfh-badge text-sm ${categoryBadgeClass(a.category)}`}>
                      {categoryLabel(a.category)}
                    </span>
                    {a.keyInfo.hasTariff && (
                      <span className="nfh-badge text-sm bg-[#FFF8E7] text-[#E8A317]">關稅</span>
                    )}
                    {a.keyInfo.hasLogistics && (
                      <span className="nfh-badge text-sm bg-[#E6F5EF] text-[#00875A]">物流</span>
                    )}
                  </p>

                  <h3 className="text-2xl sm:text-[1.65rem] font-bold text-[#1C1C1C] leading-snug mb-4">
                    {headline}
                  </h3>

                  <div className="bg-[#F7F5F2] rounded-xl px-4 py-4 mb-4 border border-[#E8E4DE]">
                    <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-1">
                      原文摘要
                    </p>
                    <p className="text-xl sm:text-2xl text-[#1C1C1C] leading-relaxed font-medium">
                      {summary}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-base text-[#666666]">
                      {sourceLabel} · {a.publishDate}
                    </p>
                    <button
                      type="button"
                      onClick={() => openLink(a.sourceUrl)}
                      className="nfh-btn-primary w-full sm:w-auto text-base py-3 px-5 inline-flex items-center justify-center gap-2"
                    >
                      查看原文
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <p className="mt-8 text-center text-base text-[#555555] leading-relaxed px-2">
          香港活豬數據來自食環署；其餘資訊由AI聯網搜索並整理，僅供參考。
        </p>
      </div>
    </section>
  );
}
