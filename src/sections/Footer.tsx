import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, ExternalLink, ShoppingBag } from 'lucide-react';
import Logo from '../components/Logo';

const footerLinks = [
  { name: '期貨報價', to: '/' },
  { name: '市場數據', to: '/market' },
  { name: '市場情報', to: '/news' },
];

export default function Footer() {
  return (
    <footer className="bg-[#1C1C1C] text-white mt-8">
      <div className="nfh-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <Logo size="lg" variant="light" showSubtitle={false} />
            <p className="text-white/60 text-sm leading-relaxed">
              美好生活五豐行
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://nfhmall.crngfung.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#E8A317] hover:text-white transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                五豐行香港商城 Ng Fung Hong
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <a
                href="https://www.facebook.com/ngfungbrand/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#E8A317] hover:text-white transition-colors"
              >
                <Facebook className="w-4 h-4" />
                五豐 Ng Fung 官方 Facebook
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">快速導航</h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-white/60 hover:text-[#E8A317] text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">聯繫我們</h4>
            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#E8A317] shrink-0 mt-0.5" />
                <span>zhangkailiang12@nfh.hk</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#E8A317] shrink-0 mt-0.5" />
                <span>+852 3174 4288</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#E8A317] shrink-0 mt-0.5" />
                <span>香港西九龍欽州街西89號潤發大廈3樓</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>數據來源：香港食物環境衛生署、CME Group、FRED</p>
          <p>© {new Date().getFullYear()} 五豐 Ng Fung. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
