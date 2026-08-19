import React from 'react';
import { 
  Sparkles, 
  Plus, 
  Zap, 
  ArrowRight, 
  BarChart2, 
  FileText, 
  Share2, 
  Megaphone, 
  Image as ImageIcon, 
  MessageSquare,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Product, UserProfile, ContentType } from '../types';
import { useToast } from '../components/ToastContext';

interface HomePageProps {
  user: UserProfile;
  products: Product[];
  onNavigate: (tab: string, productId?: string) => void;
  onOpenAddProduct: () => void;
  onOpenUpgradeModal: () => void;
  onQuickAction: (actionType: ContentType, productId?: string) => void;
}

export function HomePage({
  user,
  products,
  onNavigate,
  onOpenAddProduct,
  onOpenUpgradeModal,
  onQuickAction
}: HomePageProps) {
  const { showToast } = useToast();

  const quickActions: {
    id: ContentType;
    label: string;
    symbol: string;
    bgClass: string;
    textClass: string;
  }[] = [
    { id: 'analysis', label: 'Analyze', symbol: 'A', bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
    { id: 'listing', label: 'Listings', symbol: 'L', bgClass: 'bg-purple-50', textClass: 'text-purple-600' },
    { id: 'social', label: 'Social', symbol: 'S', bgClass: 'bg-green-50', textClass: 'text-green-600' },
    { id: 'ad', label: 'Ads', symbol: 'Ad', bgClass: 'bg-orange-50', textClass: 'text-orange-600' },
    { id: 'image', label: 'Images', symbol: 'Im', bgClass: 'bg-rose-50', textClass: 'text-rose-600' },
    { id: 'reply', label: 'Reply', symbol: 'Re', bgClass: 'bg-cyan-50', textClass: 'text-cyan-600' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
      case 'Ready':
        return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">READY</span>;
      case 'Needs improvement':
        return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">NEEDS WORK</span>;
      default:
        return <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">DRAFT</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12 flex-1">
      {/* Hero Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            What are you selling today?
          </h1>
          <p className="text-slate-500 mt-1">
            Turn your products into high-performing sales assets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            + Add Product
          </button>
          <button
            onClick={() => onNavigate('create')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create with AI</span>
          </button>
        </div>
      </div>

      {/* 6 Quick Action Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <div
            key={action.id}
            onClick={() => onQuickAction(action.id)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all text-center group"
          >
            <div className={`w-10 h-10 ${action.bgClass} ${action.textClass} rounded-xl flex items-center justify-center mx-auto mb-2 font-bold italic group-hover:scale-105 transition-transform`}>
              {action.symbol}
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
              {action.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main Content Area: Recent Products & AI Suggestions */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Recent Products */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800">Recent Products</h2>
            <button
              onClick={() => onNavigate('products')}
              className="text-blue-600 text-sm font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.slice(0, 4).map((product) => (
              <div
                key={product.id}
                onClick={() => onNavigate('product-detail', product.id)}
                className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex gap-4 cursor-pointer group"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-100 overflow-hidden shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter truncate max-w-28">
                      {product.category}
                    </span>
                    {getStatusBadge(product.status)}
                  </div>
                  <h3 className="font-semibold text-slate-800 mt-0.5 text-sm truncate" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Updated {product.lastUpdated}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI Suggestions */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          <h2 className="font-bold text-slate-800">AI Suggestions</h2>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div
                onClick={() => onQuickAction('image')}
                className="flex gap-3 p-3 bg-white/80 rounded-xl border border-blue-200/50 shadow-sm hover:bg-white transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 shrink-0 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">
                  ✨
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Your product image for <span className="text-blue-600 font-bold">Backpack</span> could perform 40% better with a Studio background.
                </p>
              </div>

              <div
                onClick={() => onQuickAction('listing')}
                className="flex gap-3 p-3 bg-white/80 rounded-xl border border-blue-200/50 shadow-sm hover:bg-white transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 shrink-0 bg-purple-600 rounded-full flex items-center justify-center text-white text-[10px]">
                  ✍️
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Latest product is missing a strong <span className="text-purple-600 font-bold">value proposition</span> in the description.
                </p>
              </div>

              <div
                onClick={() => onQuickAction('social')}
                className="flex gap-3 p-3 bg-white/80 rounded-xl border border-blue-200/50 shadow-sm hover:bg-white transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 shrink-0 bg-green-600 rounded-full flex items-center justify-center text-white text-[10px]">
                  📱
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Create a social post for <span className="text-green-600 font-bold">Smart Watch</span> to boost reach by 12%.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                showToast('Applied AI suggestions to your active queue!', 'success');
                onNavigate('create');
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide mt-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              Apply All Suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
