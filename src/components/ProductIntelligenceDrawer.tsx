import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X,
  FileText,
  HelpCircle,
  Tag,
  Search,
  Globe,
  Layers,
  BarChart3
} from 'lucide-react';
import { Product, ProductIntelligence, FactItem, ResearchSource } from '../types';

interface ProductIntelligenceDrawerProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onReAudit: () => void;
  isAnalyzing: boolean;
}

export const ProductIntelligenceDrawer: React.FC<ProductIntelligenceDrawerProps> = ({
  product,
  isOpen,
  onClose,
  onReAudit,
  isAnalyzing
}) => {
  if (!isOpen) return null;

  const intel: ProductIntelligence | undefined = product.productIntelligence;
  const profile = intel?.universalProfile;

  const [activeTab, setActiveTab] = useState<'overview' | 'attributes' | 'sources' | 'unknowns'>('overview');

  // Gather all attributes
  const dynamicAttrs = profile?.attributes ? Object.values(profile.attributes) : [];
  const sources: ResearchSource[] = profile?.sources || intel?.sources || intel?.researchSources || [];
  const unknowns = profile?.unknownFacts || intel?.unknownInformation || [];
  const userFacts = profile?.userProvidedFacts || [];
  const visualFacts = profile?.visualFacts || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Product Intelligence Profile</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Universal Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Fact-verified specs & research sources for "{product.name}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReAudit}
              disabled={isAnalyzing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Re-Run Intelligence'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Fact Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('attributes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'attributes'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dynamic Attributes ({dynamicAttrs.length + userFacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sources'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Research Sources ({sources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('unknowns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'unknowns'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Unknown Specs ({unknowns.length})</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!intel ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No Intelligence Analysis Loaded Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Re-Run Intelligence" above to analyze text and image specifications with Sellora's Product Intelligence Engine.
              </p>
            </div>
          ) : (
            <>
              {/* Fact Audit Score Header */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">
                      Fact Audit Health
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                      Category: {profile?.identity?.category || product.category}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-100">
                    {profile?.summaryNotes || intel.summaryNotes || 'Product facts verified and categorized.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Confidence Score</p>
                    <p className="text-xl font-black text-emerald-400">
                      {intel.verificationScore}%
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-400 text-emerald-400 flex items-center justify-center font-bold text-xs bg-emerald-500/10">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Category & Identity */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      Universal Identity Classification
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium">Category</p>
                        <p className="font-bold text-slate-900">{profile?.identity?.category || product.category}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Subcategory</p>
                        <p className="font-bold text-slate-900">{profile?.identity?.subcategory || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Brand</p>
                        <p className="font-bold text-slate-900">{profile?.identity?.brand || 'Generic / Seller'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Model / Style</p>
                        <p className="font-bold text-slate-900">{profile?.identity?.model || 'Standard'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Verified Price</p>
                        <p className="font-bold text-slate-900">{profile?.pricing?.formatted || `${product.currency}${product.price}`}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Sources Found</p>
                        <p className="font-bold text-slate-900">{sources.length} Research Links</p>
                      </div>
                    </div>
                  </div>

                  {/* Fact Classification Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* User Provided Facts */}
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          USER_PROVIDED Facts
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          High Confidence
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-emerald-950 pt-1">
                        {userFacts.map((fact, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2 border-b border-emerald-100/60 pb-1">
                            <span className="font-medium text-emerald-900">{fact.attributeName}:</span>
                            <span className="font-bold text-right">{fact.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Image Observed / AI Detected Facts */}
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          IMAGE_OBSERVED Facts
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          Visual Detection
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-blue-950 pt-1">
                        {visualFacts.length > 0 ? (
                          visualFacts.map((fact, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-2 border-b border-blue-100/60 pb-1">
                              <span className="font-medium text-blue-900">{fact.attributeName}:</span>
                              <span className="font-bold text-right">{fact.value}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-blue-700 italic">No additional visual specs detected beyond user input.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC ATTRIBUTES TAB */}
              {activeTab === 'attributes' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Category-specific attributes extracted by the Universal Product Intelligence Engine. Content generation consumes these verified fields.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dynamicAttrs.map((attr, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{attr.attributeName}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            attr.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {attr.source || attr.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOURCES TAB */}
              {activeTab === 'sources' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    External research links & search grounding sources verified for this product.
                  </p>

                  {sources.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <Globe className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Web Sources Linked Yet</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Click "Re-Run Intelligence" above to trigger real-time Google search grounding for external fact verification.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {sources.map((src, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                              <h4 className="text-xs font-bold text-slate-900 truncate">{src.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{src.url}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                              {src.reliabilityScore}% Trust Score
                            </span>
                            {src.url && (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* UNKNOWNS TAB */}
              {activeTab === 'unknowns' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Attributes that could not be factually confirmed from text, image, or research. Sellora strictly forbids hallucinating or inventing these specs.
                  </p>

                  <div className="space-y-2">
                    {unknowns.map((u, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-950">{u.name}</p>
                          <p className="text-xs text-amber-800 mt-0.5">{u.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
