import {
  PermittedFact,
  ExtractedClaim,
  ClaimCategory,
  ClaimSeverity,
  ClaimValidationStatus
} from '../types';

export interface ClaimValidationResult {
  passed: boolean;
  sanitizedOutput: any;
  extractedClaims: ExtractedClaim[];
  detectedClaims: string[];
  rejectedClaims: string[];
  warnings: string[];
  blockReason?: string;
}

// Quantity Normalization Types
type UnitFamily = 'BATTERY' | 'MASS' | 'DATA' | 'LENGTH' | 'POWER' | 'CURRENCY' | 'PERCENT';

interface NormalizedQuantity {
  value: number; // Base unit value
  family: UnitFamily;
  baseUnit: string;
}

/**
 * Normalizes a number and unit string into a canonical quantity representation.
 */
function normalizeQuantity(val: number, rawUnit: string): NormalizedQuantity | null {
  const u = rawUnit.toLowerCase().trim();

  // Battery capacity (base: mAh)
  if (u === 'mah') return { value: val, family: 'BATTERY', baseUnit: 'mah' };
  if (u === 'ah' || u === 'a-hour' || u === 'amp-hour' || u === 'ampere-hour') {
    return { value: val * 1000, family: 'BATTERY', baseUnit: 'mah' };
  }

  // Mass (base: g)
  if (u === 'g' || u === 'gram' || u === 'grams') return { value: val, family: 'MASS', baseUnit: 'g' };
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return { value: val * 1000, family: 'MASS', baseUnit: 'g' };
  if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') return { value: val * 453.592, family: 'MASS', baseUnit: 'g' };
  if (u === 'oz' || u === 'ounce' || u === 'ounces') return { value: val * 28.3495, family: 'MASS', baseUnit: 'g' };

  // Data / Storage (base: MB)
  if (u === 'mb') return { value: val, family: 'DATA', baseUnit: 'mb' };
  if (u === 'gb') return { value: val * 1000, family: 'DATA', baseUnit: 'mb' };
  if (u === 'tb') return { value: val * 1000000, family: 'DATA', baseUnit: 'mb' };

  // Length / Dimensions (base: mm)
  if (u === 'mm') return { value: val, family: 'LENGTH', baseUnit: 'mm' };
  if (u === 'cm') return { value: val * 10, family: 'LENGTH', baseUnit: 'mm' };
  if (u === 'm') return { value: val * 1000, family: 'LENGTH', baseUnit: 'mm' };
  if (u === 'inch' || u === 'inches' || u === 'in' || u === '"') return { value: val * 25.4, family: 'LENGTH', baseUnit: 'mm' };

  // Power (base: W)
  if (u === 'w' || u === 'watt' || u === 'watts') return { value: val, family: 'POWER', baseUnit: 'w' };
  if (u === 'kw') return { value: val * 1000, family: 'POWER', baseUnit: 'w' };

  // Currency (base: $)
  if (u === '$' || u === 'usd' || u === 'dollar' || u === 'dollars') return { value: val, family: 'CURRENCY', baseUnit: '$' };

  // Percent (base: %)
  if (u === '%' || u === 'percent' || u === 'pct') return { value: val, family: 'PERCENT', baseUnit: '%' };

  return null;
}

/**
 * Checks if two quantities match within a 2% mathematical tolerance and identical unit family.
 */
function isQuantityMatching(q1: NormalizedQuantity, q2: NormalizedQuantity): boolean {
  if (q1.family !== q2.family) return false;
  if (q1.value === 0 && q2.value === 0) return true;
  const diff = Math.abs(q1.value - q2.value);
  const maxVal = Math.max(Math.abs(q1.value), Math.abs(q2.value));
  return (diff / maxVal) <= 0.02; // 2% tolerance
}

/**
 * Extracts and parses all permitted facts into normalized quantities and canonical keywords.
 */
