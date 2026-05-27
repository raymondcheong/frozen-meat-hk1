/**
 * 农业农村部 · 内地畜产品市场价格解析
 */
const axios = require('axios');
const cheerio = require('cheerio');

const JCYJ_LIST = 'https://xmsyj.moa.gov.cn/jcyj/';
const JCYJ_BASE = 'https://xmsyj.moa.gov.cn/jcyj/';

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      Accept: 'text/html',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    validateStatus: (s) => s < 500,
  });
  if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.data;
}

function parsePercent(text) {
  if (!text || text === '—' || text === '-') return 0;
  return parseFloat(String(text).replace('%', '')) || 0;
}

/** 橫軸顯示：如「3月第2周」 */
function formatMainlandWeekLabel(label) {
  const m = String(label).match(/(\d{1,2}月第\d{1,2}周)/);
  if (m) return m[1];
  return String(label)
    .replace(/畜产品和饲料.*$/, '')
    .replace(/畜产品.*$/, '')
    .trim();
}

function parseWeeklyTable(html) {
  const $ = cheerio.load(html);
  const rows = {};
  $('table tr').each((_, tr) => {
    const cells = $(tr)
      .find('td, th')
      .map((__, c) => $(c).text().trim())
      .get();
    if (cells.length >= 6 && /^(仔猪|生猪|猪肉|牛肉|羊肉)$/.test(cells[0])) {
      rows[cells[0]] = {
        price: parseFloat(cells[1]) || 0,
        yoyPercent: parsePercent(cells[3]),
        wowPercent: parsePercent(cells[5]),
      };
    }
  });
  return rows;
}

function parseWeeklyProse(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const compact = text.replace(/\s+/g, '');
  const pick = (re) => {
    const m = compact.match(re) || text.match(re);
    return m ? parseFloat(m[1]) : 0;
  };
  const pickWow = (label) => {
    const re = new RegExp(`全国${label}平均价格[\\d.]+元/公斤，比前一周(上涨|下跌)([\\d.]+)%`);
    const m = compact.match(re);
    if (!m) return 0;
    const val = parseFloat(m[2]) || 0;
    return m[1] === '下跌' ? -val : val;
  };
  return {
    猪肉: pick(/全国猪肉平均价格([\d.]+)元\/公斤/),
    牛肉: pick(/全国牛肉平均价格([\d.]+)元\/公斤/),
    生猪: pick(/全国生猪平均价格([\d.]+)元\/公斤/),
    仔猪: pick(/全国仔猪平均价格([\d.]+)元\/公斤/),
    beefMain: pick(/主产省份牛肉价格([\d.]+)元\/公斤/),
    porkWow: pickWow('猪肉'),
    beefWow: pickWow('牛肉'),
    pigWow: pickWow('生猪'),
    weekTitle: (text.match(/(\d{1,2}月第\d周畜产品)/) || [])[0] || '',
  };
}

function parseWeeklyReport(html, meta = {}) {
  const table = parseWeeklyTable(html);
  const prose = parseWeeklyProse(html);

  const pork = table['猪肉']?.price
    ? table['猪肉']
    : { price: prose['猪肉'], wowPercent: prose.porkWow, yoyPercent: 0 };
  const beef = table['牛肉']?.price
    ? table['牛肉']
    : { price: prose['牛肉'], wowPercent: prose.beefWow, yoyPercent: 0 };
  const pig = table['生猪']?.price
    ? table['生猪']
    : { price: prose['生猪'], wowPercent: prose.pigWow, yoyPercent: 0 };
  const piglet = table['仔猪'] || { price: prose['仔猪'], wowPercent: 0, yoyPercent: 0 };

  const dateMatch = (meta.text || '').match(/(\d{4}-\d{2}-\d{2})/);
  const weekLabel = meta.text?.replace(dateMatch?.[0] || '', '').trim() || prose.weekTitle || '畜产品周报';

  return {
    date: dateMatch?.[1] || new Date().toISOString().split('T')[0],
    weekLabel,
    sourceUrl: meta.url || '',
    pork: pork.price,
    beef: beef.price,
    pig: pig.price,
    piglet: piglet.price,
    beefMain: prose.beefMain || 0,
    changes: {
      porkWow: pork.wowPercent,
      beefWow: beef.wowPercent,
      pigWow: pig.wowPercent,
      porkYoy: pork.yoyPercent,
      beefYoy: beef.yoyPercent,
    },
  };
}

