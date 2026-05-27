/**
 * 國際期貨 CME + 海產指數自動更新
 * - CME：Stooq 延遲報價（LE/GF/HE），LHI/PCI 按與 HE 歷史比例推算
 * - 海產：FRED IMF 全球魚價/蝦價（需 FRED_API_KEY），其餘按基準指數同比推算
 *
 * 用法: node scripts/fetch-international-market.cjs
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { calcChange } = require('./market-utils.cjs');

const JSON_PATH = path.join(__dirname, '../public/data/market-data.json');

function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
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
const STOOQ_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; NgFungData/1.0)' };

const CME_STOOQ = [
  { id: 'LE', name: '活牛期貨', nameEn: 'Live Cattle Futures', stooq: 'le.f', unit: 'USD/cwt' },
  { id: 'GF', name: '育肥牛期貨', nameEn: 'Feeder Cattle Futures', stooq: 'gf.f', unit: 'USD/cwt' },
  { id: 'HE', name: '瘦肉豬期貨', nameEn: 'Lean Hog Futures', stooq: 'he.f', unit: 'USD/cwt' },
];

const CME_DERIVED = [
  {
    id: 'LHI',
    name: '瘦肉豬指數',
    nameEn: 'Lean Hog Index',
    unit: 'USD/cwt',
    baseId: 'HE',
    fallbackRatio: 0.893,
  },
  {
    id: 'PCI',
    name: '豬肉切塊指數',
    nameEn: 'Pork Cutout Index',
    unit: 'USD/cwt',
    baseId: 'HE',
    fallbackRatio: 0.971,
  },
];

const SEAFOOD_FRED = [
  {
    id: 'fish-global',
    seriesId: 'PSALMUSDM',
    name: '全球魚類價格',
    nameEn: 'Global Fish Price',
    unit: 'USD/kg',
    source: 'IMF/FRED',
  },
  {
    id: 'shrimp-ucn',
    seriesId: 'PSHRIUSDM',
    name: '全球蝦價格指數',
    nameEn: 'Global Shrimp Index',
    unit: 'USD/kg',
    source: 'IMF/FRED',
  },
];

/** 無獨立 FRED 序列時，按基準項目的漲跌幅同步更新 */
const SEAFOOD_SCALED = [
  { id: 'shrimp-ec', benchmarkId: 'shrimp-ucn' },
  { id: 'salmon-cn', benchmarkId: 'fish-global' },
  { id: 'scallop-usa', benchmarkId: 'fish-global' },
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

function formatTradeDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return new Date().toISOString().split('T')[0];
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function formatFredLabel(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 7);
  return dateStr.length >= 7 ? dateStr.slice(0, 7) : dateStr;
}

async function fetchStooqQuote(stooqSymbol) {
  const url = `https://stooq.com/q/l/?s=${stooqSymbol}`;
  const response = await axios.get(url, {
    timeout: 15000,
    headers: STOOQ_HEADERS,
    responseType: 'text',
  });
  const line = String(response.data).trim();
  if (!line || line.startsWith('No data')) {
    throw new Error(`Stooq 無數據: ${stooqSymbol}`);
  }
  const parts = line.split(',');
  const close = parseFloat(parts[6]);
  const open = parseFloat(parts[3]);
  const tradeDate = formatTradeDate(parts[1]);
  if (!Number.isFinite(close)) {
    throw new Error(`Stooq 解析失敗: ${line}`);
  }
  return { price: close, open, tradeDate };
}

function findPrevItem(list, id) {
  return (list || []).find((item) => item.id === id) || null;
}

function buildMarketItem(def, price, prevPrice, updatedAt, source) {
  const { change, changePercent } = calcChange(price, prevPrice);
  return {
    id: def.id,
    name: def.name,
    nameEn: def.nameEn,
    price: round2(price),
    unit: def.unit,
    change: round2(change),
    changePercent: round2(changePercent),
    source: source || def.source || 'CME Group',
    updatedAt,
  };
}

async function fetchCmeFutures(prevCme = []) {
  const results = [];
  const today = new Date().toISOString().split('T')[0];

  for (const def of CME_STOOQ) {
    const quote = await fetchStooqQuote(def.stooq);
    const prev = findPrevItem(prevCme, def.id);
    const prevPrice = prev?.price ?? quote.open;
    results.push(
      buildMarketItem(
        def,
        quote.price,
        prevPrice,
        quote.tradeDate || today,
        'CME Group · Stooq 延遲'
      )
    );
    console.log(`  ✓ ${def.name}: ${quote.price} ${def.unit}`);
    await sleep(400);
  }

  const byId = Object.fromEntries(results.map((r) => [r.id, r]));

  for (const derived of CME_DERIVED) {
    const base = byId[derived.baseId];
    if (!base) continue;
    const prevDerived = findPrevItem(prevCme, derived.id);
    const prevBase = findPrevItem(prevCme, derived.baseId);
    let ratio = derived.fallbackRatio;
    if (prevDerived?.price && prevBase?.price) {
      ratio = prevDerived.price / prevBase.price;
    }
    const price = base.price * ratio;
    const prevPrice = prevDerived?.price ?? price;
    results.push(
      buildMarketItem(
        derived,
        price,
        prevPrice,
        base.updatedAt,
        'CME Group · 參考推算'
      )
    );
    console.log(`  ✓ ${derived.name}: ${round2(price)}（依 ${derived.baseId}）`);
  }

  return results;
}

