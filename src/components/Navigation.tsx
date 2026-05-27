import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const navLinks = [
  { name: '期貨報價', to: '/' },
  { name: '市場數據', to: '/market' },
  { name: '市場情報', to: '/news' },
];

function navClass(isActive: boolean) {
  return `px-4 sm:px-5 py-3 text-base font-semibold rounded-lg transition-all min-h-[3rem] flex items-center whitespace-nowrap ${
    isActive
      ? 'bg-[#D98236] text-white shadow-sm'
      : 'text-[#555555] hover:text-[#D98236] hover:bg-[#FDF6EE]'
  }`;
}

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E8E4DE]'
          : 'bg-white border-b border-[#E8E4DE]'
      }`}
    >
      <div className="nfh-container">
        <div className="flex items-center justify-between h-24 sm:h-28 gap-3">
          <NavLink to="/" className="shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
            <Logo size="md" />
          </NavLink>

          <nav className="hidden lg:flex items-center gap-1 p-1 bg-[#F7F5F2] rounded-lg border border-[#E8E4DE]">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => navClass(isActive)}
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="lg:hidden p-3 text-[#1C1C1C] rounded-lg hover:bg-[#F7F5F2] min-h-[3rem] min-w-[3rem] flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="選單"
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <nav className="lg:hidden pb-4 border-t border-[#E8E4DE] pt-2 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-4 rounded-lg transition-colors ${navClass(isActive)}`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
