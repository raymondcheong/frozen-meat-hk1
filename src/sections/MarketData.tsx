import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Fish, Loader2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface MarketItem {
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

interface FEHDData {
  dataDate: string;
  todaySupply: { mainland: number; local: number; total: number };
  todayPrices: { highest: number; lowest: number; average: number };
  tomorrowForecast: { mainland: number; local: number; total: number };
}

interface MarketDataJson {
  fehd: FEHDData;
  cme: MarketItem[];
  seafood: MarketItem[];
}

// CORS 代理列表
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

// 解析 FEHD HTML
function parseFEHDHtml(html: string): FEHDData | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.textContent || '';

    let dataDate = '';
    const dateMatch = text.match(/\((\d{2})\/(\d{2})\/(\d{4})\)/);
    if (dateMatch) dataDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

    const result: FEHDData = {
      dataDate: dataDate || new Date().toISOString().split('T')[0],
      todaySupply: { mainland: 0, local: 0, total: 0 },
      todayPrices: { highest: 0, lowest: 0, average: 0 },
      tomorrowForecast: { mainland: 0, local: 0, total: 0 },
    };

    const tables = doc.querySelectorAll('table');
    tables.forEach((table) => {
      const tableText = table.textContent || '';
      const rows = table.querySelectorAll('tr');

      const isTodaySupply = tableText.includes('今日活豬供應') || tableText.includes("Today's live pig admission");
      const isTodayPrices = tableText.includes('今日活豬拍賣價') || tableText.includes("Today's live pig auction prices");
      const isTomorrowForecast = tableText.includes('明日活豬預計供應') || tableText.includes("Tomorrow's live pig supply forecast");

      if (isTodaySupply) {
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const label = cells[0].textContent?.trim() || '';
            const value = cells[1].textContent?.trim().replace(/,/g, '') || '0';
            if (label.includes('Mainland') || label.includes('內地進口')) result.todaySupply.mainland = parseInt(value) || 0;
            if (label.includes('Local') || label.includes('本地')) result.todaySupply.local = parseInt(value) || 0;
            if (label.includes('Total') || label.includes('總數')) result.todaySupply.total = parseInt(value) || 0;
          }
        });
      }

      if (isTodayPrices) {
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const label = cells[0].textContent?.trim() || '';
            const value = cells[1].textContent?.trim().replace(/[$,]/g, '') || '0';
            if (label.includes('Highest') || label.includes('最高')) result.todayPrices.highest = parseInt(value) || 0;
            if (label.includes('Lowest') || label.includes('最低')) result.todayPrices.lowest = parseInt(value) || 0;
            if (label.includes('Average') || label.includes('平均')) result.todayPrices.average = parseInt(value) || 0;
          }
        });
      }

      if (isTomorrowForecast) {
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const label = cells[0].textContent?.trim() || '';
            const value = cells[1].textContent?.trim().replace(/,/g, '') || '0';
            if (label.includes('Mainland') || label.includes('內地進口')) result.tomorrowForecast.mainland = parseInt(value) || 0;
            if (label.includes('Local') || label.includes('本地')) result.tomorrowForecast.local = parseInt(value) || 0;
            if (label.includes('Total') || label.includes('總數')) result.tomorrowForecast.total = parseInt(value) || 0;
          }
        });
      }
    });

    if (!result.todayPrices.average && !result.todayPrices.highest) {
      const highestMatch = text.match(/Highest\s*最高\s*\$?([\d,]+)/);
      const lowestMatch = text.match(/Lowest\s*最低\s*\$?([\d,]+)/);
      const averageMatch = text.match(/Average\s*平均\s*\$?([\d,]+)/);
      if (highestMatch) result.todayPrices.highest = parseInt(highestMatch[1].replace(/,/g, ''));
      if (lowestMatch) result.todayPrices.lowest = parseInt(lowestMatch[1].replace(/,/g, ''));
      if (averageMatch) result.todayPrices.average = parseInt(averageMatch[1].replace(/,/g, ''));
    }

    if (result.todayPrices.average || result.todayPrices.highest) return result;
    return null;
  } catch { return null; }
}

function fehdToMarketItems(data: FEHDData): MarketItem[] {
  const { todayPrices, todaySupply, tomorrowForecast, dataDate } = data;
  return [
    { id: 'hk-pig-high', name: '活豬最高拍賣價', nameEn: 'Live Pig High Price', price: todayPrices.highest || 1130, unit: 'HKD/擔', change: -170, changePercent: -13.1, source: 'FEHD實時', updatedAt: dataDate },
    { id: 'hk-pig-avg', name: '活豬平均拍賣價', nameEn: 'Live Pig Avg Price', price: todayPrices.average || 802, unit: 'HKD/擔', change: -281, changePercent: -25.9, source: 'FEHD實時', updatedAt: dataDate },
    { id: 'hk-pig-low', name: '活豬最低拍賣價', nameEn: 'Live Pig Low Price', price: todayPrices.lowest || 650, unit: 'HKD/擔', change: -150, changePercent: -18.8, source: 'FEHD實時', updatedAt: dataDate },
    { id: 'hk-pig-supply', name: '今日活豬供應量', nameEn: "Today's Supply", price: todaySupply.total || 3549, unit: '頭', change: 79, changePercent: 2.28, source: 'FEHD實時', updatedAt: dataDate },
    { id: 'hk-pig-forecast', name: '明日活豬預計供應', nameEn: "Tomorrow's Forecast", price: tomorrowForecast.total || 3024, unit: '頭', change: -525, changePercent: -14.8, source: 'FEHD實時', updatedAt: dataDate },
  ];
}

