/**
 * FEHD 每日活豬供應及拍賣價 — 歷史表格解析
 * 月度頁面將整月數據壓縮在單行各欄位中，需按日期數量拆分。
 */

function splitDates(text) {
  return (text.match(/\d{2}\/\d{2}\/\d{4}/g) || []).map((d) => {
    const [day, month, year] = d.split('/');
    return `${year}-${month}-${day}`;
  });
}

function splitFormattedNumbers(text, count) {
  const parts = [];
  let rest = text.replace(/\s/g, '');
  while (parts.length < count && rest.length) {
    const match = rest.match(/^(\d{1,3},\d{3})/);
    if (match) {
      parts.push(parseInt(match[1].replace(/,/g, ''), 10));
      rest = rest.slice(match[1].length);
      continue;
    }
    const plain = rest.match(/^(\d{3,4})/);
    if (plain) {
      parts.push(parseInt(plain[1], 10));
      rest = rest.slice(plain[1].length);
      continue;
    }
    break;
  }
  return parts;
}

function splitMainlandSupply(text, count) {
  return splitFormattedNumbers(text, count);
}

function splitLocalSupply(text, count) {
  const digits = text.replace(/\D/g, '');
  const values = [];
  for (let i = 0; i < count; i++) {
    const chunk = digits.slice(i * 3, i * 3 + 3);
    if (!chunk) break;
    values.push(parseInt(chunk, 10));
  }
  return values;
}

function splitPrices(text, count) {
  const parts = text
    .split('$')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => parseInt(p.replace(/,/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  return parts.slice(0, count);
}

function parseDailyMonthlyPage(html) {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const table = $('table').first();
  const rows = table.find('tr');
  if (rows.length < 3) return [];

  const dataRow = rows.eq(2);
  const cells = dataRow
    .find('td')
    .map((_, c) => $(c).text().replace(/\s+/g, ' ').trim())
    .get();

  if (cells.length < 7) return [];

  const dates = splitDates(cells[0]);
  const count = dates.length;
  if (!count) return [];

  const mainland = splitMainlandSupply(cells[1], count);
  const local = splitLocalSupply(cells[2], count);
  const total = splitMainlandSupply(cells[3], count);
  const highest = splitPrices(cells[4], count);
  const lowest = splitPrices(cells[5], count);
  const average = splitPrices(cells[6], count);

  const records = [];
  for (let i = 0; i < count; i++) {
    records.push({
      date: dates[i],
      supply: {
        mainland: mainland[i] ?? 0,
        local: local[i] ?? 0,
        total: total[i] ?? 0,
      },
      prices: {
        highest: highest[i] ?? 0,
        lowest: lowest[i] ?? 0,
        average: average[i] ?? 0,
      },
    });
  }
  return records;
}

function mergeHistoryRecords(existing, incoming) {
  const map = new Map();
  for (const row of existing) map.set(row.date, row);
  for (const row of incoming) map.set(row.date, row);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function lastNDays(records, days = 30) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(-days);
}

function formatChartLabel(isoDate) {
  const [, month, day] = isoDate.split('-');
  return `${parseInt(month, 10)}/${parseInt(day, 10)}`;
}

module.exports = {
  splitDates,
  splitMainlandSupply,
  splitLocalSupply,
  splitPrices,
  parseDailyMonthlyPage,
  mergeHistoryRecords,
  lastNDays,
  formatChartLabel,
};
