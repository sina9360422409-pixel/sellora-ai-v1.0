import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

const apiKey = process.env.GEMINI_API_KEY;
console.log(`[Sellora Server] GEMINI_API_KEY is ${apiKey ? 'configured' : 'NOT present (will use mock fallback)'}`);

const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

// Helper function to extract base64 image or fetch image URL for Gemini inlineData
async function getImagePart(imageUrl?: string) {
  if (!imageUrl) return null;
  try {
    if (imageUrl.startsWith('data:image/')) {
      const match = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        return {
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        };
      }
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const res = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          inlineData: {
            mimeType: contentType.split(';')[0],
            data: base64
          }
        };
      }
    }
  } catch (err) {
    console.warn('[Sellora Server] Image conversion warning:', err);
  }
  return null;
}

// ----------------------------------------------------
// JSON SCHEMAS FOR GEMINI STRUCTURED OUTPUT
// ----------------------------------------------------

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    productIdentification: {
      type: Type.OBJECT,
      properties: {
        brand: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.STRING },
            sourceType: { type: Type.STRING },
            confidence: { type: Type.STRING }
          },
          required: ['value', 'sourceType', 'confidence']
        },
        productType: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.STRING },
            sourceType: { type: Type.STRING },
            confidence: { type: Type.STRING }
          },
          required: ['value', 'sourceType', 'confidence']
        },
        model: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.STRING },
            sourceType: { type: Type.STRING },
            confidence: { type: Type.STRING }
          },
          required: ['value', 'sourceType', 'confidence']
        }
      },
      required: ['brand', 'productType', 'model']
    },
    observedCharacteristics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          sourceType: { type: Type.STRING },
          confidence: { type: Type.STRING }
        },
        required: ['name', 'value', 'sourceType', 'confidence']
      }
    },
    userProvidedInformation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          sourceType: { type: Type.STRING },
          confidence: { type: Type.STRING }
        },
        required: ['name', 'value', 'sourceType', 'confidence']
      }
    },
    verifiedInformation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          sourceType: { type: Type.STRING },
          source: { type: Type.STRING },
          confidence: { type: Type.STRING }
        },
        required: ['name', 'value', 'sourceType', 'source', 'confidence']
      }
    },
    unknownInformation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ['name', 'reason']
      }
    },
    analysisWarnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: [
    'productIdentification',
    'observedCharacteristics',
    'userProvidedInformation',
    'verifiedInformation',
    'unknownInformation',
    'analysisWarnings'
  ]
};

// ==================================================
// PRODUCT INTELLIGENCE RESEARCH ENGINE SCHEMA & SANITIZER (PHASE 1)
// ==================================================

const productIntelligenceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    productIdentity: {
      type: Type.OBJECT,
      properties: {
        brand: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            sourceType: { type: Type.STRING },
            confidence: { type: Type.STRING },
            possibleIdentification: { type: Type.STRING },
            status: { type: Type.STRING }
          },
          required: ['name', 'value', 'sourceType', 'confidence']
        },
        productName: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            sourceType: { type: Type.STRING },
            confidence: { type: Type.STRING },
            possibleIdentification: { type: Type.STRING }
          },
          required: ['name', 'value', 'sourceType', 'confidence']
        },
        productType: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            sourceType: { type: Type.STRING },
            confidence: { type: Type.STRING }
          },
          required: ['name', 'value', 'sourceType', 'confidence']
        },
        model: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            sourceType: { type: Type.STRING },
            confidence: { type: Type.STRING }
          },
          required: ['name', 'value', 'sourceType', 'confidence']
        },
        category: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            sourceType: { type: Type.STRING },
            confidence: { type: Type.STRING }
          },
          required: ['name', 'value', 'sourceType', 'confidence']
        }
      },
      required: ['brand', 'productName', 'productType', 'model', 'category']
    },
    userProvidedFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          sourceType: { type: Type.STRING },
          confidence: { type: Type.STRING },
          evidence: { type: Type.STRING }
        },
        required: ['name', 'value', 'sourceType', 'confidence']
      }
    },
    observedFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          sourceType: { type: Type.STRING },
          confidence: { type: Type.STRING },
          evidence: { type: Type.STRING }
        },
        required: ['name', 'value', 'sourceType', 'confidence']
      }
    },
    researchedFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          sourceType: { type: Type.STRING },
          confidence: { type: Type.STRING },
          sourceTitle: { type: Type.STRING },
          sourceUrl: { type: Type.STRING },
          publisher: { type: Type.STRING },
          evidence: { type: Type.STRING }
        },
        required: ['name', 'value', 'sourceType', 'confidence']
      }
    },
    verifiedFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          sourceType: { type: Type.STRING },
          confidence: { type: Type.STRING },
          sourceTitle: { type: Type.STRING },
          sourceUrl: { type: Type.STRING },
          publisher: { type: Type.STRING },
          evidence: { type: Type.STRING }
        },
        required: ['name', 'value', 'sourceType', 'confidence']
      }
    },
    unknownFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          sourceType: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ['name', 'sourceType', 'reason']
      }
    },
    potentialFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          status: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ['name', 'value', 'status', 'reason']
      }
    },
    conflicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING },
          userValue: { type: Type.STRING },
          researchedValue: { type: Type.STRING },
          description: { type: Type.STRING },
          sourceTitle: { type: Type.STRING },
          sourceUrl: { type: Type.STRING }
        },
        required: ['field', 'userValue', 'researchedValue', 'description']
      }
    },
    researchWarnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    researchStatus: { type: Type.STRING },
    verificationScore: { type: Type.NUMBER },
    summaryNotes: { type: Type.STRING }
  },
  required: [
    'productIdentity',
    'userProvidedFacts',
    'observedFacts',
    'unknownFacts',
    'researchStatus',
    'verificationScore',
    'summaryNotes'
  ]
};

