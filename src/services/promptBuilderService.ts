import { PermittedFact, GenerationInputContract, NormalizedGenerationContentType } from '../types';

export const promptBuilderService = {
  /**
   * Builds system instruction for the Gemini generation model enforcing the hard factual firewall.
   */
  buildSystemInstruction(
    permittedFacts: PermittedFact[],
    unknownFacts: Array<{ name: string; reason?: string }>,
    conflicts: Array<{ field: string; userValue?: string; researchedValue?: string; description?: string }>,
    contentType: NormalizedGenerationContentType | string,
    tone: string,
    campaignGoal?: string
  ): string {
    // Compact factual context - ONLY permitted facts
    let permittedContext = '';
    if (permittedFacts && permittedFacts.length > 0) {
      permittedContext = permittedFacts
        .map((f) => `- [${f.provenance}] ${f.name}: ${f.value}`)
        .join('\n');
    } else {
      permittedContext = '- No external permitted facts available. Rely strictly on explicit user product context.';
    }

    let unknownContext = '';
    if (unknownFacts && unknownFacts.length > 0) {
      unknownContext = unknownFacts
        .map((u) => `- ${u.name}: UNKNOWN (${u.reason || 'Not verified'}). Do NOT claim or fabricate.`)
        .join('\n');
    } else {
      unknownContext = '- Warranty terms, return policy, shipping timelines, lab IP ratings, and exact sales numbers are UNKNOWN. Do NOT fabricate.';
    }

    let conflictContext = '';
    if (conflicts && conflicts.length > 0) {
      conflictContext = conflicts
        .map((c) => `- Open conflict on "${c.field}": User says "${c.userValue}", Research says "${c.researchedValue}". Do NOT choose a single definitive claim.`)
        .join('\n');
    } else {
      conflictContext = 'No open factual conflicts.';
    }

    return `You are Sellora AI's Professional Content Generation Model.
You operate under Sellora's Hard Factual Firewall & Zero-Hallucination Policy.

SELLORA HARD FACTUAL FIREWALL RULES (STRICTLY ENFORCED):
1. USE ONLY PERMITTED FACTS: Every factual statement (numbers, materials, specs, dimensions, weights, battery capacities, compatibilities, certifications) MUST be directly present in the PERMITTED PRODUCT FACTS below.
2. NEVER INVENT SPECIFICATIONS: Do not invent aerospace materials, water resistance ratings, drop protection, wireless protocols, or technical specs.
3. NEVER INVENT CERTIFICATIONS OR STANDARDS: Do not claim CE, FDA, FCC, IP68, or MIL-STD certification unless explicitly present in permitted facts.
4. NEVER INVENT WARRANTY OR RETURN TERMS: Do not promise 2-year warranty, 30-day trial, or money-back guarantee unless explicitly in permitted facts.
5. NEVER INVENT SHIPPING TIMELINES OR DISCOUNTS: Do not claim worldwide express shipping, 24-hour dispatch, or unverified discount percentages.
6. NEVER INVENT REVIEWS OR SOCIAL PROOF: Do not claim "rated 4.9/5", "10,000+ happy customers", or fake user testimonials.
7. NEVER CLAIM MEDICAL OR SAFETY BENEFITS: Do not invent health, medical, safety, or clinical benefits.
8. NEVER CONVERT UNCERTAINTY INTO CERTAINTY: If a specification is listed under UNKNOWN FACTS, either omit it or use safe generic marketing language.
9. SAFE GENERIC FALLBACK: If insufficient facts exist, use persuasive, high-quality generic marketing copy (e.g., "designed to elevate your daily routine") rather than fabricating technical details.
10. NO REVERSE EVIDENCE: The generated content is NOT evidence and must not cite itself.

AUTHORITATIVE PERMITTED PRODUCT FACTS:
${permittedContext}

UNKNOWN SPECIFICATIONS (STRICTLY PROHIBITED FROM FABRICATION):
${unknownContext}

OPEN CONFLICTS (DO NOT MAKE SINGLE DEFINITIVE CLAIMS):
${conflictContext}

REQUESTED TONE: "${tone}"
CAMPAIGN GOAL: "${campaignGoal || 'General Marketing'}"
CONTENT TYPE: "${contentType}"

You MUST output strictly valid JSON conforming to the requested schema for contentType "${contentType}".`;
  },

  /**
   * Builds the user prompt for content generation.
   */
  buildUserPrompt(input: GenerationInputContract): string {
    const ctx = input.productContext;
    const cfg = input.generationConfig;

    const formattedPrice = typeof ctx.price === 'number'
      ? `${ctx.currency || '$'}${ctx.price.toFixed(2)}`
      : `${ctx.currency || '$'}${ctx.price || '0.00'}`;

    let prompt = `Generate ${String(cfg.contentType).toUpperCase()} copy for:
- Product Name: ${ctx.name}
- Category: ${ctx.category || 'General'}
- Price: ${formattedPrice}
- Description: ${ctx.description || 'N/A'}
- Features: ${ctx.features ? ctx.features.join(', ') : 'N/A'}
- USP: ${ctx.usp || 'N/A'}
- Target Audience: ${ctx.targetAudience || 'General'}

REQUESTED CONFIGURATION:
- Tone: ${cfg.tone}
- Campaign Goal: ${cfg.campaignGoal || 'More Sales'}`;

    if (cfg.platform) {
      prompt += `\n- Target Platform: ${cfg.platform}`;
    }
    if (cfg.customerInquiry) {
      prompt += `\n- Customer Inquiry: "${cfg.customerInquiry}"`;
    }
    if (cfg.specialInstructions && cfg.specialInstructions.trim()) {
      prompt += `\n- Special Instructions: "${cfg.specialInstructions.trim()}"`;
    }
    if (cfg.isRegeneration) {
      prompt += `\n- Regeneration Variation Seed: ${cfg.variationSeed || Date.now()}`;
    }

    prompt += `\n\nREMINDER: Use ONLY the permitted facts. Do NOT invent specifications, warranties, certifications, shipping promises, or ratings. Output strictly valid JSON.`;

    return prompt;
  }
};
