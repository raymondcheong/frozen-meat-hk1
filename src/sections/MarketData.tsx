import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Fish, Loader2, MapPin } from 'lucide-react';
import { fehdToMarketItems, type FEHDData, type MarketItem } from '../lib/market-utils';
import { toChartData, type FehdHistoryPoint } from '../lib/fehd-history';
import { localizeSource, localizeUnit } from '../lib/overseas-zh-tw';
import { toMainlandChartData, cnyToHkdRef, type MainlandMeatData } from '../lib/mainland-meat';
import FehdTrendCharts from '../components/FehdTrendCharts';
import MainlandMeatCharts from '../components/MainlandMeatCharts';

gsap.registerPlugin(ScrollTrigger);

interface MarketDataJson {
  fehd: FEHDData;
  fehdPrevious?: FEHDData | null;
  fehdHistory?: FehdHistoryPoint[];
  hk?: MarketItem[];
  cme: MarketItem[];
  seafood: MarketItem[];
  mainland?: MainlandMeatData;
  lastUpdated?: string;
}

type MarketTab = 'hk' | 'mainland' | 'cme' | 'seafood';

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

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
  } catch {
    return null;
  }
}

async function fetchLiveFehdData(): Promise<FEHDData | null> {
  const url = 'https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html';
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i](url);
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) continue;

      const html = await response.text();
      const fehdData = parseFEHDHtml(html);
      if (fehdData?.todayPrices.average) return fehdData;
    } catch {
      /* 繼續下一個代理 */
    }
  }
  return null;
}