async function listWeeklyReportLinks(limit = 12) {
  const html = await fetchHtml(JCYJ_LIST);
  const $ = cheerio.load(html);
  const links = [];
  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (/畜产品和饲料集贸市场价格情况/.test(text) && href.endsWith('.htm')) {
      const url = href.startsWith('http') ? href : `${JCYJ_BASE}${href.replace(/^\.\//, '')}`;
      links.push({ text, url });
    }
  });
  return links.slice(0, limit);
}

async function fetchLatestWeeklyReport() {
  const links = await listWeeklyReportLinks(1);
  if (!links.length) throw new Error('未找到畜产品周报链接');
  const html = await fetchHtml(links[0].url);
  return parseWeeklyReport(html, links[0]);
}

async function fetchWeeklyHistory(limit = 12) {
  const links = await listWeeklyReportLinks(limit);
  const history = [];
  for (const link of links) {
    try {
      const html = await fetchHtml(link.url);
      history.push(parseWeeklyReport(html, link));
    } catch (err) {
      console.warn('  略過周报:', link.url, err.message);
    }
  }
  return history.sort((a, b) => a.date.localeCompare(b.date));
}

async function findLatestMonthlyPorkUrl() {
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const url = `https://www.moa.gov.cn/ztzl/szcpxx/jdsj/${y}/${y}${mm}/`;
    try {
      const html = await fetchHtml(url);
      if (/批发市场白条猪价格/.test(html)) return { url, html, month: `${y}年${parseInt(mm, 10)}月` };
    } catch {
      /* try previous month */
    }
  }
  return null;
}

function parseMonthlyPork(html, meta) {
  const $ = cheerio.load(html);
  let wholesale = null;
  let livePig = null;
  $('table tr').each((_, tr) => {
    const cells = $(tr)
      .find('td')
      .map((__, td) => $(td).text().trim())
      .get();
    if (cells.length >= 4) {
      if (/全国批发市场白条猪价格/.test(cells[1])) {
        wholesale = {
          price: parseFloat(cells[2]) || 0,
          wowPercent: parsePercent(cells[3]),
          yoyPercent: parsePercent(cells[4]),
        };
      }
      if (/全国生猪出场价格/.test(cells[1])) {
        livePig = {
          price: parseFloat(cells[2]) || 0,
          wowPercent: parsePercent(cells[3]),
          yoyPercent: parsePercent(cells[4]),
        };
      }
    }
  });
  return { wholesale, livePig, month: meta.month, sourceUrl: meta.url };
}

function weeklyToMarketItems(weekly, monthly) {
  const updatedAt = weekly.date;
  const mk = (id, name, price, wow, yoy, unit, note) => ({
    id,
    name,
    nameEn: '',
    price,
    unit,
    change: price && wow ? (price * wow) / (100 + wow) : 0,
    changePercent: wow,
    source: note || '農業農村部',
    updatedAt,
    meta: { yoyPercent: yoy },
  });

  const items = [
    mk('cn-pork-market', '豬肉集貿均價', weekly.pork, weekly.changes.porkWow, weekly.changes.porkYoy, '人民幣/公斤', '每週監測'),
    mk('cn-beef-market', '牛肉集貿均價', weekly.beef, weekly.changes.beefWow, weekly.changes.beefYoy, '人民幣/公斤', '每週監測'),
    mk('cn-pig-market', '生豬均價', weekly.pig, weekly.changes.pigWow, 0, '人民幣/公斤', '每週監測'),
  ];

  if (monthly?.wholesale?.price) {
    items.push({
      id: 'cn-pork-wholesale',
      name: '白條豬批發價',
      nameEn: '',
      price: monthly.wholesale.price,
      unit: '人民幣/公斤',
      change: 0,
      changePercent: monthly.wholesale.wowPercent,
      source: '農業農村部·月度',
      updatedAt: monthly.month,
      meta: { yoyPercent: monthly.wholesale.yoyPercent, period: 'monthly' },
    });
  }

  if (weekly.beefMain) {
    items.push({
      id: 'cn-beef-main',
      name: '主產省牛肉價',
      nameEn: '',
      price: weekly.beefMain,
      unit: '人民幣/公斤',
      change: 0,
      changePercent: 0,
      source: '河北等10省',
      updatedAt,
      meta: {},
    });
  }

  return items;
}

module.exports = {
  fetchLatestWeeklyReport,
  fetchWeeklyHistory,
  findLatestMonthlyPorkUrl,
  parseMonthlyPork,
  weeklyToMarketItems,
  parseWeeklyReport,
  formatMainlandWeekLabel,
};