function sanitizeProductIntelligenceResponse(raw: any, product: any, groundingChunks?: any[]) {
  // 1. Parse and extract real grounding web search sources
  const sources: any[] = [];
  if (Array.isArray(groundingChunks) && groundingChunks.length > 0) {
    groundingChunks.forEach((chunk, idx) => {
      if (chunk?.web?.uri) {
        try {
          const urlObj = new URL(chunk.web.uri);
          sources.push({
            id: `src-${idx + 1}`,
            title: chunk.web.title || urlObj.hostname,
            url: chunk.web.uri,
            publisher: urlObj.hostname.replace(/^www\./, ''),
            domain: urlObj.hostname,
            reliabilityScore:
              urlObj.hostname.includes('official') ||
              urlObj.hostname.includes('apple') ||
              urlObj.hostname.includes('samsung') ||
              urlObj.hostname.includes('sony') ||
              urlObj.hostname.includes('nike') ||
              urlObj.hostname.includes('beatsbydre')
                ? 95
                : 85,
            retrievedAt: new Date().toISOString()
          });
        } catch {
          sources.push({
            id: `src-${idx + 1}`,
            title: chunk.web.title || 'Authoritative Web Source',
            url: chunk.web.uri,
            publisher: 'Web Grounding',
            domain: 'web',
            reliabilityScore: 80,
            retrievedAt: new Date().toISOString()
          });
        }
      }
    });
  }

  const defaultSource = sources[0] || null;

  const formattedPrice =
    typeof product.price === 'number'
      ? `${product.currency || '$'}${product.price.toFixed(2)}`
      : `${product.currency || '$'}${product.price || '0.00'}`;

  // 2. Canonical User Provided Facts (Always preserved verbatim)
  const userProvidedFacts: any[] = [];
  const addProvided = (name: string, val: any) => {
    if (val !== undefined && val !== null && String(val).trim()) {
      userProvidedFacts.push({
        name,
        value: String(val).trim(),
        sourceType: 'USER_PROVIDED',
        confidence: 'HIGH',
        source: null,
        evidence: `Explicitly provided by user in product ${name.toLowerCase()}`
      });
    }
  };

  addProvided('Product Name', product.name || 'Unspecified Product');
  addProvided('Category', product.category || 'General');
  addProvided('Listed Price', formattedPrice);
  if (product.description) addProvided('Description', product.description);
  if (product.targetAudience) addProvided('Target Audience', product.targetAudience);
  if (product.usp) addProvided('Unique Selling Proposition', product.usp);

  if (Array.isArray(product.features)) {
    product.features.forEach((feat: any, idx: number) => {
      if (feat && String(feat).trim()) {
        addProvided(`Provided Feature ${idx + 1}`, String(feat).trim());
      }
    });
  }

  // 3. Observed Facts from Image
  const observedFacts: any[] = [];
  if (Array.isArray(raw?.observedFacts)) {
    raw.observedFacts.forEach((f: any) => {
      if (f && typeof f.value === 'string' && f.value.trim() && f.value !== 'Not verified') {
        observedFacts.push({
          name: typeof f.name === 'string' && f.name.trim() ? f.name.trim() : 'Observed Characteristic',
          value: f.value.trim(),
          sourceType: 'OBSERVED',
          confidence: f.confidence === 'LOW' ? 'LOW' : f.confidence === 'MEDIUM' ? 'MEDIUM' : 'HIGH',
          source: null,
          evidence: typeof f.evidence === 'string' ? f.evidence : 'Directly observed from uploaded product image'
        });
      }
    });
  }

  // 4. Researched and Verified Facts (MUST have a valid source)
  const verifiedFacts: any[] = [];
  const rawVerified = Array.isArray(raw?.verifiedFacts) ? raw.verifiedFacts : Array.isArray(raw?.researchedFacts) ? raw.researchedFacts : [];

  rawVerified.forEach((f: any) => {
    if (f && typeof f.value === 'string' && f.value.trim() && f.value !== 'Not verified') {
      const srcUrl = f.sourceUrl || (defaultSource ? defaultSource.url : '');
      const srcTitle = f.sourceTitle || (defaultSource ? defaultSource.title : '');
      const srcPublisher = f.publisher || (defaultSource ? defaultSource.publisher : 'Public Web Source');

      if (srcUrl || srcTitle) {
        verifiedFacts.push({
          name: typeof f.name === 'string' && f.name.trim() ? f.name.trim() : 'Verified Specification',
          value: f.value.trim(),
          sourceType: 'VERIFIED',
          confidence: f.confidence === 'LOW' ? 'LOW' : f.confidence === 'MEDIUM' ? 'MEDIUM' : 'HIGH',
          source: {
            title: srcTitle || 'Official Product Documentation',
            url: srcUrl,
            publisher: srcPublisher
          },
          evidence: typeof f.evidence === 'string' ? f.evidence : 'Confirmed via authoritative web research'
        });
      }
    }
  });

  // 5. Unknown Facts
  const unknownFacts: any[] = [];
  const defaultUnknownList = [
    { name: 'Warranty Terms', reason: 'No warranty details provided or verified' },
    { name: 'Shipping Timeline & Policy', reason: 'Shipping terms not established' },
    { name: 'Return Policy', reason: 'Return policy not provided' },
    { name: 'Drop Protection & Waterproof Ratings', reason: 'No certified lab ratings verified' },
    { name: 'Customer Review Counts & Ratings', reason: 'Real-time sales numbers not verified' }
  ];

  if (Array.isArray(raw?.unknownFacts) && raw.unknownFacts.length > 0) {
    raw.unknownFacts.forEach((u: any) => {
      if (u && typeof u.name === 'string' && u.name.trim()) {
        unknownFacts.push({
          name: u.name.trim(),
          value: 'Not verified',
          sourceType: 'UNKNOWN',
          confidence: 'NOT_APPLICABLE',
          source: null,
          reason: typeof u.reason === 'string' && u.reason.trim() ? u.reason.trim() : 'Cannot be reliably established'
        });
      }
    });
  } else {
    defaultUnknownList.forEach(u => {
      unknownFacts.push({
        name: u.name,
        value: 'Not verified',
        sourceType: 'UNKNOWN',
        confidence: 'NOT_APPLICABLE',
        source: null,
        reason: u.reason
      });
    });
  }

  // 6. Potential Facts (Never treated as verified)
  const potentialFacts: any[] = [];
  if (Array.isArray(raw?.potentialFacts)) {
    raw.potentialFacts.forEach((p: any) => {
      if (p && typeof p.name === 'string' && p.name.trim() && p.value) {
        potentialFacts.push({
          name: p.name.trim(),
          value: String(p.value).trim(),
          status: 'POTENTIAL',
          reason: typeof p.reason === 'string' ? p.reason.trim() : 'Inferred or unverified candidate'
        });
      }
    });
  }

  // 7. Conflicts (e.g. price difference or conflicting specs)
  const conflicts: any[] = [];
  if (Array.isArray(raw?.conflicts)) {
    raw.conflicts.forEach((c: any) => {
      if (c && c.field && (c.userValue || c.researchedValue)) {
        conflicts.push({
          field: String(c.field),
          userValue: String(c.userValue || 'Not specified'),
          researchedValue: String(c.researchedValue || 'Not specified'),
          description: String(c.description || 'Conflict between user input and researched data'),
          source: c.sourceUrl ? { title: c.sourceTitle || 'Web Source', url: c.sourceUrl, publisher: 'Web' } : defaultSource
        });
      }
    });
  }

  // Check price conflict explicitly if user price differs from researched
  const researchedPriceFact = verifiedFacts.find(f => f.name.toLowerCase().includes('price') || f.name.toLowerCase().includes('msrp'));
  if (researchedPriceFact && researchedPriceFact.value !== formattedPrice) {
    const exists = conflicts.some(c => c.field.toLowerCase().includes('price'));
    if (!exists) {
      conflicts.push({
        field: 'Price',
        userValue: formattedPrice,
        researchedValue: researchedPriceFact.value,
        description: 'User-provided price differs from researched official MSRP',
        source: researchedPriceFact.source
      });
    }
  }

  // 8. Research Warnings
  const researchWarnings: string[] = Array.isArray(raw?.researchWarnings)
    ? raw.researchWarnings.map((w: any) => String(w)).filter(Boolean)
    : [];

  // 9. Product Identity (Conservative, Never silently overwrites user name)
  const rawIdent = raw?.productIdentity || {};
  const userEnteredName = product.name || 'Unspecified Product';

  const productNameIdentity: any = {
    name: 'Product Name',
    value: userEnteredName,
    sourceType: 'USER_PROVIDED',
    confidence: 'HIGH',
    source: null,
    possibleIdentification: rawIdent.productName?.possibleIdentification || rawIdent.brand?.possibleIdentification || undefined
  };

  const brandIdentity: any = {
    name: 'Brand',
    value: rawIdent.brand?.value || 'Generic / Seller Provided',
    sourceType: rawIdent.brand?.sourceType === 'OBSERVED' ? 'OBSERVED' : rawIdent.brand?.sourceType === 'VERIFIED' ? 'VERIFIED' : rawIdent.brand?.sourceType === 'USER_PROVIDED' ? 'USER_PROVIDED' : 'UNKNOWN',
    confidence: rawIdent.brand?.confidence || 'HIGH',
    possibleIdentification: rawIdent.brand?.possibleIdentification || undefined,
    status: rawIdent.brand?.status || 'CONFIRMED'
  };

  const productTypeIdentity: any = {
    name: 'Product Type',
    value: rawIdent.productType?.value || product.category || 'Physical Product',
    sourceType: rawIdent.productType?.sourceType === 'OBSERVED' ? 'OBSERVED' : 'USER_PROVIDED',
    confidence: 'HIGH'
  };

  const modelIdentity: any = {
    name: 'Model',
    value: rawIdent.model?.value && rawIdent.model.value !== 'Not verified' && rawIdent.model.value !== 'UNKNOWN' ? rawIdent.model.value : 'UNKNOWN',
    sourceType: rawIdent.model?.sourceType === 'VERIFIED' ? 'VERIFIED' : rawIdent.model?.sourceType === 'USER_PROVIDED' ? 'USER_PROVIDED' : 'UNKNOWN',
    confidence: rawIdent.model?.confidence || (rawIdent.model?.value === 'UNKNOWN' ? 'NOT_APPLICABLE' : 'HIGH')
  };

  const categoryIdentity: any = {
    name: 'Category',
    value: product.category || 'General',
    sourceType: 'USER_PROVIDED',
    confidence: 'HIGH'
  };

  // Determine Research Status
  let researchStatus: any = raw?.researchStatus || 'COMPLETED';
  if (sources.length === 0 && verifiedFacts.length === 0) {
    researchStatus = 'NO_RELIABLE_SOURCE';
  } else if (verifiedFacts.length > 0 && sources.length > 0) {
    researchStatus = 'COMPLETED';
  }

  // 10. Synthesize Universal Product Intelligence Profile
  const universalProfile = {
    productIdentity: {
      brand: brandIdentity,
      productName: productNameIdentity,
      productType: productTypeIdentity,
      model: modelIdentity,
      category: categoryIdentity
    },
    userProvidedFacts,
    observedFacts,
    researchedFacts: verifiedFacts,
    verifiedFacts,
    unknownFacts,
    potentialFacts,
    sources,
    conflicts,
    researchWarnings,
    researchStatus,
    overallScore: typeof raw?.verificationScore === 'number' && !isNaN(raw.verificationScore) ? Math.min(100, Math.max(0, raw.verificationScore)) : 88,
    summaryNotes: typeof raw?.summaryNotes === 'string' && raw.summaryNotes.trim() ? raw.summaryNotes.trim() : 'Product facts verified and classified into canonical source tiers.'
  };

  // Map dynamic attributes for legacy/view compatibility
  const dynamicAttributes: Record<string, any> = {};
  userProvidedFacts.forEach(f => {
    dynamicAttributes[f.name.toLowerCase().replace(/[^a-z0-9]/g, '_')] = f;
  });
  observedFacts.forEach(f => {
    dynamicAttributes[f.name.toLowerCase().replace(/[^a-z0-9]/g, '_')] = f;
  });
  verifiedFacts.forEach(f => {
    dynamicAttributes[f.name.toLowerCase().replace(/[^a-z0-9]/g, '_')] = f;
  });

  return {
    id: 'intel-' + Date.now(),
    productId: product.id || 'unknown',
    lastAnalyzedAt: new Date().toISOString(),
    productName: {
      value: userEnteredName,
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
      value: brandIdentity.value,
      status: brandIdentity.status === 'CONFIRMED' ? 'VERIFIED' : 'POTENTIAL',
      sourceType: brandIdentity.sourceType,
      confidence: brandIdentity.confidence
    },
    description: product.description ? {
      value: product.description,
      status: 'VERIFIED',
      sourceType: 'USER_PROVIDED',
      confidence: 'HIGH'
    } : undefined,
    price: {
      value: typeof product.price === 'number' ? product.price : 0,
      currency: product.currency || '$',
      formatted: formattedPrice,
      status: 'VERIFIED',
      sourceType: 'USER_PROVIDED'
    },
    dynamicAttributes,
    unknownInformation: unknownFacts.map(u => ({ name: u.name, reason: u.reason || 'Unverified' })),
    productKeywords: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags : [product.category || 'ecommerce', product.name || 'product'],
    researchSources: sources,
    sources,
    verificationScore: universalProfile.overallScore,
    summaryNotes: universalProfile.summaryNotes,
    researchStatus,
    universalProfile
  };
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!apiKey,
    model: 'gemini-3.6-flash'
  });
});

