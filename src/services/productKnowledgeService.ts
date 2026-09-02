import {
  Product,
  ProductIntelligence,
  ProductKnowledgeProfile,
  KnowledgeFact,
  KnowledgeConflict,
  KnowledgeSourceEvidence,
  KnowledgeProvenance,
  KnowledgeConfidence,
  DynamicCategoryAttribute,
  QualityGateResult,
  NormalizedFact,
  EvidenceSource,
  EvidenceReference,
  NormalizedProductIdentity
} from '../types';
import { knowledgeQualityGate } from './knowledgeQualityGate';
import { sourceQualityService } from './sourceQualityService';
import { productIdentityService } from './productIdentityService';
import { factVerificationService } from './factVerificationService';

// In-memory cache for Product Knowledge Profiles
const knowledgeCache = new Map<string, { profile: ProductKnowledgeProfile; timestamp: number }>();
const KNOWLEDGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

function getProfileCacheKey(product: Product): string {
  return `pkp-${product.id || 'unassigned'}-${product.name}-${product.price}-${product.category}`;
}

/**
 * Creates a clean, structured, category-agnostic Product Knowledge Profile
 * representing everything Sellora currently knows about a product.
 */
export function createProductKnowledgeProfile(
  product: Product,
  intelligence?: ProductIntelligence
): ProductKnowledgeProfile {
  const now = new Date().toISOString();
  const timestamp = Date.now();
  const profileId = product.id || `prod-${timestamp}`;

  const universalIntel = intelligence?.universalProfile;

  // 1. Core Identity Facts
  const productNameFact: KnowledgeFact = {
    id: `fact-name-${timestamp}`,
    name: 'Product Name',
    value: product.name || 'Unspecified Product',
    category: 'Identity',
    provenance: 'USER_PROVIDED',
    confidence: 'HIGH',
    status: 'USER_PROVIDED',
    isPermittedForGeneration: true
  };

  const categoryFact: KnowledgeFact = {
    id: `fact-cat-${timestamp}`,
    name: 'Category',
    value: product.category || 'General',
    category: 'Identity',
    provenance: 'USER_PROVIDED',
    confidence: 'HIGH',
    status: 'USER_PROVIDED',
    isPermittedForGeneration: true
  };

  const brandValue = universalIntel?.productIdentity?.brand?.value ||
    (intelligence?.brand?.value !== 'Unspecified' ? intelligence?.brand?.value : '') ||
    'Generic / Unspecified';
  const brandProvenance: KnowledgeProvenance = universalIntel?.productIdentity?.brand?.sourceType === 'VERIFIED'
    ? 'VERIFIED'
    : (universalIntel?.productIdentity?.brand?.sourceType === 'OBSERVED' ? 'OBSERVED_FROM_IMAGE' : (brandValue !== 'Generic / Unspecified' ? 'USER_PROVIDED' : 'UNKNOWN'));

  const brandFact: KnowledgeFact = {
    id: `fact-brand-${timestamp}`,
    name: 'Brand',
    value: brandValue,
    category: 'Identity',
    provenance: brandProvenance,
    confidence: brandProvenance === 'UNKNOWN' ? 'UNKNOWN' : 'HIGH',
    status: brandProvenance === 'UNKNOWN' ? 'UNKNOWN' : 'VERIFIED',
    isPermittedForGeneration: brandProvenance !== 'UNKNOWN'
  };

  const modelValue = universalIntel?.productIdentity?.model?.value || 'Not verified';
  const modelFact: KnowledgeFact = {
    id: `fact-model-${timestamp}`,
    name: 'Model',
    value: modelValue,
    category: 'Identity',
    provenance: modelValue !== 'Not verified' ? 'VERIFIED' : 'UNKNOWN',
    confidence: modelValue !== 'Not verified' ? 'HIGH' : 'UNKNOWN',
    status: modelValue !== 'Not verified' ? 'VERIFIED' : 'UNKNOWN',
    isPermittedForGeneration: modelValue !== 'Not verified'
  };

  const subcategoryFact: KnowledgeFact = {
    id: `fact-subcat-${timestamp}`,
    name: 'Subcategory',
    value: product.category || 'General',
    category: 'Identity',
    provenance: 'USER_PROVIDED',
    confidence: 'HIGH',
    status: 'USER_PROVIDED',
    isPermittedForGeneration: true
  };

  const productTypeFact: KnowledgeFact = {
    id: `fact-type-${timestamp}`,
    name: 'Product Type',
    value: product.category || 'Physical Product',
    category: 'Identity',
    provenance: 'USER_PROVIDED',
    confidence: 'HIGH',
    status: 'USER_PROVIDED',
    isPermittedForGeneration: true
  };

  // 2. Fact Collections by Provenance Tier
  const userProvidedFacts: KnowledgeFact[] = [
    productNameFact,
    categoryFact,
    {
      id: `fact-price-${timestamp}`,
      name: 'Listed Price',
      value: `${product.currency || '$'}${product.price}`,
      category: 'Pricing',
      provenance: 'USER_PROVIDED',
      confidence: 'HIGH',
      status: 'USER_PROVIDED',
      isPermittedForGeneration: true
    }
  ];

  if (product.description) {
    userProvidedFacts.push({
      id: `fact-desc-${timestamp}`,
      name: 'Description',
      value: product.description,
      category: 'Overview',
      provenance: 'USER_PROVIDED',
      confidence: 'HIGH',
      status: 'USER_PROVIDED',
      isPermittedForGeneration: true
    });
  }

  if (Array.isArray(product.features)) {
    product.features.forEach((feat, idx) => {
      userProvidedFacts.push({
        id: `fact-feat-${idx}-${timestamp}`,
        name: `Feature ${idx + 1}`,
        value: feat,
        category: 'Features',
        provenance: 'USER_PROVIDED',
        confidence: 'HIGH',
        status: 'USER_PROVIDED',
        isPermittedForGeneration: true
      });
    });
  }

  // Observed facts from image
  const observedFacts: KnowledgeFact[] = [];
  if (universalIntel?.observedFacts && Array.isArray(universalIntel.observedFacts)) {
    universalIntel.observedFacts.forEach((f: NormalizedFact, idx: number) => {
      observedFacts.push({
        id: `fact-obs-${idx}-${timestamp}`,
        name: f.name,
        value: f.value,
        category: 'Visual & Physical',
        provenance: 'OBSERVED_FROM_IMAGE',
        confidence: (f.confidence as KnowledgeConfidence) || 'HIGH',
        status: 'OBSERVED',
        isPermittedForGeneration: true,
        evidence: {
          retrievedAt: now,
          confidence: (f.confidence as KnowledgeConfidence) || 'HIGH',
          sourceType: 'IMAGE_ANALYSIS',
          extractedFact: `${f.name}: ${f.value}`
        }
      });
    });
  }

  // Evaluate Evidence Sources Quality & Normalized Identity
  const structuredEvidenceSources: EvidenceSource[] = [];
  const rawSources = universalIntel?.sources || intelligence?.sources || [];
  rawSources.forEach((src) => {
    const evaluated = sourceQualityService.evaluateSourceQuality({
      url: src.url,
      title: src.title,
      domain: src.domain,
      publisher: src.publisher,
      retrievedAt: now,
      productContext: {
        brand: brandValue,
        model: modelValue,
        productName: product.name
      }
    });
    structuredEvidenceSources.push(evaluated);
  });

  const legacyEvidenceSources: KnowledgeSourceEvidence[] = structuredEvidenceSources.map((s) => ({
    sourceUrl: s.url,
    sourceTitle: s.title,
    publisher: s.publisher || s.domain,
    retrievedAt: s.retrievedAt,
    confidence: s.authorityScore >= 75 ? 'HIGH' : s.authorityScore >= 50 ? 'MEDIUM' : 'LOW',
    sourceType: s.sourceType,
    relationshipToProduct: 'EXACT_MATCH',
    sourceId: s.id,
    authorityScore: s.authorityScore
  }));

  const normalizedIdentity = productIdentityService.evaluateProductIdentity(
    {
      name: product.name,
      brand: brandValue,
      model: modelValue,
      category: product.category,
      description: product.description,
      features: product.features
    },
    structuredEvidenceSources
  );

  // Verified & Researched Facts
  const verifiedFacts: KnowledgeFact[] = [];
  const researchedFacts: KnowledgeFact[] = [];
  const allEvidenceReferences: EvidenceReference[] = [];
  const conflicts: KnowledgeConflict[] = [];

  if (universalIntel?.verifiedFacts && Array.isArray(universalIntel.verifiedFacts)) {
    universalIntel.verifiedFacts.forEach((vf: NormalizedFact, idx: number) => {
      const initialFact: KnowledgeFact = {
        id: `fact-ver-${idx}-${timestamp}`,
        name: vf.name,
        value: vf.value,
        category: 'Verified Technical',
        provenance: 'VERIFIED',
        confidence: (vf.confidence as KnowledgeConfidence) || 'HIGH',
        status: 'VERIFIED',
        isPermittedForGeneration: true
      };

      const evalRes = factVerificationService.evaluateFactEvidence(
        initialFact,
        structuredEvidenceSources,
        normalizedIdentity
      );

      verifiedFacts.push(evalRes.updatedFact);
      researchedFacts.push(evalRes.updatedFact);
      allEvidenceReferences.push(...evalRes.evidenceReferences);
      conflicts.push(...evalRes.conflicts);
    });
  }

  // Unknown Facts Catalog
  const unknownFacts: Array<{ name: string; reason: string }> = [];
  const defaultUnknowns = universalIntel?.unknownFacts || intelligence?.unknownInformation || [
    { name: 'Warranty Terms', reason: 'No warranty terms provided or verified' },
    { name: 'Shipping Timeline', reason: 'Shipping terms not specified' },
    { name: 'Return Policy', reason: 'Return terms not specified' },
    { name: 'Certifications & Lab Ratings', reason: 'No certified lab testing verified' }
  ];

  defaultUnknowns.forEach((u) => {
    unknownFacts.push({
      name: typeof u === 'string' ? u : (u.name || (u as any).field || 'Specification'),
      reason: typeof u === 'string' ? 'Not specified' : (u.reason || 'Unverified')
    });
  });

  // Additional Conflicts from Universal Intelligence
  if (universalIntel?.conflicts && Array.isArray(universalIntel.conflicts)) {
    universalIntel.conflicts.forEach((c, idx) => {
      const exists = conflicts.some((existing) => existing.field.toLowerCase() === c.field.toLowerCase());
      if (!exists) {
        conflicts.push({
          id: `conflict-${idx}-${timestamp}`,
          field: c.field,
          userValue: c.userValue,
          researchedValue: c.researchedValue,
          userProvenance: 'USER_PROVIDED',
          researchedProvenance: 'VERIFIED',
          description: c.description,
          status: 'OPEN_CONFLICT'
        });
      }
    });
  }

  // 3. Category-Agnostic Core Characteristics Grouping
  const attributes: ProductKnowledgeProfile['attributes'] = {
    features: userProvidedFacts.filter((f) => f.category === 'Features'),
    specifications: [...verifiedFacts, ...observedFacts],
    targetAudience: product.targetAudience ? [{
      id: `fact-aud-${timestamp}`,
      name: 'Target Audience',
      value: product.targetAudience,
      category: 'Marketing',
      provenance: 'USER_PROVIDED',
      confidence: 'HIGH',
      status: 'USER_PROVIDED',
      isPermittedForGeneration: true
    }] : []
  };

  // 4. Flexible Category Attributes Dictionary
  const categoryAttributes: Record<string, DynamicCategoryAttribute> = {};
  [...userProvidedFacts, ...observedFacts, ...verifiedFacts].forEach((f) => {
    const key = f.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    categoryAttributes[key] = {
      key,
      label: f.name,
      value: f.value,
      provenance: f.provenance,
      confidence: f.confidence
    };
  });

  const baseProfile: ProductKnowledgeProfile = {
    version: 1,
    lastUpdated: now,
    freshnessTimestamp: timestamp,
    productId: profileId,
    identity: {
      productName: productNameFact,
      brand: brandFact,
      model: modelFact,
      category: categoryFact,
      subcategory: subcategoryFact,
      productType: productTypeFact,
      normalizedIdentity
    },
    attributes,
    categoryAttributes,
    userProvidedFacts,
    observedFacts,
    researchedFacts,
    verifiedFacts,
    inferredFacts: [],
    unknownFacts,
    potentialAssumptions: [],
    conflicts,
    evidenceSources: structuredEvidenceSources,
    evidenceReferences: allEvidenceReferences,
    verificationConfidence: normalizedIdentity.identityConfidence,
    researchTimestamp: now,
    overallConfidenceScore: universalIntel?.overallScore || intelligence?.verificationScore || normalizedIdentity.identityConfidence || 85,
    qualityGatePassed: conflicts.length === 0 && normalizedIdentity.identityStatus !== 'UNCONFIRMED',
    warnings: universalIntel?.researchWarnings || [],
    summaryNotes: universalIntel?.summaryNotes || intelligence?.summaryNotes || 'Product Knowledge Profile initialized.'
  };

  // Run Quality Gate validation
  const gateResult = knowledgeQualityGate.evaluate(baseProfile);
  baseProfile.qualityGatePassed = gateResult.passed;
  baseProfile.warnings = Array.from(new Set([...baseProfile.warnings, ...gateResult.warnings]));

  return baseProfile;
}

