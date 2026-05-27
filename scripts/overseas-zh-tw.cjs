/** Node 版 — 標題直譯（與 src/lib/overseas-zh-tw.ts 同步） */
const SOURCE_ZH = {
  'Beef Central': '澳洲牛肉資訊',
  SeafoodSource: '海產業界網',
  SalmonBusiness: '三文魚業界',
  FreightAmigo: 'FreightAmigo 物流',
  USMEF: '美國肉品出口協會',
  'The Fish Site': '水產資訊網',
  'Pig Progress': '全球豬業資訊',
  'CME Group': '芝加哥商品交易所',
  'IMF/FRED': '國際貨幣基金',
  UCN: '海產價格指數',
  'Food World': 'Food World',
  'Norwegian Seafood Council': '挪威海產理事會',
  'Urner Barry': 'Urner Barry 報價',
};

const PHRASES = [
  ['steer prices surge in auctionsplus market after rain', '降雨後 AuctionsPlus 拍賣平台菜牛價格急升'],
  ['rain impact on cattle markets illustrated in big tawarri weaner steer turnoff', '降雨對牛隻市場影響：Tawarri 大型斷奶菜牛出欄'],
  ['pure salmon japan: first eggs placed at 10,000-tonne ras facility', 'Pure Salmon 日本：1 萬公噸循環水養殖場首批魚卵入孵'],
  ['after encouraging rainfall in some cattle areas last week', '部分牧區上週喜雨後'],
  ['most steer categories were sharply higher in c/kg value in online trading on friday', '週五網上交易大部分菜牛品種價格大幅上升'],
  ['breeding cattle categories also showed some solid gains', '繁殖牛品種亦有明顯漲幅'],
  ['recirculating aquaculture', '循環水養殖'],
  ['steer prices surge', '菜牛價格急升'],
  ['steer prices', '菜牛價格'],
  ['cattle markets', '牛隻市場'],
  ['breeding cattle', '繁殖牛'],
  ['weaner steer', '斷奶菜牛'],
  ['first eggs placed', '首批魚卵已入孵'],
  ['ras facility', '循環水養殖場'],
  ['after encouraging rainfall', '部分牧區喜雨後'],
  ['in online trading', '在網上交易中'],
  ['auctionsplus market', 'AuctionsPlus 拍賣平台'],
  ['rain impact', '降雨影響'],
  ['sharply higher', '大幅上升'],
  ['solid gains', '明顯上漲'],
  ['after rain', '降雨後'],
  ['record high', '創新高'],
  ['trade war', '貿易戰'],
  ['pure salmon japan', 'Pure Salmon 日本'],
  ['10,000-tonne', '1 萬公噸'],
  ['illustrated in', '體現在'],
  ['turnoff', '出欄'],
];

const WORDS = [
  ['surge', '急升'], ['plunge', '急跌'], ['rise', '上升'], ['fall', '回落'],
  ['cattle', '牛隻'], ['steer', '菜牛'], ['beef', '牛肉'], ['salmon', '三文魚'],
  ['prices', '價格'], ['price', '價格'], ['market', '市場'], ['markets', '市場'],
  ['rain', '降雨'], ['rainfall', '降雨'], ['impact', '影響'], ['illustrated', '體現'],
  ['shipping', '海運'], ['tariff', '關稅'], ['export', '出口'], ['import', '進口'],
  ['facility', '設施'], ['eggs', '魚卵'], ['tonne', '公噸'], ['global', '全球'],
  ['japan', '日本'], ['australia', '澳洲'], ['norway', '挪威'], ['china', '中國'],
  ['big', '大型'], ['first', '首批'], ['placed', '入孵'], ['new', '新'],
  ['in', '於'], ['on', '於'], ['at', '於'], ['and', '及'], ['from', '來自'],
  ['after', '在…之後'], ['before', '在…之前'],
  ['the', ''], ['a', ''], ['an', ''], ['for', ''], ['of', ''], ['to', ''], ['with', ''],
];

