/**
 * 抓取农业农村部内地猪牛价格，写入 market-data.json
 */
const fs = require('fs');
const path = require('path');
const {
  fetchLatestWeeklyReport,
  fetchWeeklyHistory,
  findLatestMonthlyPorkUrl,
  parseMonthlyPork,
  weeklyToMarketItems,
  formatMainlandWeekLabel,
} = require('./mainland-meat-utils.cjs');

const JSON_PATH = path.join(__dirname, '../public/data/market-data.json');

async function fetchMainlandMeatData() {
  console.log(`[${new Date().toISOString()}] 開始抓取內地豬牛價格...`);

  const weekly = await fetchLatestWeeklyReport();
  console.log(`  ✓ 最新周報：${weekly.weekLabel}（${weekly.date}）`);

  const history = await fetchWeeklyHistory(12);
  console.log(`  ✓ 歷史周報：${history.length} 期`);

  let monthly = null;
  const monthlyMeta = await findLatestMonthlyPorkUrl();
  if (monthlyMeta) {
    monthly = parseMonthlyPork(monthlyMeta.html, monthlyMeta);
    console.log(`  ✓ 月度批發：${monthly.month} 白條豬 ${monthly.wholesale?.price} 元/公斤`);
  }

  const items = weeklyToMarketItems(weekly, monthly);

  return {
    summary: {
      weekLabel: weekly.weekLabel,
      dataDate: weekly.date,
      sourceUrl: weekly.sourceUrl,
      monthlyLabel: monthly?.month || null,
      monthlySourceUrl: monthlyMeta?.url || null,
    },
    items,
    history: history.map((h) => ({
      date: h.date,
      label: formatMainlandWeekLabel(
        h.weekLabel.replace(/\d{4}-\d{2}-\d{2}/, '').trim() || h.weekLabel
      ),
      pork: h.pork,
      beef: h.beef,
      pig: h.pig,
    })),
    updatedAt: new Date().toISOString(),
  };
}

function updateMarketJson(mainland) {
  let json = {};
  try {
    json = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  } catch {
    json = {};
  }
  json.mainland = mainland;
  fs.writeFileSync(JSON_PATH, JSON.stringify(json, null, 2));
  console.log(`✅ mainland 已更新 → ${JSON_PATH}`);
}

async function main() {
  const mainland = await fetchMainlandMeatData();
  updateMarketJson(mainland);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ 內地肉價抓取失敗:', err.message);
    process.exit(1);
  });
}

module.exports = { fetchMainlandMeatData, updateMarketJson };