export const productKnowledgeService = {
  /**
   * Retrieves or creates a Product Knowledge Profile with caching & freshness handling.
   */
  getOrProfileProduct(
    product: Product,
    intelligence?: ProductIntelligence,
    options?: { forceRefresh?: boolean }
  ): ProductKnowledgeProfile {
    const key = getProfileCacheKey(product);

    if (!options?.forceRefresh) {
      const cached = knowledgeCache.get(key);
      if (cached && Date.now() - cached.timestamp < KNOWLEDGE_CACHE_TTL_MS) {
        return cached.profile;
      }
    }

    const profile = createProductKnowledgeProfile(product, intelligence);

    if (options?.forceRefresh && knowledgeCache.has(key)) {
      const existing = knowledgeCache.get(key);
      if (existing) {
        profile.version = existing.profile.version + 1;
      }
    }

    knowledgeCache.set(key, { profile, timestamp: Date.now() });
    return profile;
  },

  /**
   * Evaluates Quality Gate for a profile.
   */
  evaluateQualityGate(profile: ProductKnowledgeProfile): QualityGateResult {
    return knowledgeQualityGate.evaluate(profile);
  },

  /**
   * Gets permitted facts safe for downstream generation.
   */
  getPermittedFacts(profile: ProductKnowledgeProfile): KnowledgeFact[] {
    const gate = knowledgeQualityGate.evaluate(profile);
    return gate.permittedFacts;
  }
};
