import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, TrendingDown, AlertTriangle, Scale, MapPin, Package, ExternalLink, ArrowUpRight, Minus, Beef, Fish, Globe, Tag, Ship, Fuel, Loader2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface PriceChange { from?: number; to?: number; value?: number; unit: string; change?: number; changePercent?: string; }

interface NewsArticle {
  id: string; title: string; source: string; sourceUrl: string; category: string;
  keyInfo: { products: string[]; regions: string[]; impactLevel: string; impactDesc: string; priceChanges: PriceChange[]; percentChanges: Array<{ percent: number; direction: 'up' | 'down' }>; futureOutlook: string; briefReason: string; hasTariff: boolean; hasLogistics: boolean; };
  publishDate: string;
}

interface NewsData {
  generatedAt: string;
  summary: { totalArticles: number; highImpactCount: number; priceChangeCount: number; tariffRelatedCount: number; logisticsRelatedCount: number; };
  priorityArticles: NewsArticle[];
  tariffUpdates: Array<{ id: string; title: string; tariffKeywords: Array<{ en: string; cn: string; severity: string }>; countries: string[]; source: string; sourceUrl: string; }>;
  logisticsUpdates: Array<{ id: string; title: string; logisticsKeywords: Array<{ en: string; cn: string; severity: string }>; regions: string[]; impact: string; source: string; sourceUrl: string; }>;
}

const CATEGORY_FILTERS = [
  { key: 'all', label: '全部', icon: Package },
  { key: 'meat', label: '肉類', icon: Beef },
  { key: 'seafood', label: '海產', icon: Fish },
  { key: 'logistics', label: '物流', icon: Ship },
];

const IMPACT: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/20', label: '重大' },
  medium: { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/20', label: '中等' },
  low: { color: 'text-[#10B981]', bg: 'bg-[#10B981]/20', label: '輕微' },
};

const TREND: Record<string, { color: string; label: string }> = {
  bullish: { color: 'text-[#EF4444]', label: '看漲' },
  bearish: { color: 'text-[#10B981]', label: '看跌' },
  neutral: { color: 'text-[#888888]', label: '觀望' },
};