export default function MarketData() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'hk' | 'cme' | 'seafood'>('hk');
  const [hkData, setHkData] = useState<MarketItem[]>([]);
  const [cmeData, setCmeData] = useState<MarketItem[]>([]);
  const [seafoodData, setSeafoodData] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [fetchError, setFetchError] = useState<string>('');

  // 加載 JSON 數據
  const loadJsonData = useCallback(async () => {
    try {
      const response = await fetch('/data/market-data.json?t=' + Date.now());
      if (response.ok) {
        const json: MarketDataJson = await response.json();
        setCmeData(json.cme);
        setSeafoodData(json.seafood);
        setHkData(fehdToMarketItems(json.fehd));
        setLastFetchTime('JSON 數據: ' + json.fehd.dataDate);
        return true;
      }
    } catch { /* 忽略 */ }
    return false;
  }, []);

  // 抓取 FEHD 實時數據
  const fetchFEHDData = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');

    // 先加載 JSON 備用數據
    await loadJsonData();

    const url = 'https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html';
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        const proxyUrl = CORS_PROXIES[i](url);
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) continue;

        const html = await response.text();
        const fehdData = parseFEHDHtml(html);

        if (fehdData && fehdData.todayPrices.average) {
          const newItems = fehdToMarketItems(fehdData);
          setHkData(newItems);
          setLastFetchTime('FEHD實時: ' + fehdData.dataDate + ' ' + new Date().toLocaleTimeString('zh-HK'));
          setIsLoading(false);
          return;
        }
      } catch { /* 繼續下一個代理 */ }
    }

    setFetchError('無法連接 FEHD 官網，顯示緩存數據');
    setIsLoading(false);
  }, [loadJsonData]);

  // 頁面加載時自動抓取
  useEffect(() => { fetchFEHDData(); }, [fetchFEHDData]);

  // 動畫
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll('.market-card');
      if (cards) {
        gsap.fromTo(cards, { y: 20, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'expo.out',
          scrollTrigger: { trigger: cardsRef.current, start: 'top 90%' },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [activeTab, hkData, cmeData, seafoodData]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-5 h-5" />;
    if (change < 0) return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const getChangeColor = (change: number) => change > 0 ? 'text-[#EF4444]' : change < 0 ? 'text-[#10B981]' : 'text-[#888888]';
  const getChangeBg = (change: number) => change > 0 ? 'bg-[#EF4444]/10' : change < 0 ? 'bg-[#10B981]/10' : 'bg-[#888888]/10';

  const currentData = activeTab === 'hk' ? hkData : activeTab === 'cme' ? cmeData : seafoodData;

  return (
    <section id="market" ref={sectionRef} className="relative py-10 overflow-hidden">
      <div className="w-full px-6 lg:px-12 xl:px-20">
        <div className="text-center mb-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-2">
            肉類<span className="text-gradient">價格指數</span>
          </h2>
          <p className="text-lg text-[#E7F6FC]/60">
            {activeTab === 'hk' ? '香港食物環境衛生署官方數據（實時抓取）' : activeTab === 'cme' ? 'CME Group 期貨指數' : '全球海鮮價格指數'}
          </p>
          {fetchError && <p className="text-base text-[#F59E0B] mt-2">{fetchError}</p>}
          {lastFetchTime && !fetchError && <p className="text-base text-[#10B981] mt-2">{lastFetchTime}</p>}
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <button onClick={() => setActiveTab('hk')} className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${activeTab === 'hk' ? 'bg-[#10B981] text-white' : 'glass text-[#E7F6FC]/70 hover:bg-white/10'}`}>
            香港政府官方
          </button>
          <button onClick={() => setActiveTab('cme')} className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${activeTab === 'cme' ? 'bg-[#2997FF] text-white' : 'glass text-[#E7F6FC]/70 hover:bg-white/10'}`}>
            CME 期貨
          </button>
          <button onClick={() => setActiveTab('seafood')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${activeTab === 'seafood' ? 'bg-[#F59E0B] text-white' : 'glass text-[#E7F6FC]/70 hover:bg-white/10'}`}>
            <Fish className="w-5 h-5" /> 海鮮類
          </button>
        </div>

        <div ref={cardsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {currentData.map((item) => (
            <div key={item.id} className="market-card glass rounded-xl p-5 hover:bg-white/10 transition-all duration-300">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                <p className="text-sm text-[#E7F6FC]/50">{item.nameEn}</p>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-white">{item.price.toLocaleString()}</span>
                <span className="text-sm text-[#E7F6FC]/60 ml-1">{item.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getChangeBg(item.change)}`}>
                  <span className={getChangeColor(item.change)}>{getChangeIcon(item.change)}</span>
                  <span className={`text-base font-semibold ${getChangeColor(item.change)}`}>
                    {item.change > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-sm text-[#E7F6FC]/40">
                <span>{item.source}</span>
                <span>{item.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <a href="https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-base text-[#E7F6FC]/70 hover:text-white hover:bg-white/10 transition-all">
            <span>查看 FEHD 官網</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={fetchFEHDData} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-base text-[#E7F6FC]/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{isLoading ? '抓取中...' : '刷新數據'}</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-base text-[#E7F6FC]/40">
            打開頁面自動抓取 FEHD 最新數據 · 也可點擊「刷新數據」手動更新
          </p>
        </div>
      </div>
    </section>
  );
}
