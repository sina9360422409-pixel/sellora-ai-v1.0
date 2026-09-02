import { EvidenceSource, EvidenceSourceType } from '../types';

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

export const sourceQualityService = {
  /**
   * Evaluates a raw web source or grounding item and computes structured quality scores & evidence type.
   */
  evaluateSourceQuality(input: SourceEvaluationInput): EvidenceSource {
    const url = input.url || '';
    const domain = input.domain || extractDomain(url);
    const title = input.title || '';
    const publisher = input.publisher || domain;
    const retrievedAt = input.retrievedAt || new Date().toISOString();
    const supportingText = input.supportingText || '';
    const id = input.id || `src-${Math.abs(hashString(url || title || Math.random().toString()))}`;

    const brand = input.productContext?.brand?.toLowerCase().trim() || '';
    const model = input.productContext?.model?.toLowerCase().trim() || '';
    const productName = input.productContext?.productName?.toLowerCase().trim() || '';

    // 1. Detect Spam / Unsuitable Sources
    const isSpam = SPAM_PATTERNS.some((pattern) => pattern.test(url) || pattern.test(title) || pattern.test(domain));
    if (isSpam) {
      return {
        id,
        url,
        title,
        domain,
        publisher,
        sourceType: 'UNKNOWN',
        authorityScore: 10,
        relevanceScore: 10,
        freshnessScore: 50,
        reliabilityScore: 5,
        overallScore: 10,
        retrievedAt,
        supportingText
      };
    }

    // 2. Classify Source Type & Compute Authority Score
    let sourceType: EvidenceSourceType = 'SEARCH_RESULT';
    let authorityScore = 50;

    const domainLower = domain.toLowerCase();
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();

    // Check if domain matches brand name or official brand subdomains
    const isBrandDomain = Boolean(brand && brand !== 'generic' && brand.length > 2 && domainLower.includes(brand.replace(/\s+/g, '')));
    const hasOfficialPath = OFFICIAL_PATTERNS.some((p) => p.test(urlLower) || p.test(titleLower));

    if (isBrandDomain && hasOfficialPath) {
      sourceType = 'OFFICIAL_DOCUMENTATION';
      authorityScore = 98;
    } else if (isBrandDomain) {
      sourceType = 'OFFICIAL_PRODUCT_PAGE';
      authorityScore = 95;
    } else if (hasOfficialPath && (domainLower.includes('support') || domainLower.includes('docs'))) {
      sourceType = 'OFFICIAL_DOCUMENTATION';
      authorityScore = 92;
    } else if (REPUTABLE_RETAILERS.some((r) => domainLower.includes(r))) {
      sourceType = 'AUTHORIZED_RETAILER';
      authorityScore = 80;
    } else if (REPUTABLE_REVIEW_SOURCES.some((r) => domainLower.includes(r))) {
      sourceType = 'REVIEW_SOURCE';
      authorityScore = 78;
    } else if (COMMUNITY_SOURCES.some((c) => domainLower.includes(c) || urlLower.includes(c))) {
      sourceType = 'COMMUNITY_SOURCE';
      authorityScore = 35;
    } else if (publisher && publisher.toLowerCase().includes('official')) {
      sourceType = 'OFFICIAL_MANUFACTURER';
      authorityScore = 90;
    } else {
      sourceType = 'SEARCH_RESULT';
      authorityScore = 55;
    }

    // 3. Compute Relevance Score (0-100)
    let relevanceScore = 50;
    const combinedContent = `${titleLower} ${urlLower} ${supportingText.toLowerCase()}`;

    if (model && model !== 'unknown' && model !== 'not verified' && combinedContent.includes(model)) {
      relevanceScore += 35;
    }
    if (brand && brand !== 'generic' && combinedContent.includes(brand)) {
      relevanceScore += 15;
    }
    if (productName && combinedContent.includes(productName.slice(0, 15))) {
      relevanceScore += 15;
    }
    relevanceScore = Math.min(100, Math.max(20, relevanceScore));

    // 4. Compute Freshness Score (0-100)
    let freshnessScore = 90;
    if (retrievedAt) {
      const retrievedDate = new Date(retrievedAt).getTime();
      const ageInDays = (Date.now() - retrievedDate) / (1000 * 60 * 60 * 24);
      if (ageInDays > 365) {
        freshnessScore = 60;
      } else if (ageInDays > 90) {
        freshnessScore = 75;
      }
    }

    // 5. Compute Reliability Score
    let reliabilityScore = authorityScore;
    if (sourceType === 'COMMUNITY_SOURCE') {
      reliabilityScore = Math.min(45, reliabilityScore);
    }

    // 6. Overall Weighted Score
    const overallScore = Math.round(
      authorityScore * 0.4 +
      relevanceScore * 0.3 +
      reliabilityScore * 0.2 +
      freshnessScore * 0.1
    );

    return {
      id,
      url,
      title,
      domain,
      publisher,
      sourceType,
      authorityScore,
      relevanceScore,
      freshnessScore,
      reliabilityScore,
      overallScore,
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
