/**
 * 市場情報新聞自動爬蟲
 * 數據源: Beef Central, SeafoodSource, Urner Barry, SalmonBusiness, FreightAmigo, etc.
 * 輸出: public/data/news-articles.json
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ===== 數據源配置 =====
const SOURCES = [
  {
    name: 'Beef Central',
    url: 'https://www.beefcentral.com',
    rssUrl: 'https://www.beefcentral.com/feed/',
    category: 'meat',
    products: ['牛肉', '活牛'],
    regions: ['澳大利亞', '美國'],
    priority: 'high',
  },
  {
    name: 'SeafoodSource',
    url: 'https://www.seafoodsource.com',
    rssUrl: 'https://www.seafoodsource.com/rss.xml',
    category: 'seafood',
    products: ['海鮮', '魚類', '蝦', '三文魚'],
    regions: ['全球'],
    priority: 'high',
  },
  {
    name: 'SalmonBusiness',
    url: 'https://salmonbusiness.com',
    rssUrl: 'https://salmonbusiness.com/feed/',
    category: 'seafood',
    products: ['三文魚'],
    regions: ['挪威', '蘇格蘭', '智利'],
    priority: 'high',
  },
  {
    name: 'FreightAmigo',
    url: 'https://www.freightamigo.com',
    category: 'logistics',
    products: ['物流', '運輸'],
    regions: ['亞洲', '歐洲', '美國'],
    priority: 'medium',
    // FreightAmigo 沒有 RSS，需要 HTML 抓取
    useHtml: true,
  },
  {
    name: 'CNA 中央社',
    url: 'https://www.cna.com.tw',
    rssUrl: 'https://www.cna.com.tw/rss/topic/317.aspx', // 產經新聞
    category: 'meat',
    products: ['牛肉', '豬肉'],
    regions: ['台灣', '美國'],
    priority: 'high',
  },
  {
    name: 'USMEF',
    url: 'https://www.usmef.org',
    rssUrl: 'https://www.usmef.org/feed/',
    category: 'meat',
    products: ['牛肉', '豬肉'],
    regions: ['美國'],
    priority: 'medium',
  },
  {
    name: 'The Fish Site',
    url: 'https://thefishsite.com',
    rssUrl: 'https://thefishsite.com/articles/rss',
    category: 'seafood',
    products: ['魚類', '蝦', '三文魚'],
    regions: ['全球'],
    priority: 'medium',
  },
  {
    name: 'Pig Progress',
    url: 'https://www.pigprogress.net',
    rssUrl: 'https://www.pigprogress.net/rss/news',
    category: 'meat',
    products: ['豬肉', '活豬'],
    regions: ['全球', '歐洲'],
    priority: 'medium',
  },
  {
    name: '豬易網',
    url: 'https://www.zhue.com.cn',
    rssUrl: 'https://www.zhue.com.cn/feed/',
    category: 'meat',
    products: ['活豬', '豬肉', '飼料'],
    regions: ['中國', '內地'],
    priority: 'high',
  },
  {
    name: '新牧網',
    url: 'https://xinm123.nfncb.cn',
    rssUrl: 'https://xinm123.nfncb.cn/feed/',
    category: 'meat',
    products: ['活豬', '豬肉', '雞肉'],
    regions: ['中國', '內地'],
    priority: 'high',
  },
];

// ===== 產品關鍵詞庫 =====
const PRODUCT_KEYWORDS = {
  '牛肉': ['beef', 'cattle', '活牛', '肉牛', '育肥牛', 'feeder cattle', 'live cattle'],
  '豬肉': ['pork', 'pig', 'hog', '活豬', '瘦肉豬', 'lean hog', '生豬'],
  '三文魚': ['salmon', '三文魚'],
  '蝦': ['shrimp', 'prawn', '蝦'],
  '白蝦': ['white shrimp', 'vannamei'],
  '虎蝦': ['tiger shrimp'],
  '魚類': ['fish', 'fishery', '水產'],
  '海扇貝': ['scallop'],
  '雞肉': ['chicken', 'poultry'],
  '羊肉': ['lamb', 'mutton', 'sheep'],
};

// ===== 地區關鍵詞庫 =====
const REGION_KEYWORDS = {
  '香港': ['hong kong'],
  '中國': ['china', 'mainland', '中國大陸'],
  '美國': ['us', 'usa', 'united states', 'america'],
  '澳大利亞': ['australia', 'aussie'],
  '挪威': ['norway', 'norwegian'],
  '日本': ['japan', 'japanese'],
  '韓國': ['korea', 'korean'],
  '台灣': ['taiwan'],
  '歐洲': ['europe', 'eu'],
  '東南亞': ['southeast asia', 'asean'],
  '厄瓜多爾': ['ecuador'],
  '印度': ['india'],
  '智利': ['chile'],
  '蘇格蘭': ['scotland'],
  '全球': ['global', 'world', 'international'],
  '墨西哥': ['mexico'],
};

// ===== 影響級別關鍵詞 =====
const IMPACT_KEYWORDS = {
  high: ['plunge', 'surge', 'soar', 'collapse', 'crisis', 'record high', 'record low', '暴跌', '暴漲', '創新高', '創新低', '崩潰', '危機'],
  medium: ['rise', 'fall', 'increase', 'decrease', 'climb', 'drop', '上漲', '下跌', '上升', '下降'],
  low: ['stable', 'steady', 'flat', '持平', '穩定'],
};

// ===== 工具函數 =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function detectProducts(text) {
  const found = [];
  const lowerText = text.toLowerCase();
  for (const [product, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      if (!found.includes(product)) found.push(product);
    }
  }
  return found.length > 0 ? found : ['肉類'];
}

function detectRegions(text) {
  const found = [];
  const lowerText = text.toLowerCase();
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      if (!found.includes(region)) found.push(region);
    }
  }
  return found.length > 0 ? found : ['全球'];
}

function detectImpactLevel(text) {
  const lowerText = text.toLowerCase();
  for (const [level, keywords] of Object.entries(IMPACT_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) return level;
  }
  return 'medium';
}

function detectTrend(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('rise') || lowerText.includes('increase') || lowerText.includes('surge') || lowerText.includes('climb') || lowerText.includes('上漲') || lowerText.includes('上升')) {
    return 'bullish';
  }
  if (lowerText.includes('fall') || lowerText.includes('decrease') || lowerText.includes('drop') || lowerText.includes('plunge') || lowerText.includes('下跌') || lowerText.includes('下降')) {
    return 'bearish';
  }
  return 'neutral';
}

function detectPriceChanges(text) {
  const changes = [];
  // 匹配價格變動模式
  const patterns = [
    // $X.XX per pound/kg/cwt
    /\$?([\d,]+\.?\d*)\s*(?:USD\/|per\s+)?(cwt|kg|lb|pound)/gi,
  ];
  
  // 檢查百分比變動
  const percentMatch = text.match(/([\d.]+)%/);
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1]);
    return [{ percent, direction: text.toLowerCase().includes('drop') || text.toLowerCase().includes('fall') || text.toLowerCase().includes('plunge') || text.toLowerCase().includes('decrease') ? 'down' : 'up' }];
  }
  return changes;
}

function detectTariff(text) {
  const lowerText = text.toLowerCase();
  return lowerText.includes('tariff') || lowerText.includes('關稅') || lowerText.includes('trade war') || lowerText.includes('trade agreement') || lowerText.includes('貿易協定');
}

function detectLogistics(text) {
  const lowerText = text.toLowerCase();
  return lowerText.includes('shipping') || lowerText.includes('freight') || lowerText.includes('logistics') || lowerText.includes('container') || lowerText.includes('vessel') || lowerText.includes('海運') || lowerText.includes('運輸') || lowerText.includes('物流');
}

// ===== RSS 爬蟲 =====
async function fetchRSS(source) {
  const articles = [];
  try {
    console.log(`[RSS] 抓取 ${source.name}...`);
    const response = await axios.get(source.rssUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml,application/xml,*/*',
      },
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    
    $('item').each((i, el) => {
      if (i >= 5) return; // 每個源最多取 5 條
      
      const title = $(el).find('title').text().trim();
      const link = $(el).find('link').text().trim();
      const description = $(el).find('description').text().trim();
      const pubDate = $(el).find('pubDate').text().trim();
      
      if (!title) return;
      
      const content = title + ' ' + description;
      
      articles.push({
        id: `${source.name}-${i}`,
        title: title,
        source: source.name,
        sourceUrl: link || source.url,
        category: source.category,
        keyInfo: {
          products: detectProducts(content),
          regions: detectRegions(content),
          impactLevel: detectImpactLevel(content),
          impactDesc: detectImpactLevel(content) === 'high' ? '重大影響' : detectImpactLevel(content) === 'medium' ? '中等影響' : '輕微影響',
          priceChanges: [],
          percentChanges: detectPriceChanges(content),
          futureOutlook: detectTrend(content),
          briefReason: description.substring(0, 200),
          hasTariff: detectTariff(content),
          hasLogistics: detectLogistics(content),
        },
        publishDate: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    });
    
    console.log(`[RSS] ${source.name}: 獲取 ${articles.length} 條`);
  } catch (error) {
    console.error(`[RSS] ${source.name} 失敗: ${error.message}`);
  }
  return articles;
}

