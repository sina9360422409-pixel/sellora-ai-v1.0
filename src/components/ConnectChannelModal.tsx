import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Store, 
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ConnectedChannel } from '../types';
import { useToast } from './ToastContext';

interface ConnectChannelModalProps {
  channel: ConnectedChannel | null;
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess: (channelId: string, handle: string) => void;
}

export function ConnectChannelModal({
  channel,
  isOpen,
  onClose,
  onConnectSuccess
}: ConnectChannelModalProps) {
  const { showToast } = useToast();
  const [handle, setHandle] = useState(channel?.handle || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<'details' | 'authenticating' | 'success'>('details');

  if (!isOpen || !channel) return null;

  const handleStartConnection = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setStep('authenticating');

    setTimeout(() => {
      setStep('success');
      setIsConnecting(false);
      const chosenHandle = handle.trim() || channel.handle || `@my_${channel.type}_store`;
      onConnectSuccess(channel.id, chosenHandle);
      showToast(`${channel.name} connected successfully to Sellora AI!`, 'success');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'details' && (
          <form onSubmit={handleStartConnection} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                {channel.name[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Connect {channel.name}</h3>
                <p className="text-xs text-slate-500">Enable 1-click publishing & listing sync</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sync catalog metadata and product photos seamlessly</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Generate channel-compliant formatting and character counts</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Publish AI social posts & ads with explicit user approval</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                {channel.name} Handle or Storefront URL
              </label>
              <input
                type="text"
                placeholder={channel.type === 'shopify' ? 'storename.myshopify.com' : '@yourstorehandle'}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-medium shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Authorize & Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {step === 'authenticating' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center">
              <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Verifying {channel.name} Connection...</h3>
              <p className="text-xs text-slate-500 mt-1">Establishing secure webhook handshake</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{channel.name} Connected!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your store channel is now synced and ready for AI content generation.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
