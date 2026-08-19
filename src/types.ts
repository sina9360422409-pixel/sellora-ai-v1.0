export type ProductStatus = 'Ready' | 'Needs improvement' | 'Draft' | 'Published';

export type SourceType = 'USER_PROVIDED' | 'OBSERVED' | 'VERIFIED' | 'UNKNOWN';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_APPLICABLE';

export interface FactItem {
  fact: string;
  sourceType: SourceType;
  confidence: ConfidenceLevel;
}

export interface UnknownFactItem {
  field: string;
  reason: string;
  sourceType: 'UNKNOWN';
  confidence: 'NOT_APPLICABLE';
}

export interface SellingPointItem {
  point: string;
  basedOn: SourceType;
}

export interface FactValue {
  value: string;
  sourceType: SourceType;
  confidence: ConfidenceLevel;
}

export interface ProductIdentification {
  brand: FactValue;
  productType: FactValue;
  model: FactValue;
}

export interface ObservedItem {
  name: string;
  value: string;
  sourceType: 'OBSERVED';
  confidence: ConfidenceLevel;
}

export interface UserProvidedItem {
  name: string;
  value: string;
  sourceType: 'USER_PROVIDED';
  confidence: 'NOT_APPLICABLE' | ConfidenceLevel;
}

export interface VerifiedItem {
  name: string;
  value: string;
  sourceType: 'VERIFIED';
  source: string;
  confidence: ConfidenceLevel;
}

export interface UnknownItem {
  name: string;
  reason: string;
}

export interface StrictProductAnalysis {
  productIdentification: ProductIdentification;
  observedCharacteristics: ObservedItem[];
  userProvidedInformation: UserProvidedItem[];
  verifiedInformation: VerifiedItem[];
  unknownInformation: UnknownItem[];
  analysisWarnings: string[];
}

export interface DetailedAnalysisData {
  productName: { value: string; sourceType: SourceType; confidence: ConfidenceLevel };
  category: { value: string; sourceType: SourceType; confidence: ConfidenceLevel };
  overallScore: number;
  readinessLevel: 'High' | 'Moderate' | 'Needs Attention';
  observedFeatures: FactItem[];
  userProvidedFacts: FactItem[];
  verifiedFacts: FactItem[];
  unknownFacts: UnknownFactItem[];
  sellingPoints: SellingPointItem[];
  targetAudience: string[];
  contentSuggestions: string[];
  seoKeywords: string[];
  warnings: string[];
  strictAnalysis?: StrictProductAnalysis;
}

// ==================================================
// PRODUCT INTELLIGENCE ENGINE MODEL
// ==================================================

export type FactSourceCategory =
  | 'USER_PROVIDED'
  | 'IMAGE_OBSERVED'
  | 'RESEARCH_FOUND'
  | 'INFERRED'
  | 'UNKNOWN'
  | 'CONFLICTING';

export type FactVerificationStatus =
  | 'VERIFIED'
  | 'POTENTIAL'
  | 'UNSUPPORTED'
  | 'UNKNOWN'
  | 'CONFLICTING';

export interface FactItem {
  id?: string;
  attributeName: string; // e.g., "CPU", "Sole Type", "Fragrance Notes", "Compatible Model", "Material", "Color"
  value: string;
  source: FactSourceCategory;
  status: FactVerificationStatus;
  confidence: number; // 0.0 to 1.0
  sourceUrl?: string;
  sourceName?: string;
  evidence?: string;
  competingValues?: string[]; // If status === 'CONFLICTING'
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  reliabilityScore: number; // 0 to 100
  retrievedAt: string;
}

export interface UniversalProductProfile {
  id: string;
  productId: string;
  lastUpdated: string;

  identity: {
    name: string;
    brand: string;
    model: string;
    category: string;
    subcategory: string;
    productType: string;
  };

  // Dynamic Category Attributes (Works for Laptops, Shoes, Perfumes, Phone Cases, Cars, etc.)
  attributes: Record<string, FactItem>;

  // Categorized Fact lists
  userProvidedFacts: FactItem[];
  visualFacts: FactItem[];
  researchedFacts: FactItem[];
  unknownFacts: Array<{ name: string; reason: string }>;
  conflicts: FactItem[];

  // Pricing & Variants
  pricing: {
    amount: number;
    currency: string;
    formatted: string;
    source: FactSourceCategory;
  };
  variants: string[];

  // Research Sources
  sources: ResearchSource[];

  // Keywords & Target Audience
  productKeywords: string[];
  targetAudience: string[];

  // Overall Health / Confidence Score (0 - 100)
  overallConfidenceScore: number;
  summaryNotes: string;
}

export type FactStatus = FactVerificationStatus;
export type IntelligenceSourceType = 'USER_PROVIDED' | 'AI_DETECTED' | 'AI_INFERRED' | 'RESEARCH_VERIFIED';
export type IntelligenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_APPLICABLE';

export interface ProductIntelligenceFact {
  name?: string;
  value: string;
  status: FactStatus;
  sourceType: IntelligenceSourceType;
  confidence: IntelligenceConfidence;
  source?: string;
  evidence?: string;
}