// ===== HTML 爬蟲（針對沒有 RSS 的網站） =====
async function fetchHTML(source) {
  const articles = [];
  try {
    console.log(`[HTML] 抓取 ${source.name}...`);
    const response = await axios.get(source.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    
    // 通用新聞列表選擇器
    const selectors = [
      'article h2 a', 'article h3 a', '.news-item a', 
      '.post-title a', 'h2.entry-title a', '.article-title a',
      'article a[href*="/news/"]', '.news-list a',
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, el) => {
        if (i >= 3) return; // 每個選擇器最多 3 條
        
        const title = $(el).text().trim();
        let link = $(el).attr('href') || '';
        
        if (!title || title.length < 10) return;
        if (link && !link.startsWith('http')) {
          link = source.url + (link.startsWith('/') ? link : '/' + link);
        }
        
        // 避免重複
        if (articles.some(a => a.title === title)) return;
        
        articles.push({
          id: `${source.name}-${i}`,
          title: title,
          source: source.name,
          sourceUrl: link || source.url,
          category: source.category,
          keyInfo: {
            products: source.products || detectProducts(title),
            regions: source.regions || detectRegions(title),
            impactLevel: 'medium',
            impactDesc: '中等影響',
            priceChanges: [],
            percentChanges: [],
            futureOutlook: detectTrend(title),
            briefReason: title.substring(0, 100),
            hasTariff: detectTariff(title),
            hasLogistics: detectLogistics(title),
          },
          publishDate: new Date().toISOString().split('T')[0],
        });
      });
    }
    
    console.log(`[HTML] ${source.name}: 獲取 ${articles.length} 條`);
  } catch (error) {
    console.error(`[HTML] ${source.name} 失敗: ${error.message}`);
  }
  return articles;
}