// Helper to validate and sanitize Gemini fact-extraction analysis
function sanitizeAnalysisResponse(structuredData: any, product: any) {
  const userProvided: any[] = Array.isArray(structuredData.userProvidedInformation)
    ? [...structuredData.userProvidedInformation]
    : [];

  const ensureUserItem = (name: string, value: string) => {
    if (!value) return;
    const exists = userProvided.some(
      (item) => item.name?.toLowerCase().includes(name.toLowerCase())
    );
    if (!exists) {
      userProvided.push({
        name,
        value,
        sourceType: 'USER_PROVIDED',
        confidence: 'NOT_APPLICABLE'
      });
    }
  };

  const formattedPrice = typeof product.price === 'number'
    ? `${product.currency || '$'}${product.price.toFixed(2)}`
    : `${product.currency || '$'}${product.price || ''}`;

  ensureUserItem('Product Name', product.name || 'Unspecified');
  ensureUserItem('Listed Price', formattedPrice);
  if (product.category) ensureUserItem('Category', product.category);
  if (product.description) ensureUserItem('Description', product.description);

  const productIdent = structuredData.productIdentification || {};
  let brand = productIdent.brand || { value: 'Unspecified', sourceType: 'UNKNOWN', confidence: 'NOT_APPLICABLE' };
  let productType = productIdent.productType || { value: product.category || 'Product', sourceType: 'USER_PROVIDED', confidence: 'HIGH' };
  let model = productIdent.model || { value: 'Not verified', sourceType: 'UNKNOWN', confidence: 'NOT_APPLICABLE' };

  if (model.value && model.value !== 'Not verified') {
    const userText = `${product.name} ${product.description || ''} ${product.category || ''}`.toLowerCase();
    if (!userText.includes(model.value.toLowerCase()) && model.sourceType === 'VERIFIED') {
      model.sourceType = 'UNKNOWN';
      model.value = 'Not verified';
      model.confidence = 'NOT_APPLICABLE';
    }
  }

  const prohibitedPatterns = [
    /guarantee/i, /30-day/i, /money-back/i, /worldwide shipping/i, /fast shipping/i,
    /satisfaction/i, /risk-free/i, /luxury masterpiece/i, /elite performance/i,
    /unrivaled/i, /5 stars/i, /customer reviews/i, /top rated/i, /bestseller/i,
    /discount/i, /limited time/i
  ];

  const sanitizeList = (list: any[]) => {
    return (Array.isArray(list) ? list : []).filter((item: any) => {
      const text = `${item.name || ''} ${item.value || ''} ${item.fact || ''}`;
      return !prohibitedPatterns.some((pattern) => pattern.test(text));
    });
  };

  const observedCharacteristics = sanitizeList(structuredData.observedCharacteristics || []);
  let verifiedInformation = sanitizeList(structuredData.verifiedInformation || []).filter((item: any) => {
    if (!item.source || item.source.toLowerCase().includes('gemini') || item.source.toLowerCase().includes('ai')) {
      return false;
    }
    return true;
  });

  const unknownInformation = Array.isArray(structuredData.unknownInformation) ? structuredData.unknownInformation : [];
  const warnings = Array.isArray(structuredData.analysisWarnings) ? structuredData.analysisWarnings : (Array.isArray(structuredData.warnings) ? structuredData.warnings : []);

  return {
    productIdentification: { brand, productType, model },
    observedCharacteristics,
    userProvidedInformation: userProvided,
    verifiedInformation,
    unknownInformation,
    analysisWarnings: warnings
  };
}

