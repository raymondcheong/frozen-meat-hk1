/**
 * FEHD 活豬供應及拍賣價數據爬蟲
 * 數據來源: https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html
 * 
 * 此腳本只更新 public/data/market-data.json，不修改任何 TSX 文件
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function fetchFEHDData() {
  const url = 'https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html';
  
  console.log(`[${new Date().toISOString()}] 開始抓取 FEHD 數據...`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-HK,zh-TW;q=0.9,zh;q=0.8,en;q=0.7',
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // 提取數據日期
    let dataDate = '';
    $('h2, h3, h4, .sub-title, .title').each((i, el) => {
      const text = $(el).text().trim();
      const match = text.match(/\((\d{2})\/(\d{2})\/(\d{4})\)/);
      if (match) {
        dataDate = `${match[3]}-${match[2]}-${match[1]}`;
      }
    });
    
    // 備用：從整個頁面文本中提取日期
    if (!dataDate) {
      const bodyText = $('body').text();
      const match = bodyText.match(/\((\d{2})\/(\d{2})\/(\d{4})\)/);
      if (match) {
        dataDate = `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
    
    console.log(`數據日期: ${dataDate || '未找到'}`);
    
    // 提取所有表格數據
    const result = {
      dataDate: dataDate || new Date().toISOString().split('T')[0],
      todaySupply: { mainland: 0, local: 0, total: 0 },
      todayPrices: { highest: 0, lowest: 0, average: 0 },
      tomorrowForecast: { mainland: 0, local: 0, total: 0 },
      rawHtml: null,
      extractedAt: new Date().toISOString(),
    };
    
    // 從表格結構提取
    const tables = $('table');
    console.log(`找到 ${tables.length} 個表格`);
    
    tables.each((tableIndex, table) => {
      const rows = $(table).find('tr');
      const tableText = $(table).text();
      
      const isTodaySupply = tableText.includes('今日活豬供應') || tableText.includes("Today's live pig admission");
      const isTodayPrices = tableText.includes('今日活豬拍賣價') || tableText.includes("Today's live pig auction prices");
      const isTomorrowForecast = tableText.includes('明日活豬預計供應') || tableText.includes("Tomorrow's live pig supply forecast");
      
      if (isTodaySupply) {
        console.log(`表格 ${tableIndex}: 今日活豬供應`);
        rows.each((i, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const label = $(cells[0]).text().trim();
            const value = $(cells[1]).text().trim().replace(/,/g, '');
            if (label.includes('Mainland') || label.includes('內地進口')) result.todaySupply.mainland = parseInt(value) || 0;
            if (label.includes('Local') || label.includes('本地')) result.todaySupply.local = parseInt(value) || 0;
            if (label.includes('Total') || label.includes('總數')) result.todaySupply.total = parseInt(value) || 0;
          }
        });
      }
      
      if (isTodayPrices) {
        console.log(`表格 ${tableIndex}: 今日活豬拍賣價`);
        rows.each((i, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const label = $(cells[0]).text().trim();
            const value = $(cells[1]).text().trim().replace(/[$,]/g, '');
            if (label.includes('Highest') || label.includes('最高')) result.todayPrices.highest = parseInt(value) || 0;
            if (label.includes('Lowest') || label.includes('最低')) result.todayPrices.lowest = parseInt(value) || 0;
            if (label.includes('Average') || label.includes('平均')) result.todayPrices.average = parseInt(value) || 0;
          }
        });
      }
      
      if (isTomorrowForecast) {
        console.log(`表格 ${tableIndex}: 明日活豬預計供應`);
        rows.each((i, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const label = $(cells[0]).text().trim();
            const value = $(cells[1]).text().trim().replace(/,/g, '');
            if (label.includes('Mainland') || label.includes('內地進口')) result.tomorrowForecast.mainland = parseInt(value) || 0;
            if (label.includes('Local') || label.includes('本地')) result.tomorrowForecast.local = parseInt(value) || 0;
            if (label.includes('Total') || label.includes('總數')) result.tomorrowForecast.total = parseInt(value) || 0;
          }
        });
      }
    });
    
    // 如果表格提取失敗，嘗試從整個頁面文本提取
    if (!result.todayPrices.average) {
      console.log('嘗試從頁面文本提取數據...');
      const bodyText = $('body').text();
      
      const highestMatch = bodyText.match(/Highest\s*最高\s*\$?([\d,]+)/);
      const lowestMatch = bodyText.match(/Lowest\s*最低\s*\$?([\d,]+)/);
      const averageMatch = bodyText.match(/Average\s*平均\s*\$?([\d,]+)/);
      
      if (highestMatch) result.todayPrices.highest = parseInt(highestMatch[1].replace(/,/g, ''));
      if (lowestMatch) result.todayPrices.lowest = parseInt(lowestMatch[1].replace(/,/g, ''));
      if (averageMatch) result.todayPrices.average = parseInt(averageMatch[1].replace(/,/g, ''));
      
      const supplyPattern = /Mainland\s*內地進口\s*([\d,]+)[\s\S]*?Local\s*本地\s*([\d,]+)[\s\S]*?Total\s*總數\s*([\d,]+)/g;
      const supplyMatches = [...bodyText.matchAll(supplyPattern)];
      if (supplyMatches.length > 0) {
        result.todaySupply.mainland = parseInt(supplyMatches[0][1].replace(/,/g, ''));
        result.todaySupply.local = parseInt(supplyMatches[0][2].replace(/,/g, ''));
        result.todaySupply.total = parseInt(supplyMatches[0][3].replace(/,/g, ''));
      }
      
      if (supplyMatches.length > 1) {
        result.tomorrowForecast.mainland = parseInt(supplyMatches[1][1].replace(/,/g, ''));
        result.tomorrowForecast.local = parseInt(supplyMatches[1][2].replace(/,/g, ''));
        result.tomorrowForecast.total = parseInt(supplyMatches[1][3].replace(/,/g, ''));
      }
    }
    
    console.log('\n=== 提取結果 ===');
    console.log('數據日期:', result.dataDate);
    console.log('今日活豬供應:', result.todaySupply);
    console.log('今日拍賣價:', result.todayPrices);
    console.log('明日預計供應:', result.tomorrowForecast);
    console.log('================\n');
    
    return result;
    
  } catch (error) {
    console.error('抓取失敗:', error.message);
    throw error;
  }
}

// 更新 JSON 數據文件（不再修改 TSX！）
function updateJsonData(data) {
  const jsonPath = path.join(__dirname, '../public/data/market-data.json');
  
  // 讀取現有 JSON
  let jsonData = {};
  try {
    jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    console.log('創建新的 JSON 文件');
    jsonData = {
      cme: [
        { id: 'LE', name: '活牛期貨', nameEn: 'Live Cattle Futures', price: 247.63, unit: 'USD/cwt', change: -3.47, changePercent: -1.38, source: 'CME Group', updatedAt: '2026-04-17' },
        { id: 'GF', name: '育肥牛期貨', nameEn: 'Feeder Cattle Futures', price: 367.10, unit: 'USD/cwt', change: -3.85, changePercent: -1.04, source: 'CME Group', updatedAt: '2026-04-17' },
        { id: 'HE', name: '瘦肉豬期貨', nameEn: 'Lean Hog Futures', price: 101.68, unit: 'USD/cwt', change: -0.28, changePercent: -0.27, source: 'CME Group', updatedAt: '2026-04-17' },
        { id: 'LHI', name: '瘦肉豬指數', nameEn: 'Lean Hog Index', price: 90.76, unit: 'USD/cwt', change: 0.46, changePercent: 0.51, source: 'CME Group', updatedAt: '2026-04-15' },
        { id: 'PCI', name: '豬肉切塊指數', nameEn: 'Pork Cutout Index', price: 98.70, unit: 'USD/cwt', change: 0.55, changePercent: 0.56, source: 'CME Group', updatedAt: '2026-04-17' },
      ],
      seafood: [
        { id: 'fish-global', name: '全球魚類價格', nameEn: 'Global Fish Price', price: 9.18, unit: 'USD/kg', change: 1.05, changePercent: 12.9, source: 'IMF/FRED', updatedAt: '2026-Q1' },
        { id: 'shrimp-ucn', name: '全球蝦價格指數', nameEn: 'Global Shrimp Index', price: 3.33, unit: 'USD/kg', change: -0.21, changePercent: -5.9, source: 'UCN', updatedAt: '2026-04' },
        { id: 'shrimp-ec', name: '厄瓜多爾蝦價', nameEn: 'Ecuador Shrimp', price: 5.00, unit: 'USD/kg', change: -0.20, changePercent: -3.85, source: 'Food World', updatedAt: '2026-04' },
        { id: 'salmon-cn', name: '中國進口三文魚', nameEn: 'China Import Salmon', price: 9.60, unit: 'USD/kg', change: -4.60, changePercent: -32.39, source: 'Norwegian Seafood Council', updatedAt: '2026-04' },
        { id: 'scallop-usa', name: '美國海扇貝', nameEn: 'US Sea Scallops', price: 18.75, unit: 'USD/lb', change: -0.50, changePercent: -2.60, source: 'Urner Barry', updatedAt: '2026-04' },
      ]
    };
  }
  
  // 只更新 FEHD 部分
  jsonData.fehd = {
    dataDate: data.dataDate,
    todayPrices: data.todayPrices,
    todaySupply: data.todaySupply,
    tomorrowForecast: data.tomorrowForecast,
  };
  
  // 確保目錄存在
  const dir = path.dirname(jsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`✅ JSON 數據已更新: ${jsonPath}`);
}

// 主函數
async function main() {
  try {
    const data = await fetchFEHDData();
    
    // 驗證數據
    if (!data.todayPrices.average && !data.todayPrices.highest) {
      throw new Error('未能提取到拍賣價數據');
    }
    
    // 只更新 JSON 文件，不修改 TSX！
    updateJsonData(data);
    
    // 保存原始數據備份
    const backupPath = path.join(__dirname, '../data/fehd-latest.json');
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`✅ 數據備份已保存: ${backupPath}`);
    
    console.log('\n🎉 數據更新完成！請執行 npm run build 重新構建');
    
  } catch (error) {
    console.error('❌ 執行失敗:', error.message);
    process.exit(1);
  }
}

main();
