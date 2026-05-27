export interface MarketItem {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  unit: string;
  change: number;
  changePercent: number;
  source: string;
  updatedAt: string;
}

export interface FEHDData {
  dataDate: string;
  todaySupply: { mainland: number; local: number; total: number };
  todayPrices: { highest: number; lowest: number; average: number };
  tomorrowForecast: { mainland: number; local: number; total: number };
}

export function calcChange(current: number, previous?: number | null) {
  if (previous == null || previous === 0) {
    return { change: 0, changePercent: 0 };
  }
  const change = current - previous;
  const changePercent = (change / previous) * 100;
  return { change, changePercent };
}

export function fehdToMarketItems(fehd: FEHDData, previousFehd?: FEHDData | null): MarketItem[] {
  const { todayPrices, todaySupply, tomorrowForecast, dataDate } = fehd;
  const prevPrices = previousFehd?.todayPrices;
  const prevSupply = previousFehd?.todaySupply;
  const prevForecast = previousFehd?.tomorrowForecast;

  const defs = [
    {
      id: 'hk-pig-high',
      name: '活豬最高拍賣價',
      nameEn: 'Live Pig High Price',
      price: todayPrices.highest || 0,
      prevPrice: prevPrices?.highest,
      unit: 'HKD/擔',
    },
    {
      id: 'hk-pig-avg',
      name: '活豬平均拍賣價',
      nameEn: 'Live Pig Avg Price',
      price: todayPrices.average || 0,
      prevPrice: prevPrices?.average,
      unit: 'HKD/擔',
    },
    {
      id: 'hk-pig-low',
      name: '活豬最低拍賣價',
      nameEn: 'Live Pig Low Price',
      price: todayPrices.lowest || 0,
      prevPrice: prevPrices?.lowest,
      unit: 'HKD/擔',
    },
    {
      id: 'hk-pig-supply',
      name: '今日活豬供應量',
      nameEn: "Today's Supply",
      price: todaySupply.total || 0,
      prevPrice: prevSupply?.total,
      unit: '頭',
    },
    {
      id: 'hk-pig-forecast',
      name: '明日活豬預計供應',
      nameEn: "Tomorrow's Forecast",
      price: tomorrowForecast.total || 0,
      prevPrice: prevForecast?.total,
      unit: '頭',
    },
  ] as const;

  return defs.map(({ prevPrice, price, ...rest }) => {
    const { change, changePercent } = calcChange(price, prevPrice);
    return {
      ...rest,
      price,
      change,
      changePercent,
      source: 'FEHD',
      updatedAt: dataDate,
    };
  });
}
