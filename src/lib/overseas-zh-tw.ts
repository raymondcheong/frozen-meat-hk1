/**
 * 海外英文資訊 → 香港繁體中文（標題直譯，不作摘要）
 */

export const SOURCE_ZH: Record<string, string> = {
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

export const UNIT_ZH: Record<string, string> = {
  'USD/cwt': '美元/英擔',
  'USD/kg': '美元/公斤',
  'USD/lb': '美元/磅',
  'HKD/擔': '港元/擔',
  'CNY/kg': '人民幣/公斤',
};

const PHRASES: [string, string][] = [
  ['live cattle futures', '活牛期貨'],
  ['feeder cattle futures', '育肥牛期貨'],
  ['lean hog futures', '瘦肉豬期貨'],
  ['lean hog index', '瘦肉豬指數'],
  ['pork cutout index', '豬肉切塊指數'],
  ['steer prices surge', '菜牛價格急升'],
  ['steer prices', '菜牛價格'],
  ['cattle markets', '牛隻市場'],
  ['cattle market', '牛隻市場'],
  ['breeding cattle', '繁殖牛'],
  ['weaner steer', '斷奶菜牛'],
  ['record high', '創新高'],
  ['record low', '創新低'],
  ['trade war', '貿易戰'],
  ['trade agreement', '貿易協定'],
  ['first eggs placed', '首批魚卵已入孵'],
  ['ras facility', '循環水養殖場'],
  ['white shrimp', '白蝦'],
  ['tiger shrimp', '虎蝦'],
  ['after rain', '降雨後'],
  ['after encouraging rainfall', '部分牧區喜雨後'],
  ['in online trading', '在網上交易中'],
  ['on Friday', '週五'],
  ['last week', '上週'],
  ['this week', '本週'],
  ['supply chain', '供應鏈'],
  ['shipping costs', '航運成本'],
  ['freight rates', '運費'],
  ['export market', '出口市場'],
  ['import market', '進口市場'],
  ['price index', '價格指數'],
  ['global fish price', '全球魚價'],
  ['global shrimp', '全球蝦價'],
  ['sea scallops', '海扇貝'],
  ['china import salmon', '中國進口三文魚'],
  ['ecuador shrimp', '厄瓜多爾蝦'],
  ['pure salmon japan', 'Pure Salmon 日本'],
  ['auctionsplus market', 'AuctionsPlus 拍賣平台'],
  ['auctionsplus', 'AuctionsPlus 拍賣'],
  ['turnoff', '出欄'],
  ['illustrated in', '體現在'],
  ['rain impact', '降雨影響'],
  ['sharply higher', '大幅上升'],
  ['solid gains', '明顯上漲'],
  ['price surge', '價格急升'],
  ['price drop', '價格下跌'],
  ['price rise', '價格上升'],
  ['price fall', '價格回落'],
  ['rain impact on cattle markets illustrated in big tawarri weaner steer turnoff', '降雨對牛隻市場影響：Tawarri 大型斷奶菜牛出欄'],
  ['steer prices surge in auctionsplus market after rain', '降雨後 AuctionsPlus 拍賣平台菜牛價格急升'],
  ['pure salmon japan: first eggs placed at 10,000-tonne ras facility', 'Pure Salmon 日本：1 萬公噸循環水養殖場首批魚卵入孵'],
  ['after encouraging rainfall in some cattle areas last week', '部分牧區上週喜雨後'],
  ['most steer categories were sharply higher in c/kg value in online trading on friday', '週五網上交易大部分菜牛品種價格大幅上升'],
  ['most steer categories were sharply higher', '大部分菜牛品種價格大幅上升'],
  ['breeding cattle categories also showed some solid gains', '繁殖牛品種亦有明顯漲幅'],
  ['in online trading on friday', '週五網上交易'],
  ['recirculating aquaculture', '循環水養殖'],
  ['recirculating aquaculture system', '循環水養殖系統'],
  ['pure salmon japan', 'Pure Salmon 日本'],
  ['10,000-tonne', '1 萬公噸'],
  ['10,000 tonne', '1 萬公噸'],
  ['illustrated in', '體現在'],
  ['turnoff', '出欄'],
];

const WORDS: [string, string][] = [
  ['surge', '急升'],
  ['soar', '飆升'],
  ['plunge', '急跌'],
  ['collapse', '崩跌'],
  ['climb', '攀升'],
  ['drop', '下跌'],
  ['fall', '回落'],
  ['rise', '上升'],
  ['increase', '增加'],
  ['decrease', '減少'],
  ['stable', '持平'],
  ['steady', '穩定'],
  ['forecast', '預測'],
  ['outlook', '前景'],
  ['demand', '需求'],
  ['supply', '供應'],
  ['export', '出口'],
  ['import', '進口'],
  ['tariff', '關稅'],
  ['shipping', '海運'],
  ['freight', '貨運'],
  ['logistics', '物流'],
  ['container', '貨櫃'],
  ['vessel', '船隻'],
  ['facility', '設施'],
  ['production', '產量'],
  ['harvest', '收成'],
  ['fishery', '漁業'],
  ['aquaculture', '水產養殖'],
  ['salmon', '三文魚'],
  ['beef', '牛肉'],
  ['cattle', '牛隻'],
  ['steer', '菜牛'],
  ['heifer', '小母牛'],
  ['pork', '豬肉'],
  ['hog', '生豬'],
  ['pig', '豬'],
  ['shrimp', '蝦'],
  ['prawn', '蝦'],
  ['fish', '魚類'],
  ['scallop', '扇貝'],
  ['market', '市場'],
  ['markets', '市場'],
  ['prices', '價格'],
  ['price', '價格'],
  ['trading', '交易'],
  ['auction', '拍賣'],
  ['rain', '降雨'],
  ['rainfall', '降雨'],
  ['drought', '乾旱'],
  ['crisis', '危機'],
  ['growth', '增長'],
  ['expansion', '擴張'],
  ['eggs', '魚卵'],
  ['tonne', '公噸'],
  ['global', '全球'],
  ['international', '國際'],
  ['europe', '歐洲'],
  ['australia', '澳洲'],
  ['australian', '澳洲'],
  ['norway', '挪威'],
  ['japan', '日本'],
  ['japanese', '日本'],
  ['china', '中國'],
  ['chile', '智利'],
  ['ecuador', '厄瓜多爾'],
  ['mexico', '墨西哥'],
  ['india', '印度'],
  ['scotland', '蘇格蘭'],
  ['united states', '美國'],
  ['america', '美國'],
  ['after', '在…之後'],
  ['before', '在…之前'],
  ['impact', '影響'],
  ['report', '報告'],
  ['update', '更新'],
  ['news', '消息'],
  ['in', '於'],
  ['on', '於'],
  ['at', '於'],
  ['for', ''],
  ['of', ''],
  ['and', '及'],
  ['the', ''],
  ['a', ''],
  ['an', ''],
  ['to', ''],
  ['with', ''],
  ['from', '來自'],
  ['by', '由'],
  ['its', '其'],
  ['new', '新'],
  ['first', '首批'],
  ['placed', '入孵'],
  ['big', '大型'],
  ['illustrated', '體現'],
  ['week', '週'],
  ['year', '年'],
  ['month', '月'],
  ['industry', '行業'],
  ['sector', '行業'],
  ['spot', '現貨'],
  ['flat', '持平'],
  ['margin', '利潤'],
  ['margins', '利潤'],
  ['profit', '盈利'],
  ['profitable', '更賺錢'],
  ['producers', '生產商'],
  ['producer', '生產商'],
  ['hidden', ''],
  ['every', ''],
  ['how', ''],
  ['making', ''],
  ['lock', '鎖價'],
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DECIMAL_PLACEHOLDER = '\uE000';

/** 標點轉中文逗號時保留小數點（如 9.66、0.35%） */
export function maskDecimalNumbers(text: string): { masked: string; decimals: string[] } {
  const decimals: string[] = [];
  const masked = text.replace(/[+-]?\d+\.\d+/g, (match) => {
    decimals.push(match);
    return `${DECIMAL_PLACEHOLDER}${decimals.length - 1}${DECIMAL_PLACEHOLDER}`;
  });
  return { masked, decimals };
}

export function unmaskDecimalNumbers(masked: string, decimals: string[]): string {
  return masked.replace(
    new RegExp(`${DECIMAL_PLACEHOLDER}(\\d+)${DECIMAL_PLACEHOLDER}`, 'g'),
    (_, index) => decimals[parseInt(index, 10)] ?? ''
  );
}

function toChineseCommaPunctuation(text: string): string {
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

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasChinese(text: string, min = 2): boolean {
  const m = text.match(/[\u4e00-\u9fff]/g);
  return (m?.length ?? 0) >= min;
}

export function latinRatio(text: string): number {
  const t = text.replace(/\s+/g, '');
  if (!t.length) return 0;
  const latin = t.match(/[a-zA-Z]/g)?.length ?? 0;
  return latin / t.length;
}

export function translateOverseasText(input: string): string {
  if (!input?.trim()) return '';
  if (hasChinese(input)) return input.trim();

  let text = input.trim();
  for (const [en, zh] of PHRASES) {
    text = text.replace(new RegExp(escapeRegExp(en), 'gi'), zh);
  }
  for (const [en, zh] of WORDS) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(en)}\\b`, 'gi'), zh);
  }

  return toChineseCommaPunctuation(text);
}

/** 標題直譯：保留可讀標點，不用摘要句 */
export function translateOverseasTitle(input: string): string {
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

  return toChineseCommaPunctuation(text);
}

export function localizeSource(source: string | undefined): string {
  if (!source) return '';
  return SOURCE_ZH[source] ?? source;
}

export function localizeUnit(unit: string | undefined): string {
  if (!unit) return '';
  return UNIT_ZH[unit] ?? unit.replace(/^USD\//, '美元/');
}

export interface ArticleLikeForSummary {
  category: string;
  keyInfo: {
    products?: string[];
    regions?: string[];
    impactLevel?: string;
    priceChanges?: Array<{ from?: number; to?: number; changePercent?: string }>;
    percentChanges?: Array<{ percent: number; direction: string }>;
    hasTariff?: boolean;
    hasLogistics?: boolean;
  };
}

const CATEGORY_ZH: Record<string, string> = {
  meat: '肉類',
  seafood: '海產',
  logistics: '物流',
};

/** 中老年友善標題：地區＋品類，無英文殘留、不作升跌判斷 */
export function buildElderlyHeadline(article: ArticleLikeForSummary): string {
  const product = article.keyInfo.products?.filter(Boolean)[0] || CATEGORY_ZH[article.category] || '行業';
  const region = article.keyInfo.regions?.filter(Boolean).slice(0, 2).join('、') || '海外';
  return `${region}${product}相關消息`;
}

export function buildChineseHeadline(article: ArticleLikeForSummary): string {
  return buildElderlyHeadline(article);
}

/** 一行白話摘要：只陳述地區、品類與來源資訊，不作升跌預測 */
export function buildElderlyBrief(article: ArticleLikeForSummary): string {
  const product = article.keyInfo.products?.filter(Boolean).join('、') || CATEGORY_ZH[article.category] || '相關貨品';
  const region = article.keyInfo.regions?.filter(Boolean).slice(0, 3).join('、') || '海外';
  const parts: string[] = [`${region}的${product}相關報道`];

  const pc = article.keyInfo.priceChanges?.[0];
  if (pc?.from !== undefined && pc?.to !== undefined && pc.changePercent) {
    const n = String(pc.changePercent).replace(/^[+-]/, '');
    const dir = String(pc.changePercent).startsWith('-') ? '下跌' : '上升';
    parts.push(`價格由 ${pc.from} 變至 ${pc.to}（${dir} ${n}%）`);
  }

  if (article.keyInfo.hasTariff) parts.push('內容涉及關稅');
  if (article.keyInfo.hasLogistics) parts.push('內容涉及物流');

  return `${parts.join('，')}。`;
}

export function buildChineseBrief(article: ArticleLikeForSummary): string {
  return buildElderlyBrief(article);
}

/** 標題是否適合直接展示（過濾直譯殘留英文） */
export function isTitleReadable(text: string): boolean {
  const t = stripHtml(text).trim();
  if (!t || t.length < 4) return false;
  if (latinRatio(t) > 0.18) return false;
  if (/[a-zA-Z]{5,}/.test(t)) return false;
  const cn = t.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  if (cn < 5) return false;
  return true;
}

/** 清理標題中殘留英文詞 */
export function polishMixedTitle(text: string): string {
  let t = stripHtml(text).trim();
  if (!t) return t;

  const trading: [string, string][] = [
    ['spot price', '現貨價'],
    ['spot', '現貨'],
    ['flat', '持平'],
    ['RAS', '循環水養殖'],
  ];
  for (const [en, zh] of trading) {
    t = t.replace(new RegExp(escapeRegExp(en), 'gi'), zh);
  }

  t = t
    .replace(/([\d,]+)\s*—\s*公噸/g, '$1公噸')
    .replace(/([\d,]+)\s*-\s*公噸/g, '$1公噸')
    .replace(/10,000/g, '1萬')
    .replace(/10000/g, '1萬');

  if (!hasChinese(t, 2)) {
    t = translateOverseasTitle(t);
  } else {
    for (const [en, zh] of WORDS) {
      if (en.length <= 4) {
        t = t.replace(new RegExp(`\\b${escapeRegExp(en)}\\b`, 'gi'), zh);
      }
    }
  }

  return toChineseCommaPunctuation(t).trim();
}

export function localizeTitle(title: string): string {
  const cleaned = stripHtml(title);
  const translated = hasChinese(cleaned, 6) ? polishMixedTitle(cleaned) : translateOverseasTitle(cleaned);
  const polished = polishMixedTitle(translated || cleaned);
  return polished || cleaned;
}

export function localizeBriefReason(raw: string, article: ArticleLikeForSummary): string {
  const cleaned = stripHtml(raw);
  if (hasChinese(cleaned, 8)) {
    return truncateBrief(cleaned);
  }
  const translated = translateOverseasText(cleaned);
  if (hasChinese(translated, 6) && latinRatio(translated) < 0.4 && translated.length >= 8) {
    return truncateBrief(translated);
  }
  return truncateBrief(buildChineseBrief(article));
}

const BRIEF_MAX = 72;

/** 取首句并限制字数，方便中老年快速阅读 */
export function truncateBrief(text: string, max = BRIEF_MAX): string {
  const t = text
    .replace(/\s+/g, '')
    .replace(/[。！？；]+/g, '，')
    .split('，')
    .filter(Boolean)[0] ?? text;
  if (t.length <= max) return t.endsWith('。') ? t : `${t.replace(/[，。]$/, '')}。`;
  return `${t.slice(0, max).replace(/[，、]$/, '')}…`;
}