export interface ProductIntelligence {
  id: string;
  productId: string;
  lastAnalyzedAt: string;

  // Core Identifiers & Categorization
  productName: ProductIntelligenceFact;
  category: ProductIntelligenceFact;
  subcategory?: ProductIntelligenceFact;
  brand?: ProductIntelligenceFact;
  description?: ProductIntelligenceFact;
  price?: {
    value: number;
    currency: string;
    formatted: string;
    status: FactStatus;
    sourceType: IntelligenceSourceType;
  };

  // Physical & Technical Attributes
  compatibleDevices?: ProductIntelligenceFact[];
  materials?: ProductIntelligenceFact[];
  colors?: ProductIntelligenceFact[];
  design?: ProductIntelligenceFact[];
  finish?: ProductIntelligenceFact[];
  dimensions?: ProductIntelligenceFact;
  weight?: ProductIntelligenceFact;

  // Dynamic category attributes mapping
  dynamicAttributes?: Record<string, FactItem>;

  // Functional & Marketing Intelligence
  features?: ProductIntelligenceFact[];
  useCases?: ProductIntelligenceFact[];
  targetCustomer?: ProductIntelligenceFact[];
  detectedClaims?: ProductIntelligenceFact[];

  // Unknown & Unverified Catalog
  unknownInformation: Array<{
    name: string;
    reason: string;
  }>;

  // Search & Discovery
  productKeywords: string[];

  // Research Sources
  researchSources?: ResearchSource[];
  sources?: ResearchSource[];

  // Health & Readiness Summary
  verificationScore: number; // 0-100 score
  summaryNotes: string;

  // Embedded Universal Profile
  universalProfile?: UniversalProductProfile;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  status: ProductStatus;
  price: number;
  currency: string;
  image: string;
  description: string;
  features?: string[];
  tags?: string[];
  targetAudience?: string;
  usp?: string; // Unique Selling Proposition
  lastUpdated: string;
  aiContentCount?: number;
  productIntelligence?: ProductIntelligence;
}

export type ContentType = 'listing' | 'social' | 'ad' | 'image' | 'reply' | 'analysis';

export type SocialPlatform = 'Instagram' | 'Facebook' | 'TikTok' | 'WhatsApp' | 'Other';
export type AdPlatform = 'Instagram' | 'Facebook' | 'Google' | 'Amazon';
export type ToneType = 'Professional' | 'Friendly' | 'Premium' | 'Luxury' | 'Bold' | 'Minimal';
export type GoalType = 'More Sales' | 'More Clicks' | 'Brand Awareness' | 'Product Launch';
export type ImageStyle = 'Studio' | 'Minimal' | 'Luxury' | 'Lifestyle' | 'Outdoor' | 'Social Media';
export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';

export interface ListingResult {
  title: string;
  shortDescription: string;
  fullDescription: string;
  keyFeatures: string[];
  seoKeywords: string[];
  bulletPoints: string[];
  callToAction: string;
}

export interface SocialResult {
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  hook: string;
  callToAction: string;
  mediaSuggestion: string;
  bestTimeToPost: string;
}

export interface AdResult {
  platform: AdPlatform;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  audienceTargeting: string;
  estimatedCTR: string;
}

export interface ImageResult {
  originalImage: string;
  generatedImage: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
  promptUsed: string;
  lightingType: string;
  enhancementDetails: string[];
}

export interface ReplyResult {
  customerInquiry: string;
  recommendedReply: string;
  politeAlternative: string;
  objectionResolution: string;
  tone: string;
}

export interface AnalysisResult {
  overallScore: number;
  readinessLevel: 'High' | 'Moderate' | 'Needs Attention';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  salesPotential: string;
  detailedAnalysis?: DetailedAnalysisData;
}

export interface GeneratedContent {
  id: string;
  productId: string;
  productName: string;
  type: ContentType;
  createdAt: string;
  tone: ToneType;
  goal?: GoalType;
  platform?: string;
  isRealAi?: boolean;
  aiStatusMessage?: string;
  error?: {
    type: string;
    message: string;
    diagnostic?: string;
  };
  result: {
    listing?: ListingResult;
    social?: SocialResult;
    ad?: AdResult;
    image?: ImageResult;
    reply?: ReplyResult;
    analysis?: AnalysisResult;
  };
}

export interface ConnectedChannel {
  id: string;
  name: string;
  type: 'instagram' | 'amazon' | 'shopify' | 'tiktok' | 'etsy';
  icon: string;
  status: 'Connected' | 'Not connected';
  handle?: string;
  lastSync?: string;
  productCount?: number;
}

export interface UserProfile {
  name: string;
  storeName: string;
  email: string;
  avatar: string;
  plan: 'Starter' | 'Pro' | 'Growth';
  creditsUsed: number;
  creditsTotal: number;
  currency: string;
  defaultTone: ToneType;
  autoSave: boolean;
}

export interface OnboardingData {
  categories: string[];
  channels: string[];
  goal: string;
  completed: boolean;
}

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  actionType: ContentType;
  productId?: string;
  tag: string;
}
