/**
 * 市場情報 · 千問聯網搜索 + AI 繁中摘要
 * 需環境變量: DASHSCOPE_API_KEY 或 QWEN_API_KEY
 *
 * 用法: node scripts/fetch-ai-news.cjs
 * 可選: QWEN_MODEL=qwen-plus  AI_NEWS_LIMIT=10  AI_NEWS_RETENTION_DAYS=3
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { qwenChatWithSearch, getApiKey } = require('./qwen-client.cjs');
const {
  mergeAiNewsArticles,
  buildNewsOutput,
} = require('./news-utils.cjs');

const NEWS_PATH = path.join(__dirname, '../public/data/news-articles.json');
const LIMIT = parseInt(process.env.AI_NEWS_LIMIT || '10', 10);
const RETENTION_DAYS = parseInt(process.env.AI_NEWS_RETENTION_DAYS || '3', 10);

function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  const examplePath = path.join(__dirname, '../.env.example');
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      console.warn('[配置] 未找到 .env，請複製 .env.example 為 .env 並填入 DASHSCOPE_API_KEY');
    }
    return;
  }
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function dateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const SEARCH_TOPICS = [
  { label: '香港供港凍肉海產', keywords: '香港 供港 凍肉 凍品 海產 進口 批發' },
  { label: '內地豬肉行情', keywords: '內地 生豬 豬肉 屠宰 價格 供應' },
  { label: '牛肉羊肉貿易', keywords: '牛肉 羊肉 進口 澳洲 巴西 關稅' },
  { label: '海產水產', keywords: '三文魚 蝦 海產 水產 挪威 智利 出口' },
  { label: '冷链物流關稅', keywords: '冷链 凍柜 海運 物流 關稅 貿易政策 肉類' },
];

const OVERSEAS_SEARCH_TOPICS = [
  { label: '澳洲牛肉', keywords: 'Australia beef cattle steer prices market auction' },
  { label: '挪威三文魚', keywords: 'Norway salmon aquaculture export price' },
  { label: '美國肉品出口', keywords: 'US beef pork meat export trade tariff' },
  { label: '全球海產貿易', keywords: 'seafood shrimp salmon trade import export' },
  { label: '智利海產', keywords: 'Chile salmon seafood export Asia' },
];

const ENHANCE_SYSTEM_PROMPT = `你是五豐行凍肉海產資訊平台的編輯助手，服務香港凍品、海產進口商。
請聯網搜索指定新聞原文，用香港繁體中文整理標題與摘要，用詞適合中老年從業者。
只陳述事實，禁止「睇升/睇跌/影響大/建議」等主觀判斷。輸出必須是合法 JSON。`;

function buildEnhancePrompt(article) {
  const excerpt = String(article.keyInfo?.briefReason || '').slice(0, 800);
  const url = String(article.sourceUrl || '').trim();
  const title = String(article.title || '').trim();
  const pub = String(article.publishDate || '').slice(0, 10);

  return `請聯網搜索並閱讀以下海外凍肉/海產行業新聞，整理成繁體中文：

原文連結：${url}
英文標題：${title}
${excerpt ? `原文節選：${excerpt}` : ''}
發布日期：${pub}

要求：
- title：繁體中文標題，保留關鍵數字、地區、品種
- summary：2–3 句繁體摘要，只陳述事實
- sourceUrl 必須為 ${url}
- publishDate 用 ${pub}
- category：meat / seafood / logistics

只輸出 JSON：
{"articles":[{"title","summary","sourceName","sourceUrl","publishDate","category","products","regions","hasTariff","hasLogistics"}]}`;
}

function parseSingleAiArticle(content, fallback = {}, index = 0) {
  const parsed = extractJson(content);
  const item = Array.isArray(parsed?.articles) ? parsed.articles[0] : parsed?.title ? parsed : null;
  if (!item?.title || !item?.summary) return null;

  return toNewsArticle(
    {
      ...item,
      sourceUrl: fallback.sourceUrl || item.sourceUrl,
      publishDate: fallback.publishDate || item.publishDate,
      sourceName: fallback.source || item.sourceName,
      category: item.category || fallback.category,
      products: item.products || fallback.keyInfo?.products,
      regions: item.regions || fallback.keyInfo?.regions,
      hasTariff: item.hasTariff ?? fallback.keyInfo?.hasTariff,
      hasLogistics: item.hasLogistics ?? fallback.keyInfo?.hasLogistics,
    },
    index
  );
}

async function aiEnhanceArticle(article, index) {
  const { content } = await qwenChatWithSearch(
    [
      { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
      { role: 'user', content: buildEnhancePrompt(article) },
    ],
    { forcedSearch: true, searchStrategy: 'max', timeout: 120000 }
  );
  return parseSingleAiArticle(content, article, index);
}

async function aiEnhanceRssBatch(rssArticles, need) {
  const results = [];
  for (let i = 0; i < rssArticles.length && results.length < need; i++) {
    const raw = rssArticles[i];
    const label = String(raw.title || raw.sourceUrl || '').slice(0, 48);
    try {
      console.log(`[千問] AI 整理：${label}…`);
      const enhanced = await aiEnhanceArticle(raw, i);
      if (enhanced) {
        results.push(enhanced);
        console.log(`[千問]   → ${enhanced.title.slice(0, 40)}`);
      } else {
        console.warn(`[千問]   → 解析失敗，略過`);
      }
    } catch (err) {
      console.warn(`[千問]   → 失敗: ${err.message}`);
    }
    if (i < rssArticles.length - 1 && results.length < need) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return results;
}

async function collectFromTopics(topics, searchDays, collected, seen) {
  for (const topic of topics) {
    if (collected.length >= LIMIT) break;
    try {
      console.log(`[千問] 搜索：${topic.label}…`);
      const batch = await fetchTopicArticles(topic, searchDays);
      for (const article of batch) {
        const key = article.sourceUrl || article.title;
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push(article);
        if (collected.length >= LIMIT) break;
      }
      console.log(`[千問]   → ${batch.length} 條（累計 ${collected.length}）`);
    } catch (err) {
      console.warn(`[千問]   → 失敗: ${err.message}`);
    }
  }
}

function buildTopicPrompt(topic, searchDays) {
  const today = new Date().toISOString().split('T')[0];
  const since = dateDaysAgo(searchDays);
  const perTopic = Math.max(2, Math.ceil(LIMIT / SEARCH_TOPICS.length));

  return `今天是 ${today}。請聯網搜索「${topic.keywords}」相關的**真實新聞**（${since} 至 ${today}，最近 ${searchDays} 天內）。

主題：${topic.label}
要求：最多 ${perTopic} 條；每條含可訪問 URL；繁體中文；只陳述事實；不要雞肉為主。
publishDate 格式 YYYY-MM-DD，必須在 ${since} 至 ${today}。

只輸出 JSON：{"articles":[{"title","summary","sourceName","sourceUrl","publishDate","category","products","regions","hasTariff","hasLogistics"}]}`;
}

function buildSearchPrompt(options = {}) {
  const today = new Date().toISOString().split('T')[0];
  const searchDays = options.searchDays || Math.max(RETENTION_DAYS, 7);
  const since = dateDaysAgo(searchDays);

  return `今天是 ${today}。請使用聯網搜索，找出 ${since} 至 ${today} 期間（最近 ${searchDays} 天內）與以下主題相關的**真實新聞或行業報道**：

1. 香港凍肉、凍品、海產進口與批發
2. 活豬、豬肉、牛肉、羊肉、禽肉
3. 三文魚、蝦、海產、水產
4. 冷链物流、海運凍柜、關稅/貿易政策（若與肉類海產相關）

要求：
- 最多 ${LIMIT} 條，每條必須有**可訪問的原文 URL**
- 優先：香港、內地、澳洲、挪威、智利、美國等與進口相關來源
- 不要雞肉為主的新聞
- **只陳述事實**：禁止「睇升/睇跌/影響大/建議」等主觀判斷
- 標題與摘要一律用**香港繁體中文**，用詞適合中老年凍品從業者
- 摘要 2–3 句，保留關鍵數字、地區、品種
- publishDate 必須在 ${since} 至 ${today} 之間，格式 YYYY-MM-DD
- 若搜尋結果不足 ${LIMIT} 條，請分多次搜索（香港供港、內地豬價、澳洲牛肉、挪威三文魚、海運關稅等關鍵詞）後合併

請**只輸出 JSON**，不要 markdown，格式如下：
{
  "articles": [
    {
      "title": "繁體標題",
      "summary": "繁體摘要",
      "sourceName": "來源網站名稱",
      "sourceUrl": "https://原文連結",
      "publishDate": "YYYY-MM-DD",
      "category": "meat 或 seafood 或 logistics",
      "products": ["豬肉"],
      "regions": ["澳洲"],
      "hasTariff": false,
      "hasLogistics": false
    }
  ]
}`;
}

const SYSTEM_PROMPT = `你是五豐行凍肉海產資訊平台的編輯助手，服務香港凍品、海產進口商。
你的任務是聯網搜索最新行業資訊，用香港繁體中文整理成客觀、易讀的新聞摘要。
禁止編造 URL 或日期；若搜不到足夠新聞，返回較少條目即可。
輸出必須是合法 JSON。`;

function extractJson(text) {
  const raw = String(text).trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1));
  }
  return JSON.parse(candidate);
}

function hashId(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 10);
}

function normalizeCategory(cat) {
  const c = String(cat || '').toLowerCase();
  if (c.includes('sea') || c.includes('fish') || c.includes('蝦') || c.includes('產')) return 'seafood';
  if (c.includes('log') || c.includes('ship') || c.includes('運')) return 'logistics';
  return 'meat';
}

function toNewsArticle(item, index) {
  const url = String(item.sourceUrl || '').trim();
  const publishDate = String(item.publishDate || '').slice(0, 10);
  const title = String(item.title || '').trim();
  const summary = String(item.summary || '').trim();

  if (!title || !summary || !url.startsWith('http')) return null;

  return {
    id: `ai-${hashId(url)}-${index}`,
    title,
    source: String(item.sourceName || '聯網搜索').trim(),
    sourceUrl: url,
    category: normalizeCategory(item.category),
    keyInfo: {
      products: Array.isArray(item.products) ? item.products.filter(Boolean) : ['肉類'],
      regions: Array.isArray(item.regions) ? item.regions.filter(Boolean) : ['海外'],
      impactLevel: 'low',
      impactDesc: '',
      priceChanges: [],
      percentChanges: [],
      futureOutlook: 'neutral',
      briefReason: summary,
      hasTariff: Boolean(item.hasTariff),
      hasLogistics: Boolean(item.hasLogistics),
      aiGenerated: true,
    },
    publishDate: publishDate || new Date().toISOString().split('T')[0],
  };
}

function parseAiArticles(content, options = {}) {
  const logFilter = options.logFilter !== false;
  const retentionDays = options.retentionDays ?? RETENTION_DAYS;
  const parsed = extractJson(content);
  const list = Array.isArray(parsed?.articles) ? parsed.articles : [];
  const since = dateDaysAgo(retentionDays);
  const today = new Date().toISOString().split('T')[0];

  const articles = [];
  let skippedInvalid = 0;
  let skippedDate = 0;

  for (let i = 0; i < list.length && articles.length < LIMIT; i++) {
    const item = list[i];
    const url = String(item?.sourceUrl || '').trim();
    const title = String(item?.title || '').trim();
    const summary = String(item?.summary || '').trim();
    let publishDate = String(item?.publishDate || '').slice(0, 10);

    if (!title || !summary || !url.startsWith('http')) {
      skippedInvalid++;
      continue;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(publishDate)) {
      publishDate = today;
    }
    if (publishDate < since || publishDate > today) {
      skippedDate++;
      continue;
    }

    const article = toNewsArticle({ ...item, publishDate }, i);
    if (article) articles.push(article);
  }

  if (logFilter && list.length > 0 && articles.length === 0) {
    console.warn(
      `[千問] 返回 ${list.length} 條，但全部被過濾（無效 ${skippedInvalid} · 日期 ${skippedDate} · 保留 ${since}～${today}）`
    );
  } else if (logFilter && (skippedInvalid > 0 || skippedDate > 0)) {
    console.log(`[千問] 過濾：無效 ${skippedInvalid} · 日期 ${skippedDate}`);
  }

  return articles;
}

async function fetchTopicArticles(topic, searchDays) {
  const { content } = await qwenChatWithSearch(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildTopicPrompt(topic, searchDays) },
    ],
    { forcedSearch: true, searchStrategy: 'max', timeout: 120000 }
  );
  return parseAiArticles(content, { logFilter: false, retentionDays: RETENTION_DAYS });
}

async function fetchAiNewsArticles() {
  console.log(`[千問] 模型: ${process.env.QWEN_MODEL || 'qwen-plus'} · 聯網搜索最近 ${RETENTION_DAYS} 天 · 最多 ${LIMIT} 條`);

  const searchDays = Math.max(RETENTION_DAYS, 7);
  const collected = [];
  const seen = new Set();

  await collectFromTopics(SEARCH_TOPICS, searchDays, collected, seen);

  if (collected.length < LIMIT) {
    console.log(`[千問] 海外專題搜索（補足 ${LIMIT - collected.length} 條）…`);
    await collectFromTopics(OVERSEAS_SEARCH_TOPICS, Math.max(searchDays, 14), collected, seen);
  }

  if (collected.length === 0) {
    console.warn('[千問] 分主題搜索無結果，嘗試綜合搜索…');
    const requestOptions = { forcedSearch: true, searchStrategy: 'max', timeout: 180000 };
    for (let attempt = 1; attempt <= 2; attempt++) {
      const userPrompt =
        attempt === 1
          ? buildSearchPrompt()
          : buildSearchPrompt({ searchDays: 14 }) +
            '\n\n上一輪未找到足夠新聞，請擴大搜索範圍至 14 天，務必返回至少 5 條有效 JSON。';

      const result = await qwenChatWithSearch(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        requestOptions
      );
      const articles = parseAiArticles(result.content, { logFilter: attempt === 2 });
      for (const article of articles) {
        const key = article.sourceUrl || article.title;
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push(article);
      }
      if (collected.length > 0) break;
      if (attempt === 1) {
        console.warn('[千問] 綜合搜索無結果，10 秒後重試…');
        await new Promise((r) => setTimeout(r, 10000));
      }
    }
  }

  console.log(`[千問] 共解析到 ${collected.length} 條有效資訊`);
  return collected.slice(0, LIMIT);
}

async function supplementWithAiEnhance(aiArticles) {
  const need = LIMIT - aiArticles.length;
  if (need <= 0) return [];

  console.log(`[千問] 聯網搜索 ${aiArticles.length} 條，RSS 取稿 + AI 整理 ${need} 條…`);
  try {
    const { scrapeRssArticles } = require('./scrape-news.cjs');
    const rss = await scrapeRssArticles();
    const aiUrls = new Set(aiArticles.map((a) => a.sourceUrl || a.title));
    const candidates = rss.filter((a) => !aiUrls.has(a.sourceUrl || a.title));
    const enhanced = await aiEnhanceRssBatch(candidates, need);
    console.log(`[千問] AI 整理完成 ${enhanced.length} 條`);
    return enhanced;
  } catch (err) {
    console.warn(`[千問] AI 整理失敗: ${err.message}`);
    return [];
  }
}

async function writeAiNewsOutput(aiArticles, supplement, metaExtra = {}) {
  const allAi = [...aiArticles, ...supplement];
  const merged = mergeAiNewsArticles(allAi, {
    limit: LIMIT,
    retentionDays: RETENTION_DAYS,
  });
  const output = buildNewsOutput(merged);

  output.meta = {
    source: supplement.length ? 'qwen-web-search+ai-enhance' : 'qwen-web-search',
    model: process.env.QWEN_MODEL || 'qwen-plus',
    retentionDays: RETENTION_DAYS,
    aiArticleCount: allAi.length,
    aiEnhanceCount: supplement.length,
    ...metaExtra,
  };

  const dir = path.dirname(NEWS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(NEWS_PATH, JSON.stringify(output, null, 2));

  console.log(`\n✅ 已寫入 ${NEWS_PATH}`);
  console.log(
    `📊 共 ${output.summary.totalArticles} 條（含 FEHD 置頂）· AI ${allAi.length} 條` +
      (supplement.length ? ` · 含 ${supplement.length} 條 RSS→AI 整理` : '') +
      ` · 保留 ${RETENTION_DAYS} 天內`
  );
}

async function fallbackWithAiEnhance() {
  console.warn('[備用] 千問搜索無結果，RSS 取稿 + AI 聯網整理…');
  try {
    const { scrapeRssArticles } = require('./scrape-news.cjs');
    const rss = await scrapeRssArticles();
    const enhanced = await aiEnhanceRssBatch(rss, LIMIT);
    if (enhanced.length === 0) {
      console.error('[備用] AI 整理亦無結果，請檢查 API Key 或稍後重試');
      return;
    }
    await writeAiNewsOutput([], enhanced);
  } catch (err) {
    console.error(`[備用] 失敗: ${err.message}`);
  }
}

async function main() {
  loadEnvFile();
  console.log(`[${new Date().toISOString()}] 開始 AI 市場情報更新…\n`);

  let aiArticles = [];

  if (getApiKey()) {
    try {
      aiArticles = await fetchAiNewsArticles();
    } catch (err) {
      console.error(`[千問] 失敗: ${err.message}`);
    }
  } else {
    console.warn('[千問] 未配置 API Key，跳過 AI 搜索');
  }

  if (aiArticles.length === 0) {
    await fallbackWithAiEnhance();
    return;
  }

  const supplement = await supplementWithAiEnhance(aiArticles);
  await writeAiNewsOutput(aiArticles, supplement);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ AI 情報更新失敗:', err.message);
    process.exit(1);
  });
}

module.exports = { fetchAiNewsArticles, parseAiArticles, loadEnvFile };
