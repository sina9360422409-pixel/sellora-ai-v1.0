import { Type, Schema } from '@google/genai';
import { NormalizedGenerationContentType } from '../types';

/**
 * Gemini response schemas for structured output generation.
 */
export const listingResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Product listing title grounded in permitted facts' },
    shortDescription: { type: Type.STRING, description: 'Concise product summary' },
    sellingPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key factual selling points'
    },
    fullDescription: { type: Type.STRING, description: 'Detailed marketing description' },
    seoKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Relevant SEO search keywords'
    },
    callToAction: { type: Type.STRING, description: 'Conversion call to action' },
    // Backward compatibility fields
    bulletPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Factual bullet points'
    },
    keyFeatures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key features'
    }
  },
  required: ['title', 'shortDescription', 'fullDescription', 'callToAction']
};

export const socialResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hook: { type: Type.STRING, description: 'Social hook phrase' },
    caption: { type: Type.STRING, description: 'Social media post caption' },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Hashtags for social post'
    },
    callToAction: { type: Type.STRING, description: 'Social call to action' }
  },
  required: ['hook', 'caption', 'callToAction']
};

export const adResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'Ad headline' },
    primaryText: { type: Type.STRING, description: 'Main advertisement body text' },
    benefits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key benefits'
    },
    callToAction: { type: Type.STRING, description: 'Ad call to action' }
  },
  required: ['headline', 'primaryText', 'callToAction']
};

export const replyResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    response: { type: Type.STRING, description: 'Recommended customer reply' },
    politeAlternative: { type: Type.STRING, description: 'Alternative polite option' }
  },
  required: ['response']
};

export const imagePromptResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    style: { type: Type.STRING },
    aspectRatio: { type: Type.STRING },
    prompt: { type: Type.STRING, description: 'Commercial photo generation prompt' },
    negativePrompt: { type: Type.STRING },
    lighting: { type: Type.STRING },
    background: { type: Type.STRING },
    composition: { type: Type.STRING }
  },
  required: ['prompt']
};

export const schemaValidationService = {
  /**
   * Gets the appropriate Gemini responseSchema for a normalized content type.
   */
  getSchemaForType(contentType: NormalizedGenerationContentType | string): Schema {
    const norm = String(contentType).toUpperCase();
    if (norm === 'PRODUCT_LISTING' || norm === 'LISTING') return listingResponseSchema;
    if (norm === 'SOCIAL_CONTENT' || norm === 'SOCIAL') return socialResponseSchema;
    if (norm === 'ADVERTISEMENT' || norm === 'AD') return adResponseSchema;
    if (norm === 'CUSTOMER_REPLY' || norm === 'REPLY') return replyResponseSchema;
    if (norm === 'PRODUCT_IMAGE' || norm === 'IMAGE') return imagePromptResponseSchema;
    return listingResponseSchema;
  },

  /**
   * Validates structured output from Gemini against required schema contracts.
   */
  validateSchema(
    data: any,
    contentType: NormalizedGenerationContentType | string
  ): { valid: boolean; error?: string; normalizedData?: any } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Output is not a valid JSON object' };
    }

    const norm = String(contentType).toUpperCase();

    if (norm === 'PRODUCT_LISTING' || norm === 'LISTING') {
      if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
        return { valid: false, error: 'Missing or invalid "title" field in listing output' };
      }
      if (!data.fullDescription || typeof data.fullDescription !== 'string') {
        return { valid: false, error: 'Missing "fullDescription" in listing output' };
      }
      // Populate normalized fields
      const sellingPoints = Array.isArray(data.sellingPoints)
        ? data.sellingPoints
        : Array.isArray(data.bulletPoints)
        ? data.bulletPoints
        : Array.isArray(data.keyFeatures)
        ? data.keyFeatures
        : [];
      
      const normalizedData = {
        title: data.title.trim(),
        shortDescription: data.shortDescription || data.title.trim(),
        sellingPoints,
        fullDescription: data.fullDescription.trim(),
        seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords : [],
        callToAction: data.callToAction || 'Shop Now',
        bulletPoints: sellingPoints,
        keyFeatures: sellingPoints
      };
      return { valid: true, normalizedData };
    }

    if (norm === 'SOCIAL_CONTENT' || norm === 'SOCIAL') {
      if (!data.caption || typeof data.caption !== 'string') {
        return { valid: false, error: 'Missing "caption" field in social output' };
      }
      const normalizedData = {
        hook: data.hook || data.caption.slice(0, 50),
        caption: data.caption.trim(),
        hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        callToAction: data.callToAction || 'Learn More'
      };
      return { valid: true, normalizedData };
    }

    if (norm === 'ADVERTISEMENT' || norm === 'AD') {
      if (!data.headline || typeof data.headline !== 'string') {
        return { valid: false, error: 'Missing "headline" field in ad output' };
      }
      if (!data.primaryText || typeof data.primaryText !== 'string') {
        return { valid: false, error: 'Missing "primaryText" field in ad output' };
      }
      const normalizedData = {
        headline: data.headline.trim(),
        primaryText: data.primaryText.trim(),
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
        callToAction: data.callToAction || 'Buy Now'
      };
      return { valid: true, normalizedData };
    }

    if (norm === 'CUSTOMER_REPLY' || norm === 'REPLY') {
      const responseText = data.response || data.recommendedReply;
      if (!responseText || typeof responseText !== 'string') {
        return { valid: false, error: 'Missing "response" field in customer reply output' };
      }
      const normalizedData = {
        response: responseText.trim(),
        recommendedReply: responseText.trim(),
        politeAlternative: data.politeAlternative || responseText.trim()
      };
      return { valid: true, normalizedData };
    }

    if (norm === 'PRODUCT_IMAGE' || norm === 'IMAGE') {
      if (!data.prompt || typeof data.prompt !== 'string') {
        return { valid: false, error: 'Missing "prompt" field in image generation output' };
      }
      const normalizedData = {
        style: data.style || 'Studio',
        aspectRatio: data.aspectRatio || '1:1',
        prompt: data.prompt.trim(),
        negativePrompt: data.negativePrompt || 'blurry, low quality',
        lighting: data.lighting || 'Studio lighting',
        background: data.background || 'Clean neutral background',
        composition: data.composition || 'Centered product shot'
      };
      return { valid: true, normalizedData };
    }

    return { valid: true, normalizedData: data };
  }
};