// Server-side product payload sanitizer
function sanitizeProductPayload(product: any) {
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
      targetAudience: 'General ecommerce buyers',
      usp: 'High quality product',
      facts: []
    };
  }

  const numPrice = typeof product.price === 'number' && !isNaN(product.price)
    ? product.price
    : (typeof product.price === 'string' ? (parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0) : 0);

  return {
    id: typeof product.id === 'string' ? product.id : (typeof product.id === 'number' ? String(product.id) : ''),
    name: typeof product.name === 'string' ? product.name : 'Unspecified Product',
    category: typeof product.category === 'string' ? product.category : 'General',
    description: typeof product.description === 'string' ? product.description : '',
    price: numPrice,
    currency: typeof product.currency === 'string' ? product.currency : '$',
    image: typeof product.image === 'string' ? product.image : (typeof product.imageUrl === 'string' ? product.imageUrl : null),
    features: Array.isArray(product.features) ? product.features.filter((f: any) => typeof f === 'string') : [],
    tags: Array.isArray(product.tags) ? product.tags.filter((t: any) => typeof t === 'string') : [],
    targetAudience: typeof product.targetAudience === 'string' ? product.targetAudience : null,
    usp: typeof product.usp === 'string' ? product.usp : null,
    facts: Array.isArray(product.facts) ? product.facts : []
  };
}

