import {
  Product,
  ProductIntelligence,
  ProductIntelligenceFact,
  FactStatus,
  IntelligenceSourceType,
  IntelligenceConfidence,
  UniversalProductIntelligenceProfile,
  NormalizedFact,
  FactItem,
  ResearchSource
} from '../types';
import { toSerializableProductDto } from './mockAiService';

export interface AnalysisResponse {
  success: boolean;
  intelligence: ProductIntelligence;
  isRealAi?: boolean;
  message?: string;
  diagnostic?: string;
}

// In-memory cache for intelligence profiles
const intelligenceCache = new Map<string, { intelligence: ProductIntelligence; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(product: Product): string {
  return `${product.id || 'unassigned'}-${product.name}-${product.price}-${product.category}`;
}

/**
 * Filter and extract only verified, observed, and user-provided facts for downstream generation.
 * STRICTLY blocks UNKNOWN, POTENTIAL, and ungrounded inferences.
 */
export function getSupportedProductFacts(
  profileOrIntelligence: UniversalProductIntelligenceProfile | ProductIntelligence
): NormalizedFact[] {
  const supported: NormalizedFact[] = [];

  const profile: UniversalProductIntelligenceProfile | undefined =
    'productIdentity' in profileOrIntelligence
      ? (profileOrIntelligence as UniversalProductIntelligenceProfile)
      : (profileOrIntelligence as ProductIntelligence).universalProfile;

  if (!profile) {
    return supported;
  }

  // 1. User-Provided Facts (Preserved verbatim and allowed)
  if (Array.isArray(profile.userProvidedFacts)) {
    profile.userProvidedFacts.forEach((fact) => {
      if (fact && fact.value && fact.value !== 'Not verified' && fact.sourceType === 'USER_PROVIDED') {
        supported.push({
          name: fact.name,
          value: fact.value,
          sourceType: 'USER_PROVIDED',
          confidence: fact.confidence || 'HIGH',
          evidence: fact.evidence
        });
      }
    });
  }

  // 2. Observed Facts from Image (Direct visual match allowed)
  if (Array.isArray(profile.observedFacts)) {
    profile.observedFacts.forEach((fact) => {
      if (fact && fact.value && fact.value !== 'Not verified' && fact.sourceType === 'OBSERVED') {
        supported.push({
          name: fact.name,
          value: fact.value,
          sourceType: 'OBSERVED',
          confidence: fact.confidence || 'HIGH',
          evidence: fact.evidence
        });
      }
    });
  }

  // 3. Verified Facts (Grounding confirmed with reliable source)
  if (Array.isArray(profile.verifiedFacts)) {
    profile.verifiedFacts.forEach((fact) => {
      if (
        fact &&
        fact.value &&
        fact.value !== 'Not verified' &&
        fact.sourceType === 'VERIFIED' &&
        fact.source &&
        (fact.source.url || fact.source.title)
      ) {
        supported.push({
          name: fact.name,
          value: fact.value,
          sourceType: 'VERIFIED',
          confidence: fact.confidence || 'HIGH',
          source: fact.source,
          evidence: fact.evidence
        });
      }
    });
  }

  return supported;
}

/**
 * Creates a clean fallback UniversalProductIntelligenceProfile and ProductIntelligence derived purely from user-provided facts.
 * Ensures that if the AI endpoint is unavailable or returns an error, the application never crashes
 * and existing product data remains undamaged.
 */
export function createFallbackProductIntelligence(
  product: Product,
  note = 'Structured from user-provided product details.'
): ProductIntelligence {
  const formattedPrice =
    typeof product.price === 'number'
      ? `${product.currency || '$'}${product.price.toFixed(2)}`
      : `${product.currency || '$'}${product.price || '0.00'}`;

  const userFeatures: ProductIntelligenceFact[] = Array.isArray(product.features)
    ? product.features.map((feat) => ({
        name: 'Provided Feature',
        value: String(feat),
        status: 'VERIFIED' as FactStatus,
        sourceType: 'USER_PROVIDED' as IntelligenceSourceType,
        confidence: 'HIGH' as IntelligenceConfidence
      }))
    : [];

  const userProvidedFacts: NormalizedFact[] = [
    {
      name: 'Product Name',
      value: product.name || 'Unspecified Product',
      sourceType: 'USER_PROVIDED',
      confidence: 'HIGH',
      evidence: 'Explicitly entered by user'
    },
    {
      name: 'Category',
      value: product.category || 'General',
      sourceType: 'USER_PROVIDED',
      confidence: 'HIGH',
      evidence: 'Explicitly selected by user'
    },
    {
      name: 'Price',
      value: formattedPrice,
      sourceType: 'USER_PROVIDED',
      confidence: 'HIGH',
      evidence: 'Explicitly set by user'
    }
  ];

  if (product.description) {
    userProvidedFacts.push({
      name: 'Description',
      value: product.description,
      sourceType: 'USER_PROVIDED',
      confidence: 'HIGH',
      evidence: 'Explicitly written by user'
    });
  }

  if (Array.isArray(product.features)) {
    product.features.forEach((f, idx) => {
      userProvidedFacts.push({
        name: `Feature ${idx + 1}`,
        value: String(f),
        sourceType: 'USER_PROVIDED',
        confidence: 'HIGH',
        evidence: 'Explicitly listed by user'
      });
    });
  }

  const defaultUnknowns = [
    { name: 'Warranty Terms', reason: 'No warranty details provided by seller or verified' },
    { name: 'Shipping Timeline & Policy', reason: 'Shipping terms not specified' },
    { name: 'Return Policy', reason: 'Return terms not specified' },
    { name: 'Drop Protection & Lab Ratings', reason: 'No certified lab testing verified' }
  ];

  const universalProfile: UniversalProductIntelligenceProfile = {
    productIdentity: {
      brand: {
        name: 'Brand',
        value: 'Generic / Seller Provided',
        sourceType: 'USER_PROVIDED',
        confidence: 'HIGH',
        status: 'CONFIRMED'
      },
      productName: {
        name: 'Product Name',
        value: product.name || 'Unspecified Product',
        sourceType: 'USER_PROVIDED',
        confidence: 'HIGH'
      },
      productType: {
        name: 'Product Type',
        value: product.category || 'Physical Product',
        sourceType: 'USER_PROVIDED',
        confidence: 'HIGH'
      },
      model: {
        name: 'Model',
        value: 'UNKNOWN',
        sourceType: 'UNKNOWN',
        confidence: 'NOT_APPLICABLE'
      },
      category: {
        name: 'Category',
        value: product.category || 'General',
        sourceType: 'USER_PROVIDED',
        confidence: 'HIGH'
      }
    },
    userProvidedFacts,
    observedFacts: [],
    researchedFacts: [],
    verifiedFacts: [],
    unknownFacts: defaultUnknowns.map((u) => ({
      name: u.name,
      value: 'Not verified',
      sourceType: 'UNKNOWN',
      confidence: 'NOT_APPLICABLE',
      reason: u.reason
    })),
    potentialFacts: [],
    sources: [],
    conflicts: [],
    researchWarnings: [],
    researchStatus: 'NO_RELIABLE_SOURCE',
    overallScore: 82,
    summaryNotes: note
  };

  return {
    id: 'intel-' + Date.now(),
    productId: product.id || 'unknown',
    lastAnalyzedAt: new Date().toISOString(),
    productName: {
      value: product.name || 'Unspecified Product',
      status: 'VERIFIED',
      sourceType: 'USER_PROVIDED',
      confidence: 'HIGH'
    },
    category: {
      value: product.category || 'General',
      status: 'VERIFIED',
      sourceType: 'USER_PROVIDED',
      confidence: 'HIGH'
    },
    brand: {
      value: 'Generic / Seller Provided',
      status: 'VERIFIED',
      sourceType: 'USER_PROVIDED',
      confidence: 'HIGH'
    },
    description: product.description
      ? {
          value: product.description,
          status: 'VERIFIED',
          sourceType: 'USER_PROVIDED',
          confidence: 'HIGH'
        }
      : undefined,
    price: {
      value: typeof product.price === 'number' ? product.price : 0,
      currency: product.currency || '$',
      formatted: formattedPrice,
      status: 'VERIFIED',
      sourceType: 'USER_PROVIDED'
    },
    features: userFeatures,
    targetCustomer: product.targetAudience
      ? [
          {
            value: product.targetAudience,
            status: 'VERIFIED',
            sourceType: 'USER_PROVIDED',
            confidence: 'HIGH'
          }
        ]
      : [],
    unknownInformation: defaultUnknowns,
    productKeywords: Array.isArray(product.tags) ? product.tags : [product.category || 'ecommerce'],
    verificationScore: 82,
    summaryNotes: note,
    researchStatus: 'NO_RELIABLE_SOURCE',
    universalProfile
  };
}

export const productIntelligenceService = {
  /**
   * Analyzes product details, image, and optional web research using server-side Gemini Universal Product Intelligence Engine.
   * Returns a structured ProductIntelligence object containing the Universal Product Profile.
   */
  async analyzeProductIntelligence(
    product: Product,
    options?: { enableResearch?: boolean; forceRefresh?: boolean }
  ): Promise<AnalysisResponse> {
    const cacheKey = getCacheKey(product);

    if (!options?.forceRefresh) {
      const cached = intelligenceCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return {
          success: true,
          intelligence: cached.intelligence,
          isRealAi: true,
          message: 'Retrieved from cached Product Intelligence profile'
        };
      }
    }

    const productDto = toSerializableProductDto(product);

    try {
      const response = await fetch('/api/analyze-product-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productDto,
          enableResearch: options?.enableResearch ?? true
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.intelligence) {
        intelligenceCache.set(cacheKey, {
          intelligence: data.intelligence,
          timestamp: Date.now()
        });

        return {
          success: true,
          intelligence: data.intelligence,
          isRealAi: data.isRealAi ?? true,
          message: data.message || 'Product Intelligence Analysis Complete'
        };
      } else {
        console.warn('[Sellora Intelligence] Server returned non-ok response, using fallback:', data?.message);
        const fallback = createFallbackProductIntelligence(product, data?.message || 'Fallback product structure');
        return {
          success: false,
          intelligence: fallback,
          isRealAi: false,
          message: data?.message || 'Product Intelligence currently operating on user-provided facts.',
          diagnostic: data?.diagnostic
        };
      }
    } catch (err: any) {
      console.error('[Sellora Intelligence] Network error during product analysis:', err);
      const fallback = createFallbackProductIntelligence(product, 'Local verification fallback');
      return {
        success: false,
        intelligence: fallback,
        isRealAi: false,
        message: 'Unable to connect to Product Intelligence server.',
        diagnostic: err?.message
      };
    }
  }
};
