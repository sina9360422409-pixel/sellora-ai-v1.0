import { Product, ContentType, ToneType, GoalType, SocialPlatform, AdPlatform, ImageStyle, AspectRatio, GeneratedContent, AnalysisResult } from '../types';

export interface GenerationParams {
  product: Product;
  type: ContentType;
  tone: ToneType;
  goal?: GoalType;
  platform?: SocialPlatform | AdPlatform | string;
  imageStyle?: ImageStyle;
  aspectRatio?: AspectRatio;
  customPrompt?: string;
  customerInquiry?: string;
  isRegeneration?: boolean;
  variationSeed?: number;
  onProgress?: (stageText: string, percent: number) => void;
}

export interface SerializableProductDto {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  features: string[];
  tags: string[];
  targetAudience: string | null;
  usp: string | null;
  facts: Array<{
    name?: string;
    fact?: string;
    value?: string;
    sourceType?: string;
    confidence?: string;
  }>;
  strictAnalysis?: {
    observedCharacteristics?: any[];
    userProvidedInformation?: any[];
    verifiedInformation?: any[];
    unknownInformation?: any[];
  } | null;
  productIntelligence?: any;
  knowledgeProfile?: any;
}

const DELAY = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function safeString(val: any, defaultVal = ''): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return defaultVal;
}

export function toSerializableProductDto(product: any): SerializableProductDto {
  if (!product || typeof product !== 'object') {
    return {
      id: '',
      name: 'Unspecified Product',
      category: 'General',
      description: '',
      price: 0,
      currency: '$',
      image: null,
      features: [],
      tags: [],
      targetAudience: null,
      usp: null,
      facts: [],
      strictAnalysis: null
    };
  }

  // Ensure price is a clean primitive number
  let numPrice = 0;
  if (typeof product.price === 'number' && !isNaN(product.price)) {
    numPrice = product.price;
  } else if (typeof product.price === 'string') {
    const parsed = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) numPrice = parsed;
  }

  // Clean image URL (only primitive strings allowed; File/Blob/DOM objects stripped)
  let cleanImage: string | null = null;
  if (typeof product.image === 'string' && product.image.trim()) {
    cleanImage = product.image.trim();
  } else if (typeof product.imageUrl === 'string' && product.imageUrl.trim()) {
    cleanImage = product.imageUrl.trim();
  }

  // Extract facts safely
  let sanitizedFacts: any[] = [];
  if (Array.isArray(product.facts)) {
    sanitizedFacts = product.facts.map((f: any) => {
      if (!f || typeof f !== 'object') return { fact: safeString(f) };
      return {
        name: safeString(f.name),
        fact: safeString(f.fact),
        value: safeString(f.value),
        sourceType: safeString(f.sourceType, 'FACT'),
        confidence: safeString(f.confidence, 'HIGH')
      };
    });
  }

  // Extract strictAnalysis safely if present
  let strictAnalysis: any = null;
  if (product.strictAnalysis && typeof product.strictAnalysis === 'object') {
    const sa = product.strictAnalysis;
    strictAnalysis = {
      observedCharacteristics: Array.isArray(sa.observedCharacteristics)
        ? sa.observedCharacteristics.map((item: any) => ({
            name: safeString(item?.name),
            value: safeString(item?.value),
            sourceType: 'OBSERVED',
            confidence: safeString(item?.confidence, 'HIGH')
          }))
        : [],
      userProvidedInformation: Array.isArray(sa.userProvidedInformation)
        ? sa.userProvidedInformation.map((item: any) => ({
            name: safeString(item?.name),
            value: safeString(item?.value),
            sourceType: 'USER_PROVIDED',
            confidence: safeString(item?.confidence, 'NOT_APPLICABLE')
          }))
        : [],
      verifiedInformation: Array.isArray(sa.verifiedInformation)
        ? sa.verifiedInformation.map((item: any) => ({
            name: safeString(item?.name),
            value: safeString(item?.value),
            source: safeString(item?.source),
            confidence: safeString(item?.confidence, 'HIGH')
          }))
        : [],
      unknownInformation: Array.isArray(sa.unknownInformation)
        ? sa.unknownInformation.map((item: any) => ({
            name: safeString(item?.name || item?.field),
            reason: safeString(item?.reason)
          }))
        : []
    };
  }

  return {
    id: safeString(product.id),
    name: safeString(product.name, 'Unspecified Product'),
    category: safeString(product.category, 'General'),
    description: safeString(product.description),
    price: numPrice,
    currency: safeString(product.currency, '$'),
    image: cleanImage,
    features: Array.isArray(product.features) ? product.features.map((f: any) => safeString(f)).filter(Boolean) : [],
    tags: Array.isArray(product.tags) ? product.tags.map((t: any) => safeString(t)).filter(Boolean) : [],
    targetAudience: typeof product.targetAudience === 'string' ? product.targetAudience : null,
    usp: typeof product.usp === 'string' ? product.usp : null,
    facts: sanitizedFacts,
    strictAnalysis,
    productIntelligence: product.productIntelligence && typeof product.productIntelligence === 'object' ? product.productIntelligence : undefined,
    knowledgeProfile: product.knowledgeProfile || product.productIntelligence?.knowledgeProfile || undefined
  };
}

