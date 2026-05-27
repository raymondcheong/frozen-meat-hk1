/**
 * 抓取 FEHD 近月每日活豬供應及拍賣價，寫入 market-data.json 的 fehdHistory
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const {
  parseDailyMonthlyPage,
  mergeHistoryRecords,
  lastNDays,
} = require('./fehd-history-utils.cjs');

const BASE = 'https://www.fehd.gov.hk/tc_chi/sh/data/';
const AVG_URL = `${BASE}supply_avg_tw.html`;
const JSON_PATH = path.join(__dirname, '../public/data/market-data.json');
const HISTORY_DAYS = 30;

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'zh-HK,zh-TW;q=0.9',
    },
  });
  return response.data;
}

async function getMonthlyPageUrls() {
  const html = await fetchHtml(AVG_URL);
  const $ = cheerio.load(html);
  const urls = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (/supply_daily_avg_tw_\d+\.html/.test(href)) {
      const full = href.startsWith('http') ? href : `${BASE}${href.replace(/^\.\//, '')}`;
      urls.push(full);
    }
  });
  return urls;
}

function fehdSnapshotToHistory(fehd) {
  if (!fehd?.dataDate) return null;
  return {
    date: fehd.dataDate,
    supply: {
      mainland: fehd.todaySupply?.mainland ?? 0,
      local: fehd.todaySupply?.local ?? 0,
      total: fehd.todaySupply?.total ?? 0,
    },
    prices: {
      highest: fehd.todayPrices?.highest ?? 0,
      lowest: fehd.todayPrices?.lowest ?? 0,
      average: fehd.todayPrices?.average ?? 0,
    },
  };
}

function normalizeRecord(row) {
  const total =
    row.supply.total ||
    (row.supply.mainland || 0) + (row.supply.local || 0);
  return {
    ...row,
    supply: { ...row.supply, total },
  };
}

async function fetchFehdHistory() {
  console.log(`[${new Date().toISOString()}] 開始抓取 FEHD 近 ${HISTORY_DAYS} 日歷史...`);

  const monthlyUrls = await getMonthlyPageUrls();
  const recentUrls = monthlyUrls.slice(-3);
  console.log(`將抓取 ${recentUrls.length} 個月份頁面`);

  let merged = [];
  for (const url of recentUrls) {
    try {
      const html = await fetchHtml(url);
      const records = parseDailyMonthlyPage(html).map(normalizeRecord);
      merged = mergeHistoryRecords(merged, records);
      console.log(`  ✓ ${url.split('/').pop()} → ${records.length} 日`);
    } catch (err) {
      console.warn(`  ✗ ${url}: ${err.message}`);
    }
  }

  return lastNDays(merged, HISTORY_DAYS);
}

function updateMarketJson(history, fehd) {
  let json = {};
  try {
    json = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  } catch {
    json = {};
  }

  const existing = json.fehdHistory || [];
  let merged = mergeHistoryRecords(existing, history);

  const todayRow = fehdSnapshotToHistory(fehd || json.fehd);
  if (todayRow) {
    merged = mergeHistoryRecords(merged, [normalizeRecord(todayRow)]);
  }

  json.fehdHistory = lastNDays(merged, HISTORY_DAYS);
  json.fehdHistoryUpdatedAt = new Date().toISOString();

  fs.writeFileSync(JSON_PATH, JSON.stringify(json, null, 2));
  console.log(`✅ fehdHistory 已更新：${merged.length} 日 → ${JSON_PATH}`);
  return merged;
}

async function main() {
  const history = await fetchFehdHistory();
  let fehd = null;
  try {
    const json = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    fehd = json.fehd;
  } catch {
    /* ignore */
  }
  updateMarketJson(history, fehd);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ 歷史數據抓取失敗:', err.message);
    process.exit(1);
  });
}

module.exports = { fetchFehdHistory, updateMarketJson };
