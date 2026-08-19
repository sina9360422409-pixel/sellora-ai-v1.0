import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Package, 
  FileText, 
  Share2, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb,
  Zap,
  Target,
  Layers
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Product } from '../types';

interface InsightsPageProps {
  products: Product[];
  onNavigate: (tab: string, productId?: string) => void;
}

export function InsightsPage({ products, onNavigate }: InsightsPageProps) {
  const stats = [
    {
      id: 'products',
      label: 'Products Created',
      value: products.length > 5 ? products.length : 24,
      change: '+4 this month',
      icon: Package,
      color: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
      id: 'generations',
      label: 'AI Generations',
      value: 186,
      change: '+32% vs last month',
      icon: Sparkles,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
    },
    {
      id: 'content',
      label: 'Content Created',
      value: 92,
      change: '+18 listings & ads',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
    {
      id: 'improvements',
      label: 'Products Improved',
      value: 37,
      change: '+12 score lifts',
      icon: TrendingUp,
      color: 'bg-violet-50 text-violet-600 border-violet-100'
    }
  ];

  const weeklyActivityData = [
    { day: 'Mon', listings: 12, social: 18, images: 8 },
    { day: 'Tue', listings: 19, social: 24, images: 14 },
    { day: 'Wed', listings: 15, social: 32, images: 19 },
    { day: 'Thu', listings: 22, social: 28, images: 16 },
    { day: 'Fri', listings: 28, social: 42, images: 25 },
    { day: 'Sat', listings: 14, social: 20, images: 11 },
    { day: 'Sun', listings: 18, social: 22, images: 15 }
  ];

  const categoryPerformance = [
    { category: 'Electronics', count: 82, share: 44 },
    { category: 'Accessories', count: 48, share: 26 },
    { category: 'Wearables', count: 32, share: 17 },
    { category: 'Bags & Travel', count: 24, share: 13 }
  ];

  const recommendations = [
    {
      id: 'rec-1',
      title: 'Your electronics products generate the most content.',
      desc: 'Electronics listings account for 44% of your total AI campaigns and hold an average 88/100 readiness score.',
      actionText: 'Generate New Electronics Ad',
      actionTab: 'create'
    },
    {
      id: 'rec-2',
      title: 'Your product descriptions could be more benefit-focused.',
      desc: 'Sellers who switch from feature-heavy copy to benefit-first copy see a 24% boost in add-to-cart clicks on mobile.',
      actionText: 'Optimize Draft Listings',
      actionTab: 'products'
    },
    {
      id: 'rec-3',
      title: 'Consider creating more lifestyle images.',
      desc: 'Lifestyle studio backdrops with contextual lighting convert 34% better on Instagram and Shopify hero banners.',
      actionText: 'Open Image Studio',
      actionTab: 'create'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 mb-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Real-time Store Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Insights & Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track AI content velocity, conversion readiness, and channel performance metrics.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </span>
                <div className={`w-9 h-9 rounded-xl ${item.color} border flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <span className="text-3xl font-extrabold text-slate-900">{item.value}</span>
                <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {item.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Weekly Generations Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Weekly AI Content Velocity</h2>
              <p className="text-xs text-slate-500">Volume of generated listings, social posts, and visual assets</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Social
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Listings
              </span>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="social" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSocial)" />
                <Area type="monotone" dataKey="listings" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorListings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Category Dominance</h2>
            <p className="text-xs text-slate-500">Distribution of AI marketing efforts</p>

            <div className="space-y-3.5 mt-5">
              {categoryPerformance.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{cat.category}</span>
                    <span className="text-slate-500">{cat.count} assets ({cat.share}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${cat.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-950 flex items-center justify-between">
            <span className="font-semibold">Need content for new categories?</span>
            <button
              onClick={() => onNavigate('create')}
              className="font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              Create →
            </button>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              AI Growth Recommendations
            </h2>
            <p className="text-xs text-slate-500">
              Data-backed optimization opportunities tailored to your catalog
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors"
            >
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug mb-2">
                  {rec.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {rec.desc}
                </p>
              </div>

              <button
                onClick={() => onNavigate(rec.actionTab)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-3 border-t border-slate-100 cursor-pointer"
              >
                <span>{rec.actionText}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
