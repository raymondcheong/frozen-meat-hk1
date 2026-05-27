import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from '../components/Navigation';
import Footer from '../sections/Footer';

export default function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach((t) => t.kill());
    ScrollTrigger.refresh();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
