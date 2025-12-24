import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shirt, ShoppingBag, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-brand-600 font-semibold' : 'text-gray-600 hover:text-brand-600';

  return (
    <div className="h-screen flex flex-col bg-stone-50 text-stone-800 overflow-hidden">
      {/* Header */}
      <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-200">
              <Shirt size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 uppercase">
              KOMBİN ATÖLYESİ <span className="text-brand-600">AI</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={isActive('/')}>Kombin Stüdyosu</Link>
            <Link to="/wardrobe" className={`flex items-center gap-2 ${isActive('/wardrobe')}`}>
              <ShoppingBag size={18} />
              Gardırop
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 flex flex-col gap-4 shadow-lg absolute w-full z-50">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className={isActive('/')}>Kombin Stüdyosu</Link>
            <Link to="/wardrobe" onClick={() => setIsMenuOpen(false)} className={isActive('/wardrobe')}>Gardırop</Link>
          </div>
        )}
      </header>

      {/* Main Content - Flexible to allow full height pages */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;