export default function BusinessDashboard() {
  const sectionRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState('all');
  const [showTariff, setShowTariff] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    fetch('/data/news-articles.json?t=' + Date.now())
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: NewsData) => { setNewsData(d); setLastUpdate(new Date(d.generatedAt).toLocaleString('zh-HK')); })
      .catch(() => setError('無法加載最新新聞'))
      .finally(() => setIsLoading(false));
  }, []);

  const isHK = (a: NewsArticle) => a.keyInfo.regions.some(r => ['香港','內地','中國'].includes(r));

  const articles = (newsData?.priorityArticles || [])
    .filter(a => {
      if (filter !== 'all' && a.category !== filter) return false;
      if (showTariff && !a.keyInfo.hasTariff) return false;
      if (showLogistics && !a.keyInfo.hasLogistics) return false;
      return true;
    })
    .sort((a, b) => {
      const hkDiff = (isHK(b) ? 2 : 0) - (isHK(a) ? 2 : 0);
      if (hkDiff) return hkDiff;
      const impDiff = ({high:3,medium:2,low:1}[b.keyInfo.impactLevel]||0) - ({high:3,medium:2,low:1}[a.keyInfo.impactLevel]||0);
      if (impDiff) return impDiff;
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.dashboard-card', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' } });
    }, sectionRef);
    return () => ctx.revert();
  }, [filter, articles.length]);

  const openLink = (url?: string) => url && window.open(url, '_blank', 'noopener,noreferrer');

  if (isLoading) return <section ref={sectionRef} className="py-10 text-center"><Loader2 className="w-12 h-12 animate-spin text-[#2997FF] mx-auto mb-4"/><p className="text-xl text-white">加載中...</p></section>;

  return (
    <section id="business-dashboard" ref={sectionRef} className="py-10">
      <div className="w-full px-6 lg:px-12 xl:px-20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-2">市場<span className="text-gradient">情報</span></h2>
            <p className="text-lg text-[#E7F6FC]/60">產品 · 地區 · 影響程度 · 價格變動 · 未來預計</p>
            {error && <p className="text-base text-[#F59E0B] mt-1">{error}</p>}
            {lastUpdate && <p className="text-base text-[#10B981] mt-1">上次更新：{lastUpdate}</p>}
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            <div className="glass rounded-xl px-4 py-3 text-center"><div className="text-2xl font-bold text-[#EF4444]">{newsData?.summary?.highImpactCount||0}</div><div className="text-sm text-[#E7F6FC]/60">重大影響</div></div>
            <div className="glass rounded-xl px-4 py-3 text-center"><div className="text-2xl font-bold text-[#F59E0B]">{newsData?.summary?.priceChangeCount||0}</div><div className="text-sm text-[#E7F6FC]/60">價格變動</div></div>
            <div className="glass rounded-xl px-4 py-3 text-center"><div className="text-2xl font-bold text-[#10B981]">{newsData?.summary?.logisticsRelatedCount||0}</div><div className="text-sm text-[#E7F6FC]/60">物流相關</div></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {CATEGORY_FILTERS.map(c => (
            <button key={c.key} onClick={() => setFilter(c.key)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-lg transition-all ${filter===c.key?'bg-[#2997FF] text-white':'glass text-[#E7F6FC]/70 hover:bg-white/15'}`}>
              <c.icon className="w-5 h-5"/><span className="font-semibold">{c.label}</span>
            </button>
          ))}
          <button onClick={() => setShowTariff(!showTariff)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-lg transition-all ${showTariff?'bg-[#8B5CF6] text-white':'glass text-[#E7F6FC]/70 hover:bg-white/15'}`}>
            <Scale className="w-5 h-5"/><span className="font-semibold">僅顯示關稅相關</span>
          </button>
          <button onClick={() => setShowLogistics(!showLogistics)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-lg transition-all ${showLogistics?'bg-[#10B981] text-white':'glass text-[#E7F6FC]/70 hover:bg-white/15'}`}>
            <Fuel className="w-5 h-5"/><span className="font-semibold">僅顯示物流相關</span>
          </button>
        </div>

        <div className="grid gap-4">
          {articles.length===0?(
            <div className="text-center py-16"><h3 className="text-2xl text-white mb-2">暫無相關資訊</h3><p className="text-lg text-[#E7F6FC]/60">請嘗試調整篩選條件</p></div>
          ):articles.map(a => {
            const imp = IMPACT[a.keyInfo.impactLevel]||IMPACT.medium;
            const tr = TREND[a.keyInfo.futureOutlook]||TREND.neutral;
            return (
              <article key={a.id} className="dashboard-card glass rounded-2xl p-5 hover:bg-white/10 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-base ${a.category==='meat'?'bg-[#F59E0B]/20 text-[#F59E0B]':a.category==='seafood'?'bg-[#2997FF]/20 text-[#2997FF]':'bg-[#8B5CF6]/20 text-[#8B5CF6]'}`}>
                        {a.category==='meat'?<Beef className="w-5 h-5"/>:a.category==='seafood'?<Fish className="w-5 h-5"/>:<Ship className="w-5 h-5"/>}
                        {a.category==='meat'?'肉類':a.category==='seafood'?'海產':'物流'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-base ${imp.bg} ${imp.color}`}>{imp.label}影響</span>
                      {a.keyInfo.hasTariff&&<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-base bg-[#8B5CF6]/20 text-[#8B5CF6]"><Scale className="w-4 h-4"/>關稅</span>}
                      {a.keyInfo.hasLogistics&&<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-base bg-[#10B981]/20 text-[#10B981]"><Ship className="w-4 h-4"/>物流</span>}
                      <span className="text-base text-[#E7F6FC]/50">{a.source} · {a.publishDate}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white hover:text-[#2997FF] transition-colors cursor-pointer" onClick={()=>openLink(a.sourceUrl)}>{a.title}</h3>
                  </div>
                  <button onClick={()=>openLink(a.sourceUrl)} className="p-2 text-[#E7F6FC]/50 hover:text-[#2997FF] transition-colors bg-transparent border-0 cursor-pointer"><ExternalLink className="w-6 h-6"/></button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="glass rounded-xl p-3"><div className="flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-[#2997FF]"/><span className="text-base text-[#E7F6FC]/60">產品</span></div><div className="flex flex-wrap gap-2">{a.keyInfo.products.map(p=><span key={p} className="text-base text-white font-semibold">{p}</span>)}</div></div>
                  <div className="glass rounded-xl p-3"><div className="flex items-center gap-2 mb-2"><MapPin className="w-5 h-5 text-[#10B981]"/><span className="text-base text-[#E7F6FC]/60">地區</span></div><div className="flex flex-wrap gap-2">{a.keyInfo.regions.map(r=><span key={r} className="text-base text-white font-semibold">{r}</span>)}</div></div>
                  <div className="glass rounded-xl p-3"><div className="flex items-center gap-2 mb-2"><Tag className="w-5 h-5 text-[#F59E0B]"/><span className="text-base text-[#E7F6FC]/60">價格變動</span></div>{a.keyInfo.priceChanges.length>0?a.keyInfo.priceChanges.map((c,i)=>(<div key={i} className="text-base">{c.from!==undefined&&c.to!==undefined?(<div className="flex items-center gap-1.5"><span className="text-white/60">${c.from}</span><ArrowUpRight className={`w-4 h-4 ${(c.change||0)>0?'text-[#EF4444]':'text-[#10B981]'}`}/><span className="text-white font-bold">${c.to}</span><span className="text-white/40">/{c.unit}</span></div>):<span className="text-white font-bold">${c.value}/{c.unit}</span>}{c.changePercent&&c.changePercent!=='0'&&<span className={`ml-2 ${parseFloat(c.changePercent)>0?'text-[#EF4444]':'text-[#10B981]'}`}>{parseFloat(c.changePercent)>0?'+':''}{c.changePercent}%</span>}</div>)):<span className="text-base text-white/50">暫無價格數據</span>}</div>
                  <div className="glass rounded-xl p-3"><div className="flex items-center gap-2 mb-2"><TrendingUp className={`w-5 h-5 ${tr.color}`}/><span className="text-base text-[#E7F6FC]/60">預計 · 原因</span></div><div className="text-base text-white font-bold mb-1">{tr.label}</div><div className="text-base text-[#E7F6FC]/60">{a.keyInfo.briefReason}</div></div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
