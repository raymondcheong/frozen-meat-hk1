/**
 * 市場數據工具 — 供 fetch-fehd-data.cjs 使用
 */

function calcChange(current, previous) {
  if (previous == null || previous === 0 || current == null) {
    return { change: 0, changePercent: 0 };
  }
  const change = current - previous;
  const changePercent = (change / previous) * 100;
  return { change, changePercent };
}

function fehdToMarketItems(fehd, previousFehd) {
  const prev = previousFehd || null;
  const { todayPrices, todaySupply, tomorrowForecast, dataDate } = fehd;
  const prevPrices = prev?.todayPrices || {};
  const prevSupply = prev?.todaySupply || {};
  const prevForecast = prev?.tomorrowForecast || {};

  const defs = [
    {
      id: 'hk-pig-high',
      name: '活豬最高拍賣價',
      nameEn: 'Live Pig High Price',
      price: todayPrices.highest || 0,
      prevPrice: prevPrices.highest,
      unit: 'HKD/擔',
    },
    {
      id: 'hk-pig-avg',
      name: '活豬平均拍賣價',
      nameEn: 'Live Pig Avg Price',
      price: todayPrices.average || 0,
      prevPrice: prevPrices.average,
      unit: 'HKD/擔',
    },
    {
      id: 'hk-pig-low',
      name: '活豬最低拍賣價',
      nameEn: 'Live Pig Low Price',
      price: todayPrices.lowest || 0,
      prevPrice: prevPrices.lowest,
      unit: 'HKD/擔',
    },
    {
      id: 'hk-pig-supply',
      name: '今日活豬供應量',
      nameEn: "Today's Supply",
      price: todaySupply.total || 0,
      prevPrice: prevSupply.total,
      unit: '頭',
    },
    {
      id: 'hk-pig-forecast',
      name: '明日活豬預計供應',
      nameEn: "Tomorrow's Forecast",
      price: tomorrowForecast.total || 0,
      prevPrice: prevForecast.total,
      unit: '頭',
    },
  ];

  return defs.map(({ prevPrice, price, unit, ...rest }) => {
    const { change, changePercent } = calcChange(price, prevPrice);
    return {
      ...rest,
      price,
      unit,
      change,
      changePercent,
      source: 'FEHD',
      updatedAt: dataDate,
    };
  });
}

module.exports = { calcChange, fehdToMarketItems };