const IMPACT_ZH = { high: '重大影響', medium: '中等影響', low: '輕微影響' };
const TREND_ZH = { bullish: '市場看漲', bearish: '市場看跌', neutral: '市場觀望' };
const CATEGORY_ZH = { meat: '肉類', seafood: '海產', logistics: '物流' };

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DECIMAL_PLACEHOLDER = '\uE000';

function maskDecimalNumbers(text) {
  const decimals = [];
  const masked = String(text).replace(/[+-]?\d+\.\d+/g, (match) => {
    decimals.push(match);
    return `${DECIMAL_PLACEHOLDER}${decimals.length - 1}${DECIMAL_PLACEHOLDER}`;
  });
  return { masked, decimals };
}

function unmaskDecimalNumbers(masked, decimals) {
  return masked.replace(
    new RegExp(`${DECIMAL_PLACEHOLDER}(\\d+)${DECIMAL_PLACEHOLDER}`, 'g'),
    (_, index) => decimals[parseInt(index, 10)] ?? ''
  );
}

function toChineseCommaPunctuation(text) {
  const { masked, decimals } = maskDecimalNumbers(text);
  return unmaskDecimalNumbers(
    masked
      .replace(/\s+/g, '')
      .replace(/[,.;]+/g, '，')
      .replace(/，+/g, '，')
      .replace(/^，|，$/g, '')
      .replace(/：+/g, '：'),
    decimals
  );
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasChinese(text, min = 2) {
  return (String(text).match(/[\u4e00-\u9fff]/g)?.length ?? 0) >= min;
}

function latinRatio(text) {
  const t = String(text).replace(/\s+/g, '');
  if (!t.length) return 0;
  const latin = t.match(/[a-zA-Z]/g)?.length ?? 0;
  return latin / t.length;
}

function translateOverseasText(input) {
  if (!input?.trim() || hasChinese(input)) return (input || '').trim();
  let text = input.trim();
  for (const [en, zh] of PHRASES) {
    text = text.replace(new RegExp(escapeRegExp(en), 'gi'), zh);
  }
  for (const [en, zh] of WORDS) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(en)}\\b`, 'gi'), zh);
  }
  return toChineseCommaPunctuation(text);
}

function translateOverseasTitle(input) {
  if (!input?.trim()) return '';
  const cleaned = stripHtml(input).trim();
  if (hasChinese(cleaned, 2)) return cleaned;

  let text = cleaned
    .replace(/\s*:\s*/g, '：')
    .replace(/\s*-\s*/g, '—')
    .replace(/\s+/g, ' ');

  for (const [en, zh] of PHRASES) {
    text = text.replace(new RegExp(escapeRegExp(en), 'gi'), zh);
  }
  for (const [en, zh] of WORDS) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(en)}\\b`, 'gi'), zh);
  }

  return toChineseCommaPunctuation(text).trim();
}

function buildChineseBrief(article) {
  const products = article.keyInfo.products?.join('、') || '相關產品';
  const regions = article.keyInfo.regions?.join('、') || '海外市場';
  const trend = TREND_ZH[article.keyInfo.futureOutlook ?? 'neutral'] ?? '走勢待觀察';
  return `涉及${regions}的${products}動態；${trend}。`;
}

function localizeTitle(title) {
  const cleaned = stripHtml(title);
  if (hasChinese(cleaned, 2)) return cleaned;
  const translated = translateOverseasTitle(cleaned);
  return translated || cleaned;
}

function localizeBriefReason(raw, article) {
  const cleaned = stripHtml(raw);
  if (hasChinese(cleaned, 8)) {
    return cleaned.length > 160 ? `${cleaned.slice(0, 160)}…` : cleaned;
  }
  const translated = translateOverseasText(cleaned);
  if (translated.length >= 12) {
    return translated.length > 160 ? `${translated.slice(0, 160)}…` : translated;
  }
  return buildChineseBrief(article);
}

function localizeSource(source) {
  return SOURCE_ZH[source] ?? source;
}

function localizeNewsArticle(article) {
  return {
    ...article,
    source: localizeSource(article.source),
  };
}

module.exports = {
  stripHtml,
  localizeNewsArticle,
  localizeSource,
  localizeTitle,
  translateOverseasTitle,
  translateOverseasText,
  hasChinese,
  latinRatio,
};