// ===== 生成默認文章（當爬蟲失敗時使用） =====
function getDefaultArticles() {
  return [
    {
      id: 'default-1',
      title: '港進口活豬平均拍賣價跌至802元/擔',
      source: 'FEHD官方',
      sourceUrl: 'https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html',
      category: 'meat',
      keyInfo: {
        products: ['活豬', '豬肉'],
        regions: ['香港', '內地'],
        impactLevel: 'high',
        impactDesc: '重大影響',
        priceChanges: [{ from: 1083, to: 802, unit: 'HKD/擔', change: -281, changePercent: '-25.9' }],
        percentChanges: [{ percent: 25.9, direction: 'down' }],
        futureOutlook: 'bearish',
        briefReason: '今日供應3,549頭，明日預計3,024頭，內地生豬供應過剩',
        hasTariff: false,
        hasLogistics: false,
      },
      publishDate: '2026-04-21',
    },
    {
      id: 'default-2',
      title: '活豬拍賣價：最高1,130/最低650元/擔',
      source: 'FEHD官方',
      sourceUrl: 'https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html',
      category: 'meat',
      keyInfo: {
        products: ['活豬'],
        regions: ['香港'],
        impactLevel: 'high',
        impactDesc: '重大影響',
        priceChanges: [{ from: 800, to: 650, unit: 'HKD/擔(最低)', change: -150, changePercent: '-18.8' }, { from: 1300, to: 1130, unit: 'HKD/擔(最高)', change: -170, changePercent: '-13.1' }],
        percentChanges: [{ percent: 18.8, direction: 'down' }, { percent: 13.1, direction: 'down' }],
        futureOutlook: 'bearish',
        briefReason: '最高價1,130、最低價650，價差擴大至480元，明日預計供應3,024頭',
        hasTariff: false,
        hasLogistics: false,
      },
      publishDate: '2026-04-21',
    },
    {
      id: 'default-3',
      title: '美台簽署紅肉貿易協定擴大對台出口',
      source: 'USTR/CNA',
      sourceUrl: 'https://www.cna.com.tw',
      category: 'meat',
      keyInfo: {
        products: ['牛肉', '豬肉'],
        regions: ['美國', '台灣'],
        impactLevel: 'high',
        impactDesc: '重大影響',
        priceChanges: [],
        percentChanges: [],
        futureOutlook: 'bullish',
        briefReason: '移除關稅與非關稅壁壘，台灣是美國牛肉第五大市場',
        hasTariff: true,
        hasLogistics: false,
      },
      publishDate: '2026-04-21',
    },
    {
      id: 'default-4',
      title: '全球豬肉市場2026年調整：中國進口下降',
      source: 'Rabobank',
      sourceUrl: 'https://www.rabobank.com',
      category: 'meat',
      keyInfo: {
        products: ['豬肉'],
        regions: ['全球', '中國', '墨西哥'],
        impactLevel: 'high',
        impactDesc: '重大影響',
        priceChanges: [],
        percentChanges: [],
        futureOutlook: 'neutral',
        briefReason: '中國母豬存欄降至3,900萬頭，墨西哥成最大進口國',
        hasTariff: false,
        hasLogistics: false,
      },
      publishDate: '2026-04-21',
    },
    {
      id: 'default-5',
      title: '瘦肉豬期貨連跌8日創12月以來新低',
      source: 'CME Group/Reuters',
      sourceUrl: 'https://www.cmegroup.com',
      category: 'meat',
      keyInfo: {
        products: ['豬肉'],
        regions: ['美國'],
        impactLevel: 'medium',
        impactDesc: '中等影響',
        priceChanges: [{ value: 101.68, unit: 'USD/cwt', change: -0.28, changePercent: '-0.27' }],
        percentChanges: [{ percent: 0.27, direction: 'down' }],
        futureOutlook: 'bearish',
        briefReason: '飼料成本下降但出口需求疲軟，連續8日下跌',
        hasTariff: false,
        hasLogistics: false,
      },
      publishDate: '2026-04-21',
    },
    {
      id: 'default-6',
      title: '活牛期貨創歷史新高後回落至247.63美分',
      source: 'CME Group/Reuters',
      sourceUrl: 'https://www.cmegroup.com',
      category: 'meat',
      keyInfo: {
        products: ['牛肉'],
        regions: ['美國'],
        impactLevel: 'medium',
        impactDesc: '中等影響',
        priceChanges: [{ from: 252, to: 247.63, unit: 'USD/cwt', change: -4.37, changePercent: '-1.73' }],
        percentChanges: [{ percent: 1.73, direction: 'down' }],
        futureOutlook: 'bullish',
        briefReason: '美國牛隻存欄降至75年來最低、燒烤季節需求強勁',
        hasTariff: false,
        hasLogistics: false,
      },
      publishDate: '2026-04-21',
    },
    {
      id: 'default-7',
      title: '三文魚價格6周連漲創18個月新高',
      source: 'SalmonBusiness',
      sourceUrl: 'https://salmonbusiness.com',
      category: 'seafood',
      keyInfo: {
        products: ['三文魚'],
        regions: ['挪威', '蘇格蘭', '智利'],
        impactLevel: 'high',
        impactDesc: '重大影響',
        priceChanges: [{ from: 72.5, to: 85.3, unit: 'NOK/kg', change: 12.8, changePercent: '+17.7' }],
        percentChanges: [{ percent: 17.7, direction: 'up' }],
        futureOutlook: 'bullish',
        briefReason: '挪威供應量下降12%，加上復活節需求旺季',
        hasTariff: false,
        hasLogistics: false,
      },
      publishDate: '2026-04-21',
    },
    {
      id: 'default-8',
      title: '蝦類市場供應過剩價格跌至5年低點',
      source: 'Urner Barry',
      sourceUrl: 'https://www.urnerbarry.com',
      category: 'seafood',
      keyInfo: {
        products: ['白蝦', '虎蝦'],
        regions: ['厄瓜多爾', '印度', '東南亞'],
        impactLevel: 'medium',
        impactDesc: '中等影響',
        priceChanges: [{ from: 5.8, to: 4.2, unit: 'USD/kg', change: -1.6, changePercent: '-27.6' }],
        percentChanges: [{ percent: 27.6, direction: 'down' }],
        futureOutlook: 'bearish',
        briefReason: '全球養殖產量過剩，主要產區庫存積壓嚴重',
        hasTariff: false,
        hasLogistics: false,
      },
      publishDate: '2026-04-21',
    },
    {
      id: 'default-9',
      title: '2026年GRI海運漲價：亞洲-美國西岸漲13%',
      source: 'FreightAmigo',
      sourceUrl: 'https://www.freightamigo.com',
      category: 'logistics',
      keyInfo: {
        products: ['集裝箱運輸'],
        regions: ['亞洲', '美國', '歐洲'],
        impactLevel: 'medium',
        impactDesc: '中等影響',
        priceChanges: [{ from: 3200, to: 3616, unit: 'USD/FEU', change: 416, changePercent: '+13.0' }],
        percentChanges: [{ percent: 13.0, direction: 'up' }],
        futureOutlook: 'bullish',
        briefReason: 'GRI生效、紅海危機持續，預計6月再加徵旺季附加費',
        hasTariff: false,
        hasLogistics: true,
      },
      publishDate: '2026-04-21',
    },
  ];
}