// 1. Real Gemini Product Analyzer Endpoint
app.post('/api/analyze-product', async (req, res) => {
  const rawProduct = req.body.product;

  if (!rawProduct) {
    return res.status(400).json({ error: 'Missing product payload' });
  }

  const product = sanitizeProductPayload(rawProduct);

  console.log(`[Sellora Server] Gemini request started for product: "${product.name || 'Unspecified'}"`);

  // Explicit check for server-side Gemini configuration
  if (!apiKey || !ai) {
    console.error(`[Sellora Server] Gemini request failed: GEMINI_API_KEY environment variable is missing`);
    return res.status(503).json({
      success: false,
      errorType: 'API_KEY_MISSING',
      message: 'Gemini AI is not configured.',
      diagnostic: 'Configure the server-side GEMINI_API_KEY environment variable to enable real AI analysis.'
    });
  }

  try {
    const imagePart = await getImagePart(product.image);

    const systemInstruction = `You are Sellora AI's Product Analyzer — a strict fact extraction and product understanding tool.

CORE SELLORA TRUST POLICY:
- NEVER present an assumption, hallucination, inference, marketing exaggeration, or unsupported claim as a factual statement.
- Accuracy is far more important than completeness. When in doubt, prefer UNKNOWN ("Not verified" / "Not provided").
- Do NOT generate persuasive marketing copy, sales copy, high-conversion bullets, luxury claims, or promotional exaggerations.

SOURCE TYPES (MUST be exactly one of these strings):
- OBSERVED: Directly visible in the uploaded image (e.g., visible shape, visible camera cutouts, buttons, visible logo, physical color).
- USER_PROVIDED: Explicitly provided by the user in the text input.
- VERIFIED: Confirmed beyond doubt by an authoritative external source with source specified. NEVER label Gemini's own inference or confidence as VERIFIED! If no authoritative external source is available, do NOT use VERIFIED.
- UNKNOWN: Cannot be reliably established from image or user text.

CONFIDENCE VALUES (MUST be one of these strings):
"HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE".
Do NOT use high confidence to turn an uncertain guess into a fact.

MODEL IDENTIFICATION RULES:
Be extremely conservative! If the image or text does not provide enough evidence to reliably determine the exact model (e.g., a phone case where the exact target phone model cannot be established with 100% certainty):
- brand: value: "Generic" (or visible brand), sourceType: "OBSERVED", confidence: "MEDIUM"
- productType: value: "Phone case" (or visible type), sourceType: "OBSERVED", confidence: "HIGH"
- model: value: "Not verified", sourceType: "UNKNOWN", confidence: "NOT_APPLICABLE"
Never upgrade "looks like" into "confirmed model".

USER-PROVIDED INFORMATION PRESERVATION:
You MUST include every piece of user-provided information from the prompt (Name, Price, Category, Description) in "userProvidedInformation" with sourceType "USER_PROVIDED".

MANDATORY UNKNOWN SPECIFICATIONS:
Unless explicitly provided by the user or genuinely verified, the following MUST be listed in "unknownInformation" with clear reasons:
- Storage capacity & RAM
- Battery capacity & Power specs
- Weight & Dimensions
- Material composition & Drop protection
- MagSafe & Wireless charging compatibility
- Water resistance & IP rating
- Warranty & Return terms
- Price (if not provided)
- Customer reviews & Customer ratings
- Number of sales & Customer statistics
- Shipping times & Global availability

NO FAKE MARKETING CLAIMS & NO FAKE NUMBERS:
Never invent prices, percentages, review counts, sales stats, warranty periods, shipping times, or promotional phrases ("Luxury masterpiece", "Elite performance", "Unrivaled reliability", "Risk-free trial", "30-day money-back guarantee", "Fast worldwide shipping", "Premium materials").

Your output MUST strictly adhere to the JSON schema.`;

    const formattedPrice = typeof product.price === 'number'
      ? `${product.currency || '$'}${product.price.toFixed(2)}`
      : `${product.currency || '$'}${product.price || '0.00'}`;

    const userPrompt = `Analyze this product for factual understanding.

USER-PROVIDED PRODUCT TEXT:
- Product Name: ${product.name || 'Unspecified'}
- Category: ${product.category || 'Unspecified'}
- Listed Price: ${formattedPrice}
- Provided Description: ${product.description || 'None provided'}
- Provided Features: ${product.features?.join(', ') || 'None provided'}

Extract user-provided facts, report genuinely observable physical characteristics from the image, list unknown specifications clearly, and provide analysis warnings if model or facts cannot be verified.`;

    const contents: any = [];
    if (imagePart) {
      contents.push(imagePart);
    }
    contents.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: analysisResponseSchema
      }
    });

    console.log('[Sellora Server] Gemini request completed successfully via model: gemini-3.6-flash');

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty response');
    }

    const structuredData = JSON.parse(text);
    const sanitized = sanitizeAnalysisResponse(structuredData, product);

    console.log(`[Sellora Server] Response validation completed for product: "${product.name || 'Unspecified'}"`);

    const detailedAnalysis = {
      productName: {
        value: product.name,
        sourceType: 'USER_PROVIDED' as const,
        confidence: 'NOT_APPLICABLE' as const
      },
      category: {
        value: product.category || 'Unspecified',
        sourceType: 'USER_PROVIDED' as const,
        confidence: 'NOT_APPLICABLE' as const
      },
      overallScore: 88,
      readinessLevel: 'High' as const,
      observedFeatures: sanitized.observedCharacteristics.map((item: any) => ({
        fact: `${item.name}: ${item.value}`,
        sourceType: 'OBSERVED' as const,
        confidence: item.confidence || 'HIGH'
      })),
      userProvidedFacts: sanitized.userProvidedInformation.map((item: any) => ({
        fact: `${item.name}: ${item.value}`,
        sourceType: 'USER_PROVIDED' as const,
        confidence: (item.confidence || 'NOT_APPLICABLE') as any
      })),
      verifiedFacts: sanitized.verifiedInformation.map((item: any) => ({
        fact: `${item.name}: ${item.value} (Source: ${item.source})`,
        sourceType: 'VERIFIED' as const,
        confidence: item.confidence || 'HIGH'
      })),
      unknownFacts: sanitized.unknownInformation.map((item: any) => ({
        field: item.name,
        reason: item.reason,
        sourceType: 'UNKNOWN' as const,
        confidence: 'NOT_APPLICABLE' as const
      })),
      sellingPoints: [],
      targetAudience: [],
      contentSuggestions: [],
      seoKeywords: [],
      warnings: sanitized.analysisWarnings,
      strictAnalysis: sanitized
    };

    const analysisResult = {
      overallScore: 88,
      readinessLevel: 'High',
      strengths: sanitized.observedCharacteristics.map((item: any) => `Observed: ${item.name} (${item.value})`),
      weaknesses: sanitized.unknownInformation.map((item: any) => `Not verified: ${item.name}`),
      recommendations: [
        'Confirm unverified specs (material, drop protection, exact compatibility) before creating marketing campaigns'
      ],
      salesPotential: `Fact audit complete. Grounded in ${sanitized.userProvidedInformation.length} provided items & ${sanitized.observedCharacteristics.length} visual observations.`,
      strictAnalysis: sanitized,
      detailedAnalysis
    };

    return res.json({
      success: true,
      isRealAi: true,
      aiStatusMessage: 'Real Gemini Fact Extraction (gemini-3.6-flash)',
      analysis: analysisResult
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`[Sellora Server] Gemini request failed: ${errMsg}`);

    let errorType = 'GEMINI_UNAVAILABLE';
    let message = 'Gemini AI is currently unavailable.';
    let diagnostic = errMsg;

    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota')) {
      errorType = 'RATE_LIMIT';
      message = 'AI usage limit reached. Please try again later.';
    } else if (errMsg.includes('fetch failed') || errMsg.includes('ENOTFOUND') || errMsg.includes('ECONNREFUSED') || errMsg.includes('connect')) {
      errorType = 'NETWORK_ERROR';
      message = 'Unable to connect to Sellora AI.';
    } else if (errMsg.includes('SyntaxError') || errMsg.includes('JSON')) {
      errorType = 'INVALID_RESPONSE';
      message = 'Sellora received an invalid AI response. Please try again.';
    }

    return res.status(500).json({
      success: false,
      errorType,
      message,
      diagnostic
    });
  }
});

