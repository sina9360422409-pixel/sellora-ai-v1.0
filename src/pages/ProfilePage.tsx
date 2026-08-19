import React, { useState } from 'react';
import { 
  User, 
  Store, 
  Zap, 
  Shield, 
  Settings, 
  Check, 
  LogOut, 
  Share2, 
  CreditCard, 
  Lock, 
  Globe, 
  Bell, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { UserProfile, ConnectedChannel, ToneType } from '../types';
import { useToast } from '../components/ToastContext';

interface ProfilePageProps {
  user: UserProfile;
  channels: ConnectedChannel[];
  onUpdateUser: (updated: UserProfile) => void;
  onOpenConnectChannel: (channel: ConnectedChannel) => void;
  onDisconnectChannel: (channelId: string) => void;
  onOpenUpgradeModal: () => void;
  onResetData: () => void;
}

export function ProfilePage({
  user,
  channels,
  onUpdateUser,
  onOpenConnectChannel,
  onDisconnectChannel,
  onOpenUpgradeModal,
  onResetData
}: ProfilePageProps) {
  const { showToast } = useToast();

  const [name, setName] = useState(user.name);
  const [storeName, setStoreName] = useState(user.storeName);
  const [email, setEmail] = useState(user.email);
  const [currency, setCurrency] = useState(user.currency);
  const [defaultTone, setDefaultTone] = useState<ToneType>(user.defaultTone);
  const [autoSave, setAutoSave] = useState(user.autoSave);
  const [activeSection, setActiveSection] = useState<'profile' | 'channels' | 'billing' | 'settings'>('profile');

  const creditsRemaining = Math.max(0, user.creditsTotal - user.creditsUsed);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name,
      storeName,
      email,
      currency,
      defaultTone,
      autoSave
    });
    showToast('Store settings saved successfully!', 'success');
  };

  const channelIcons: Record<string, string> = {
    instagram: '📸',
    amazon: '📦',
    shopify: '🛍️',
    tiktok: '🎵',
    etsy: '🏷️'
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Store Settings & Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your storefront profile, AI generation preferences, plan, and connected channels.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'profile', label: 'Store Profile', icon: Store },
          { id: 'channels', label: 'Connected Channels', icon: Share2, count: channels.filter(c => c.status === 'Connected').length },
          { id: 'billing', label: 'Plan & Credits', icon: Zap },
          { id: 'settings', label: 'AI Preferences & Privacy', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. Store Profile Section */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100 shadow-md"
            />
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500">{user.storeName} • {user.email}</p>
              <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {user.plan} Plan Member
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Owner / Merchant Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Store Brand Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Primary Store Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900"
              >
                <option value="$">$ USD (United States Dollar)</option>
                <option value="€">€ EUR (Euro)</option>
                <option value="£">£ GBP (British Pound)</option>
                <option value="C$">C$ CAD (Canadian Dollar)</option>
                <option value="A$">A$ AUD (Australian Dollar)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-medium text-xs shadow-sm cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* 2. Connected Channels Section */}
      {activeSection === 'channels' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Connected Storefront Channels</h2>
            <p className="text-xs text-slate-500">
              Connect your sales channels to synchronize listings and publish AI campaigns.
            </p>
          </div>

          <div className="space-y-3.5">
            {channels.map((channel) => {
              const isConnected = channel.status === 'Connected';

              return (
                <div
                  key={channel.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isConnected ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                      {channelIcons[channel.type] || '🏬'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{channel.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            isConnected
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {channel.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isConnected ? `Handle: ${channel.handle} • Synced` : 'Not linked to any store account'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isConnected ? (
                      <button
                        onClick={() => onDisconnectChannel(channel.id)}
                        className="px-4 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenConnectChannel(channel)}
                        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer"
                      >
                        Connect {channel.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Billing & AI Credits */}
      {activeSection === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{user.plan} Merchant Plan</h2>
                <p className="text-xs text-slate-500">Includes 250 AI generation credits per monthly cycle</p>
              </div>

              <button
                onClick={onOpenUpgradeModal}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-medium shadow-sm self-start sm:self-auto cursor-pointer"
              >
                Change Subscription Plan
              </button>
            </div>

            {/* Credit Balance Card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400 fill-blue-400" />
                  <span className="text-sm font-bold">AI Generation Credits</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{creditsRemaining} / {user.creditsTotal} available</span>
              </div>

              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 rounded-full"
                  style={{ width: `${(user.creditsUsed / user.creditsTotal) * 100}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                <span className="text-slate-400">Credits refresh on the 1st of every month</span>
                <button
                  onClick={onOpenUpgradeModal}
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Add Extra Credits</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI Preferences & Privacy */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Generation Defaults</h2>
              <p className="text-xs text-slate-500">Preset your default brand voice and workspace behaviors</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Default Brand Voice Tone
                </label>
                <select
                  value={defaultTone}
                  onChange={(e) => {
                    setDefaultTone(e.target.value as ToneType);
                    onUpdateUser({ ...user, defaultTone: e.target.value as ToneType });
                    showToast('Default tone updated!', 'info');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900"
                >
                  <option value="Premium">Premium</option>
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Bold">Bold</option>
                  <option value="Minimal">Minimal</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <p className="text-xs font-bold text-slate-900">Auto-Save Generated Copy</p>
                  <p className="text-[11px] text-slate-500">Automatically store results to library</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => {
                    setAutoSave(e.target.checked);
                    onUpdateUser({ ...user, autoSave: e.target.checked });
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* Privacy & Data Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Privacy & Demo Controls</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Sellora AI stores demo product states and generations securely in your local browser sandbox. No confidential API keys or payment cards are required during this frontend preview.
            </p>

            <div className="pt-3 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  onResetData();
                  showToast('Demo catalog reset to initial state!', 'info');
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo Seed Data</span>
              </button>

              <button
                onClick={() => showToast('Signed out of Sellora session.', 'info')}
                className="px-4 py-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
