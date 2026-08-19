import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Store, 
  ShoppingBag, 
  Target, 
  Zap,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OnboardingData } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

const CATEGORY_OPTIONS = [
  { id: 'Electronics', label: 'Electronics & Tech', icon: '⚡' },
  { id: 'Fashion', label: 'Fashion & Apparel', icon: '👗' },
  { id: 'Beauty', label: 'Beauty & Skincare', icon: '✨' },
  { id: 'Home', label: 'Home & Living', icon: '🛋️' },
  { id: 'Food', label: 'Food & Gourmet', icon: '☕' },
  { id: 'Digital Products', label: 'Digital Products', icon: '💻' },
  { id: 'Other', label: 'Other Products', icon: '📦' }
];

const CHANNEL_OPTIONS = [
  { id: 'Shopify', label: 'Shopify', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Amazon', label: 'Amazon Storefront', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'Instagram', label: 'Instagram Shop', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'TikTok', label: 'TikTok Shop', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { id: 'Etsy', label: 'Etsy', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'Website', label: 'Direct Online Store', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Other', label: 'Other Marketplace', color: 'bg-purple-50 text-purple-700 border-purple-200' }
];

const GOAL_OPTIONS = [
  {
    id: 'Get more sales',
    title: 'Get More Sales & Conversions',
    desc: 'Craft high-converting product listings and targeted social ads.'
  },
  {
    id: 'Save time',
    title: 'Save 10+ Hours Every Week',
    desc: 'Automate copywriting, customer responses, and photo enhancement.'
  },
  {
    id: 'Create better content',
    title: 'Create Studio-Quality Marketing',
    desc: 'Transform product images and generate viral social media scripts.'
  },
  {
    id: 'Grow my store',
    title: 'Scale to Multiple Channels',
    desc: 'Expand from a single storefront to Amazon, TikTok, and Instagram.'
  }
];

export function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Electronics']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['Shopify', 'Instagram']);
  const [selectedGoal, setSelectedGoal] = useState<string>('Get more sales');

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleChannel = (chan: string) => {
    setSelectedChannels((prev) =>
      prev.includes(chan) ? prev.filter((c) => c !== chan) : [...prev, chan]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedCategories.length === 0) return;
      setStep(2);
    } else if (step === 2) {
      if (selectedChannels.length === 0) return;
      setStep(3);
    } else if (step === 3) {
      setStep(4);
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleFinish = () => {
    onComplete({
      categories: selectedCategories,
      channels: selectedChannels,
      goal: selectedGoal,
      completed: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 p-6 sm:p-8">
        {/* Step indicator */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {step}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Step {step} of 3</p>
                <p className="text-xs text-slate-500">Sellora AI Personalization</p>
              </div>
            </div>

            {onSkip && (
              <button
                onClick={onSkip}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Skip for now
              </button>
            )}
          </div>
        )}

        {/* Step 1: What do you sell? */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                What do you sell?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Select all categories that apply so our AI can calibrate the optimal sales copy models.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="flex-1 truncate">{cat.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedCategories.length === 0}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Where do you sell? */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Where do you sell?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                We'll tailor your generated listings, captions, and ad specs for these platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHANNEL_OPTIONS.map((chan) => {
                const isSelected = selectedChannels.includes(chan.id);
                return (
                  <button
                    key={chan.id}
                    type="button"
                    onClick={() => toggleChannel(chan.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="font-semibold">{chan.label}</span>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedChannels.length === 0}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: What's your main goal? */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                What's your main goal?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                We'll preset your AI recommendation engine to prioritize this metric.
              </p>
            </div>

            <div className="space-y-2.5">
              {GOAL_OPTIONS.map((g) => {
                const isSelected = selectedGoal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoal(g.id)}
                    className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{g.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{g.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Complete Setup</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Ready Confirmation */}
        {step === 4 && (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Your AI workspace is ready!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                Sellora AI is primed to analyze your product catalog, write high-converting listings, and create viral marketing campaigns.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left max-w-md mx-auto text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Selected Categories:</span>
                <span className="font-bold text-slate-900">{selectedCategories.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Connected Channels:</span>
                <span className="font-bold text-slate-900">{selectedChannels.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Main Objective:</span>
                <span className="font-bold text-indigo-700">{selectedGoal}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Enter Sellora Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