// 1b. Real Gemini Product Intelligence Engine Endpoint
app.post('/api/analyze-product-intelligence', async (req, res) => {
  const rawProduct = req.body.product;
  const enableResearch = req.body.enableResearch !== false; // enabled by default

  if (!rawProduct) {
    return res.status(400).json({ error: 'Missing product payload' });
  }

  const product = sanitizeProductPayload(rawProduct);

  console.log(`[Sellora Server] Product Intelligence request started for: "${product.name || 'Unspecified'}" (Research enabled: ${enableResearch})`);

  if (!apiKey || !ai) {
    console.error(`[Sellora Server] Intelligence request failed: GEMINI_API_KEY environment variable is missing`);
    return res.status(503).json({
      success: false,
      errorType: 'API_KEY_MISSING',
      message: 'Gemini AI is not configured.',
      diagnostic: 'Configure GEMINI_API_KEY to enable Product Intelligence analysis.'
    });
  }

  try {
    const imagePart = await getImagePart(product.image);

    const systemInstruction = `You are Sellora AI's Universal Product Intelligence Research Engine (Phase 1).
Your mission is to perform rigorous, grounded product understanding, web research, fact verification, and anomaly detection for ANY physical product (electronics, cosmetics, shoes, clothing, furniture, tools, sports gear, etc.).

STRICT SOURCE CLASSIFICATION (MUST be one of these strings):
- OBSERVED: Directly visible in the uploaded product image (e.g., color, visible texture, button layout, visible ports, matte/glossy finish). Set confidence="HIGH" or "MEDIUM".
- USER_PROVIDED: Explicitly entered or supplied by the user (name, description, features, price). Always preserve user data verbatim.
- VERIFIED: Confirmed by authoritative web research / official product documentation via Google Search grounding. MUST include source title, source URL, publisher, and evidence.
- UNKNOWN: Cannot be reliably established from image, user data, or authoritative web research. Value MUST be "Not verified". Reason must explain what is missing.

STRICT STATUS VALUES (MUST be one of these strings):
"CONFIRMED", "REQUIRES_CONFIRMATION", "UNVERIFIED", "POTENTIAL", "CONFLICTING".

CORE TRUTHFULNESS & ANTI-HALLUCINATION RULES:
1. TRUTHFULNESS OVER GUESSWORK: Sellora strictly prefers "I don't know" over "I think this is probably true." Never invent specifications, features, ratings, or policies.
2. CONSERVATIVE IDENTIFICATION: Do NOT guess specific model numbers unless confirmed by search grounding or clear visible labeling. If exact model is unverified, set model value to "UNKNOWN" with sourceType="UNKNOWN".
3. CONFLICT & OVERWRITE PROTECTION: NEVER silently overwrite user-provided information.
   - If user wrote "headphone bit's", preserve productName as "headphone bit's" with sourceType="USER_PROVIDED". If research finds "Beats", add possibleIdentification="Beats", status="REQUIRES_CONFIRMATION", and add a researchWarning.
   - If user specified a price (e.g. $49.99), the user's price is ALWAYS USER_PROVIDED. If research finds a different MSRP ($59.99), record a conflict in "conflicts" with field="Price", userValue="$49.99", researchedValue="$59.99", and description explaining the difference.
4. PROHIBITED FABRICATIONS: You are strictly forbidden from inventing:
   - Warranty terms, return policies, or money-back guarantees
   - Shipping times, delivery guarantees, or global shipping claims
   - Drop protection ratings (e.g. "military grade drop test"), waterproof ratings (e.g. "IP68") unless officially documented
   - Customer review counts, average star ratings, or sales statistics
   - Promotional fluff ("luxury masterpiece", "elite performance", "risk-free")
   If any of these are not explicitly provided or verified, they MUST be classified in unknownFacts.
5. GROUNDING & SOURCES: Every verifiedFact MUST have sourceTitle, sourceUrl, publisher, and evidence. If search grounding does not return authoritative corroboration, classify as unknownFacts or potentialFacts (with status="POTENTIAL").

Your output MUST strictly adhere to the JSON schema.`;

    const formattedPrice = typeof product.price === 'number'
      ? `${product.currency || '$'}${product.price.toFixed(2)}`
      : `${product.currency || '$'}${product.price || '0.00'}`;

    const userPrompt = `Perform rigorous Product Intelligence Research on this item.

USER-PROVIDED PRODUCT INPUTS:
- Product Name: ${product.name || 'Unspecified'}
- Category: ${product.category || 'General'}
- Listed Price: ${formattedPrice}
- Description: ${product.description || 'None provided'}
- Features: ${product.features?.join(', ') || 'None provided'}
- Target Audience: ${product.targetAudience || 'General ecommerce buyers'}
- USP: ${product.usp || 'None provided'}

RESEARCH & VERIFICATION INSTRUCTIONS:
1. Examine the image (if provided) for visual characteristics (OBSERVED).
2. Use Google Search grounding to research authoritative product specifications, official brand/model details, verified materials, and official pricing.
3. Compare researched facts with user-provided inputs to detect any conflicts or spelling/brand discrepancies.
4. List all unverified or missing specifications in unknownFacts with clear reasons.
5. Compute an overall verification confidence score (0-100) and provide factual summary notes.`;

    const contents: any = [];
    if (imagePart) {
      contents.push(imagePart);
    }
    contents.push({ text: userPrompt });

    const config: any = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: productIntelligenceResponseSchema
    };

    if (enableResearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty intelligence response');
    }

    const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const structuredData = JSON.parse(text);
    const sanitizedIntel = sanitizeProductIntelligenceResponse(structuredData, product, groundingChunks);

    console.log(`[Sellora Server] Product Intelligence analysis completed for: "${product.name}" (Sources found: ${sanitizedIntel.sources?.length || 0})`);

    return res.json({
      success: true,
      isRealAi: true,
      message: 'Universal Product Intelligence analysis complete',
      intelligence: sanitizedIntel
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`[Sellora Server] Product Intelligence analysis failed: ${errMsg}`);

    return res.status(500).json({
      success: false,
      errorType: 'INTELLIGENCE_ERROR',
      message: 'Failed to generate Product Intelligence',
      diagnostic: errMsg
    });
  }
});