export const mockAiService = {
  async generate(params: GenerationParams): Promise<GeneratedContent> {
    const {
      product,
      type,
      tone,
      goal = 'More Sales',
      platform = 'Instagram',
      imageStyle = 'Studio',
      aspectRatio = '1:1',
      customPrompt,
      customerInquiry,
      isRegeneration,
      variationSeed,
      onProgress
    } = params;

    const id = 'gen-' + Date.now();
    const createdAt = new Date().toISOString();

    // 1. Prepare clean, serializable product DTO and request payload
    let productDto: SerializableProductDto;
    let payloadBody: string;

    try {
      productDto = toSerializableProductDto(product);

      const payload = {
        product: productDto,
        type: safeString(type, 'listing'),
        tone: safeString(tone, 'Professional'),
        goal: safeString(goal, 'More Sales'),
        platform: safeString(platform, 'Instagram'),
        imageStyle: safeString(imageStyle, 'Studio'),
        aspectRatio: safeString(aspectRatio, '1:1'),
        customerInquiry: safeString(customerInquiry),
        customPrompt: safeString(customPrompt),
        isRegeneration: Boolean(isRegeneration),
        variationSeed: typeof variationSeed === 'number' ? variationSeed : undefined
      };

      payloadBody = JSON.stringify(payload);
    } catch (serializeErr: any) {
      console.error('[Sellora AI] Product serialization failed:', serializeErr);
      return {
        id,
        productId: product?.id ? safeString(product.id) : 'unknown',
        productName: product?.name ? safeString(product.name) : 'Unknown Product',
        type,
        createdAt,
        tone: (tone as ToneType) || 'Professional',
        goal: (goal as GoalType) || 'More Sales',
        platform: safeString(platform, 'Instagram'),
        isRealAi: false,
        aiStatusMessage: 'Unable to prepare the content request.',
        error: {
          type: 'SERIALIZATION_ERROR',
          message: 'Unable to prepare the content request.',
          diagnostic: 'Sellora could not serialize the selected product data. Please try again.'
        },
        result: { [type]: null } as any
      };
    }

    // Stage 1
    onProgress?.(`Connecting to Sellora Gemini Analyzer for ${productDto.name}...`, 20);
    await DELAY(300);

    // 1. REAL GEMINI PRODUCT ANALYZER ROUTE
    if (type === 'analysis') {
      onProgress?.('Performing truthfulness-first product audit with Gemini Flash...', 60);
      try {
        const response = await fetch('/api/analyze-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: productDto })
        });

        const data = await response.json();

        if (response.ok && data.success && data.analysis) {
          onProgress?.('Finalizing verified facts & unknown attributes catalog...', 95);
          await DELAY(200);

          return {
            id,
            productId: productDto.id,
            productName: productDto.name,
            type: 'analysis',
            createdAt,
            tone,
            isRealAi: true,
            aiStatusMessage: data.aiStatusMessage || 'Real Gemini Fact Extraction',
            result: { analysis: data.analysis }
          };
        } else {
          // Server returned explicit error object
          const errorMsg = data?.message || 'Gemini AI is currently unavailable.';
          const errorDiag = data?.diagnostic;
          return {
            id,
            productId: productDto.id,
            productName: productDto.name,
            type: 'analysis',
            createdAt,
            tone,
            isRealAi: false,
            aiStatusMessage: errorMsg,
            error: {
              type: data?.errorType || 'GEMINI_ERROR',
              message: errorMsg,
              diagnostic: errorDiag
            },
            result: { analysis: null }
          };
        }
      } catch (err: any) {
        console.error('[Sellora AI] /api/analyze-product endpoint fetch error:', err);
        const errMsg = err?.message || String(err);
        const isCircular = errMsg.includes('circular') || errMsg.includes('JSON');
        return {
          id,
          productId: productDto.id,
          productName: productDto.name,
          type: 'analysis',
          createdAt,
          tone,
          isRealAi: false,
          aiStatusMessage: isCircular ? 'Unable to prepare the content request.' : 'Unable to connect to Sellora AI.',
          error: {
            type: isCircular ? 'SERIALIZATION_ERROR' : 'NETWORK_ERROR',
            message: isCircular ? 'Unable to prepare the content request.' : 'Unable to connect to Sellora AI.',
            diagnostic: isCircular ? 'Sellora could not serialize the selected product data. Please try again.' : errMsg
          },
          result: { analysis: null }
        };
      }
    }

    // 2. REAL GEMINI CONTENT GENERATOR ROUTE
    onProgress?.(`Applying ${safeString(tone, 'Professional').toLowerCase()} sales psychology & ${safeString(goal, 'More Sales').toLowerCase()} objective...`, 60);
    await DELAY(200);

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadBody
      });

      const data = await response.json();

      if (response.ok && data.success && data.isRealAi && data.textResponse) {
        try {
          const parsed = JSON.parse(data.textResponse);
          onProgress?.('Finalizing Gemini output...', 98);
          await DELAY(200);

          return {
            id,
            productId: productDto.id,
            productName: productDto.name,
            type,
            createdAt,
            tone,
            goal,
            platform,
            isRealAi: true,
            aiStatusMessage: data.aiStatusMessage || 'Real Gemini Content Generation',
            result: {
              [type]: parsed
            } as any
          };
        } catch (pErr) {
          console.error('[Sellora AI] Could not parse raw Gemini JSON:', pErr);
          return {
            id,
            productId: productDto.id,
            productName: productDto.name,
            type,
            createdAt,
            tone,
            goal,
            platform,
            isRealAi: false,
            aiStatusMessage: 'Sellora received an invalid AI response. Please try again.',
            error: {
              type: 'INVALID_RESPONSE',
              message: 'Sellora received an invalid AI response. Please try again.'
            },
            result: { [type]: null } as any
          };
        }
      } else {
        const errorMsg = data?.message || 'Gemini AI is currently unavailable.';
        return {
          id,
          productId: productDto.id,
          productName: productDto.name,
          type,
          createdAt,
          tone,
          goal,
          platform,
          isRealAi: false,
          aiStatusMessage: errorMsg,
          error: {
            type: data?.errorType || 'GEMINI_UNAVAILABLE',
            message: errorMsg,
            diagnostic: data?.diagnostic
          },
          result: { [type]: null } as any
        };
      }
    } catch (err: any) {
      console.error('[Sellora AI] Content generation API request error:', err);
      const errMsg = err?.message || String(err);
      const isCircular = errMsg.includes('circular') || errMsg.includes('JSON');
      return {
        id,
        productId: productDto.id,
        productName: productDto.name,
        type,
        createdAt,
        tone,
        goal,
        platform,
        isRealAi: false,
        aiStatusMessage: isCircular ? 'Unable to prepare the content request.' : 'Unable to connect to Sellora AI.',
        error: {
          type: isCircular ? 'SERIALIZATION_ERROR' : 'NETWORK_ERROR',
          message: isCircular ? 'Unable to prepare the content request.' : 'Unable to connect to Sellora AI.',
          diagnostic: isCircular ? 'Sellora could not serialize the selected product data. Please try again.' : errMsg
        },
        result: { [type]: null } as any
      };
    }
  }
};