async function fetchFredSeries(seriesId, apiKey) {
  const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
    timeout: 20000,
    params: {
      series_id: seriesId,
      api_key: apiKey,
      file_type: 'json',
      sort_order: 'desc',
      limit: 6,
    },
  });
  const observations = response.data?.observations || [];
  for (const obs of observations) {
    const value = parseFloat(obs.value);
    if (Number.isFinite(value) && obs.value !== '.') {
      return { price: value, date: obs.date };
    }
  }
  throw new Error(`FRED 無有效觀測值: ${seriesId}`);
}

function scaleSeafoodItem(prevItem, benchmarkOld, benchmarkNew, updatedAt) {
  if (!prevItem || !benchmarkOld?.price || !benchmarkNew?.price) return null;
  const factor = benchmarkNew.price / benchmarkOld.price;
  const price = prevItem.price * factor;
  const { change, changePercent } = calcChange(price, prevItem.price);
  return {
    ...prevItem,
    price: round2(price),
    change: round2(change),
    changePercent: round2(changePercent),
    updatedAt: formatFredLabel(benchmarkNew.date) || updatedAt,
    source: `${prevItem.source || '行業參考'} · 按指數推算`,
  };
}

async function fetchSeafoodIndices(prevSeafood = [], apiKey) {
  if (!apiKey) {
    console.warn('[海產] 未設置 FRED_API_KEY，跳過海產自動更新（可免費申請: https://fred.stlouisfed.org/docs/api/api_key.html）');
    return null;
  }

  const updated = [];
  const benchmarkSnapshots = {};

  for (const def of SEAFOOD_FRED) {
    const obs = await fetchFredSeries(def.seriesId, apiKey);
    const prev = findPrevItem(prevSeafood, def.id);
    const item = buildMarketItem(def, obs.price, prev?.price ?? obs.price, formatFredLabel(obs.date), def.source);
    updated.push(item);
    benchmarkSnapshots[def.id] = { price: obs.price, date: obs.date, prevPrice: prev?.price };
    console.log(`  ✓ ${def.name}: ${obs.price} ${def.unit} (${obs.date})`);
    await sleep(300);
  }

  const today = formatFredLabel(new Date().toISOString().split('T')[0]);

  for (const rule of SEAFOOD_SCALED) {
    const prev = findPrevItem(prevSeafood, rule.id);
    if (!prev) continue;
    const bench = benchmarkSnapshots[rule.benchmarkId];
    if (!bench?.prevPrice) {
      updated.push(prev);
      continue;
    }
    const scaled = scaleSeafoodItem(
      prev,
      { price: bench.prevPrice },
      { price: bench.price, date: bench.date },
      today
    );
    if (scaled) {
      updated.push(scaled);
      console.log(`  ✓ ${scaled.name}: ${scaled.price} ${scaled.unit}（推算）`);
    }
  }

  const updatedIds = new Set(updated.map((x) => x.id));
  for (const prev of prevSeafood) {
    if (!updatedIds.has(prev.id)) updated.push(prev);
  }

  return updated;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadJson() {
  try {
    return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function main() {
  loadEnvFile();
  console.log(`[${new Date().toISOString()}] 開始更新國際期貨與海產指數…\n`);

  const json = loadJson();
  const prevCme = json.cme || [];
  const prevSeafood = json.seafood || [];

  console.log('[CME] 抓取 Stooq 期貨報價…');
  const cme = await fetchCmeFutures(prevCme);
  json.cme = cme;

  const fredKey = process.env.FRED_API_KEY || '';
  console.log('\n[海產] 抓取 FRED IMF 指數…');
  const seafood = await fetchSeafoodIndices(prevSeafood, fredKey);
  if (seafood) {
    json.seafood = seafood;
  }

  json.internationalMeta = {
    cmeUpdatedAt: new Date().toISOString(),
    cmeSource: 'Stooq delayed · CME livestock futures',
    seafoodUpdatedAt: seafood ? new Date().toISOString() : json.internationalMeta?.seafoodUpdatedAt || null,
    seafoodSource: seafood ? 'FRED IMF Primary Commodity Prices' : '未更新（需 FRED_API_KEY）',
  };
  json.lastUpdated = new Date().toISOString();

  const dir = path.dirname(JSON_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(json, null, 2));

  console.log(`\n✅ 已寫入 ${JSON_PATH}`);
  console.log(`   CME ${cme.length} 項 · 海產 ${seafood ? seafood.length : prevSeafood.length} 項`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ 國際市場數據更新失敗:', err.message);
    process.exit(1);
  });
}

module.exports = { fetchCmeFutures, fetchSeafoodIndices };