function parsePermittedFacts(permittedFacts: PermittedFact[]): {
  quantities: NormalizedQuantity[];
  factText: string;
  factNamesAndValues: Array<{ name: string; value: string }>;
  prices: number[];
} {
  const quantities: NormalizedQuantity[] = [];
  const prices: number[] = [];
  const factNamesAndValues: Array<{ name: string; value: string }> = [];
  let combinedText = '';

  permittedFacts.forEach((f) => {
    const text = `${f.name} ${f.value}`.toLowerCase();
    combinedText += ' ' + text;
    factNamesAndValues.push({ name: f.name.toLowerCase(), value: f.value.toLowerCase() });

    // Extract numbers with units from fact values
    const numUnitRegex = /(\d+(?:[.,]\d+)?)\s*([a-zA-Z%"$]+)/g;
    let match: RegExpExecArray | null;
    while ((match = numUnitRegex.exec(f.value)) !== null) {
      const numStr = match[1].replace(',', '');
      const val = parseFloat(numStr);
      const unit = match[2];
      if (!isNaN(val)) {
        const norm = normalizeQuantity(val, unit);
        if (norm) quantities.push(norm);
        if (norm && norm.family === 'CURRENCY') prices.push(norm.value);
      }
    }

    // Check for raw price in numeric fact
    const priceMatch = f.value.match(/\$?(\d+(?:\.\d{1,2})?)/);
    if (priceMatch && (f.name.toLowerCase().includes('price') || f.name.toLowerCase().includes('cost'))) {
      prices.push(parseFloat(priceMatch[1]));
    }
  });

  return { quantities, factText: combinedText, factNamesAndValues, prices };
}

export const claimValidationService = {
  /**
   * Recursively extracts text fields from any structured generation payload.
   */
  extractAllTextFields(obj: any, fieldPath = ''): Array<{ path: string; text: string }> {
    const results: Array<{ path: string; text: string }> = [];
    if (!obj) return results;

    if (typeof obj === 'string') {
      results.push({ path: fieldPath, text: obj });
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        results.push(...this.extractAllTextFields(item, `${fieldPath}[${index}]`));
      });
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        const currentPath = fieldPath ? `${fieldPath}.${key}` : key;
        results.push(...this.extractAllTextFields(obj[key], currentPath));
      });
    }
    return results;
  },

  /**
   * Extracts structured claims from text string, classifying category and severity.
   */
  extractClaimsFromText(text: string, sourceField = 'content'): ExtractedClaim[] {
    if (!text || typeof text !== 'string') return [];
    const claims: ExtractedClaim[] = [];
    let claimId = 1;

    // 1. Certifications & Military Standards (CRITICAL)
    const certRegex = /\b(ce|fda|fcc|ul|rohs)\s*(certified|approved)?\b|\bip6[78](?: waterproof)?\b|\bmil(?:-std)?[- ]\d+[a-z]?\b|\bmilitary-grade\s*(?:protection|tpu|durability|testing|standards?)\b|\bbuilt to military standards?\b|\bcertified\s*(?:protection|quality|testing)\b|\bwaterproof\s*(?:protection|certification|rating)?\b|\bdustproof\b/gi;
    let match: RegExpExecArray | null;
    while ((match = certRegex.exec(text)) !== null) {
      claims.push({
        id: `c-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'CERTIFICATION',
        severity: 'CRITICAL',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // 2. Warranties & Guarantees (CRITICAL)
    const warrantyRegex = /\b\d+[- ]year\s*(?:manufacturer\s*)?warranty\b|\blifetime warranty\b|\bbacked by a \d+[- ]year warranty\b|\b\d+[- ]day\s*(?:money-back guarantee|trial|returns?)\b|\bmoney-back guarantee\b|\brisk-free trial\b/gi;
    while ((match = warrantyRegex.exec(text)) !== null) {
      claims.push({
        id: `w-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'WARRANTY',
        severity: 'CRITICAL',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // 3. Shipping & Logistics Promises (CRITICAL)
    const shippingRegex = /\b(?:fast\s*)?worldwide shipping\b|\bships worldwide\b|\bfree express shipping\b|\b(?:same-day|next-day|24-hour)\s*(?:dispatch|shipping|delivery)\b/gi;
    while ((match = shippingRegex.exec(text)) !== null) {
      claims.push({
        id: `s-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'SHIPPING',
        severity: 'CRITICAL',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // 4. Social Proof & Fake Ratings (CRITICAL)
    const socialProofRegex = /\b10,000\+\s*(?:sold|satisfied customers|happy buyers)\b|\btrusted by\s*(?:thousands|millions)\b|\brated 4\.\d\/5\b|\b(?:over\s*)?\d{3,}\s*reviews\b|\bbest seller\b|\baward-winning\b|\b#1 rated\b/gi;
    while ((match = socialProofRegex.exec(text)) !== null) {
      claims.push({
        id: `sp-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'SOCIAL_PROOF',
        severity: 'CRITICAL',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // 5. Financial Discounts & Price Claims (CRITICAL)
    const discountRegex = /\b\d+%\s*off\b|\b\d+%\s*discount\b|\bsave \$?\d+\b|\blimited-time deal\b/gi;
    while ((match = discountRegex.exec(text)) !== null) {
      claims.push({
        id: `d-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'DISCOUNT',
        severity: 'CRITICAL',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // Explicit Price Claims (CRITICAL)
    const priceClaimRegex = /\$\s*(\d+(?:\.\d{1,2})?)/g;
    while ((match = priceClaimRegex.exec(text)) !== null) {
      const pVal = parseFloat(match[1]);
      claims.push({
        id: `p-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'PRICING',
        severity: 'CRITICAL',
        normalizedValue: pVal,
        unit: '$',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // 6. Numeric Technical Specs (HIGH)
    const numSpecRegex = /\b(\d+(?:[.,]\d+)?)\s*(mah|ah|gb|tb|mb|hz|fps|w|v|g|kg|lbs?|oz|inch|inches|cm|mm|m)\b/gi;
    while ((match = numSpecRegex.exec(text)) !== null) {
      const valStr = match[1].replace(',', '');
      const numVal = parseFloat(valStr);
      const rawUnit = match[2].toLowerCase();
      const norm = normalizeQuantity(numVal, rawUnit);

      let category: ClaimCategory = 'SPECIFICATION';
      if (norm?.family === 'BATTERY') category = 'BATTERY';
      else if (norm?.family === 'MASS') category = 'WEIGHT';
      else if (norm?.family === 'DATA') category = 'CAPACITY';
      else if (norm?.family === 'LENGTH') category = 'DIMENSION';

      claims.push({
        id: `spec-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category,
        severity: 'HIGH',
        normalizedValue: norm?.value ?? numVal,
        unit: norm?.baseUnit ?? rawUnit,
        rawUnit,
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // 7. Battery Performance Runtimes (HIGH)
    const runtimeRegex = /\b(\d+)\s*(?:hour|hr|day)s?\s*(?:battery|runtime|playtime|use|battery life)?\b|\ball-day battery(?: life)?\b|\b48-hour battery\b/gi;
    while ((match = runtimeRegex.exec(text)) !== null) {
      claims.push({
        id: `rt-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'BATTERY',
        severity: 'HIGH',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // 8. Specific Unverified Materials (MEDIUM)
    const materialRegex = /\b(?:aerospace(?:-grade)?(?:\s+aluminum)?|titanium(?:\s+frame|\s+casing|\s+housing)?|gorilla glass|carbon fiber|genuine leather|100% cotton|stainless steel|tpu)\b/gi;
    while ((match = materialRegex.exec(text)) !== null) {
      claims.push({
        id: `mat-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'MATERIAL',
        severity: 'MEDIUM',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    // 9. Unverified Compatibility (HIGH)
    const compatRegex = /\b(?:magsafe(?:\s+fast)?(?:\s+wireless)?|\biphone \d+ compatible\b)/gi;
    while ((match = compatRegex.exec(text)) !== null) {
      claims.push({
        id: `compat-${sourceField}-${claimId++}`,
        text: match[0].trim(),
        category: 'COMPATIBILITY',
        severity: 'HIGH',
        sourceField,
        validationStatus: 'UNSUPPORTED'
      });
    }

    return claims;
  },

  /**
   * Helper to perform semantic / normalized claim matching against permitted facts.
   */
  validateClaimAgainstPermittedFacts(
    claim: ExtractedClaim,
    parsedFacts: ReturnType<typeof parsePermittedFacts>
  ): { status: ClaimValidationStatus; reason?: string } {
    const claimLower = claim.text.toLowerCase();

    // Special Specific Feature / Brand Enforcement:
    if (claimLower.includes('magsafe') && !parsedFacts.factText.includes('magsafe')) {
      return { status: 'UNSUPPORTED', reason: 'MagSafe compatibility is not supported by permitted facts.' };
    }

    if (claimLower.includes('ip68') && parsedFacts.factText.includes('ip68')) {
      return { status: 'SUPPORTED' };
    }

    // 1. Direct text presence or substring in permitted facts
    if (parsedFacts.factText.includes(claimLower)) {
      return { status: 'SUPPORTED' };
    }

    // Check individual fact values
    for (const f of parsedFacts.factNamesAndValues) {
      if (f.value.includes(claimLower) || claimLower.includes(f.value)) {
        return { status: 'SUPPORTED' };
      }
    }

    // 2. Numeric / Unit matching
    if (claim.normalizedValue !== undefined && claim.unit) {
      const claimQuantity: NormalizedQuantity = {
        value: claim.normalizedValue,
        family:
          claim.category === 'BATTERY' ? 'BATTERY' :
          claim.category === 'WEIGHT' ? 'MASS' :
          claim.category === 'CAPACITY' ? 'DATA' :
          claim.category === 'DIMENSION' ? 'LENGTH' :
          claim.category === 'PRICING' ? 'CURRENCY' :
          'POWER',
        baseUnit: claim.unit
      };

      const matchedFactQuantity = parsedFacts.quantities.find((fq) => isQuantityMatching(claimQuantity, fq));
      if (matchedFactQuantity) {
        return { status: 'SUPPORTED' };
      } else {
        return {
          status: 'UNSUPPORTED',
          reason: `Numeric claim ${claim.text} (normalized: ${claim.normalizedValue}${claim.unit}) has no matching permitted fact.`
        };
      }
    }

    // 3. Price Protection
    if (claim.category === 'PRICING' && claim.normalizedValue !== undefined) {
      const isPriceSupported = parsedFacts.prices.some((p) => Math.abs(p - claim.normalizedValue!) < 0.01);
      if (isPriceSupported) {
        return { status: 'SUPPORTED' };
      } else {
        return {
          status: 'UNSUPPORTED',
          reason: `Price claim $${claim.normalizedValue} differs from permitted price facts (${parsedFacts.prices.join(', ')}).`
        };
      }
    }

    // 4. Special word matches (e.g. "wireless" matching "Bluetooth 5.3" if present)
    if (
      !claimLower.includes('magsafe') &&
      claimLower.includes('wireless') &&
      (parsedFacts.factText.includes('bluetooth') || parsedFacts.factText.includes('2.4ghz'))
    ) {
      return { status: 'SUPPORTED' };
    }

    return {
      status: 'UNSUPPORTED',
      reason: `Claim "${claim.text}" (${claim.category}) is not present in permitted product facts.`
    };
  },

  /**
   * Validates generated content claims against permitted facts across all fields,
   * performs safe sanitization, and returns structured audit results.
   */
  validateClaims(contentObj: any, permittedFacts: PermittedFact[]): ClaimValidationResult {
    const parsedFacts = parsePermittedFacts(permittedFacts);
    const textFields = this.extractAllTextFields(contentObj);

    const extractedClaims: ExtractedClaim[] = [];
    const detectedClaimsStr: string[] = [];
    const rejectedClaims: string[] = [];
    const warnings: string[] = [];

    // Extract claims from all fields
    textFields.forEach((tf) => {
      const claimsInField = this.extractClaimsFromText(tf.text, tf.path);
      claimsInField.forEach((claim) => {
        detectedClaimsStr.push(claim.text);
        detectedClaimsStr.push(claim.text.toLowerCase());
        if (claim.rawUnit) {
          detectedClaimsStr.push(`${claim.normalizedValue}${claim.rawUnit}`);
          detectedClaimsStr.push(`${claim.normalizedValue} ${claim.rawUnit}`);
        }

        const matchResult = this.validateClaimAgainstPermittedFacts(claim, parsedFacts);
        claim.validationStatus = matchResult.status;
        claim.reason = matchResult.reason;

        if (matchResult.status === 'UNSUPPORTED') {
          const categoryLabel = claim.category === 'BATTERY' ? 'battery/runtime' : claim.category;
          rejectedClaims.push(`[${claim.severity}] ${categoryLabel} in ${claim.sourceField}: "${claim.text}"`);
        }
        extractedClaims.push(claim);
      });
    });

    // Perform safe sanitization on copy
    let sanitizedOutput = JSON.parse(JSON.stringify(contentObj || {}));

    // Sanitize arrays (seoKeywords, hashtags, features, sellingPoints)
    if (Array.isArray(sanitizedOutput.seoKeywords)) {
      sanitizedOutput.seoKeywords = sanitizedOutput.seoKeywords.filter((kw: string) => {
        if (typeof kw !== 'string') return true;
        const claims = this.extractClaimsFromText(kw, 'seoKeywords');
        const isUnsupported = claims.some((c) => this.validateClaimAgainstPermittedFacts(c, parsedFacts).status === 'UNSUPPORTED');
        if (isUnsupported) warnings.push(`Removed unsupported SEO keyword: "${kw}"`);
        return !isUnsupported;
      });
    }

    if (Array.isArray(sanitizedOutput.hashtags)) {
      sanitizedOutput.hashtags = sanitizedOutput.hashtags.filter((ht: string) => {
        if (typeof ht !== 'string') return true;
        const claims = this.extractClaimsFromText(ht, 'hashtags');
        const isUnsupported = claims.some((c) => this.validateClaimAgainstPermittedFacts(c, parsedFacts).status === 'UNSUPPORTED');
        if (isUnsupported) warnings.push(`Removed unsupported hashtag: "${ht}"`);
        return !isUnsupported;
      });
    }

    if (Array.isArray(sanitizedOutput.sellingPoints)) {
      sanitizedOutput.sellingPoints = sanitizedOutput.sellingPoints.map((sp: string) => {
        if (typeof sp !== 'string') return sp;
        return this.sanitizeTextString(sp, parsedFacts, warnings);
      });
    }

    // Sanitize string fields safely
    const stringKeys = ['title', 'shortDescription', 'fullDescription', 'callToAction', 'customerReply', 'prompt', 'socialCaption', 'advertisementHeadline', 'advertisementBody'];
    stringKeys.forEach((key) => {
      if (typeof sanitizedOutput[key] === 'string') {
        sanitizedOutput[key] = this.sanitizeTextString(sanitizedOutput[key], parsedFacts, warnings);
      }
    });

    // Check for critical / high severe rejections that could not be supported
    const unsupportedCriticalOrHigh = extractedClaims.filter(
      (c) => c.validationStatus === 'UNSUPPORTED' && (c.severity === 'CRITICAL' || c.severity === 'HIGH' || c.severity === 'MEDIUM')
    );

    const passed = unsupportedCriticalOrHigh.length === 0;

    return {
      passed,
      sanitizedOutput,
      extractedClaims,
      detectedClaims: Array.from(new Set(detectedClaimsStr)),
      rejectedClaims,
      warnings,
      blockReason: passed
        ? undefined
        : `Generated content contains ${unsupportedCriticalOrHigh.length} unsupported critical/high claim(s): ${unsupportedCriticalOrHigh.map((c) => `"${c.text}" (${c.category})`).join('; ')}`
    };
  },

  /**
   * Safely sanitizes unsupported phrases from a text string without inventing fake facts.
   */
  sanitizeTextString(text: string, parsedFacts: ReturnType<typeof parsePermittedFacts>, warnings: string[]): string {
    let result = text;

    const patternsToSanitize: Array<{ pattern: RegExp; requiresKw?: string[] }> = [
      { pattern: /\b\d+[- ]year\s*(?:manufacturer\s*)?warranty\b/gi, requiresKw: ['warranty'] },
      { pattern: /\blifetime warranty\b/gi, requiresKw: ['lifetime warranty', 'warranty'] },
      { pattern: /\b30-day\s*(?:money-back guarantee|trial|returns?)\b/gi, requiresKw: ['30-day', 'guarantee'] },
      { pattern: /\bmoney-back guarantee\b/gi, requiresKw: ['guarantee'] },
      { pattern: /\b(?:ce|fda|fcc)\s*(?:certified|approved)\b/gi, requiresKw: ['ce', 'fda', 'fcc'] },
      { pattern: /\bip68\s*(?:waterproof)?\b/gi, requiresKw: ['ip68'] },
      { pattern: /\bmilitary-grade\s*(?:protection|tpu|durability|testing|standards?)\b/gi, requiresKw: ['military-grade', 'mil-std'] },
      { pattern: /\b10,000\+\s*(?:sold|satisfied customers|happy buyers)\b/gi, requiresKw: ['10,000'] },
      { pattern: /\brated 4\.9\/5\b/gi, requiresKw: ['4.9/5'] },
      { pattern: /\b\d+%\s*off\b/gi, requiresKw: ['% off', 'discount'] },
      { pattern: /\b(?:fast\s*)?worldwide shipping\b/gi, requiresKw: ['worldwide shipping'] }
    ];

    for (const rule of patternsToSanitize) {
      if (rule.pattern.test(result)) {
        const isSupported = rule.requiresKw?.some((kw) => parsedFacts.factText.includes(kw.toLowerCase()));
        if (!isSupported) {
          result = result.replace(rule.pattern, '').replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
          warnings.push(`Sanitized text: removed unsupported phrase matching ${rule.pattern}`);
        }
      }
    }

    return result;
  }
};
