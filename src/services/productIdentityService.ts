import { EvidenceSource, NormalizedProductIdentity, ProductIdentityStatus } from '../types';

export interface ProductInput {
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  description?: string;
  features?: string[];
  observedCharacteristics?: Array<{ name: string; value: string }>;
}

export const productIdentityService = {
  /**
   * Evaluates exact product identity match across user inputs and external evidence sources.
   * Produces a normalized identity object with confidence score and status.
   */
  evaluateProductIdentity(
    product: ProductInput,
    sources: EvidenceSource[]
  ): NormalizedProductIdentity {
    const userProductName = product.name?.trim() || 'Unspecified Product';
    const userBrand = product.brand?.trim() || extractBrandFromName(userProductName);
    const userModel = product.model?.trim() || extractModelFromName(userProductName);
    const category = product.category?.trim() || 'General';

    const matchedSources: string[] = [];
    let matchScore = 0;

    if (!sources || sources.length === 0) {
      return {
        brand: userBrand || 'Generic / Seller Provided',
        model: userModel || 'Not verified',
        productName: userProductName,
        category,
        identityConfidence: 35,
        matchedSources: [],
        identityStatus: 'UNCONFIRMED',
        reasoning: 'No external research sources available to verify identity.'
      };
    }

    let detectedModelMismatch = false;

    // Evaluate each source against expected brand & model
    sources.forEach((source) => {
      const sourceContent = `${source.title || ''} ${source.url || ''} ${source.supportingText || ''}`.toLowerCase();
      let sourceMatchesProduct = false;

      // Check model match
      if (userModel && userModel.length >= 3 && userModel !== 'not verified' && userModel !== 'unknown') {
        if (sourceContent.includes(userModel.toLowerCase())) {
          matchScore += 50;
          sourceMatchesProduct = true;
        } else {
          // Model mismatch penalty if source discusses a conflicting model
          const hasDifferentModel = detectConflictingModel(sourceContent, userModel.toLowerCase());
          if (hasDifferentModel) {
            matchScore -= 60;
            detectedModelMismatch = true;
          }
        }
      }

      // Check brand match
      if (userBrand && userBrand.length >= 2 && userBrand.toLowerCase() !== 'generic') {
        if (sourceContent.includes(userBrand.toLowerCase())) {
          matchScore += 25;
          sourceMatchesProduct = sourceMatchesProduct || !detectedModelMismatch;
        }
      }

      // Check product name keywords
      const nameKeywords = userProductName.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const matchedKeywords = nameKeywords.filter((kw) => sourceContent.includes(kw));
      if (nameKeywords.length > 0 && matchedKeywords.length / nameKeywords.length >= 0.6) {
        matchScore += 20;
        sourceMatchesProduct = sourceMatchesProduct || !detectedModelMismatch;
      }

      if (sourceMatchesProduct && !detectedModelMismatch && source.id) {
        matchedSources.push(source.id);
      }
    });

    let averageScorePerSource = sources.length > 0 ? Math.min(100, Math.max(0, Math.round((matchScore / sources.length) * 1.5))) : 0;
    if (detectedModelMismatch) {
      averageScorePerSource = Math.min(25, averageScorePerSource);
    }

    let identityConfidence = averageScorePerSource;

    // Boost if official manufacturer domain is present among matched sources (only if model matches)
    const hasOfficialMatch = !detectedModelMismatch && sources.some(
      (s) => (s.sourceType === 'OFFICIAL_MANUFACTURER' || s.sourceType === 'OFFICIAL_DOCUMENTATION' || s.sourceType === 'OFFICIAL_PRODUCT_PAGE') && matchedSources.includes(s.id)
    );
    if (hasOfficialMatch) {
      identityConfidence = Math.min(100, identityConfidence + 25);
    }

    if (detectedModelMismatch) {
      identityConfidence = Math.min(25, identityConfidence);
    }

    // Determine status based on identity confidence & exact model matching
    let identityStatus: ProductIdentityStatus = 'UNCONFIRMED';
    if (identityConfidence >= 80 && matchedSources.length > 0) {
      identityStatus = 'CONFIRMED';
    } else if (identityConfidence >= 60) {
      identityStatus = 'LIKELY';
    } else if (identityConfidence >= 35) {
      identityStatus = 'AMBIGUOUS';
    } else {
      identityStatus = 'UNCONFIRMED';
    }

    let reasoning = 'Product identity verified against external sources.';
    if (identityStatus === 'UNCONFIRMED') {
      reasoning = 'Search sources did not contain sufficient exact-model evidence. Facts downgraded to unconfirmed.';
    } else if (identityStatus === 'AMBIGUOUS') {
      reasoning = 'Multiple similar product models found in research. Proceeding conservatively.';
    }

    return {
      brand: userBrand || 'Generic / Seller Provided',
      model: userModel || 'Not verified',
      productName: userProductName,
      category,
      identityConfidence,
      matchedSources,
      identityStatus,
      reasoning
    };
  },

  /**
   * Generates dynamic, product-agnostic research queries derived purely from product identity.
   */
  generateResearchQueries(identity: { brand?: string; model?: string; productName?: string; category?: string }): string[] {
    const brand = identity.brand && identity.brand !== 'Generic / Seller Provided' ? identity.brand : '';
    const model = identity.model && identity.model !== 'Not verified' && identity.model !== 'UNKNOWN' ? identity.model : '';
    const name = identity.productName || '';

    const queries: string[] = [];

    if (brand && model) {
      queries.push(`${brand} ${model} official specifications`);
      queries.push(`${brand} ${model} product manual technical details`);
      queries.push(`${brand} ${model} official features materials`);
    } else if (model) {
      queries.push(`${model} specifications`);
      queries.push(`${model} official manual`);
    } else if (name) {
      queries.push(`${name} specifications features`);
      queries.push(`${name} official product details`);
    }

    if (identity.category && name) {
      queries.push(`${name} ${identity.category} specifications`);
    }

    return Array.from(new Set(queries.map((q) => q.trim()))).filter(Boolean);
  }
};

