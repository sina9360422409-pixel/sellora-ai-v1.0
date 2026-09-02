export type ProductStatus = 'Ready' | 'Needs improvement' | 'Draft' | 'Published';

export type SourceType = 'USER_PROVIDED' | 'OBSERVED' | 'VERIFIED' | 'UNKNOWN';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_APPLICABLE';

export interface LegacyFactItem {
  fact?: string;
  name?: string;
  value?: string;
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
  observedFeatures: LegacyFactItem[];
  userProvidedFacts: LegacyFactItem[];
  verifiedFacts: LegacyFactItem[];
  unknownFacts: UnknownFactItem[];
  sellingPoints: SellingPointItem[];
  targetAudience: string[];
  contentSuggestions: string[];
  seoKeywords: string[];
  warnings: string[];
  strictAnalysis?: StrictProductAnalysis;
}

// ==================================================
// PRODUCT INTELLIGENCE RESEARCH ENGINE MODEL (PHASE 1)
// ==================================================

export type FactSourceType = 'OBSERVED' | 'USER_PROVIDED' | 'VERIFIED' | 'UNKNOWN';
export type FactConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_APPLICABLE';
export type ResearchStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'NO_RELIABLE_SOURCE';

export interface FactSourceRef {
  title: string;
  url: string;
  publisher?: string;
  domain?: string;
  reliabilityScore?: number;
}

export interface NormalizedFact {
  name: string;
  value: string;
  sourceType: FactSourceType;
  confidence: FactConfidence;
  source?: FactSourceRef | null;
  evidence?: string;
  reason?: string;
}

export interface ProductIdentityItem extends NormalizedFact {
  possibleIdentification?: string;
  status?: 'CONFIRMED' | 'REQUIRES_CONFIRMATION' | 'UNVERIFIED';
}

export interface ProductFactConflict {
  field: string;
  userValue: string;
  researchedValue: string;
  description: string;
  source?: FactSourceRef | null;
}

export interface PotentialFact {
  name: string;
  value: string;
  status: 'POTENTIAL';
  reason: string;
}

export interface UniversalProductIntelligenceProfile {
  productIdentity: {
    brand: ProductIdentityItem;
    productName: ProductIdentityItem;
    productType: ProductIdentityItem;
    model: ProductIdentityItem;
    category: ProductIdentityItem;
  };
  userProvidedFacts: NormalizedFact[];
  observedFacts: NormalizedFact[];
  researchedFacts: NormalizedFact[];
  verifiedFacts: NormalizedFact[];
  unknownFacts: NormalizedFact[];
  potentialFacts: PotentialFact[];
  sources: FactSourceRef[];
  conflicts: ProductFactConflict[];
  researchWarnings: string[];
  researchStatus: ResearchStatus;
  overallScore?: number;
  summaryNotes?: string;
}

// ==================================================
// PHASE 2 — PRODUCT KNOWLEDGE LAYER & QUALITY GATE TYPES
// ==================================================

export type KnowledgeProvenance =
  | 'USER_PROVIDED'
  | 'OBSERVED_FROM_IMAGE'
  | 'RESEARCHED'
  | 'VERIFIED'
  | 'INFERRED'
  | 'UNKNOWN';

export type KnowledgeConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

// ==================================================
// PHASE 3 — EVIDENCE & SOURCE INTELLIGENCE MODEL
// ==================================================
// PHASE 3 — EVIDENCE & SOURCE INTELLIGENCE MODEL
// ==================================================

export type CanonicalSourceType =
  | 'OFFICIAL_MANUFACTURER'
  | 'OFFICIAL_DOCUMENTATION'
  | 'AUTHORIZED_RETAILER'
  | 'REPUTABLE_REVIEW'
  | 'REPUTABLE_DATABASE'
  | 'SPECIALIZED_PUBLICATION'
  | 'GENERAL_PUBLICATION'
  | 'MARKETPLACE'
  | 'USER_GENERATED'
  | 'UNKNOWN';

export type EvidenceSourceType =
  | 'OFFICIAL_MANUFACTURER'
  | 'OFFICIAL_DOCUMENTATION'
  | 'AUTHORIZED_RETAILER'
  | 'REPUTABLE_REVIEW'
  | 'REPUTABLE_DATABASE'
  | 'SPECIALIZED_PUBLICATION'
  | 'GENERAL_PUBLICATION'
  | 'MARKETPLACE'
  | 'USER_GENERATED'
  | 'OFFICIAL_PRODUCT_PAGE'
  | 'REPUTABLE_RETAILER'
  | 'REVIEW_SOURCE'
  | 'NEWS_SOURCE'
  | 'COMMUNITY_SOURCE'
  | 'SEARCH_RESULT'
  | 'UNKNOWN';

