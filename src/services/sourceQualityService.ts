import { EvidenceSource, EvidenceSourceType, ProductMatchLevel } from '../types';

export interface SourceEvaluationInput {
  id?: string;
  url: string;
  title?: string;
  domain?: string;
  publisher?: string;
  retrievedAt?: string;
  supportingText?: string;
  productContext?: {
    brand?: string;
    model?: string;
    productName?: string;
  };
}

// Known reputable domains and category heuristics
const OFFICIAL_PATTERNS = [
  /support\./i, /docs\./i, /manuals?\./i, /developer\./i,
  /\/manual\//i, /\/specifications\//i, /\/specs\//i, /\/support\//i, /\/product\//i, /\/pd\//i
];

const REPUTABLE_RETAILERS = [
  'amazon.com', 'bestbuy.com', 'bhphotovideo.com', 'walmart.com', 'target.com',
  'homedepot.com', 'newegg.com', 'costco.com', 'microcenter.com', 'adorama.com'
];

const REPUTABLE_REVIEW_SOURCES = [
  'rtings.com', 'cnet.com', 'theverge.com', 'wirecutter.com', 'tomsguide.com',
  'gsmarena.com', 'techradar.com', 'dpreview.com', 'anandtech.com', 'engadget.com',
  'rtings.ca', 'consumer-reports.org'
];

const COMMUNITY_SOURCES = [
  'reddit.com', 'quora.com', 'forum', 'community', 'discussions', 'stackexchange.com', 'medium.com'
];

const SPAM_PATTERNS = [
  /best-cheap-deals/i, /coupon/i, /top10-best/i, /scam-check/i, /free-download/i,
  /cheap-online/i, /discount-code/i, /replica/i, /fake-/i, /unverified-deals/i
];

/**
 * Validates whether a given URL is a valid, secure HTTP/HTTPS external web source.
 * Rejects javascript:, data:, file:, local references, malformed URLs, and empty domains.
 */