export default function MarketData() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cachedFehdRef = useRef<FEHDData | null>(null);
  const [activeTab, setActiveTab] = useState<MarketTab>('hk');
  const [hkData, setHkData] = useState<MarketItem[]>([]);
  const [mainlandData, setMainlandData] = useState<MainlandMeatData | null>(null);
  const [cmeData, setCmeData] = useState<MarketItem[]>([]);
  const [seafoodData, setSeafoodData] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [fetchError, setFetchError] = useState<string>('');
  const [fehdHistory, setFehdHistory] = useState<FehdHistoryPoint[]>([]);

  const applyJsonData = useCallback((json: MarketDataJson) => {
    cachedFehdRef.current = json.fehd;
    setCmeData(json.cme ?? []);
    setSeafoodData(json.seafood ?? []);
    setFehdHistory(json.fehdHistory ?? []);
    setMainlandData(json.mainland ?? null);
    const hkItems = json.hk?.length
      ? json.hk
      : fehdToMarketItems(json.fehd, json.fehdPrevious);
    setHkData(hkItems);
    setLastFetchTime('JSON 數據: ' + json.fehd.dataDate);
  }, []);

  const loadJsonData = useCallback(async (): Promise<MarketDataJson | null> => {
    try {
      const response = await fetch('/data/market-data.json?t=' + Date.now());
      if (response.ok) {
        const json: MarketDataJson = await response.json();
        applyJsonData(json);
        return json;
      }
    } catch {
      /* 忽略 */
    }
    return null;
  }, [applyJsonData]);

  const fetchFEHDData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
      setFetchError('');
    }

    const cachedJson = await loadJsonData();
    const previousFehd = cachedJson?.fehd ?? cachedFehdRef.current;
    const fehdData = await fetchLiveFehdData();

    if (fehdData) {
      const newItems = fehdToMarketItems(fehdData, previousFehd);
      setHkData(newItems.map((item) => ({ ...item, source: 'FEHD實時' })));
      setLastFetchTime('FEHD實時: ' + fehdData.dataDate + ' ' + new Date().toLocaleTimeString('zh-HK'));
    } else {
      setFetchError('無法連接 FEHD 官網，顯示緩存數據');
    }

    setIsLoading(false);
  }, [loadJsonData]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const cachedJson = await loadJsonData();
      if (cancelled) return;

      const previousFehd = cachedJson?.fehd ?? null;
      const fehdData = await fetchLiveFehdData();
      if (cancelled) return;

      if (fehdData) {
        const newItems = fehdToMarketItems(fehdData, previousFehd);
        setHkData(newItems.map((item) => ({ ...item, source: 'FEHD實時' })));
        setLastFetchTime('FEHD實時: ' + fehdData.dataDate + ' ' + new Date().toLocaleTimeString('zh-HK'));
      } else {
        setFetchError('無法連接 FEHD 官網，顯示緩存數據');
      }

      setIsLoading(false);
    }

    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [loadJsonData]);

  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll('.market-card');
    if (!cards?.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { y: 12, opacity: 0.3 },
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
          stagger: 0.04,
          ease: 'power2.out',
          overwrite: 'auto',
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [activeTab, hkData, mainlandData, cmeData, seafoodData]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-5 h-5" />;
    if (change < 0) return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const getChangeColor = (change: number) => change > 0 ? 'nfh-stat-up' : change < 0 ? 'nfh-stat-down' : 'nfh-stat-flat';
  const getChangeBg = (change: number) => change > 0 ? 'bg-[#FDF6EE]' : change < 0 ? 'bg-[#E6F5EF]' : 'bg-[#F7F5F2]';

  const currentData =
    activeTab === 'hk'
      ? hkData
      : activeTab === 'mainland'
        ? (mainlandData?.items ?? [])
        : activeTab === 'cme'
          ? cmeData
          : seafoodData;

  const tabDescriptions: Record<MarketTab, string> = {
    hk: '香港食環署官方數據 · 活豬拍賣價（港元/擔）',
    mainland: mainlandData
      ? `${mainlandData.summary.weekLabel} · 農業農村部全國500縣集貿監測（人民幣/公斤）`
      : '農業農村部 · 內地豬牛價格參考（人民幣/公斤）',
    cme: 'CME 牲畜期貨 · Stooq 延遲報價 · 每日自動更新',
    seafood: 'IMF/FRED 全球魚蝦價 · 部分按指數推算 · 每日自動更新',
  };

  const chartData = toChartData(fehdHistory);
  const mainlandChartData = toMainlandChartData(mainlandData?.history ?? []);
  const isMainland = activeTab === 'mainland';

  return (
    <section id="market" ref={sectionRef} className="py-10 bg-[#F7F5F2]">
      <div className="nfh-container">
        <div className="mb-8">
          <h2 className="nfh-section-title">肉類價格指數</h2>
          <p className="nfh-section-subtitle">{tabDescriptions[activeTab]}</p>
          {fetchError && <p className="text-sm text-[#E8A317] mt-2 font-medium">{fetchError}</p>}
          {lastFetchTime && !fetchError && <p className="text-sm text-[#00875A] mt-2 font-medium">{lastFetchTime}</p>}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveTab('hk')} className={`nfh-tab ${activeTab === 'hk' ? 'nfh-tab-active' : ''}`}>香港豬價</button>
          <button onClick={() => setActiveTab('mainland')} className={`nfh-tab inline-flex items-center gap-1.5 ${activeTab === 'mainland' ? 'nfh-tab-active' : ''}`}>
            <MapPin className="w-5 h-5" /> 內地肉價
          </button>
          <button onClick={() => setActiveTab('cme')} className={`nfh-tab ${activeTab === 'cme' ? 'nfh-tab-active' : ''}`}>國際期貨</button>
          <button onClick={() => setActiveTab('seafood')} className={`nfh-tab inline-flex items-center gap-1 ${activeTab === 'seafood' ? 'nfh-tab-active' : ''}`}>
            <Fish className="w-4 h-4" /> 海產參考
          </button>
        </div>

        <div ref={cardsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {currentData.length === 0 ? (
            <div className="col-span-full nfh-card p-10 text-center text-lg text-[#555555]">
              {activeTab === 'cme'
                ? '暫無國際期貨數據，請執行 npm run update-data 更新'
                : activeTab === 'seafood'
                  ? '暫無海產指數數據，請配置 FRED_API_KEY 後執行 npm run update-data'
                  : '暫無數據'}
            </div>
          ) : null}
          {currentData.map((item) => (
            <div key={item.id} className="market-card nfh-card-accent p-4 sm:p-5">
              <div className="mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-[#1C1C1C]">{item.name}</h3>
                {isMainland ? (
                  <p className="text-sm text-[#555555] mt-1">約 HK${cnyToHkdRef(item.price)} 參考</p>
                ) : null}
              </div>
              <div className="mb-3">
                <span className="text-2xl sm:text-4xl font-bold text-[#D98236]">
                  {isMainland ? `¥${item.price.toFixed(2)}` : item.price.toLocaleString()}
                </span>
                <span className="text-sm text-[#555555] ml-1">{localizeUnit(item.unit)}</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold ${getChangeBg(item.changePercent ?? 0)} ${getChangeColor(item.changePercent ?? 0)}`}>
                {getChangeIcon(item.changePercent ?? 0)}
                {isMainland ? '較上週 ' : ''}
                {(item.changePercent ?? 0) > 0 ? '+' : ''}
                {(item.changePercent ?? 0).toFixed(1)}%
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E4DE] flex items-center justify-between text-sm text-[#555555]">
                <span>{localizeSource(item.source)}</span>
                <span>{item.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>

        {activeTab === 'hk' && (
          <>
            <FehdTrendCharts data={chartData} />
            <p className="mt-3 text-center text-sm text-[#555555] leading-relaxed">
              圖表數據來自食環署官方 · 當月每日記錄隨「更新肉價」自動累積
            </p>
          </>
        )}

{activeTab === 'mainland' && (
          <>
            <MainlandMeatCharts data={mainlandChartData} />
            <p className="mt-3 text-center text-sm text-[#555555] leading-relaxed">
              數據來自農業農村部 · 港元參考價按 1.08 匯率估算 · 每週更新
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {activeTab === 'mainland' && mainlandData?.summary.sourceUrl ? (
            <a href={mainlandData.summary.sourceUrl} target="_blank" rel="noopener noreferrer" className="nfh-btn-outline">
              查看農業農村部原文
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <a href="https://www.fehd.gov.hk/tc_chi/sh/data/supply_tw.html" target="_blank" rel="noopener noreferrer" className="nfh-btn-outline">
              查看 FEHD 官網
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {activeTab === 'hk' && (
            <button onClick={() => void fetchFEHDData(true)} disabled={isLoading} className="nfh-btn-primary disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isLoading ? '抓取中...' : '刷新數據'}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-[#555555]">
          {activeTab === 'hk'
            ? '打開頁面自動抓取 FEHD 最新數據 · 也可點擊「刷新數據」手動更新'
            : activeTab === 'mainland'
              ? '內地價格為進口參考 · 與香港拍賣價單位及口徑不同 · 執行 npm run update-data 可更新'
              : activeTab === 'cme'
                ? '國際期貨每日自動更新 · LHI/PCI 依瘦肉豬期貨比例推算'
                : '海產指數需 FRED_API_KEY · 厄瓜多爾蝦/三文魚/扇貝按基準指數同比推算'}
        </p>
      </div>
    </section>
  );
}
