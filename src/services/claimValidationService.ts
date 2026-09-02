import { PermittedFact } from '../types';

export interface ClaimValidationResult {
  passed: boolean;
  sanitizedOutput: any;
  detectedClaims: string[];
  rejectedClaims: string[];
  warnings: string[];
  blockReason?: string;
}

const PROHIBITED_UNSUPPORTED_PATTERNS: {
  pattern: RegExp;
  claimCategory: string;
  replacement: string;
  requiresPermittedKeyword?: string[];
}[] = [
  // Warranties & Guarantees
  {
    pattern: /\b(2|1|3|5)-year (manufacturer )?warranty\b/gi,
    claimCategory: 'Warranty Claim',
    replacement: 'quality assurance',
    requiresPermittedKeyword: ['warranty']
  },
  {
    pattern: /\blifetime warranty\b/gi,
    claimCategory: 'Lifetime Warranty',
    replacement: 'durable design',
    requiresPermittedKeyword: ['lifetime warranty', 'warranty']
  },
  {
    pattern: /\b30-day (money-back guarantee|trial|return)\b/gi,
    claimCategory: 'Money-Back Guarantee',
    replacement: 'customer support guarantee',
    requiresPermittedKeyword: ['30-day', 'guarantee', 'money-back']
  },
  {
    pattern: /\brisk-free trial\b/gi,
    claimCategory: 'Risk-Free Guarantee',
    replacement: 'worry-free purchase',
    requiresPermittedKeyword: ['risk-free']
  },

  // Certifications & Ratings
  {
    pattern: /\b(ce|fda|fcc) certified\b/gi,
    claimCategory: 'Certification Claim',
    replacement: 'quality tested',
    requiresPermittedKeyword: ['ce certified', 'fda approved', 'fcc certified']
  },
  {
    pattern: /\bip68( waterproof)?\b/gi,
    claimCategory: 'IP68 Waterproof Rating',
    replacement: 'water resistant',
    requiresPermittedKeyword: ['ip68']
  },
  {
    pattern: /\bmilitary-grade (protection|tpu|durability|testing)\b/gi,
    claimCategory: 'Military Grade Claim',
    replacement: 'rugged durability',
    requiresPermittedKeyword: ['military-grade', 'mil-std']
  },

  // Shipping & Delivery Promises
  {
    pattern: /\b(fast )?worldwide shipping\b/gi,
    claimCategory: 'Worldwide Shipping Claim',
    replacement: 'standard shipping options',
    requiresPermittedKeyword: ['worldwide shipping']
  },
  {
    pattern: /\bfree express shipping\b/gi,
    claimCategory: 'Free Express Shipping Claim',
    replacement: 'shipping options',
    requiresPermittedKeyword: ['express shipping']
  },
  {
    pattern: /\bsame-day (dispatch|shipping)\b/gi,
    claimCategory: 'Same-Day Dispatch Claim',
    replacement: 'prompt dispatch',
    requiresPermittedKeyword: ['same-day']
  },

  // Social Proof & Fake Numbers
  {
    pattern: /\b10,000\+ (sold|satisfied customers|happy buyers)\b/gi,
    claimCategory: 'Sales Volume Claim',
    replacement: 'popular choice',
    requiresPermittedKeyword: ['10,000']
  },
  {
    pattern: /\brated 4\.9\/5\b/gi,
    claimCategory: 'Fake Star Rating',
    replacement: 'highly rated',
    requiresPermittedKeyword: ['4.9/5', 'rating']
  },
  {
    pattern: /\b(over )?1,000 reviews\b/gi,
    claimCategory: 'Fake Review Count',
    replacement: 'customer favorite',
    requiresPermittedKeyword: ['reviews']
  },

  // Unverified Discount Claims
  {
    pattern: /\b(20%|50%|30%|40%) off\b/gi,
    claimCategory: 'Unverified Discount Claim',
    replacement: 'great value',
    requiresPermittedKeyword: ['discount', '% off']
  }
];