export type ProductMatchLevel = 'EXACT' | 'HIGH' | 'PARTIAL' | 'MISMATCHED' | 'UNKNOWN';

export interface EvidenceSource {
  id: string;
  url: string;
  title: string;
  domain: string;
  publisher?: string;
  sourceType: EvidenceSourceType;
  authorityScore: number;   // 0-100
  relevanceScore: number;   // 0-100
  freshnessScore: number;   // 0-100
  reliabilityScore: number; // 0-100
  overallScore: number;     // 0-100
  productMatch: ProductMatchLevel;
  retrievedAt: string;
  supportingText?: string;
}

export type SupportLevel = 'DIRECT' | 'PARTIAL' | 'INDIRECT' | 'CONTRADICTORY';

export type EvidenceType =
  | 'DIRECT_SPECIFICATION'
  | 'PRODUCT_PAGE'
  | 'TECHNICAL_DOCUMENTATION'
  | 'REVIEW_TEST'
  | 'DATABASE_RECORD'
  | 'OTHER';

export type SupportStrength = 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE';

export interface EvidenceReference {
  sourceId: string;
  factId?: string;
  factName: string;
  supportingText?: string;
  evidenceType?: EvidenceType;
  supportStrength?: SupportStrength;
  productMatch?: ProductMatchLevel;
  createdAt?: string;
  supportLevel?: SupportLevel;
  confidence?: number;      // 0-100
  reasoning?: string;
}

export type ProductIdentityStatus = 'CONFIRMED' | 'LIKELY' | 'AMBIGUOUS' | 'UNCONFIRMED';

export interface NormalizedProductIdentity {
  brand?: string;
  model?: string;
  productName?: string;
  category?: string;
  identityConfidence: number; // 0-100
  matchedSources: string[];
  identityStatus: ProductIdentityStatus;
  reasoning?: string;
}

export type FactVerificationStatus = 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'CONTRADICTED';

export interface KnowledgeSourceEvidence {
  sourceUrl?: string;
  sourceTitle?: string;
  sourceType?: 'OFFICIAL_MANUFACTURER' | 'OFFICIAL_DOCS' | 'RETAILER_DOCS' | 'SEARCH_GROUNDED' | 'USER_INPUT' | 'IMAGE_ANALYSIS' | EvidenceSourceType;
  extractedFact?: string;
  publicationDate?: string;
  retrievedAt: string;
  confidence: KnowledgeConfidence;
  relationshipToProduct?: 'EXACT_MATCH' | 'HIGHLY_SIMILAR' | 'GENERIC_CATEGORY' | 'UNCERTAIN';
  publisher?: string;
  sourceId?: string;
  authorityScore?: number;
}

export interface KnowledgeFact {
  id: string;
  name: string;
  value: string;
  category: string; // e.g. 'Identity', 'Material', 'Dimension', 'Performance', 'Compatibility', 'Care', etc.
  provenance: KnowledgeProvenance;
  confidence: KnowledgeConfidence;
  evidence?: KnowledgeSourceEvidence;
  evidenceReferences?: EvidenceReference[];
  verificationStatus?: FactVerificationStatus;
  lastVerifiedAt?: string;
  status: 'VERIFIED' | 'OBSERVED' | 'USER_PROVIDED' | 'INFERRED' | 'UNKNOWN' | 'CONFLICTING';
  isPermittedForGeneration: boolean;
  reasonIfNotPermitted?: string;
}

export type ConflictType =
  | 'DIRECT_CONTRADICTION'
  | 'CONTEXTUAL_DIFFERENCE'
  | 'VARIANT_DIFFERENCE'
  | 'MEASUREMENT_DIFFERENCE'
  | 'UNRESOLVED';

export type ResolutionStatus = 'RESOLVED' | 'OPEN';

export interface KnowledgeConflictValue {
  value: string;
  sourceId: string;
  authorityScore: number;
  relevanceScore: number;
  sourceIds?: string[];
}