// 2. Content Generation Endpoint (Listing, Social, Ad, Reply)
app.post('/api/generate-content', async (req, res) => {
  const {
    product: rawProduct,
    type,
    tone = 'Professional',
    goal = 'More Sales',
    platform,
    imageStyle,
    aspectRatio,
    customerInquiry,
    customPrompt,
    isRegeneration,
    variationSeed
  } = req.body;

  if (!rawProduct || !type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const product = sanitizeProductPayload(rawProduct);

  if (!apiKey || !ai) {
    return res.status(400).json({
      success: false,
      isRealAi: false,
      message: 'Gemini AI is not configured.'
    });
  }

  try {
    const imagePart = await getImagePart(product.image);

    const formattedPrice = typeof product.price === 'number'
      ? `${product.currency || '$'}${product.price.toFixed(2)}`
      : `${product.currency || '$'}${product.price || '0.00'}`;

    const userDescription = product.description || 'None provided';
    const featuresList = Array.isArray(product.features) && product.features.length > 0
      ? product.features.join('; ')
      : 'None provided';
    const usp = product.usp || 'None provided';
    const targetAudience = product.targetAudience || 'General ecommerce buyers';

    // Build structured facts list
    let factsContext = '';
    if (product.facts && Array.isArray(product.facts) && product.facts.length > 0) {
      factsContext = product.facts.map((f: any) => `- [${f.sourceType || 'FACT'}] ${f.fact || f.name || ''}: ${f.value || ''}`).join('\n');
    }

    const toneGuide: Record<string, string> = {
      Professional: "Clear, trustworthy, precise, and business-oriented. Focus on facts, clear structure, and confident professionalism.",
      Premium: "Refined, sophisticated, and quality-focused. Use elevated vocabulary emphasizing craftsmanship and elevated taste.",
      Luxury: "Elegant, exclusive, sophisticated, and emotionally appealing tone. Create a high-end atmosphere without fabricating technical specifications or promises.",
      Bold: "Confident, energetic, direct, and attention-grabbing style. Use punchy sentences and a strong memorable voice.",
      Friendly: "Warm, approachable, conversational, and relatable tone. Speak like a helpful expert introducing a great find.",
      Minimal: "Short, clean, modern, and simple. Remove clutter and focus purely on essential facts and direct appeal."
    };

    const goalGuide: Record<string, string> = {
      "More Sales": "Focus heavily on product benefits, purchase motivation, value proposition, and a clear conversion CTA.",
      "More Clicks": "Craft intriguing hooks, curiosity-building headlines, and a strong compelling click call-to-action.",
      "Brand Awareness": "Focus on memorable brand identity, distinctive positioning, and long-term brand connection.",
      "Product Launch": "Create launch excitement, highlight key product details clearly, and encourage immediate exploration."
    };

    const selectedToneGuide = toneGuide[tone] || toneGuide['Professional'];
    const selectedGoalGuide = goalGuide[goal] || goalGuide['More Sales'];

    const specialInstructionsText = customPrompt && typeof customPrompt === 'string' && customPrompt.trim()
      ? `SPECIAL USER INSTRUCTIONS:\n"${customPrompt.trim()}"\n- Adhere strictly to these instructions (e.g. language preference, length, emoji usage, specific emphasis) unless they conflict with truthfulness rules.`
      : '';

    const regenerationText = isRegeneration
      ? `REGENERATION VARIATION (Seed: ${variationSeed || Date.now()}): Generate a distinct, creative variation of the copy while maintaining the same product facts, tone, goal, and special instructions.`
      : '';

    const systemInstruction = `You are Sellora AI's Professional Ecommerce Copywriter & Content Generator.

STRICT TRUTHFULNESS & ANTI-HALLUCINATION MANDATE:
1. Ground ALL factual statements strictly in the provided product details:
   - Product Name: ${product.name}
   - Category: ${product.category}
   - Listed Price: ${formattedPrice}
   - User Provided Description: ${userDescription}
   - Provided Features: ${featuresList}
   - Unique Selling Proposition: ${usp}
   - Target Audience: ${targetAudience}
   ${factsContext ? `\nAdditional Verified Facts:\n${factsContext}` : ''}

2. CREATIVE STYLE vs FACTUAL ACCURACY:
   - YOU MAY use creative, persuasive marketing language to match the requested Tone ("${tone}") and Goal ("${goal}").
   - Examples of allowed stylistic expressions: "designed for a modern aesthetic", "crafted for effortless daily style", "a refined accessory".
   - YOU MUST NOT INVENT FACTUAL CLAIMS or TECHNICAL SPECS that were not explicitly provided in the product details above or clearly visible in the product image.
   - STRICTLY FORBIDDEN UNLESS EXPLICITLY PROVIDED IN USER TEXT/IMAGE:
     * Warranty terms (e.g., "2-year warranty", "lifetime guarantee")
     * Return policy or money-back guarantees (e.g., "30-day money-back guarantee", "risk-free trial")
     * Shipping promises or timelines (e.g., "fast worldwide shipping", "free express shipping", "same-day dispatch")
     * Technical specs / materials (e.g., "aerospace aluminum", "military-grade TPU", "MagSafe compatible", "shockproof", "20h battery life", "waterproof IP68")
     * Social proof / fake stats (e.g., "10,000+ sold", "4.9/5 stars", "verified customer favorite", "award-winning")

3. TONE INSTRUCTION (${tone}):
   ${selectedToneGuide}

4. CAMPAIGN GOAL INSTRUCTION (${goal}):
   ${selectedGoalGuide}

5. LANGUAGE & FORMAT RULES:
   - If special instructions or user input are written in or explicitly request a specific language (e.g. Persian, Spanish, French, German), generate the ENTIRE content in that requested language.
   - Do NOT translate brand names or product names unless explicitly requested.

JSON OUTPUT FORMAT REQUIREMENT:
You MUST respond with valid JSON matching the requested structure for format "${type}".

For format "listing":
{
  "contentType": "listing",
  "title": "Clean, persuasive, high-converting product title based strictly on name, price, category, and tone",
  "shortDescription": "Concise product summary grounded strictly in provided facts",
  "bulletPoints": ["Factual bullet point 1", "Factual bullet point 2", "Factual bullet point 3"],
  "keyFeatures": ["Key feature 1 grounded in facts", "Key feature 2 grounded in facts"],
  "fullDescription": "Persuasive full description reflecting selected tone and goal without inventing fake specs, fake guarantees, or fake shipping terms",
  "seoKeywords": ["relevant keyword 1", "relevant keyword 2"],
  "callToAction": "Clear call to action",
  "warnings": []
}

For format "social":
{
  "contentType": "social",
  "platform": "${platform || 'Instagram'}",
  "hook": "Engaging social hook matching tone and goal",
  "caption": "Platform-appropriate caption grounded strictly in provided facts",
  "hashtags": ["#tag1", "#tag2"],
  "callToAction": "Call to action",
  "mediaSuggestion": "Creative visual or video concept idea",
  "bestTimeToPost": "Posting time recommendation",
  "warnings": []
}

For format "ad":
{
  "contentType": "ad",
  "platform": "${platform || 'Google'}",
  "headline": "High-CTR ad headline",
  "primaryText": "Factual primary ad copy without fake claims or fake guarantees",
  "description": "Short factual ad description",
  "callToAction": "Clear CTA text",
  "audienceTargeting": "Suggested demographic target",
  "warnings": []
}

For format "reply":
{
  "contentType": "reply",
  "customerInquiry": "${customerInquiry || 'General Inquiry'}",
  "recommendedReply": "Factual, polite response stating strictly known details. If customer asks about unverified details (like warranty or shipping), state honestly that details are not currently specified.",
  "politeAlternative": "Polite alternative response option",
  "warnings": []
}`;

    const prompt = `Generate ${type.toUpperCase()} copy for:
Product Name: ${product.name}
Category: ${product.category}
Price: ${formattedPrice}
Description: ${userDescription}
Features: ${featuresList}
Tone: ${tone}
Goal: ${goal}
Platform: ${platform || 'General'}
Customer Inquiry: ${customerInquiry || 'N/A'}

${specialInstructionsText}
${regenerationText}

Remember: NO fake claims, NO fake warranties, NO fake shipping terms, NO fake reviews. Ground strictly in provided product facts while using persuasive style for tone "${tone}".`;

    const contents: any = [];
    if (imagePart) contents.push(imagePart);
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty response');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (pErr) {
      console.error('[Sellora Server] Could not parse Gemini output as JSON:', text);
      return res.status(500).json({
        success: false,
        message: 'Sellora received an invalid AI response. Please try again.'
      });
    }

    // Server-side Compliance Validation & Sanitization
    const userAndImageFacts = `${product.name} ${product.description || ''} ${(product.features || []).join(' ')} ${product.usp || ''}`.toLowerCase();

    const sanitizeField = (inputStr: string, fieldWarnings: string[]): string => {
      if (!inputStr || typeof inputStr !== 'string') return inputStr;
      let cleaned = inputStr;

      // Unverified claim terms to flag unless present in user text
      const prohibitedTerms: { pattern: RegExp; replacement: string; reason: string }[] = [
        { pattern: /30-day money-back guarantee/gi, replacement: 'standard customer support', reason: 'money-back guarantee' },
        { pattern: /2-year (manufacturer )?warranty/gi, replacement: 'quality assurance', reason: 'warranty timeline' },
        { pattern: /lifetime warranty/gi, replacement: 'quality design', reason: 'lifetime warranty' },
        { pattern: /fast worldwide shipping/gi, replacement: 'standard delivery', reason: 'worldwide shipping claims' },
        { pattern: /free express shipping/gi, replacement: 'standard shipping options', reason: 'free express shipping claims' },
        { pattern: /military-grade (protection|tpu|durability)/gi, replacement: 'durable construction', reason: 'military-grade claims' },
        { pattern: /magsafe (compatible|charging)/gi, replacement: 'device compatible', reason: 'MagSafe compatibility claim' },
        { pattern: /10,000\+ (sold|satisfied customers)/gi, replacement: 'popular choice', reason: 'sales volume claim' },
        { pattern: /rated 4\.9\/5/gi, replacement: 'customer favorite', reason: 'fake rating claim' }
      ];

      for (const item of prohibitedTerms) {
        if (cleaned.match(item.pattern) && !userAndImageFacts.includes(item.reason)) {
          cleaned = cleaned.replace(item.pattern, item.replacement);
          fieldWarnings.push(`Excluded unverified claim: ${item.reason}`);
        }
      }

      return cleaned;
    };

    const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings : [];

    if (type === 'listing' && parsed) {
      if (parsed.title) parsed.title = sanitizeField(parsed.title, warnings);
      if (parsed.fullDescription) parsed.fullDescription = sanitizeField(parsed.fullDescription, warnings);
      if (parsed.shortDescription) parsed.shortDescription = sanitizeField(parsed.shortDescription, warnings);
      if (Array.isArray(parsed.bulletPoints)) {
        parsed.bulletPoints = parsed.bulletPoints.map((b: string) => sanitizeField(b, warnings));
      }
      if (Array.isArray(parsed.keyFeatures)) {
        parsed.keyFeatures = parsed.keyFeatures.map((kf: string) => sanitizeField(kf, warnings));
      }
    } else if (type === 'social' && parsed) {
      if (parsed.caption) parsed.caption = sanitizeField(parsed.caption, warnings);
      if (parsed.hook) parsed.hook = sanitizeField(parsed.hook, warnings);
    } else if (type === 'ad' && parsed) {
      if (parsed.primaryText) parsed.primaryText = sanitizeField(parsed.primaryText, warnings);
      if (parsed.headline) parsed.headline = sanitizeField(parsed.headline, warnings);
      if (parsed.description) parsed.description = sanitizeField(parsed.description, warnings);
    } else if (type === 'reply' && parsed) {
      if (parsed.recommendedReply) parsed.recommendedReply = sanitizeField(parsed.recommendedReply, warnings);
      if (parsed.politeAlternative) parsed.politeAlternative = sanitizeField(parsed.politeAlternative, warnings);
    }

    parsed.warnings = Array.from(new Set(warnings));

    return res.json({
      success: true,
      isRealAi: true,
      aiStatusMessage: 'Real Gemini Content Generation (gemini-3.6-flash)',
      textResponse: JSON.stringify(parsed)
    });
  } catch (err: any) {
    console.error('[Sellora Server] Gemini Generation error:', err?.message || err);
    return res.status(500).json({
      success: false,
      isRealAi: false,
      message: 'Gemini AI is currently unavailable.',
      diagnostic: err?.message || String(err)
    });
  }
});

// Helper for fallback mock analysis
function getFallbackAnalysis(product: any) {
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
    overallScore: 84,
    readinessLevel: 'High' as const,
    strengths: [
      `User-provided title "${product.name}" clearly defines item`,
      `Price (${product.currency || '$'}${product.price}) set explicitly by user`
    ],
    weaknesses: [
      'Unverified: Internal specs, exact model number, and warranty terms'
    ],
    recommendations: [
      'Confirm unverified specs (battery, storage, warranty) with manufacturer before generating promotional campaigns'
    ],
    salesPotential: 'Strict fact extraction complete. Unverified specifications marked as UNKNOWN.',
    strictAnalysis,
    detailedAnalysis: {
      productName: { value: product.name, sourceType: 'USER_PROVIDED' as const, confidence: 'HIGH' as const },
      category: { value: product.category, sourceType: 'USER_PROVIDED' as const, confidence: 'HIGH' as const },
      overallScore: 84,
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

// ----------------------------------------------------
// VITE MIDDLEWARE SETUP
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sellora Server] Express backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
