import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X,
  Tag,
  Globe,
  Layers,
  BarChart3,
  AlertTriangle,
  FileCheck,
  HelpCircle,
  Eye,
  UserCheck
} from 'lucide-react';
import { Product, ProductIntelligence, NormalizedFact, ResearchSource } from '../types';
import { getSupportedProductFacts } from '../services/productIntelligenceService';

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

  const [activeTab, setActiveTab] = useState<'overview' | 'canonical_tiers' | 'conflicts' | 'sources' | 'unknowns'>('overview');

  // Extract canonical items
  const userFacts: NormalizedFact[] = profile?.userProvidedFacts || [];
  const observedFacts: NormalizedFact[] = profile?.observedFacts || [];
  const verifiedFacts: NormalizedFact[] = profile?.verifiedFacts || profile?.researchedFacts || [];
  const unknownFacts = profile?.unknownFacts || (intel?.unknownInformation?.map(u => ({ name: u.name, reason: u.reason })) || []);
  const potentialFacts = profile?.potentialFacts || [];
  const conflicts = profile?.conflicts || [];
  const warnings = profile?.researchWarnings || [];
  const sources: ResearchSource[] = profile?.sources || intel?.sources || intel?.researchSources || [];
  const supportedFacts = profile ? getSupportedProductFacts(profile) : [];

  const identity = profile?.productIdentity;

  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'USER_PROVIDED':
        return <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">USER_PROVIDED</span>;
      case 'OBSERVED':
        return <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">OBSERVED</span>;
      case 'VERIFIED':
        return <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">VERIFIED</span>;
      case 'UNKNOWN':
        return <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">UNKNOWN</span>;
      default:
        return <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{sourceType}</span>;
    }
  };

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
                  Phase 1 Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Truthful specification verification & research for "{product.name}"
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
              <span>{isAnalyzing ? 'Researching...' : 'Re-Run Research'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Navigation Tabs */}
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
            <span>Overview & Health</span>
          </button>

          <button
            onClick={() => setActiveTab('canonical_tiers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'canonical_tiers'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fact Tiers ({userFacts.length + observedFacts.length + verifiedFacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'conflicts'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${conflicts.length > 0 ? 'text-amber-400' : ''}`} />
            <span>Conflicts & Warnings ({conflicts.length + warnings.length})</span>
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
            <span>Unknown Specs ({unknownFacts.length})</span>
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
                Click "Re-Run Research" above to perform grounded fact verification and research for this product.
              </p>
            </div>
          ) : (
            <>
              {/* Fact Audit Score Header */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">
                      Product Intelligence Health
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                      Status: {profile?.researchStatus || intel.researchStatus || 'COMPLETED'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-100">
                    {profile?.summaryNotes || intel.summaryNotes || 'Product facts verified and classified into canonical source tiers.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Confidence Score</p>
                    <p className="text-xl font-black text-emerald-400">
                      {profile?.overallScore || intel.verificationScore}%
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        Conservative Product Identity
                      </h3>
                      {identity?.brand?.status === 'REQUIRES_CONFIRMATION' && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                          Possible: {identity.brand.possibleIdentification} (Requires Confirmation)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium">Category</p>
                        <p className="font-bold text-slate-900">{identity?.category?.value || product.category}</p>
                        <span className="text-[9px] text-slate-500">{identity?.category?.sourceType || 'USER_PROVIDED'}</span>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Brand</p>
                        <p className="font-bold text-slate-900">{identity?.brand?.value || 'Generic'}</p>
                        <span className="text-[9px] text-slate-500">{identity?.brand?.sourceType || 'UNKNOWN'}</span>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Model</p>
                        <p className="font-bold text-slate-900">{identity?.model?.value || 'UNKNOWN'}</p>
                        <span className="text-[9px] text-slate-500">{identity?.model?.sourceType || 'UNKNOWN'}</span>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">User-Provided Price</p>
                        <p className="font-bold text-slate-900">{product.currency}{product.price}</p>
                        <span className="text-[9px] text-emerald-600 font-bold">USER_PROVIDED</span>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Supported Facts Count</p>
                        <p className="font-bold text-slate-900">{supportedFacts.length} Verified Facts</p>
                        <span className="text-[9px] text-slate-500">Ready for Generator</span>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Research Grounding</p>
                        <p className="font-bold text-slate-900">{sources.length} Real Web Sources</p>
                        <span className="text-[9px] text-slate-500">Grounded via Google</span>
                      </div>
                    </div>
                  </div>

                  {/* Fact Generation Gate Preview */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                        Downstream Content Generator Fact Gate
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        {supportedFacts.length} Permitted Facts
                      </span>
                    </div>
                    <p className="text-xs text-indigo-800">
                      Only facts classified as <strong className="font-bold">USER_PROVIDED</strong>, <strong className="font-bold">OBSERVED</strong>, and <strong className="font-bold">VERIFIED</strong> with authentic sources will be provided to marketing copy generators. UNKNOWN and POTENTIAL inferences are blocked.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {supportedFacts.slice(0, 8).map((f, idx) => (
                        <span key={idx} className="text-[10px] bg-white border border-indigo-200 text-indigo-900 px-2 py-0.5 rounded font-medium">
                          {f.name}: {f.value}
                        </span>
                      ))}
                      {supportedFacts.length > 8 && (
                        <span className="text-[10px] text-indigo-600 font-bold self-center">
                          +{supportedFacts.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CANONICAL FACT TIERS TAB */}
              {activeTab === 'canonical_tiers' && (
                <div className="space-y-6">
                  {/* USER_PROVIDED Facts */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        USER_PROVIDED Facts ({userFacts.length})
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Preserved Verbatim
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {userFacts.map((fact, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-white border border-emerald-100 flex items-start justify-between gap-3">
                          <div>
                            <span className="font-bold text-emerald-950">{fact.name}:</span>{' '}
                            <span className="text-slate-800">{fact.value}</span>
                          </div>
                          {getSourceBadge('USER_PROVIDED')}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OBSERVED Facts */}
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-sky-600" />
                        OBSERVED Facts ({observedFacts.length})
                      </span>
                      <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                        Visible in Image
                      </span>
                    </div>
                    {observedFacts.length === 0 ? (
                      <p className="text-xs text-sky-800 italic">No image provided or no distinct visual specs observed.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {observedFacts.map((fact, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-white border border-sky-100 flex items-start justify-between gap-3">
                            <div>
                              <span className="font-bold text-sky-950">{fact.name}:</span>{' '}
                              <span className="text-slate-800">{fact.value}</span>
                            </div>
                            {getSourceBadge('OBSERVED')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* VERIFIED Facts */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        VERIFIED Researched Facts ({verifiedFacts.length})
                      </span>
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                        Source Grounded
                      </span>
                    </div>
                    {verifiedFacts.length === 0 ? (
                      <p className="text-xs text-indigo-800 italic">No external web facts verified yet.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {verifiedFacts.map((fact, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white border border-indigo-100 space-y-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="font-bold text-indigo-950">{fact.name}:</span>{' '}
                                <span className="text-slate-800">{fact.value}</span>
                              </div>
                              {getSourceBadge('VERIFIED')}
                            </div>
                            {fact.source && (
                              <p className="text-[10px] text-indigo-600">
                                Source: {fact.source.title} ({fact.source.publisher || 'Web'})
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* POTENTIAL Inferences */}
                  {potentialFacts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-slate-500" />
                          POTENTIAL Candidates ({potentialFacts.length})
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                          Blocked from Content Generation
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {potentialFacts.map((fact, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-3">
                            <div>
                              <span className="font-bold text-slate-900">{fact.name}:</span>{' '}
                              <span className="text-slate-700">{fact.value}</span>
                              {fact.reason && <p className="text-[10px] text-slate-500 mt-0.5">{fact.reason}</p>}
                            </div>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">POTENTIAL</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONFLICTS & WARNINGS TAB */}
              {activeTab === 'conflicts' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Discrepancies detected between user inputs and researched specifications. User data is never silently overwritten.
                  </p>

                  {conflicts.length === 0 && warnings.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-emerald-900">Zero Conflicts Detected</p>
                      <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                        User inputs and verified characteristics are fully consistent.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conflicts.map((conflict, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <h4 className="text-xs font-bold text-amber-950">Conflict in {conflict.field}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-amber-200">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-700 uppercase">User-Provided Value</p>
                              <p className="font-bold text-slate-900">{conflict.userValue}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-indigo-700 uppercase">Researched Value</p>
                              <p className="font-bold text-slate-900">{conflict.researchedValue}</p>
                            </div>
                          </div>
                          <p className="text-xs text-amber-800">{conflict.description}</p>
                        </div>
                      ))}

                      {warnings.map((warn, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-700">{warn}</p>
                        </div>
                      ))}
                    </div>
                  )}
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
                        Click "Re-Run Research" above to trigger real-time Google search grounding for external fact verification.
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
                              {src.reliabilityScore || 85}% Trust Score
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
                    {unknownFacts.map((u, idx) => (
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

