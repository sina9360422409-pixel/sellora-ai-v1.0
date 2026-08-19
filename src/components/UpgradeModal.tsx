import React, { useState } from 'react';
import { X, Sparkles, Check, Zap, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateCredits: (newTotal: number, newPlan?: 'Starter' | 'Pro' | 'Growth') => void;
}

export function UpgradeModal({ isOpen, onClose, user, onUpdateCredits }: UpgradeModalProps) {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'Starter' | 'Pro' | 'Growth'>(user.plan);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'Starter' as const,
      name: 'Starter Tier',
      price: '$19',
      period: '/mo',
      credits: 50,
      features: ['50 AI Generations / mo', 'Product Listing Writer', 'Basic Social Captions', 'Standard Support']
    },
    {
      id: 'Pro' as const,
      name: 'Pro Merchant',
      price: '$49',
      period: '/mo',
      credits: 250,
      popular: true,
      features: ['250 AI Generations / mo', 'All AI Tools & Studio', 'Multi-channel sync', 'Priority Neural Speed', 'Product Photo Enhancer']
    },
    {
      id: 'Growth' as const,
      name: 'Scale & Growth',
      price: '$99',
      period: '/mo',
      credits: 1000,
      features: ['1,000 AI Generations / mo', 'Unlimited Photo Enhancements', 'Custom Brand Voices', 'Dedicated Account Mgr']
    }
  ];

  const handleRefillCredits = (amount: number) => {
    onUpdateCredits(user.creditsTotal + amount);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    showToast(`+${amount} AI Credits added to your balance!`, 'success');
    onClose();
  };

  const handleUpgradePlan = (plan: 'Starter' | 'Pro' | 'Growth', credits: number) => {
    onUpdateCredits(credits, plan);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    showToast(`Successfully upgraded to ${plan} Plan!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Credits & Subscription</h2>
              <p className="text-xs text-slate-500">Scale your ecommerce store with high-converting AI power</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Top-up pill section */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-900">Instant Credit Top-Up</p>
            <p className="text-[11px] text-slate-500">Need extra generations without changing your current plan?</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRefillCredits(50)}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              +50 Credits ($9)
            </button>
            <button
              onClick={() => handleRefillCredits(100)}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              +100 Credits ($15)
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
          {plans.map((p) => {
            const isCurrent = user.plan === p.id;
            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between relative transition-all ${
                  p.popular
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 right-3 text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-600 text-white rounded-full">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-2xl font-extrabold text-slate-900">{p.price}</span>
                    <span className="text-xs text-slate-400 font-medium">{p.period}</span>
                  </div>
                  <p className="text-xs font-semibold text-blue-700 mb-3">{p.credits} AI credits/mo</p>

                  <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan(p.id, p.credits)}
                  disabled={isCurrent}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : p.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${p.id}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