export const claimValidationService = {
  /**
   * Extracts factual claims (numbers, units, materials, specs) from generated text.
   */
  extractClaims(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    const claims: string[] = [];

    // Extract numeric claims with units
    const numUnitRegex = /\b\d+(\.\d+)?\s*(mah|gb|tb|mb|hz|fps|w|v|g|kg|lbs|inch|inches|cm|mm|m)s?\b/gi;
    let match: RegExpExecArray | null;
    while ((match = numUnitRegex.exec(text)) !== null) {
      claims.push(match[0].trim().toLowerCase());
    }

    // Extract battery runtime claims (e.g. 2-day battery, 30 hours)
    const runtimeRegex = /\b\d+\s*(hour|hr|day)s?\s*(battery|runtime|playtime|use)?\b/gi;
    while ((match = runtimeRegex.exec(text)) !== null) {
      claims.push(match[0].trim().toLowerCase());
    }

    // Extract specific material claims
    const materialRegex = /\b(aerospace(-grade)?|titanium|gorilla glass|carbon fiber|genuine leather|100% cotton)\b/gi;
    while ((match = materialRegex.exec(text)) !== null) {
      claims.push(match[0].trim().toLowerCase());
    }

    return Array.from(new Set(claims));
  },

  /**
   * Validates generated content claims against permitted facts.
   * Sanitizes unpermitted claims where possible, or rejects if unresolvable.
   */
  validateClaims(contentObj: any, permittedFacts: PermittedFact[]): ClaimValidationResult {
    const jsonString = JSON.stringify(contentObj || {});
    const permittedText = permittedFacts
      .map((f) => `${f.name} ${f.value}`.toLowerCase())
      .join(' ');

    const detectedClaims = this.extractClaims(jsonString);
    const rejectedClaims: string[] = [];
    const warnings: string[] = [];
    let sanitizedJsonStr = jsonString;

    // 1. Validate extracted numeric & spec claims
    detectedClaims.forEach((claim) => {
      // Check if claim exists in permitted facts text
      const cleanClaim = claim.toLowerCase();
      const isPresent = permittedText.includes(cleanClaim);

      if (!isPresent) {
        // Special check: if it's a numeric runtime claim (e.g. 2-day battery life) and permitted facts don't mention 2-day or battery
        if (cleanClaim.includes('day') || cleanClaim.includes('hour') || cleanClaim.includes('mah')) {
          rejectedClaims.push(`Unsupported battery/runtime claim: "${claim}"`);
        } else if (cleanClaim.includes('gb') || cleanClaim.includes('tb')) {
          rejectedClaims.push(`Unsupported storage capacity claim: "${claim}"`);
        } else {
          rejectedClaims.push(`Unsupported specification claim: "${claim}"`);
        }
      }
    });

    // 2. Validate against prohibited pattern rules & perform sanitization
    for (const rule of PROHIBITED_UNSUPPORTED_PATTERNS) {
      if (rule.pattern.test(sanitizedJsonStr)) {
        // Check if permitted facts explicitly contain any required keyword
        const isAllowedByPermitted = rule.requiresPermittedKeyword?.some((kw) =>
          permittedText.includes(kw.toLowerCase())
        );

        if (!isAllowedByPermitted) {
          sanitizedJsonStr = sanitizedJsonStr.replace(rule.pattern, rule.replacement);
          rejectedClaims.push(`Unsupported ${rule.claimCategory}`);
          warnings.push(`Sanitized unverified claim: replaced with "${rule.replacement}"`);
        }
      }
    }

    let sanitizedOutput = contentObj;
    try {
      sanitizedOutput = JSON.parse(sanitizedJsonStr);
    } catch (e) {
      sanitizedOutput = contentObj;
    }

    // Determine pass status
    // Hard rejection if there are severe unsupported claims (like fake storage capacities, fake battery specs, fake certifications)
    const severeRejections = rejectedClaims.filter(
      (rc) =>
        rc.includes('battery/runtime') ||
        rc.includes('storage capacity') ||
        rc.includes('Certification') ||
        rc.includes('Military Grade') ||
        rc.includes('IP68')
    );

    const passed = severeRejections.length === 0;

    return {
      passed,
      sanitizedOutput,
      detectedClaims,
      rejectedClaims,
      warnings,
      blockReason: passed ? undefined : `Generated content contains unsupported factual claims: ${severeRejections.join('; ')}`
    };
  }
};
