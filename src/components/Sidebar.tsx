import React from 'react';
import { 
  Home, 
  Package, 
  Sparkles, 
  BarChart3, 
  User, 
  PlusCircle, 
  Zap, 
  ArrowUpRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string, productId?: string) => void;
  user: UserProfile;
  onOpenAddProduct: () => void;
  onOpenUpgradeModal?: () => void;
}

export function Sidebar({ currentTab, onNavigate, user, onOpenAddProduct, onOpenUpgradeModal }: SidebarProps) {
  const creditsRemaining = Math.max(0, user.creditsTotal - user.creditsUsed);
  const creditsPercent = Math.min(100, Math.round((user.creditsUsed / user.creditsTotal) * 100));

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'products', label: 'Products', icon: Package, badge: '5' },
    { id: 'create', label: 'Create with AI', icon: Sparkles, highlight: true },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-tight">Sellora AI</span>
          </div>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'products' && currentTab === 'product-detail');

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md font-medium text-sm transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.highlight && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                  AI
                </span>
              )}
              {item.badge && !item.highlight && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Credits Card */}
      <div className="p-4 m-4 bg-slate-800 rounded-xl border border-slate-700/80">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Credits</span>
          <span className="text-xs text-white font-medium">{creditsRemaining} / {user.creditsTotal}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-700 h-1.5 rounded-full mb-3 overflow-hidden">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(user.creditsUsed / user.creditsTotal) * 100}%` }}
          />
        </div>

        <button 
          onClick={onOpenUpgradeModal}
          className="w-full py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
        >
          Upgrade Plan
        </button>
      </div>

      {/* User Profile Mini Bar */}
      <div className="p-3 mx-4 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800 transition-colors">
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-600"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-200 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.storeName}</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate('profile')}
          className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          aria-label="View user profile"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
