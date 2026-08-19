import {
  Product,
  ProductIntelligence,
  ProductIntelligenceFact,
  FactStatus,
  IntelligenceSourceType,
  IntelligenceConfidence,
  UniversalProductProfile,
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

/**
  Creates a clean fallback UniversalProductProfile and ProductIntelligence object derived purely from user-provided facts.
  Ensures that if the AI endpoint is unavailable or returns an error, the application never crashes
  and existing product data remains undamaged.
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

  const userFactItems: FactItem[] = [
    {
      attributeName: 'Product Name',
      value: product.name || 'Unspecified Product',
      source: 'USER_PROVIDED',
      status: 'VERIFIED',
      confidence: 1.0
    },
    {
      attributeName: 'Category',
      value: product.category || 'General',
      source: 'USER_PROVIDED',
      status: 'VERIFIED',
      confidence: 1.0
    },
    {
      attributeName: 'Price',
      value: formattedPrice,
      source: 'USER_PROVIDED',
      status: 'VERIFIED',
      confidence: 1.0
    }
  ];

  if (product.description) {
    userFactItems.push({
      attributeName: 'Description',
      value: product.description,
      source: 'USER_PROVIDED',
      status: 'VERIFIED',
      confidence: 1.0
    });
  }

  if (Array.isArray(product.features)) {
    product.features.forEach((f, idx) => {
      userFactItems.push({
        attributeName: `Feature ${idx + 1}`,
        value: String(f),
        source: 'USER_PROVIDED',
        status: 'VERIFIED',
        confidence: 1.0
      });
    });
  }

  const defaultUnknowns = [
    { name: 'Warranty Terms', reason: 'No warranty details provided by seller' },
    { name: 'Shipping Timeline', reason: 'Shipping terms not specified' },
    { name: 'Return Policy', reason: 'Return terms not specified' },
    { name: 'Exact Technical Dimensions & Weight', reason: 'Technical dimensions not provided' }
  ];

  const universalProfile: UniversalProductProfile = {
    id: 'profile-' + Date.now(),
    productId: product.id || 'unknown',
    lastUpdated: new Date().toISOString(),
    identity: {
      name: product.name || 'Unspecified Product',
      brand: 'Generic / Seller Provided',
      model: 'Standard',
      category: product.category || 'General',
      subcategory: product.category || 'General',
      productType: product.category || 'Physical Product'
    },
    attributes: {
      category: {
        attributeName: 'Category',
        value: product.category || 'General',
        source: 'USER_PROVIDED',
        status: 'VERIFIED',
        confidence: 1.0
      }
    },
    userProvidedFacts: userFactItems,
    visualFacts: [],
    researchedFacts: [],
    unknownFacts: defaultUnknowns,
    conflicts: [],
    pricing: {
      amount: typeof product.price === 'number' ? product.price : 0,
      currency: product.currency || '$',
      formatted: formattedPrice,
      source: 'USER_PROVIDED'
    },
    variants: [],
    sources: [],
    productKeywords: Array.isArray(product.tags) ? product.tags : [product.category || 'ecommerce'],
    targetAudience: product.targetAudience ? [product.targetAudience] : ['General Buyers'],
    overallConfidenceScore: 80,
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
    verificationScore: 80,
    summaryNotes: note,
    universalProfile
  };
}

export const productIntelligenceService = {
  /**
    Analyzes product details, image, and optional web research using server-side Gemini Universal Product Intelligence Engine.
    Returns a structured ProductIntelligence object containing the Universal Product Profile.
   */
  async analyzeProductIntelligence(
    product: Product,
    options?: { enableResearch?: boolean }
  ): Promise<AnalysisResponse> {
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
        return {
          success: true,
          intelligence: data.intelligence,
          isRealAi: data.isRealAi ?? true,
          message: data.message || 'Product Intelligence Analysis Complete'
        };
      } else {
        console.warn('[Sellora Intelligence] Server returned non-ok response, using fallback:', data?.message);
        return {
          success: false,
          intelligence: createFallbackProductIntelligence(product, data?.message || 'Fallback product structure'),
          isRealAi: false,
          message: data?.message || 'Product Intelligence currently operating on user-provided facts.',
          diagnostic: data?.diagnostic
        };
      }
    } catch (err: any) {
      console.error('[Sellora Intelligence] Network error during product analysis:', err);
      return {
        success: false,
        intelligence: createFallbackProductIntelligence(product, 'Local verification fallback'),
        isRealAi: false,
        message: 'Unable to connect to Product Intelligence server.',
        diagnostic: err?.message
      };
    }
  }
};