// ===== 主函數 =====
async function main() {
  console.log(`[${new Date().toISOString()}] 開始抓取市場新聞...\n`);
  
  let allArticles = [];
  
  // 抓取所有數據源
  for (const source of SOURCES) {
    let articles = [];
    
    if (source.rssUrl) {
      articles = await fetchRSS(source);
    } else if (source.useHtml) {
      articles = await fetchHTML(source);
    }
    
    allArticles = allArticles.concat(articles);
    await sleep(1000); // 避免請求過快
  }
  
  console.log(`\n總共抓取 ${allArticles.length} 條新聞`);
  
  // 如果爬蟲沒有抓到任何新聞，使用默認文章
  if (allArticles.length === 0) {
    console.log('爬蟲未獲取到新聞，使用默認文章');
    allArticles = getDefaultArticles();
  }
  
  // 生成統計數據
  const highImpactCount = allArticles.filter(a => a.keyInfo.impactLevel === 'high').length;
  const priceChangeCount = allArticles.filter(a => a.keyInfo.priceChanges.length > 0 || a.keyInfo.percentChanges.length > 0).length;
  const tariffRelatedCount = allArticles.filter(a => a.keyInfo.hasTariff).length;
  const logisticsRelatedCount = allArticles.filter(a => a.keyInfo.hasLogistics).length;
  
  const outputData = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalArticles: allArticles.length,
      highImpactCount,
      priceChangeCount,
      tariffRelatedCount,
      logisticsRelatedCount,
    },
    priorityArticles: allArticles,
    tariffUpdates: allArticles.filter(a => a.keyInfo.hasTariff).map(a => ({
      id: a.id,
      title: a.title,
      tariffKeywords: [{ en: 'tariff', cn: '關稅', severity: a.keyInfo.impactLevel }],
      countries: a.keyInfo.regions,
      source: a.source,
      sourceUrl: a.sourceUrl,
    })),
    logisticsUpdates: allArticles.filter(a => a.keyInfo.hasLogistics).map(a => ({
      id: a.id,
      title: a.title,
      logisticsKeywords: [{ en: 'shipping', cn: '海運', severity: a.keyInfo.impactLevel }],
      regions: a.keyInfo.regions,
      impact: a.keyInfo.briefReason,
      source: a.source,
      sourceUrl: a.sourceUrl,
    })),
  };
  
  // 保存到 JSON 文件
  const outputPath = path.join(__dirname, '../public/data/news-articles.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n✅ 新聞數據已保存: ${outputPath}`);
  console.log(`📊 總文章: ${allArticles.length} | 重大影響: ${highImpactCount} | 價格變動: ${priceChangeCount} | 關稅相關: ${tariffRelatedCount} | 物流相關: ${logisticsRelatedCount}`);
}

main().catch(error => {
  console.error('❌ 執行失敗:', error.message);
  process.exit(1);
});
