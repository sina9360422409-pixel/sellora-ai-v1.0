import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Copy, 
  RefreshCw, 
  FileText, 
  Share2, 
  Megaphone, 
  Image as ImageIcon, 
  MessageSquare, 
  Clock, 
  Layers, 
  Target, 
  Smile, 
  Wand2, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, ContentType, ToneType, GoalType, SocialPlatform, AdPlatform, ImageStyle, AspectRatio, GeneratedContent, UserProfile } from '../types';
import { mockAiService } from '../services/mockAiService';
import { useToast } from '../components/ToastContext';

interface CreatePageProps {
  products: Product[];
  user: UserProfile;
  initialProductId?: string;
  initialActionType?: ContentType;
  onUpdateUser: (user: UserProfile) => void;
  onOpenAddProduct: () => void;
  onSaveGeneration?: (item: GeneratedContent) => void;
}

export function CreatePage({
  products,
  user,
  initialProductId,
  initialActionType = 'listing',
  onUpdateUser,
  onOpenAddProduct,
  onSaveGeneration
}: CreatePageProps) {
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedProduct, setSelectedProduct] = useState<Product>(() => {
    if (initialProductId) {
      const found = products.find((p) => p.id === initialProductId);
      if (found) return found;
    }
    return products[0] || null;
  });

  const [contentType, setContentType] = useState<ContentType>(initialActionType);
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>('Instagram');
  const [adPlatform, setAdPlatform] = useState<AdPlatform>('Instagram');
  const [tone, setTone] = useState<ToneType>('Premium');
  const [goal, setGoal] = useState<GoalType>('More Sales');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('Studio');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [customNotes, setCustomNotes] = useState('');
  const [customerInquiry, setCustomerInquiry] = useState('How durable is this and what is the return policy?');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const contentTypes: {
    id: ContentType;
    title: string;
    description: string;
    icon: React.ElementType;
    badge: string;
  }[] = [
    {
      id: 'listing',
      title: 'Product Listing',
      description: 'Amazon, Shopify & SEO descriptions with conversion bullet points',
      icon: FileText,
      badge: 'Listing'
    },
    {
      id: 'social',
      title: 'Social Content',
      description: 'Instagram captions, TikTok scripts, and engagement hooks',
      icon: Share2,
      badge: 'Social'
    },
    {
      id: 'ad',
      title: 'Advertisement',
      description: 'High-CTR ad copy tailored for Meta, Google & Amazon',
      icon: Megaphone,
      badge: 'Ads'
    },
    {
      id: 'image',
      title: 'Product Image',
      description: 'Turn raw product shots into studio-lit luxury commercial photos',
      icon: ImageIcon,
      badge: 'Studio'
    },
    {
      id: 'reply',
      title: 'Customer Reply',
      description: 'High-converting polite replies to resolve customer hesitation',
      icon: MessageSquare,
      badge: 'Sales Bot'
    }
  ];

  const toneOptions: ToneType[] = ['Professional', 'Friendly', 'Premium', 'Luxury', 'Bold', 'Minimal'];
  const goalOptions: GoalType[] = ['More Sales', 'More Clicks', 'Brand Awareness', 'Product Launch'];
  const socialPlatforms: SocialPlatform[] = ['Instagram', 'TikTok', 'Facebook', 'WhatsApp', 'Other'];
  const adPlatforms: AdPlatform[] = ['Instagram', 'Facebook', 'Google', 'Amazon'];
  const imageStyles: ImageStyle[] = ['Studio', 'Minimal', 'Luxury', 'Lifestyle', 'Outdoor', 'Social Media'];
  const aspectRatios: AspectRatio[] = ['1:1', '4:5', '9:16', '16:9'];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedLabel(null), 2500);
  };

  const handleStartGeneration = async (isRegen = false) => {
    if (!selectedProduct) {
      showToast('Please select a product first', 'error');
      return;
    }

    // Check credits
    if (user.creditsUsed >= user.creditsTotal) {
      showToast('You have used all your AI credits for this billing cycle.', 'error');
      return;
    }

    setCurrentStep(4);
    setIsGenerating(true);
    setProgressPercent(15);
    setProgressStage(isRegen ? 'Generating fresh copy variation...' : 'Reading product metadata & facts...');

    try {
      const generated = await mockAiService.generate({
        product: selectedProduct,
        type: contentType,
        tone,
        goal,
        platform: contentType === 'social' ? socialPlatform : contentType === 'ad' ? adPlatform : undefined,
        imageStyle,
        aspectRatio,
        customPrompt: customNotes,
        customerInquiry,
        isRegeneration: isRegen,
        variationSeed: isRegen ? Date.now() : undefined,
        onProgress: (stage, percent) => {
          setProgressStage(stage);
          setProgressPercent(percent);
        }
      });

      setResult(generated);

      // Deduct 1 credit
      onUpdateUser({
        ...user,
        creditsUsed: user.creditsUsed + 1
      });

      onSaveGeneration?.(generated);

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      showToast(isRegen ? 'New variation generated!' : 'Content generated and 1 credit deducted!', 'success');
    } catch (e) {
      showToast('Generation failed, please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create with AI
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Turn your products into sales-driven content, copy, and visuals.
          </p>
        </div>

        {/* AI Credits Mini Counter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl shadow-xs self-start sm:self-auto">
          <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
          <span className="text-xs font-semibold text-slate-700">
            {user.creditsTotal - user.creditsUsed} credits left
          </span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { num: 1, label: '1. Select Product' },
            { num: 2, label: '2. Content Type' },
            { num: 3, label: '3. Customize' },
            { num: 4, label: '4. Generate' }
          ].map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <button
                key={s.num}
                onClick={() => {
                  if (s.num <= 3 || result) {
                    setCurrentStep(s.num as any);
                  }
                }}
                className={`py-2 px-2 rounded-xl font-bold transition-all text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-current text-[10px] flex items-center justify-center">
                    {s.num}
                  </span>
                )}
                <span className="truncate">{s.label.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Select Product */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1: Choose Product</h2>
              <p className="text-xs text-slate-500">Pick which product to generate content for</p>
            </div>
            <button
              onClick={onOpenAddProduct}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              + Add New Product
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((p) => {
              const isSelected = selectedProduct?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase text-blue-600">{p.category}</span>
                    <h3 className="font-bold text-sm text-slate-900 truncate">{p.name}</h3>
                    <p className="text-xs font-semibold text-slate-500">{p.currency}{p.price}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!selectedProduct}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-medium text-sm shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Next: Choose Format</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Choose what to create */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 2: Choose What to Create</h2>
              <p className="text-xs text-slate-500">Select the target marketing asset format</p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTypes.map((item) => {
              const Icon = item.icon;
              const isSelected = contentType === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setContentType(item.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className={isSelected ? 'text-blue-700' : 'text-slate-400'}>
                      {isSelected ? 'Selected Format' : 'Select'}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-medium text-sm shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Customize Parameters</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Customize */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 3: Customize Generation Parameters</h2>
              <p className="text-xs text-slate-500">Fine-tune brand voice, target channels, and goals</p>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="space-y-6">
            {/* Tone Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Brand Tone & Voice
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {toneOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      tone === t
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Primary Campaign Goal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {goalOptions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      goal === g
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Format-Specific Options */}
            {contentType === 'social' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Social Media Platform
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {socialPlatforms.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSocialPlatform(p)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        socialPlatform === p
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {contentType === 'ad' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Ad Network / Placement
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {adPlatforms.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAdPlatform(p)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        adPlatform === p
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {p} Ads
                    </button>
                  ))}
                </div>
              </div>
            )}

            {contentType === 'image' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Studio Photography Scene
                  </label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900"
                  >
                    {imageStyles.map((st) => (
                      <option key={st} value={st}>
                        {st} Scene
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900"
                  >
                    {aspectRatios.map((ar) => (
                      <option key={ar} value={ar}>
                        {ar} {ar === '1:1' ? '(Square)' : ar === '4:5' ? '(Portrait)' : ar === '9:16' ? '(Story/Reels)' : '(Landscape)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {contentType === 'reply' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Customer Message / Question
                </label>
                <textarea
                  rows={2}
                  value={customerInquiry}
                  onChange={(e) => setCustomerInquiry(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
                  placeholder="Paste the buyer's exact DM or email query..."
                />
              </div>
            )}

            {/* Custom Notes / Prompt Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Special Instructions (Optional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Highlight the waterproof warranty, discount 15% for summer launch..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleStartGeneration}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-medium text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Generate Content (1 Credit)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Generation / Results Workspace */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          {isGenerating ? (
            <div className="py-20 text-center space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">{progressStage}</h3>
                <p className="text-xs text-slate-500">Sellora AI is crafting high-converting sales assets</p>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : result?.error ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    {result.error.message || 'Gemini AI is currently unavailable.'}
                  </h3>
                  {result.error.diagnostic && (
                    <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
                      {result.error.diagnostic}
                    </p>
                  )}
                  <button
                    onClick={handleStartGeneration}
                    className="mt-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Top Result Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-emerald-950">
                        AI Content Generation Complete
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${result.isRealAi ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-amber-100 text-amber-900 border-amber-200'}`}>
                        {result.aiStatusMessage || (result.isRealAi ? 'Gemini Flash Engine' : 'Sellora AI Engine')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100/80 text-emerald-900">
                        Product: {result.productName}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100/80 text-emerald-900 uppercase">
                        Type: {result.type}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100/80 text-emerald-900">
                        Tone: {result.tone}
                      </span>
                      {result.goal && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100/80 text-emerald-900">
                          Goal: {result.goal}
                        </span>
                      )}
                      {result.platform && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100/80 text-emerald-900">
                          Platform: {result.platform}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartGeneration(true)}
                    className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-800 cursor-pointer transition-colors"
                  >
                    Create Another
                  </button>
                </div>
              </div>

              {/* Transparency & Truthfulness Indicator */}
              {(() => {
                const currentData: any = result.result[result.type as keyof typeof result.result];
                const hasWarnings = currentData && Array.isArray(currentData.warnings) && currentData.warnings.length > 0;

                return (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${hasWarnings ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50/80 border-blue-200/80 text-blue-900'}`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasWarnings ? 'text-amber-600' : 'text-blue-600'}`} />
                    <span className="font-medium leading-relaxed">
                      {hasWarnings
                        ? 'Some product details could not be verified and were not used as factual claims.'
                        : 'Generated using your product information and supported product facts.'}
                    </span>
                  </div>
                );
              })()}

              {/* Render Type-specific Preview */}
              {result.type === 'listing' && result.result.listing && (
                <div className="space-y-4">
                  {/* Title */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase text-slate-400">Product Title</span>
                      <button
                        onClick={() => copyToClipboard(result.result.listing!.title, 'Listing Title')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{result.result.listing.title}</p>
                  </div>

                  {/* Short Description */}
                  {result.result.listing.shortDescription && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase text-slate-400">Short Description</span>
                        <button
                          onClick={() => copyToClipboard(result.result.listing!.shortDescription, 'Short Description')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">
                        {result.result.listing.shortDescription}
                      </p>
                    </div>
                  )}

                  {/* Bullet Points */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase text-slate-400">Key Selling Points</span>
                      <button
                        onClick={() => copyToClipboard(result.result.listing!.bulletPoints.join('\n\n'), 'Bullet Points')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Bullets
                      </button>
                    </div>
                    <ul className="space-y-2 mt-2">
                      {result.result.listing.bulletPoints.map((b, i) => (
                        <li key={i} className="text-xs text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Full Description */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase text-slate-400">Full Description</span>
                      <button
                        onClick={() => copyToClipboard(result.result.listing!.fullDescription, 'Full Description')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed mt-2 bg-white p-3.5 rounded-xl border border-slate-200">
                      {result.result.listing.fullDescription}
                    </p>
                  </div>

                  {/* SEO Keywords & Call To Action */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.result.listing.seoKeywords && result.result.listing.seoKeywords.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold uppercase text-slate-400 block mb-2">SEO Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.result.listing.seoKeywords.map((kw, idx) => (
                            <span key={idx} className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.result.listing.callToAction && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Call To Action</span>
                        <p className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 p-2.5 rounded-xl">
                          {result.result.listing.callToAction}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.type === 'social' && result.result.social && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                      {result.result.social.platform || socialPlatform} Content
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.result.social!.caption, 'Social Post')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Post
                    </button>
                  </div>

                  {result.result.social.hook && (
                    <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100 text-xs text-pink-950 font-bold">
                      <span className="text-[10px] uppercase text-pink-600 block font-bold mb-0.5">Hook</span>
                      {result.result.social.hook}
                    </div>
                  )}

                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 whitespace-pre-line leading-relaxed">
                    {result.result.social.caption}
                  </div>

                  {result.result.social.hashtags && result.result.social.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {result.result.social.hashtags.map((ht, idx) => (
                        <span key={idx} className="text-[11px] font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                          {ht.startsWith('#') ? ht : `#${ht}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {result.result.social.mediaSuggestion && (
                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">Suggested Visual Concept:</span>
                      {result.result.social.mediaSuggestion}
                    </div>
                  )}
                </div>
              )}

              {result.type === 'ad' && result.result.ad && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {result.result.ad.platform || adPlatform} Ad Creative
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${result.result.ad!.headline}\n\n${result.result.ad!.primaryText}`, 'Ad Copy')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Ad Copy
                    </button>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Headline</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{result.result.ad.headline}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Primary Text</span>
                      <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{result.result.ad.primaryText}</p>
                    </div>
                    {result.result.ad.callToAction && (
                      <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        CTA Button: {result.result.ad.callToAction}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {result.type === 'image' && result.result.image && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500">Original Photo</span>
                    <img src={result.result.image.originalImage} alt="Original" className="w-full aspect-square rounded-2xl object-cover border" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-blue-600">AI Studio Transformation</span>
                    <img src={result.result.image.generatedImage} alt="Transformed" className="w-full aspect-square rounded-2xl object-cover border-2 border-blue-600" />
                  </div>
                </div>
              )}

              {result.type === 'reply' && result.result.reply && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Customer Inquiry Reply
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.result.reply!.recommendedReply, 'Reply')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Reply
                    </button>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-950">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">Customer Inquiry:</span>
                    "{result.result.reply.customerInquiry}"
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 whitespace-pre-line leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Recommended Response:</span>
                    {result.result.reply.recommendedReply}
                  </div>

                  {result.result.reply.politeAlternative && (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Polite Alternative Option:</span>
                      {result.result.reply.politeAlternative}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
