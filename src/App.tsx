import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AppLayout from './layouts/AppLayout';
import CatalogPage from './pages/CatalogPage';
import MarketPage from './pages/MarketPage';
import NewsPage from './pages/NewsPage';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.globalTimeline.timeScale(0);
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<CatalogPage />} />
          <Route path="market" element={<MarketPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
