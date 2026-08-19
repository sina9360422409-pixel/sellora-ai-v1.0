import React from 'react';
import { 
  Home, 
  Package, 
  Sparkles, 
  BarChart3, 
  User, 
  X, 
  PlusCircle, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';
import { UserProfile } from '../types';

interface MobileNavProps {
  currentTab: string;
  onNavigate: (tab: string, productId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenAddProduct: () => void;
}

export function MobileNav({
  currentTab,
  onNavigate,
  isOpen,
  onClose,
  user,
  onOpenAddProduct
}: MobileNavProps) {
  const creditsRemaining = Math.max(0, user.creditsTotal - user.creditsUsed);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'create', label: 'Create', icon: Sparkles, highlight: true },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'products' && currentTab === 'product-detail');

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.highlight ? (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 -mt-2">
                  <Icon className="w-4 h-4" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Slide-out Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-white shadow-2xl p-5 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div>
                  <span className="font-bold text-white text-lg tracking-tight">Sellora AI</span>
                  <p className="text-[10px] text-slate-400">Ecommerce Sales Assistant</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add button */}
            <div className="py-4">
              <button
                onClick={() => {
                  onClose();
                  onOpenAddProduct();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Product</span>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1.5 py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id || (item.id === 'products' && currentTab === 'product-detail');

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md font-medium text-sm transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* AI Credits Pill */}
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700/80 mt-auto">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Credits</span>
                <span className="text-xs text-white font-medium">{creditsRemaining} / {user.creditsTotal}</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(user.creditsUsed / user.creditsTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
