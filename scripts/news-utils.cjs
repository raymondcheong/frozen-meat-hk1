/**
 * 市場情報工具 — 從 FEHD 數據生成置頂情報，合併 RSS 新聞
 */
const fs = require('fs');
const path = require('path');
const { calcChange } = require('./market-utils.cjs');

const FEHD_URL = 'https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html';
const MARKET_DATA_PATH = path.join(__dirname, '../public/data/market-data.json');
const NEWS_DATA_PATH = path.join(__dirname, '../public/data/news-articles.json');

function formatPercent(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}`;
}

function supplyTrendLabel(current, previous) {
  if (previous == null || previous === 0) return '供應更新';
  const { changePercent } = calcChange(current, previous);
  if (changePercent <= -3) return '供應續降';
  if (changePercent >= 3) return '供應回升';
  return '供應持平';
}

function detectOutlook(avgChange, supplyChange) {
  if (avgChange < -1 || supplyChange > 3) return 'bearish';
  if (avgChange > 1) return 'bullish';
  return 'neutral';
}

function detectImpactLevel(avgChangePercent, supplyChangePercent) {
  if (Math.abs(avgChangePercent) >= 5 || Math.abs(supplyChangePercent) >= 10) return 'high';
  if (Math.abs(avgChangePercent) >= 1 || Math.abs(supplyChangePercent) >= 3) return 'medium';
  return 'low';
}

function impactDesc(level) {
  return { high: '重大影響', medium: '中等影響', low: '輕微影響' }[level] || '中等影響';
}

/**
 * 從 market-data.json 的 fehd / fehdPrevious 生成置頂情報卡片
 */
function fehdToNewsArticle(fehd, previousFehd) {
  if (!fehd?.todayPrices?.average && !fehd?.todayPrices?.highest) {
    return null;
  }

  const { todayPrices, todaySupply, tomorrowForecast, dataDate } = fehd;
  const prevPrices = previousFehd?.todayPrices || {};
  const prevSupply = previousFehd?.todaySupply || {};

  const avgResult = calcChange(todayPrices.average, prevPrices.average);
  const supplyResult = calcChange(todaySupply.total, prevSupply.total);
  const supplyTrend = supplyTrendLabel(todaySupply.total, prevSupply.total);
  const impactLevel = detectImpactLevel(avgResult.changePercent, supplyResult.changePercent);
  const futureOutlook = detectOutlook(avgResult.change, supplyResult.changePercent);

  const title = `港活豬拍賣價：最高${todayPrices.highest.toLocaleString()}/平均${todayPrices.average}元/擔 ${supplyTrend}`;

  const priceChanges = [];
  const percentChanges = [];

  if (prevPrices.average && todayPrices.average) {
    priceChanges.push({
      from: prevPrices.average,
      to: todayPrices.average,
      unit: 'HKD/擔',
      change: avgResult.change,
      changePercent: formatPercent(avgResult.changePercent),
    });
    if (avgResult.change !== 0) {
      percentChanges.push({
        percent: Math.round(Math.abs(avgResult.changePercent) * 10) / 10,
        direction: avgResult.change > 0 ? 'up' : 'down',
      });
    }
  }

  const briefReason = [
    `最高價${todayPrices.highest.toLocaleString()}元，平均價${todayPrices.average}元，最低價${todayPrices.lowest}元`,
    `今日供應${todaySupply.total.toLocaleString()}頭（內地${todaySupply.mainland.toLocaleString()}/本地${todaySupply.local}）`,
    `明日預計${tomorrowForecast.total.toLocaleString()}頭（內地${tomorrowForecast.mainland.toLocaleString()}/本地${tomorrowForecast.local}）`,
  ].join('；');

  return {
    id: `fehd-${dataDate}`,
    title,
    source: 'FEHD官方',
    sourceUrl: FEHD_URL,
    category: 'meat',
    keyInfo: {
      products: ['活豬', '豬肉'],
      regions: ['香港', '內地'],
      impactLevel,
      impactDesc: impactDesc(impactLevel),
      priceChanges,
      percentChanges,
      futureOutlook,
      briefReason,
      hasTariff: false,
      hasLogistics: false,
    },
    publishDate: dataDate,
  };
}

function loadMarketData() {
  try {
    return JSON.parse(fs.readFileSync(MARKET_DATA_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function loadExistingNews() {
  try {
    return JSON.parse(fs.readFileSync(NEWS_DATA_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function isFehdArticle(article) {
  return article?.id?.startsWith('fehd-') || article?.source === 'FEHD官方';
}

function isPoultryArticle(article) {
  return article?.category === 'poultry';
}

function getRegionTier(regions = []) {
  if (regions.includes('香港')) return 'hk';
  if (regions.some((r) => ['內地', '中國'].includes(r))) return 'mainland';
  if (regions.some((r) => ['台灣', '亞洲', '東南亞', '日本', '韓國'].includes(r))) return 'asia';
  return 'overseas';
}

function articlePriorityScore(article) {
  const tier = getRegionTier(article.keyInfo?.regions);
  let score = { hk: 30, mainland: 20, asia: 10, overseas: 0 }[tier];

  if (article.keyInfo?.aiGenerated) score += 50;

  const category = article.category;
  if (category === 'meat' || category === 'seafood') score += 5;
  else if (category === 'logistics') score += 2;

  score += { high: 3, medium: 2, low: 1 }[article.keyInfo?.impactLevel] || 0;

  const published = new Date(article.publishDate).getTime();
  if (!Number.isNaN(published)) {
    const days = (Date.now() - published) / 86400000;
    if (days <= 1) score += 2;
    else if (days <= 7) score += 1;
  }

  if (article.id?.startsWith('fehd-')) score += 1000;

  return score;
}

function sortArticles(articles) {
  return [...articles]
    .filter((a) => !isPoultryArticle(a))
    .sort((a, b) => {
      const scoreDiff = articlePriorityScore(b) - articlePriorityScore(a);
      if (scoreDiff) return scoreDiff;
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
}

function dedupeArticles(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const key = a.sourceUrl || a.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildFehdArticleFromMarketData() {
  const marketData = loadMarketData();
  if (!marketData?.fehd) {
    console.warn('[FEHD情報] market-data.json 中無 fehd 數據');
    return null;
  }
  const article = fehdToNewsArticle(marketData.fehd, marketData.fehdPrevious || null);
  if (article) {
    console.log(`[FEHD情報] 已生成置頂情報: ${article.title}`);
  }
  return article;
}

function dateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function filterRetentionDays(articles, days = 3) {
  const cutoff = dateDaysAgo(days);
  return articles.filter((a) => {
    if (isFehdArticle(a)) return true;
    const pub = String(a.publishDate || '').slice(0, 10);
    return pub && pub >= cutoff;
  });
}

/**
 * 合併 FEHD 置頂 + 千問 AI 搜索（保留 N 天、最多 limit 條）
 */
function mergeAiNewsArticles(aiArticles, options = {}) {
  const limit = options.limit ?? 10;
  const retentionDays = options.retentionDays ?? 3;
  const supplement = options.supplement || [];

  const fehdArticle = buildFehdArticleFromMarketData();
  const aiList = (aiArticles || []).filter((a) => !isFehdArticle(a) && !isPoultryArticle(a));
  const rssList = supplement.filter((a) => !isFehdArticle(a) && !isPoultryArticle(a) && !a.keyInfo?.aiGenerated);

  let others = dedupeArticles([...aiList, ...rssList]);
  others = sortArticles(others).slice(0, limit);

  let merged = fehdArticle ? [fehdArticle, ...others] : others;
  merged = filterRetentionDays(merged, retentionDays);
  merged = sortArticles(merged);
  return dedupeArticles(merged);
}

/**
 * 合併 FEHD 置頂情報 + RSS/既有新聞
 * @param {Array} rssArticles - 本次 RSS 抓取結果
 * @param {Array} fallbackArticles - RSS 全失敗時的備用列表
 */
function mergeNewsArticles(rssArticles, fallbackArticles = []) {
  const fehdArticle = buildFehdArticleFromMarketData();
  const existing = loadExistingNews();
  const existingOthers = (existing?.priorityArticles || []).filter((a) => !isFehdArticle(a));

  let otherArticles = rssArticles.length > 0 ? rssArticles : existingOthers;
  if (otherArticles.length === 0) {
    otherArticles = fallbackArticles.filter((a) => !isFehdArticle(a));
  }

  otherArticles = dedupeArticles(otherArticles.filter((a) => !isFehdArticle(a) && !isPoultryArticle(a)));
  otherArticles = sortArticles(otherArticles);

  const maxOthers = fehdArticle ? 14 : 15;
  let merged = fehdArticle
    ? [fehdArticle, ...otherArticles.slice(0, maxOthers)]
    : otherArticles.slice(0, 15);

  merged = sortArticles(merged);

  return dedupeArticles(merged);
}

function buildNewsOutput(articles) {
  const highImpactCount = articles.filter((a) => a.keyInfo.impactLevel === 'high').length;
  const priceChangeCount = articles.filter(
    (a) => a.keyInfo.priceChanges.length > 0 || a.keyInfo.percentChanges.length > 0
  ).length;
  const tariffRelatedCount = articles.filter((a) => a.keyInfo.hasTariff).length;
  const logisticsRelatedCount = articles.filter((a) => a.keyInfo.hasLogistics).length;

  const hkRelatedCount = articles.filter((a) => getRegionTier(a.keyInfo?.regions) === 'hk').length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalArticles: articles.length,
      highImpactCount,
      priceChangeCount,
      tariffRelatedCount,
      logisticsRelatedCount,
      hkRelatedCount,
    },
    priorityArticles: articles,
    tariffUpdates: articles.filter((a) => a.keyInfo.hasTariff).map((a) => ({
      id: a.id,
      title: a.title,
      tariffKeywords: [{ en: 'tariff', cn: '關稅', severity: a.keyInfo.impactLevel }],
      countries: a.keyInfo.regions,
      source: a.source,
      sourceUrl: a.sourceUrl,
    })),
    logisticsUpdates: articles.filter((a) => a.keyInfo.hasLogistics).map((a) => ({
      id: a.id,
      title: a.title,
      logisticsKeywords: [{ en: 'shipping', cn: '海運', severity: a.keyInfo.impactLevel }],
      regions: a.keyInfo.regions,
      impact: a.keyInfo.briefReason,
      source: a.source,
      sourceUrl: a.sourceUrl,
    })),
  };
}

module.exports = {
  fehdToNewsArticle,
  mergeNewsArticles,
  mergeAiNewsArticles,
  buildNewsOutput,
  isFehdArticle,
  sortArticles,
  filterRetentionDays,
};