function getFallbackLocalAnalysis(product: Product): AnalysisResult {
  const userProvidedInformation = [
    { name: 'Product Name', value: product.name, sourceType: 'USER_PROVIDED' as const, confidence: 'NOT_APPLICABLE' as const },
    { name: 'Category', value: product.category, sourceType: 'USER_PROVIDED' as const, confidence: 'NOT_APPLICABLE' as const },
    { name: 'Listed Price', value: `${product.currency || '$'}${product.price}`, sourceType: 'USER_PROVIDED' as const, confidence: 'NOT_APPLICABLE' as const }
  ];

  if (product.description) {
    userProvidedInformation.push({
      name: 'Description',
      value: product.description,
      sourceType: 'USER_PROVIDED' as const,
      confidence: 'NOT_APPLICABLE' as const
    });
  }

  const observedCharacteristics = [
    { name: 'Visual Media', value: 'Product image provided for catalog inspection', sourceType: 'OBSERVED' as const, confidence: 'HIGH' as const },
    { name: 'Presentation', value: 'Item centered in primary frame view', sourceType: 'OBSERVED' as const, confidence: 'MEDIUM' as const }
  ];

  const unknownInformation = [
    { name: 'Exact Model Number', reason: 'Not verified from visual evidence alone' },
    { name: 'Internal Specifications (Storage/RAM/Battery)', reason: 'Not verified in image or provided text' },
    { name: 'Material Composition & Durability Claims', reason: 'Not explicitly verified' },
    { name: 'Warranty & Return Policy', reason: 'Not provided by user' },
    { name: 'Customer Ratings & Sales Volume', reason: 'Not provided or verified' }
  ];

  const strictAnalysis = {
    productIdentification: {
      brand: { value: product.name.split(' ')[0] || 'Unspecified', sourceType: 'USER_PROVIDED' as const, confidence: 'MEDIUM' as const },
      productType: { value: product.category || 'Product', sourceType: 'USER_PROVIDED' as const, confidence: 'HIGH' as const },
      model: { value: 'Not verified', sourceType: 'UNKNOWN' as const, confidence: 'NOT_APPLICABLE' as const }
    },
    observedCharacteristics,
    userProvidedInformation,
    verifiedInformation: [],
    unknownInformation,
    analysisWarnings: [
      'Sellora separates observed, user-provided and verified information. It does not treat guesses as facts.'
    ]
  };

  return {
    overallScore: 86,
    readinessLevel: 'High' as const,
    strengths: [
      `Grounded product name "${product.name}" provided by user`,
      `Price (${product.currency || '$'}${product.price}) set explicitly by user`
    ],
    weaknesses: [
      'Unverified: Internal specs, exact model number, and warranty terms'
    ],
    recommendations: [
      'Confirm unverified specs (battery, storage, warranty) with manufacturer before generating promotional campaigns'
    ],
    salesPotential: 'Strict fact extraction complete. Unverified specifications marked as UNKNOWN.',
    detailedAnalysis: {
      productName: { value: product.name, sourceType: 'USER_PROVIDED' as const, confidence: 'HIGH' as const },
      category: { value: product.category, sourceType: 'USER_PROVIDED' as const, confidence: 'HIGH' as const },
      overallScore: 86,
      readinessLevel: 'High' as const,
      observedFeatures: observedCharacteristics.map(o => ({ fact: `${o.name}: ${o.value}`, sourceType: 'OBSERVED' as const, confidence: o.confidence })),
      userProvidedFacts: userProvidedInformation.map(u => ({ fact: `${u.name}: ${u.value}`, sourceType: 'USER_PROVIDED' as const, confidence: 'HIGH' as const })),
      verifiedFacts: [],
      unknownFacts: unknownInformation.map(u => ({ field: u.name, reason: u.reason, sourceType: 'UNKNOWN' as const, confidence: 'NOT_APPLICABLE' as const })),
      sellingPoints: [],
      targetAudience: [],
      contentSuggestions: [],
      seoKeywords: [],
      warnings: strictAnalysis.analysisWarnings,
      strictAnalysis
    }
  };
}