function extractBrandFromName(name: string): string {
  if (!name) return 'Generic';
  const firstWord = name.trim().split(/\s+/)[0];
  if (firstWord && firstWord.length > 2 && !/^(the|a|an|new|pro|ultra|mini|max|case|cable|item)$/i.test(firstWord)) {
    return firstWord;
  }
  return 'Generic';
}

function extractModelFromName(name: string): string {
  if (!name) return 'Not verified';
  // Common model number patterns e.g. WH-1000XM4, S24, iPhone 15 Pro, MX Master 3S
  const modelMatch = name.match(/\b([A-Z0-9]{2,10}-[A-Z0-9]{2,10}|[A-Z]+[0-9]{2,5}|[0-9]{2,5}[A-Z]+)\b/i);
  if (modelMatch) {
    return modelMatch[1];
  }
  return 'Not verified';
}

function detectConflictingModel(sourceContent: string, expectedModel: string): boolean {
  if (!sourceContent || !expectedModel) return false;
  const cleanExpected = expectedModel.toLowerCase().trim();
  const cleanSource = sourceContent.toLowerCase();

  // Match model prefix and ending number, e.g. "wh-1000xm" + "4" or "s" + "24" or "iphone 15"
  const modelMatch = cleanExpected.match(/^([a-z0-9\s\-]+?)([0-9]+)$/i);
  if (modelMatch) {
    const prefix = modelMatch[1];
    const expectedNum = modelMatch[2];

    // Search for prefix followed by a different number in source text
    const regex = new RegExp(`${escapeRegExp(prefix)}([0-9]+)`, 'i');
    const srcMatch = cleanSource.match(regex);
    if (srcMatch && srcMatch[1] !== expectedNum) {
      return true;
    }
  }

  // Generic model code check: if model code e.g. "xm4" vs "xm5"
  if (cleanExpected.length >= 3 && !cleanSource.includes(cleanExpected)) {
    // Check if source contains similar model pattern with different digit
    const digitsInModel = cleanExpected.match(/\d+/g);
    if (digitsInModel) {
      for (const digit of digitsInModel) {
        const patternWithDiffDigit = cleanExpected.replace(digit, '\\d+');
        const match = cleanSource.match(new RegExp(patternWithDiffDigit, 'i'));
        if (match && !cleanSource.includes(cleanExpected)) {
          return true;
        }
      }
    }
  }

  return false;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
