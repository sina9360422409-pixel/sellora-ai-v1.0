import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Edit3, 
  BarChart2, 
  FileText, 
  Share2, 
  Megaphone, 
  Image as ImageIcon, 
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  Wand2,
  Sliders,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, ContentType, ToneType, ImageStyle, AspectRatio, GeneratedContent } from '../types';
import { mockAiService } from '../services/mockAiService';
import { productIntelligenceService } from '../services/productIntelligenceService';
import { useToast } from '../components/ToastContext';
import { ProductIntelligenceDrawer } from '../components/ProductIntelligenceDrawer';

interface ProductDetailWorkspaceProps {
  product: Product;
  onBack: () => void;
  onNavigateToCreate: (productId: string, actionType?: ContentType) => void;
  onUpdateProduct: (updated: Product) => void;
}

export function ProductDetailWorkspace({
  product,
  onBack,
  onNavigateToCreate,
  onUpdateProduct
}: ProductDetailWorkspaceProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ContentType>('listing');
  const [tone, setTone] = useState<ToneType>('Premium');
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStyle>('Studio');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1');
  const [inquiryText, setInquiryText] = useState('Is this covered under warranty and what is the return policy?');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingIntelligence, setIsAnalyzingIntelligence] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentResult, setCurrentResult] = useState<GeneratedContent | null>(null);

  const handleRunIntelligence = async () => {
    setIsAnalyzingIntelligence(true);
    showToast('Analyzing product intelligence & fact verification...', 'info');
    const res = await productIntelligenceService.analyzeProductIntelligence(product);
    setIsAnalyzingIntelligence(false);

    if (res.intelligence) {
      onUpdateProduct({
        ...product,
        productIntelligence: res.intelligence
      });
      showToast('Product Intelligence audit completed!', 'success');
    } else {
      showToast('Failed to run product intelligence audit', 'error');
    }
  };

  // Editable local state for generated content
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label = 'Content') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGenerate = async (typeToGen: ContentType = activeTab) => {
    setIsGenerating(true);
    setIsEditing(false);
    setProgressPercent(10);
    setProgressStage('Initializing Sellora neural model...');

    try {
      const genResult = await mockAiService.generate({
        product,
        type: typeToGen,
        tone,
        imageStyle: selectedImageStyle,
        aspectRatio: selectedAspectRatio,
        customerInquiry: inquiryText,
        onProgress: (stage, percent) => {
          setProgressStage(stage);
          setProgressPercent(percent);
        }
      });

      setCurrentResult(genResult);
      if (genResult.result.listing) {
        setEditedTitle(genResult.result.listing.title);
        setEditedDescription(genResult.result.listing.fullDescription);
      }
      if (genResult.result.social) {
        setEditedCaption(genResult.result.social.caption);
      }

      // Update product's ai content counter
      onUpdateProduct({
        ...product,
        aiContentCount: (product.aiContentCount || 0) + 1,
        lastUpdated: 'Just now'
      });

      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      showToast(`${typeToGen.toUpperCase()} generated successfully!`, 'success');
    } catch (e) {
      showToast('Generation failed, please retry.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger initial generation if none yet
  React.useEffect(() => {
    handleGenerate(activeTab);
  }, [activeTab]);

  const aiActions: {
    id: ContentType;
    label: string;
    icon: React.ElementType;
    desc: string;
  }[] = [
    { id: 'listing', label: 'Generate Listing', icon: FileText, desc: 'Amazon, Shopify & SEO copy' },
    { id: 'social', label: 'Social Content', icon: Share2, desc: 'Instagram, TikTok & viral posts' },
    { id: 'ad', label: 'Advertisement', icon: Megaphone, desc: 'High conversion ad campaigns' },
    { id: 'image', label: 'Improve Photo', icon: ImageIcon, desc: 'Studio lighting & scenes' },
    { id: 'reply', label: 'Customer Reply', icon: MessageSquare, desc: 'Smart sales response bot' },
    { id: 'analysis', label: 'Analyze Product', icon: BarChart2, desc: 'Audit listing score & leaks' }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={product.status}
            onChange={(e) => onUpdateProduct({ ...product, status: e.target.value as any })}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none"
          >
            <option value="Ready">Ready</option>
            <option value="Published">Published</option>
            <option value="Needs improvement">Needs improvement</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Product Summary Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Photo */}
          <div className="w-full md:w-56 aspect-4/3 md:aspect-square rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
              {product.currency}{product.price}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                {product.category}
              </span>
              <span className="text-xs text-slate-400">• Updated {product.lastUpdated}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {product.name}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {product.description}
            </p>

            {/* Quick Specs / Features Tags */}
            {product.features && product.features.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-2">
                {product.features.slice(0, 3).map((feat, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    {feat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Intelligence Snapshot Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Product Intelligence Engine</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Foundation v1
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fact classification & source verification engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {product.productIntelligence && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>View Facts & Sources ({product.productIntelligence.sources?.length || 0})</span>
              </button>
            )}

            <button
              onClick={handleRunIntelligence}
              disabled={isAnalyzingIntelligence}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingIntelligence ? 'animate-spin' : ''}`} />
              <span>{product.productIntelligence ? 'Re-Audit Intelligence' : 'Analyze Intelligence'}</span>
            </button>
          </div>
        </div>

        {product.productIntelligence ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED Facts (User Provided)
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  POTENTIAL Facts (AI Detected / Inferred)
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {product.productIntelligence.unknownInformation.length} Unknown Attributes
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-500">Fact Score:</span>
                <span className="font-black text-slate-900">{product.productIntelligence.verificationScore}%</span>
              </div>
            </div>

            {/* Fact details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Verified Specifications</p>
                <div className="space-y-1">
                  <p><span className="font-semibold text-slate-900">Name:</span> {product.productIntelligence.productName.value} <span className="text-[10px] text-emerald-600 font-bold">[{product.productIntelligence.productName.sourceType}]</span></p>
                  <p><span className="font-semibold text-slate-900">Category:</span> {product.productIntelligence.category.value} <span className="text-[10px] text-emerald-600 font-bold">[{product.productIntelligence.category.sourceType}]</span></p>
                  {product.productIntelligence.price && (
                    <p><span className="font-semibold text-slate-900">Price:</span> {product.productIntelligence.price.formatted} <span className="text-[10px] text-emerald-600 font-bold">[{product.productIntelligence.price.sourceType}]</span></p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Unknown / Unverified Catalog</p>
                <div className="space-y-1">
                  {product.productIntelligence.unknownInformation.slice(0, 3).map((u, i) => (
                    <p key={i} className="text-slate-600 line-clamp-1">
                      <span className="font-semibold text-slate-800">• {u.name}:</span> {u.reason}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Click "Analyze Intelligence" to run Sellora's Product Intelligence Engine on this product's text and image data.
          </p>
        )}
      </div>

      {/* AI Actions Workspace Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                AI Optimization Workspace
              </h2>
              <p className="text-xs text-slate-500">
                Generate high-converting marketing assets for this specific product
              </p>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Tone:</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as ToneType)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none"
            >
              <option value="Premium">Premium</option>
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Luxury">Luxury</option>
              <option value="Bold">Bold</option>
              <option value="Minimal">Minimal</option>
            </select>
          </div>
        </div>

        {/* 6 AI Action Tab Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {aiActions.map((action) => {
            const Icon = action.icon;
            const isSelected = activeTab === action.id;

            return (
              <button
                key={action.id}
                onClick={() => {
                  setActiveTab(action.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-600/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold truncate">{action.label}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic AI Generation Result Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Action Sub-Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Active Tool:
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                {aiActions.find((a) => a.id === activeTab)?.label}
              </span>
              <span className="text-xs text-slate-400">• Tone: {tone}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerate(activeTab)}
                disabled={isGenerating}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Preview Mode' : 'Edit Copy'}</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6">
            {isGenerating ? (
              /* Loading State */
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{progressStage}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Calibrating ecommerce psychology and conversion triggers
                  </p>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : currentResult?.error ? (
              <div className="p-6 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 space-y-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      {currentResult.error.message || 'Gemini AI is currently unavailable.'}
                    </h3>
                    {currentResult.error.diagnostic && (
                      <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
                        {currentResult.error.diagnostic}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : currentResult ? (
              /* Generated Output Views */
              <div className="space-y-6">
                {/* 1. Listing Output */}
                {activeTab === 'listing' && currentResult.result.listing && (
                  <div className="space-y-6">
                    {/* Title */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Product Listing Title (Amazon & Shopify Ready)
                        </span>
                        <button
                          onClick={() => copyToClipboard(isEditing ? editedTitle : currentResult.result.listing!.title, 'Listing Title')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          {copiedKey === 'Listing Title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'Listing Title' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                        />
                      ) : (
                        <p className="text-base font-bold text-slate-900 leading-snug">
                          {editedTitle || currentResult.result.listing.title}
                        </p>
                      )}
                    </div>

                    {/* Bullet Points */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Conversion Key Bullet Points
                        </span>
                        <button
                          onClick={() => copyToClipboard(currentResult.result.listing!.bulletPoints.join('\n\n'), 'Bullet Points')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy All Bullets
                        </button>
                      </div>
                      <div className="space-y-2">
                        {currentResult.result.listing.bulletPoints.map((bullet, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 flex items-start gap-2.5 shadow-2xs">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full Description */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Full Product Story & Description
                        </span>
                        <button
                          onClick={() => copyToClipboard(isEditing ? editedDescription : currentResult.result.listing!.fullDescription, 'Full Description')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Description
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={6}
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800"
                        />
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {editedDescription || currentResult.result.listing.fullDescription}
                        </div>
                      )}
                    </div>

                    {/* SEO Keywords */}
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Target SEO Search Keywords
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentResult.result.listing.seoKeywords.map((kw, idx) => (
                          <span
                            key={idx}
                            onClick={() => copyToClipboard(kw, `Keyword "${kw}"`)}
                            className="text-xs px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/60 font-semibold cursor-pointer transition-colors"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Social Content Output */}
                {activeTab === 'social' && currentResult.result.social && (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                            {currentResult.result.social.platform} Ready
                          </span>
                          <span className="text-xs text-slate-400">
                            ⏰ {currentResult.result.social.bestTimeToPost}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(isEditing ? editedCaption : currentResult.result.social!.caption, 'Social Post')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Full Post</span>
                        </button>
                      </div>

                      {isEditing ? (
                        <textarea
                          rows={7}
                          value={editedCaption}
                          onChange={(e) => setEditedCaption(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
                        />
                      ) : (
                        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-normal shadow-2xs">
                          {editedCaption || currentResult.result.social.caption}
                        </div>
                      )}

                      {/* Hashtags */}
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="text-xs font-semibold text-slate-500 mr-2">Suggested Tags:</span>
                        <div className="inline-flex flex-wrap gap-1.5 mt-1">
                          {currentResult.result.social.hashtags.map((tag, idx) => (
                            <span key={idx} className="text-[11px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Creative Director Tip: </span>
                        <span>{currentResult.result.social.mediaSuggestion}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Ad Output */}
                {activeTab === 'ad' && currentResult.result.ad && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Ad Spec details */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ad Headline</span>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{currentResult.result.ad.headline}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Ad Text</span>
                            <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{currentResult.result.ad.primaryText}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                            <span className="font-semibold text-slate-500">CTA Button:</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                              {currentResult.result.ad.callToAction}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Target Audience Calibration
                          </p>
                          <p className="text-emerald-800">{currentResult.result.ad.audienceTargeting}</p>
                          <p className="text-[11px] font-semibold text-emerald-700 pt-1">
                            Benchmark CTR: {currentResult.result.ad.estimatedCTR}
                          </p>
                        </div>
                      </div>

                      {/* Mock Ad Preview Mockup */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md max-w-sm mx-auto w-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                            S
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Sellora Sponsored</p>
                            <p className="text-[10px] text-slate-400">Paid Partnership</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 mb-2 leading-snug line-clamp-3">
                          {currentResult.result.ad.primaryText}
                        </p>

                        <div className="rounded-xl overflow-hidden border border-slate-100 mb-3 bg-slate-100 aspect-16/10">
                          <img src={product.image} alt="Ad Preview" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase">store.sellora.ai</p>
                            <p className="text-xs font-bold text-slate-900 truncate max-w-40">{currentResult.result.ad.headline}</p>
                          </div>
                          <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">
                            {currentResult.result.ad.callToAction}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Product Studio Image Enhancer */}
                {activeTab === 'image' && currentResult.result.image && (
                  <div className="space-y-6">
                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Style:</span>
                        {(['Studio', 'Minimal', 'Luxury', 'Lifestyle', 'Outdoor', 'Social Media'] as ImageStyle[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              setSelectedImageStyle(st);
                              handleGenerate('image');
                            }}
                            className={`text-xs px-3 py-1 rounded-xl font-bold transition-all ${
                              selectedImageStyle === st
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Ratio:</span>
                        {(['1:1', '4:5', '9:16', '16:9'] as AspectRatio[]).map((ar) => (
                          <button
                            key={ar}
                            onClick={() => setSelectedAspectRatio(ar)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                              selectedAspectRatio === ar
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {ar}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Before vs After View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>Original Raw Photo</span>
                          <span className="text-slate-400">Input Photo</span>
                        </div>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={currentResult.result.image.originalImage} alt="Original" className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            AI Studio Render ({selectedImageStyle})
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[10px]">
                            {selectedAspectRatio}
                          </span>
                        </div>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border-2 border-indigo-500 shadow-md relative group">
                          <img src={currentResult.result.image.generatedImage} alt="Enhanced" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => showToast('High-resolution asset downloaded!', 'success')}
                              className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-lg hover:bg-slate-100"
                            >
                              Download 4K
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhancement Specs */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Lighting & Compositing Notes</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        {currentResult.result.image.enhancementDetails.map((det, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{det}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 5. Customer Reply Bot */}
                {activeTab === 'reply' && currentResult.result.reply && (
                  <div className="space-y-5">
                    {/* Inquiry Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Customer Message or Objection:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inquiryText}
                          onChange={(e) => setInquiryText(e.target.value)}
                          placeholder="e.g. Does this come with a warranty?"
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                        />
                        <button
                          onClick={() => handleGenerate('reply')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0"
                        >
                          Generate Reply
                        </button>
                      </div>
                    </div>

                    {/* AI Response Card */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          Recommended High-Conversion Reply
                        </span>
                        <button
                          onClick={() => copyToClipboard(currentResult.result.reply!.recommendedReply, 'Customer Reply')}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Reply</span>
                        </button>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed shadow-2xs">
                        {currentResult.result.reply.recommendedReply}
                      </div>

                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                        <span className="font-bold">Sales Strategy: </span>
                        <span>{currentResult.result.reply.objectionResolution}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Product Deep Analysis (Fact Extraction & Product Understanding Tool) */}
                {activeTab === 'analysis' && currentResult.result.analysis && (
                  <div className="space-y-6">
                    {/* Truthfulness Notice Banner */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-2">
                            <span>Sellora Fact Extraction Audit</span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Core Trust Policy
                            </span>
                          </p>
                          <p className="text-xs text-slate-300 mt-0.5 font-medium">
                            Sellora separates observed, user-provided and verified information. It does not treat guesses as facts.
                          </p>
                        </div>
                      </div>

                      {/* Engine Status Badge */}
                      <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                        <span className={`w-2 h-2 rounded-full ${currentResult.isRealAi ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        <span className="text-xs font-semibold text-slate-200">
                          {currentResult.aiStatusMessage || (currentResult.isRealAi ? 'Gemini Flash Engine' : 'AI Analysis Result')}
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Product Identification */}
                    {(() => {
                      const strict = currentResult.result.analysis.strictAnalysis || currentResult.result.analysis.detailedAnalysis?.strictAnalysis;
                      const brand = strict?.productIdentification?.brand || { value: product.name.split(' ')[0] || 'Unspecified', sourceType: 'USER_PROVIDED', confidence: 'MEDIUM' };
                      const pType = strict?.productIdentification?.productType || { value: product.category || 'Product', sourceType: 'USER_PROVIDED', confidence: 'HIGH' };
                      const model = strict?.productIdentification?.model || { value: 'Not verified', sourceType: 'UNKNOWN', confidence: 'NOT_APPLICABLE' };

                      return (
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <Layers className="w-4 h-4 text-blue-600" />
                              1. Product Identification
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500">Fact Extraction</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Brand */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Brand</span>
                              <p className="text-sm font-extrabold text-slate-900">{brand.value}</p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                  brand.sourceType === 'OBSERVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  brand.sourceType === 'USER_PROVIDED' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                  brand.sourceType === 'VERIFIED' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                  'bg-slate-200 text-slate-700 border-slate-300'
                                }`}>
                                  {brand.sourceType === 'UNKNOWN' ? 'NOT VERIFIED' : brand.sourceType.replace('_', ' ')}
                                </span>
                                {brand.confidence && brand.confidence !== 'NOT_APPLICABLE' && (
                                  <span className="text-[10px] font-semibold text-slate-500">({brand.confidence})</span>
                                )}
                              </div>
                            </div>

                            {/* Product Type */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Product Type</span>
                              <p className="text-sm font-extrabold text-slate-900">{pType.value}</p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                  pType.sourceType === 'OBSERVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  pType.sourceType === 'USER_PROVIDED' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                  pType.sourceType === 'VERIFIED' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                  'bg-slate-200 text-slate-700 border-slate-300'
                                }`}>
                                  {pType.sourceType === 'UNKNOWN' ? 'NOT VERIFIED' : pType.sourceType.replace('_', ' ')}
                                </span>
                                {pType.confidence && pType.confidence !== 'NOT_APPLICABLE' && (
                                  <span className="text-[10px] font-semibold text-slate-500">({pType.confidence})</span>
                                )}
                              </div>
                            </div>

                            {/* Model */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Exact Model</span>
                              <p className="text-sm font-extrabold text-slate-900">{model.value}</p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                  model.sourceType === 'OBSERVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  model.sourceType === 'USER_PROVIDED' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                  model.sourceType === 'VERIFIED' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                  'bg-amber-100 text-amber-900 border-amber-300'
                                }`}>
                                  {model.sourceType === 'UNKNOWN' ? 'NOT VERIFIED' : model.sourceType.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Factual Grid Sections 2 - 5 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section 2: What Sellora Can Observe */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            2. What Sellora Can Observe
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                            OBSERVED
                          </span>
                        </div>
                        {(() => {
                          const strictObserved = currentResult.result.analysis.strictAnalysis?.observedCharacteristics;
                          const fallbackObserved = currentResult.result.analysis.detailedAnalysis?.observedFeatures;

                          if (strictObserved && strictObserved.length > 0) {
                            return (
                              <ul className="space-y-2 text-xs text-slate-700">
                                {strictObserved.map((item, idx) => (
                                  <li key={idx} className="flex items-start justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <div>
                                      <span className="font-bold text-slate-900 block">{item.name}</span>
                                      <span className="text-slate-700">{item.value}</span>
                                    </div>
                                    <span className="text-[10px] font-extrabold text-emerald-700 shrink-0 uppercase bg-emerald-100/60 px-1.5 py-0.5 rounded">
                                      {item.confidence}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            );
                          } else if (fallbackObserved && fallbackObserved.length > 0) {
                            return (
                              <ul className="space-y-2 text-xs text-slate-700">
                                {fallbackObserved.map((feat, idx) => (
                                  <li key={idx} className="flex items-start justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="font-medium text-slate-800">{feat.fact}</span>
                                    <span className="text-[10px] font-extrabold text-emerald-700 shrink-0 uppercase">{feat.confidence}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                          return <p className="text-xs text-slate-400 italic p-2">No observable visual characteristics identified from image.</p>;
                        })()}
                      </div>

                      {/* Section 3: Information Provided by You */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            3. Information Provided by You
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                            USER PROVIDED
                          </span>
                        </div>
                        {(() => {
                          const strictUser = currentResult.result.analysis.strictAnalysis?.userProvidedInformation;
                          const fallbackUser = currentResult.result.analysis.detailedAnalysis?.userProvidedFacts;

                          if (strictUser && strictUser.length > 0) {
                            return (
                              <ul className="space-y-2 text-xs text-slate-700">
                                {strictUser.map((item, idx) => (
                                  <li key={idx} className="flex items-start justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <div>
                                      <span className="font-bold text-slate-900 block">{item.name}</span>
                                      <span className="text-slate-700">{item.value}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-700 shrink-0 uppercase bg-blue-100/60 px-1.5 py-0.5 rounded">
                                      USER PROVIDED
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            );
                          } else if (fallbackUser && fallbackUser.length > 0) {
                            return (
                              <ul className="space-y-2 text-xs text-slate-700">
                                {fallbackUser.map((fact, idx) => (
                                  <li key={idx} className="flex items-start justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="font-medium text-slate-800">{fact.fact}</span>
                                    <span className="text-[10px] font-bold text-blue-700 shrink-0 uppercase">USER PROVIDED</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                          return <p className="text-xs text-slate-400 italic p-2">No custom text specifications provided by user.</p>;
                        })()}
                      </div>

                      {/* Section 4: Verified Information */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                            4. Verified Information
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                            VERIFIED
                          </span>
                        </div>
                        {(() => {
                          const strictVerified = currentResult.result.analysis.strictAnalysis?.verifiedInformation;

                          if (strictVerified && strictVerified.length > 0) {
                            return (
                              <ul className="space-y-2 text-xs text-slate-700">
                                {strictVerified.map((item, idx) => (
                                  <li key={idx} className="flex items-start justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <div>
                                      <span className="font-bold text-slate-900 block">{item.name}: {item.value}</span>
                                      <span className="text-[11px] text-purple-700">Source: {item.source}</span>
                                    </div>
                                    <span className="text-[10px] font-extrabold text-purple-800 shrink-0 uppercase bg-purple-100/60 px-1.5 py-0.5 rounded">
                                      {item.confidence}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                          return (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
                              <p className="font-semibold text-slate-700">No external authoritative verification available.</p>
                              <p className="text-[11px] text-slate-400">Sellora never labels Gemini AI inference or guesses as VERIFIED without external source confirmation.</p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Section 5: Information Not Verified (UNKNOWN) */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            5. Information Not Verified
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                            NOT VERIFIED
                          </span>
                        </div>
                        {(() => {
                          const strictUnknown = currentResult.result.analysis.strictAnalysis?.unknownInformation;
                          const fallbackUnknown = currentResult.result.analysis.detailedAnalysis?.unknownFacts;

                          if (strictUnknown && strictUnknown.length > 0) {
                            return (
                              <ul className="space-y-2 text-xs text-slate-600">
                                {strictUnknown.map((item, idx) => (
                                  <li key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-900">{item.name}</span>
                                      <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                        Not verified
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500">{item.reason}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          } else if (fallbackUnknown && fallbackUnknown.length > 0) {
                            return (
                              <ul className="space-y-2 text-xs text-slate-600">
                                {fallbackUnknown.map((uf, idx) => (
                                  <li key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-900">{uf.field}</span>
                                      <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Not verified</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500">{uf.reason}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                          return <p className="text-xs text-slate-400 italic p-2">All product attributes verified.</p>;
                        })()}
                      </div>
                    </div>

                    {/* Section 6: Analysis Warnings */}
                    {(() => {
                      const warnings = currentResult.result.analysis.strictAnalysis?.analysisWarnings || currentResult.result.analysis.detailedAnalysis?.warnings;
                      if (warnings && warnings.length > 0) {
                        return (
                          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              6. Analysis Warnings & Accuracy Notes
                            </span>
                            <ul className="space-y-1.5 text-xs text-amber-900">
                              {warnings.map((warn, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="font-bold text-amber-600">•</span>
                                  <span>{warn}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ProductIntelligenceDrawer
        product={product}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onReAudit={() => {
          handleRunIntelligence();
        }}
        isAnalyzing={isAnalyzingIntelligence}
      />
    </div>
  );
}