export interface KnowledgeConflict {
  id: string;
  factName: string;
  field: string;
  userValue?: string;
  researchedValue?: string;
  userProvenance?: 'USER_PROVIDED';
  researchedProvenance?: 'RESEARCHED' | 'VERIFIED' | 'OBSERVED_FROM_IMAGE';
  description?: string;
  status?: 'OPEN_CONFLICT' | 'RESOLVED_BY_USER' | 'FLAGGED_FOR_REVIEW';
  resolutionNote?: string;
  values?: KnowledgeConflictValue[];
  conflictType?: ConflictType;
  resolutionStatus?: ResolutionStatus;
  resolutionReason?: string;
}

export interface DynamicCategoryAttribute {
  key: string;
  label: string;
  value: string;
  provenance: KnowledgeProvenance;
  confidence: KnowledgeConfidence;
  unit?: string;
}

export interface ProductKnowledgeProfile {
  version: number;
  lastUpdated: string;
  freshnessTimestamp: number;
  productId: string;

  // Identity
  identity: {
    productName: KnowledgeFact;
    brand: KnowledgeFact;
    model: KnowledgeFact;
    category: KnowledgeFact;
    subcategory: KnowledgeFact;
    productType: KnowledgeFact;
    normalizedIdentity?: NormalizedProductIdentity;
  };

  // Category-Agnostic Core Characteristics
  attributes: {
    materials?: KnowledgeFact[];
    dimensions?: KnowledgeFact[];
    weight?: KnowledgeFact[];
    compatibility?: KnowledgeFact[];
    features?: KnowledgeFact[];
    functionalCharacteristics?: KnowledgeFact[];
    visualCharacteristics?: KnowledgeFact[];
    usageScenarios?: KnowledgeFact[];
    targetAudience?: KnowledgeFact[];
    benefits?: KnowledgeFact[];
    limitations?: KnowledgeFact[];
    potentialRisks?: KnowledgeFact[];
    careInstructions?: KnowledgeFact[];
    specifications?: KnowledgeFact[];
  };

  // Flexible dynamic extensible category attributes dictionary
  categoryAttributes: Record<string, DynamicCategoryAttribute>;

  // Fact Collections by Provenance Tier
  userProvidedFacts: KnowledgeFact[];
  observedFacts: KnowledgeFact[];
  researchedFacts: KnowledgeFact[];
  verifiedFacts: KnowledgeFact[];
  inferredFacts: KnowledgeFact[]; // AI assumptions (low confidence, blocked from generation unless verified)
  unknownFacts: Array<{ name: string; reason: string }>;
  potentialAssumptions: KnowledgeFact[];

  // Conflict Resolution Ledger
  conflicts: KnowledgeConflict[];

  // Evidence & Grounding Sources
  evidenceSources: EvidenceSource[];
  evidenceReferences?: EvidenceReference[];
  verificationConfidence?: number;
  researchTimestamp?: string;

  // Overall Quality & Audit Metadata
  overallConfidenceScore: number;
  qualityGatePassed: boolean;
  warnings: string[];
  summaryNotes: string;
}

export interface QualityGateResult {
  passed: boolean;
  permittedFacts: KnowledgeFact[];
  blockedFacts: KnowledgeFact[];
  unresolvedConflicts: KnowledgeConflict[];
  warnings: string[];
  qualityScore: number;
  prohibitedClaimsDetected: string[];
}

// Backward-compatible aliases
export type FactSourceCategory = CanonicalSourceType;
export type LegacyFactVerificationStatus = 'VERIFIED' | 'POTENTIAL' | 'UNSUPPORTED' | 'UNKNOWN' | 'CONFLICTING';
export type FactItem = NormalizedFact & { attributeName?: string; status?: FactVerificationStatus | LegacyFactVerificationStatus };
export type ResearchSource = FactSourceRef & { id?: string; snippet?: string; retrievedAt?: string };
export type UniversalProductProfile = UniversalProductIntelligenceProfile;
export type FactStatus = FactVerificationStatus | LegacyFactVerificationStatus;
export type IntelligenceSourceType = CanonicalSourceType | 'USER_PROVIDED' | 'OBSERVED' | 'AI_DETECTED' | 'AI_INFERRED' | 'RESEARCH_VERIFIED';
export type IntelligenceConfidence = FactConfidence;

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

  // Canonical Universal Profile
  universalProfile?: UniversalProductIntelligenceProfile;

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
  researchStatus?: ResearchStatus;

  // Phase 2 Knowledge Layer Profile
  knowledgeProfile?: ProductKnowledgeProfile;
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
  knowledgeProfile?: ProductKnowledgeProfile;
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
  knowledgeProfile?: ProductKnowledgeProfile;
  qualityGate?: QualityGateResult | any;
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