export function isValidEvidenceUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('blob:')
  ) {
    return false;
  }

  try {
    const fullUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(fullUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname;
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || !hostname.includes('.')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts normalized domain name from a URL string
 */
export function extractDomain(url: string): string {
  try {
    if (!url) return '';
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(cleanUrl);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return url.toLowerCase().split('/')[0].replace(/^www\./, '');
  }
}

/**
 * Strictly verifies whether a domain is an authentic brand domain.
 * Avoids substring false positives like "fake-samsung-example.com" or "samsung-cheap-deals.xyz".
 */
export function isAuthenticBrandDomain(domain: string, brand: string): boolean {
  if (!domain || !brand) return false;
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
  const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!cleanBrand || cleanBrand.length < 2 || cleanBrand === 'generic') {
    return false;
  }

  // Split domain into labels e.g. "support.samsung.com" -> ["support", "samsung", "com"]
  const parts = cleanDomain.split('.');
  if (parts.length < 2) return false;

  // The Second Level Domain (SLD) is the label right before the TLD (e.g. "samsung" in "samsung.com" or "samsung.co.uk")
  // Handle multi-part TLDs like .co.uk, .com.au
  const sldIndex = (parts.length >= 3 && ['co', 'com', 'net', 'org', 'gov'].includes(parts[parts.length - 2]))
    ? parts.length - 3
    : parts.length - 2;

  if (sldIndex < 0) return false;
  const sld = parts[sldIndex];

  // Exact match on SLD, e.g. sld === "samsung" or sld === "sony" or sld === "apple"
  return sld === cleanBrand;
}

export const sourceQualityService = {
  isValidEvidenceUrl,
  extractDomain,

  /**
   * Evaluates a raw web source or grounding item and computes structured quality scores & evidence type.
   */
  evaluateSourceQuality(input: SourceEvaluationInput): EvidenceSource {
    const rawUrl = input.url || '';
    const isValidUrl = isValidEvidenceUrl(rawUrl);

    const domain = input.domain || extractDomain(rawUrl);
    const title = input.title || '';
    const publisher = input.publisher || domain;
    const retrievedAt = input.retrievedAt || new Date().toISOString();
    const supportingText = input.supportingText || '';
    const id = input.id || `src-${Math.abs(hashString(rawUrl || title || Math.random().toString()))}`;

    const brand = input.productContext?.brand?.trim() || '';
    const model = input.productContext?.model?.trim() || '';
    const productName = input.productContext?.productName?.trim() || '';

    // If URL is invalid, malformed, or unsafe scheme (javascript:, data:, file:), reject/downgrade immediately
    if (!isValidUrl && rawUrl) {
      return {
        id,
        url: rawUrl,
        title: title || 'Malformed / Unsafe Source URL',
        domain: domain || 'invalid-domain',
        publisher,
        sourceType: 'UNKNOWN',
        authorityScore: 0,
        relevanceScore: 0,
        freshnessScore: 0,
        reliabilityScore: 0,
        overallScore: 0,
        productMatch: 'MISMATCHED',
        retrievedAt,
        supportingText: 'Rejected: Malformed or unsupported URL scheme'
      };
    }

    // 1. Detect Spam / Unsuitable Sources
    const isSpam = SPAM_PATTERNS.some((pattern) => pattern.test(rawUrl) || pattern.test(title) || pattern.test(domain));
    if (isSpam) {
      return {
        id,
        url: rawUrl,
        title,
        domain,
        publisher,
        sourceType: 'UNKNOWN',
        authorityScore: 10,
        relevanceScore: 10,
        freshnessScore: 50,
        reliabilityScore: 5,
        overallScore: 10,
        productMatch: 'UNKNOWN',
        retrievedAt,
        supportingText
      };
    }

    // 2. Classify Source Type & Compute Authority Score using strict domain matching
    let sourceType: EvidenceSourceType = 'SEARCH_RESULT';
    let authorityScore = 55;

    const domainLower = domain.toLowerCase();
    const urlLower = rawUrl.toLowerCase();
    const titleLower = title.toLowerCase();

    // Strict brand domain check (must match actual SLD, e.g. samsung.com, not fake-samsung-example.com)
    const isBrandDomain = isAuthenticBrandDomain(domainLower, brand);
    const hasOfficialPath = OFFICIAL_PATTERNS.some((p) => p.test(urlLower) || p.test(titleLower));

    if (isBrandDomain && hasOfficialPath) {
      sourceType = 'OFFICIAL_DOCUMENTATION';
      authorityScore = 98;
    } else if (isBrandDomain) {
      sourceType = 'OFFICIAL_MANUFACTURER';
      authorityScore = 95;
    } else if (hasOfficialPath && (domainLower.includes('support') || domainLower.includes('docs'))) {
      sourceType = 'OFFICIAL_DOCUMENTATION';
      authorityScore = 92;
    } else if (REPUTABLE_RETAILERS.some((r) => domainLower === r || domainLower.endsWith('.' + r))) {
      sourceType = 'AUTHORIZED_RETAILER';
      authorityScore = 80;
    } else if (REPUTABLE_REVIEW_SOURCES.some((r) => domainLower === r || domainLower.endsWith('.' + r))) {
      sourceType = 'REVIEW_SOURCE';
      authorityScore = 78;
    } else if (COMMUNITY_SOURCES.some((c) => domainLower === c || domainLower.endsWith('.' + c))) {
      sourceType = 'COMMUNITY_SOURCE';
      authorityScore = 35;
    } else if (publisher && publisher.toLowerCase().includes('official') && isBrandDomain) {
      sourceType = 'OFFICIAL_MANUFACTURER';
      authorityScore = 90;
    } else {
      sourceType = 'SEARCH_RESULT';
      authorityScore = 55;
    }

    // 3. Compute Product Match Level
    let productMatch: ProductMatchLevel = 'UNKNOWN';
    const combinedContent = `${titleLower} ${urlLower} ${supportingText.toLowerCase()}`;

    const cleanModel = model.toLowerCase().trim();
    const hasModel = cleanModel && cleanModel !== 'unknown' && cleanModel !== 'not verified' && cleanModel.length >= 2;

    if (hasModel) {
      if (combinedContent.includes(cleanModel)) {
        productMatch = 'EXACT';
      } else {
        // Check model mismatch
        const modelDigitMatch = cleanModel.match(/^([a-z0-9\s\-]+?)([0-9]+)$/i);
        if (modelDigitMatch) {
          const prefix = modelDigitMatch[1];
          const num = modelDigitMatch[2];
          const regex = new RegExp(`${escapeRegExp(prefix)}([0-9]+)`, 'i');
          const match = combinedContent.match(regex);
          if (match && match[1] !== num) {
            productMatch = 'MISMATCHED';
          }
        }
      }
    }

    if (productMatch === 'UNKNOWN') {
      const cleanBrand = brand.toLowerCase().trim();
      const cleanName = productName.toLowerCase().trim();
      if (cleanBrand && cleanBrand !== 'generic' && combinedContent.includes(cleanBrand)) {
        productMatch = 'HIGH';
      } else if (cleanName && combinedContent.includes(cleanName.slice(0, 10))) {
        productMatch = 'PARTIAL';
      }
    }

    // 4. Compute Relevance Score (0-100)
    let relevanceScore = 50;
    if (productMatch === 'EXACT') relevanceScore = 95;
    else if (productMatch === 'HIGH') relevanceScore = 80;
    else if (productMatch === 'PARTIAL') relevanceScore = 60;
    else if (productMatch === 'MISMATCHED') relevanceScore = 15;

    // 5. Compute Freshness Score
    let freshnessScore = 90;
    if (retrievedAt) {
      const retrievedDate = new Date(retrievedAt).getTime();
      const ageInDays = (Date.now() - retrievedDate) / (1000 * 60 * 60 * 24);
      if (ageInDays > 365) freshnessScore = 60;
      else if (ageInDays > 90) freshnessScore = 75;
    }

    // 6. Compute Reliability Score
    let reliabilityScore = authorityScore;
    if (productMatch === 'MISMATCHED') reliabilityScore = Math.min(20, reliabilityScore);
    if (sourceType === 'COMMUNITY_SOURCE') reliabilityScore = Math.min(45, reliabilityScore);

    // 7. Overall Weighted Score
    const overallScore = Math.round(
      authorityScore * 0.4 +
      relevanceScore * 0.3 +
      reliabilityScore * 0.2 +
      freshnessScore * 0.1
    );

    return {
      id,
      url: rawUrl,
      title: title || domain || 'Web Research Source',
      domain: domain || 'web-source',
      publisher,
      sourceType,
      authorityScore,
      relevanceScore,
      freshnessScore,
      reliabilityScore,
      overallScore,
      productMatch,
      retrievedAt,
      supportingText
    };
  }
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
