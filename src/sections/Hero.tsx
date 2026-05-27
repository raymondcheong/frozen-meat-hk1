import { Link } from 'react-router-dom';
import { BarChart3, Newspaper, ClipboardList } from 'lucide-react';

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="nfh-brand-gradient">
        <div className="nfh-container py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-[#E8A317] text-lg font-semibold mb-3">
              五豐行 · 凍品水產部
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
              期貨報價 ·
              <span className="text-[#E8A317]">市場資訊</span>
            </h1>
            <p className="text-white text-lg sm:text-xl mb-8 leading-relaxed">
              階梯批發報價、香港官方肉價、行業消息 — 分頁睇更清楚
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Link to="/" className="nfh-btn-primary bg-white text-[#D98236] hover:bg-[#FFF8E7]">
                <ClipboardList className="w-5 h-5" />
                期貨報價
              </Link>
              <Link
                to="/market"
                className="nfh-btn-outline border-white/50 text-white bg-transparent hover:bg-white/10 hover:text-white hover:border-white"
              >
                <BarChart3 className="w-5 h-5" />
                市場數據
              </Link>
              <Link
                to="/news"
                className="nfh-btn-outline border-white/50 text-white bg-transparent hover:bg-white/10 hover:text-white hover:border-white"
              >
                <Newspaper className="w-5 h-5" />
                市場情報
              </Link>
            </div>
          </div>
        </div>

        <div className="h-1 nfh-gold-line" />
      </div>
    </section>
  );
}
