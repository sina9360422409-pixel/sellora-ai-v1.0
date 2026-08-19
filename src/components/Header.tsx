import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Sparkles, 
  Zap, 
  Menu, 
  CheckCircle2, 
  X,
  ArrowRight
} from 'lucide-react';
import { UserProfile, Product } from '../types';

interface HeaderProps {
  user: UserProfile;
  products: Product[];
  currentTab: string;
  onNavigate: (tab: string, productId?: string) => void;
  onOpenAddProduct: () => void;
  onOpenMobileMenu: () => void;
}

export function Header({
  user,
  products,
  currentTab,
  onNavigate,
  onOpenAddProduct,
  onOpenMobileMenu
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const filteredProducts = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const mockNotifications = [
    {
      id: 'notif-1',
      title: 'AI Listing Generated',
      time: '12m ago',
      desc: 'Optimized Amazon title & description ready for Wireless Headphones.',
      unread: true
    },
    {
      id: 'notif-2',
      title: 'New Sales Milestone',
      time: '2h ago',
      desc: 'Magnetic iPhone Case conversion rate increased by +18% this week.',
      unread: true
    },
    {
      id: 'notif-3',
      title: 'Weekly Store Report',
      time: 'Yesterday',
      desc: 'Your AI product studio generated 14 new marketing assets.',
      unread: false
    }
  ];

  const creditsRemaining = Math.max(0, user.creditsTotal - user.creditsUsed);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
      {/* Mobile Menu Button & Left greeting/version tag */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-4">
          <span className="text-slate-500 text-sm italic">Good morning 👋</span>
          <div className="h-4 w-[1px] bg-slate-200" />
          <span className="text-sm text-slate-400">Sellora Dashboard v1.0</span>
        </div>

        <div className="sm:hidden flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="font-bold text-sm text-slate-900">Sellora AI</span>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="pl-8 pr-4 py-1.5 bg-slate-100 rounded-full text-sm border-none focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48 transition-all"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 w-3.5 h-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 max-h-72 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                Matching Products ({filteredProducts.length})
              </p>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      onNavigate('product-detail', product.id);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 rounded-md object-cover"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 truncate max-w-36">{product.name}</p>
                        <p className="text-[10px] text-slate-400">{product.currency}{product.price}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">
                      Open
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  No matching products
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-2">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[11px] text-blue-600 font-medium">2 unread</span>
              </div>
              <div className="space-y-2">
                {mockNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2.5 rounded-xl text-left text-xs transition-colors ${
                      notif.unread ? 'bg-blue-50/50 border border-blue-100/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">{notif.title}</span>
                      <span className="text-[10px] text-slate-400">{notif.time}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{notif.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Initials / Profile Button */}
        <button
          onClick={() => onNavigate('profile')}
          className="w-8 h-8 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs hover:bg-blue-200 transition-colors cursor-pointer"
          aria-label="User Profile"
        >
          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'JD'}
        </button>
      </div>
    </header>
  );
}
