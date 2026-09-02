import { EvidenceSource, NormalizedProductIdentity, ProductKnowledgeProfile } from '../types';

export interface ResearchCacheEntry {
  key: string;
  timestamp: number;
  version: number;
  sources: EvidenceSource[];
  identity: NormalizedProductIdentity;
  profile?: ProductKnowledgeProfile;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 Hour TTL

export class ResearchCacheEngine {
  private cache = new Map<string, { entry: ResearchCacheEntry; expiresAt: number }>();

  /**
   * Builds a normalized, deterministic research cache key from product identity attributes.
   */
  public buildCacheKey(identity: {
    brand?: string;
    productName?: string;
    model?: string;
    variant?: string;
  }): string {
    const brand = (identity.brand || 'generic').toLowerCase().replace(/[^a-z0-9]/g, '');
    const model = (identity.model || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '');
    const name = (identity.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '');
    const variant = (identity.variant || 'default').toLowerCase().replace(/[^a-z0-9]/g, '');

    return `research-v1-${brand}-${model}-${name.slice(0, 20)}-${variant}`;
  }

  /**
   * Retrieves a cached research entry if valid and unexpired.
   */
  public get(key: string): ResearchCacheEntry | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.entry;
  }

  /**
   * Stores research sources and profile in cache with TTL.
   */
  public set(key: string, entry: ResearchCacheEntry, ttlMs: number = DEFAULT_TTL_MS): void {
    this.cache.set(key, {
      entry,
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * Clears all cached research data.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current cache size.
   */
  public size(): number {
    return this.cache.size;
  }
}

export const researchCacheService = new ResearchCacheEngine();
