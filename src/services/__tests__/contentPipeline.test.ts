import { describe, it, expect } from 'vitest';
import { productKnowledgeService } from '../productKnowledgeService';
import { knowledgeQualityGate } from '../knowledgeQualityGate';
import { schemaValidationService } from '../schemaValidationService';
import { promptBuilderService } from '../promptBuilderService';
import { claimValidationService } from '../claimValidationService';
import { PermittedFact, Product, KnowledgeFact } from '../../types';

describe('Production Content Generation Pipeline Integration Tests (Scenarios A-L)', () => {
  // Scenario A: Valid product with verified specifications
  it('Scenario A: Valid product with verified specifications returns permitted facts and generates grounded copy', () => {
    const product: Product = {
      id: 'p-valid-01',
      name: 'Anker PowerBank 20000mAh 65W',
      category: 'Electronics',
      price: 59.99,
      description: 'High capacity portable charger with 65W Power Delivery.',
      features: ['20000mAh battery capacity', '65W USB-C PD fast charging']
    };

    const profile = productKnowledgeService.getOrProfileProduct(product);
    const permitted = productKnowledgeService.getCanonicalPermittedFacts(profile);

    expect(permitted.length).toBeGreaterThan(0);
    const batteryFact = permitted.find((f) => f.name.toLowerCase().includes('battery') || f.value.includes('20000mAh'));
    expect(batteryFact).toBeDefined();

    const systemPrompt = promptBuilderService.buildSystemInstruction(
      permitted,
      profile.unknownFacts || [],
      [],
      'PRODUCT_LISTING',
      'Professional'
    );
    expect(systemPrompt).toContain('20000mAh');
    expect(systemPrompt).toContain('SELLORA HARD FACTUAL FIREWALL RULES');
  });

  // Scenario B: Unverified research result
  it('Scenario B: Unverified research result is excluded from permitted facts and generator context', () => {
    const profile = productKnowledgeService.getOrProfileProduct({
      id: 'p-unverified-01',
      name: 'Generic Earbuds',
      category: 'Audio'
    });

    // Add unverified researched fact
    const unverifiedFact: KnowledgeFact = {
      id: 'f-unverified',
      name: 'Noise Cancellation',
      value: 'Active Noise Cancellation 35dB',
      category: 'Audio',
      provenance: 'RESEARCHED',
      status: 'UNVERIFIED',
      verificationStatus: 'UNVERIFIED',
      confidence: 'LOW',
      evidenceReferences: []
    };
    profile.researchedFacts.push(unverifiedFact);

    const gate = knowledgeQualityGate.evaluate(profile);
    const isIncludedInPermitted = gate.permittedFacts.some((f) => f.id === 'f-unverified');
    expect(isIncludedInPermitted).toBe(false);

    const canonicalPermitted = productKnowledgeService.getCanonicalPermittedFacts(profile);
    expect(canonicalPermitted.some((f) => f.id === 'f-unverified')).toBe(false);
  });

  // Scenario C: Inferred product facts
  it('Scenario C: Inferred facts are blocked from permitted facts and cannot be passed to generator', () => {
    const profile = productKnowledgeService.getOrProfileProduct({
      id: 'p-inferred-01',
      name: 'Wireless Mouse',
      category: 'Accessories'
    });

    const inferredFact: KnowledgeFact = {
      id: 'f-inferred-01',
      name: 'Battery Life',
      value: '2 Years on single AA battery',
      category: 'Power',
      provenance: 'INFERRED',
      status: 'INFERRED',
      confidence: 'LOW',
      evidenceReferences: []
    };
    profile.inferredFacts.push(inferredFact);

    const gate = knowledgeQualityGate.evaluate(profile);
    expect(gate.permittedFacts.some((f) => f.id === 'f-inferred-01')).toBe(false);
    expect(gate.blockedFacts.some((f) => f.id === 'f-inferred-01')).toBe(true);
  });

  // Scenario D: Factual conflict between user and research
  it('Scenario D: Conflicted facts are excluded from permitted facts and context notes open conflict', () => {
    const profile = productKnowledgeService.getOrProfileProduct({
      id: 'p-conflict-01',
      name: 'Running Shoes',
      category: 'Footwear'
    });

    profile.conflicts = [
      {
        id: 'c-01',
        factName: 'Upper Material',
        field: 'Upper Material',
        userValue: 'Leather',
        researchedValue: 'Synthetic Mesh',
        userProvenance: 'USER_PROVIDED',
        researchedProvenance: 'VERIFIED',
        status: 'OPEN_CONFLICT'
      }
    ];

    const gate = knowledgeQualityGate.evaluate(profile);
    expect(gate.unresolvedConflicts.length).toBe(1);

    const systemPrompt = promptBuilderService.buildSystemInstruction(
      gate.permittedFacts as any,
      profile.unknownFacts || [],
      gate.unresolvedConflicts,
      'PRODUCT_LISTING',
      'Professional'
    );
    expect(systemPrompt).toContain('Open conflict on "Upper Material"');
    expect(systemPrompt).toContain('Do NOT choose a single definitive claim');
  });

  // Scenario E: Low identity confidence
  it('Scenario E: Low product identity confidence flags identity UNCONFIRMED and downgrades unevidenced facts', () => {
    const profile = productKnowledgeService.getOrProfileProduct({
      id: 'p-identity-low',
      name: 'Random Unbrand Widget 99X'
    });

    profile.identity.normalizedIdentity.identityStatus = 'UNCONFIRMED';
    profile.identity.normalizedIdentity.identityConfidence = 20;

    const unevidencedResearchedFact: KnowledgeFact = {
      id: 'f-unevidenced',
      name: 'Processor',
      value: 'Octa-core 2.0GHz',
      category: 'Specs',
      provenance: 'RESEARCHED',
      status: 'UNVERIFIED',
      confidence: 'MEDIUM'
    };
    profile.researchedFacts.push(unevidencedResearchedFact);

    const gate = knowledgeQualityGate.evaluate(profile);
    expect(gate.blockedFacts.some((f) => f.id === 'f-unevidenced')).toBe(true);
  });

  // Scenario F: Gemini hallucinated claim
  it('Scenario F: Claim validation layer catches unpermitted hallucinated claims and rejects or sanitizes', () => {
    const permittedFacts: PermittedFact[] = [
      {
        id: 'f-1',
        name: 'Battery',
        value: '5000 mAh',
        provenance: 'USER_PROVIDED',
        verificationStatus: 'USER_PROVIDED',
        confidence: 95,
        evidenceIds: [],
        generationAllowed: true
      }
    ];

    const hallucinatedOutput = {
      title: 'Super Phone Case',
      fullDescription: 'Features aerospace titanium construction and 30-day money-back guarantee.',
      callToAction: 'Buy Now'
    };

    const validation = claimValidationService.validateClaims(hallucinatedOutput, permittedFacts);
    expect(validation.rejectedClaims.length).toBeGreaterThan(0);
    expect(validation.warnings.some((w) => w.includes('Sanitized'))).toBe(true);
    expect(JSON.stringify(validation.sanitizedOutput)).not.toContain('30-day money-back guarantee');
  });

  // Scenario G: Numeric specification mismatch
  it('Scenario G: Numeric claim protection catches fabricated specs like 10000mAh when permitted is 5000mAh', () => {
    const permittedFacts: PermittedFact[] = [
      {
        id: 'f-1',
        name: 'Battery Capacity',
        value: '5000 mAh',
        provenance: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        confidence: 95,
        evidenceIds: [],
        generationAllowed: true
      }
    ];

    const fabricatedOutput = {
      title: 'Ultra Power Bank 10000mAh',
      fullDescription: 'Has 10000 mAh high capacity power.',
      callToAction: 'Shop Now'
    };

    const validation = claimValidationService.validateClaims(fabricatedOutput, permittedFacts);
    expect(validation.detectedClaims).toContain('10000 mah');
    expect(validation.passed).toBe(false);
    expect(validation.rejectedClaims.some((rc) => rc.includes('battery/runtime'))).toBe(true);
  });

  // Scenario H: Prohibited copy patterns (warranty, shipping, rating)
  it('Scenario H: Prohibited copy patterns (2-year warranty, fast worldwide shipping, rated 4.9/5) are sanitized or blocked', () => {
    const permittedFacts: PermittedFact[] = [];

    const prohibitedOutput = {
      title: 'Smart Watch',
      fullDescription: 'Comes with 2-year warranty and fast worldwide shipping. Rated 4.9/5 by 10,000+ happy buyers.',
      callToAction: 'Buy Now'
    };

    const validation = claimValidationService.validateClaims(prohibitedOutput, permittedFacts);
    const sanitizedText = JSON.stringify(validation.sanitizedOutput);

    expect(sanitizedText).not.toContain('2-year warranty');
    expect(sanitizedText).not.toContain('fast worldwide shipping');
    expect(sanitizedText).not.toContain('rated 4.9/5');
    expect(sanitizedText).not.toContain('10,000+ happy buyers');
  });

  // Scenario I: Client tampering (fake verificationStatus / generationAllowed)
  it('Scenario I: Client sending fake verificationStatus or generationAllowed flags is ignored by server-side gate', () => {
    // Client sends an unverified fact with spoofed flags
    const tamperedFact: KnowledgeFact = {
      id: 'f-spoofed',
      name: 'Waterproof',
      value: 'IP68 Waterproof up to 50m',
      provenance: 'RESEARCHED',
      status: 'UNVERIFIED',
      verificationStatus: 'VERIFIED', // Client tried to claim VERIFIED!
      isPermittedForGeneration: true, // Client tried to set true!
      confidence: 'LOW',
      evidenceReferences: []
    };

    const profile = productKnowledgeService.getOrProfileProduct({
      id: 'p-tamper',
      name: 'Watch'
    });
    profile.researchedFacts.push(tamperedFact);

    // Re-evaluate server side Quality Gate
    const gate = knowledgeQualityGate.evaluate(profile);
    const canonicalPermitted = productKnowledgeService.getCanonicalPermittedFacts(profile);

    // Unverified researched fact must remain blocked despite client spoofing
    expect(gate.permittedFacts.some((f) => f.id === 'f-spoofed')).toBe(false);
    expect(canonicalPermitted.some((f) => f.id === 'f-spoofed')).toBe(false);
  });

  // Scenario J: Insufficient product knowledge
  it('Scenario J: Insufficient product knowledge returns safe generic context and appropriate prompt warnings', () => {
    const profile = productKnowledgeService.getOrProfileProduct({
      id: 'p-empty',
      name: 'Minimal Pen'
    });

    const canonicalPermitted = productKnowledgeService.getCanonicalPermittedFacts(profile);
    const systemPrompt = promptBuilderService.buildSystemInstruction(
      canonicalPermitted,
      profile.unknownFacts || [],
      [],
      'PRODUCT_LISTING',
      'Minimal'
    );

    expect(systemPrompt).toContain('SAFE GENERIC FALLBACK');
    expect(systemPrompt).toContain('PERMITTED PRODUCT FACTS');
  });

  // Scenario K: Regeneration request
  it('Scenario K: Regeneration request maintains factual firewall constraints while passing variation seed', () => {
    const inputContract = {
      productId: 'p-regen',
      productContext: { name: 'Eco Bottle', price: 25 },
      permittedFacts: [
        {
          id: 'f-bpa',
          name: 'Material',
          value: 'BPA-Free Tritan',
          provenance: 'USER_PROVIDED' as const,
          verificationStatus: 'USER_PROVIDED' as const,
          confidence: 100,
          evidenceIds: [],
          generationAllowed: true
        }
      ],
      generationConfig: {
        contentType: 'PRODUCT_LISTING' as const,
        tone: 'LUXURY' as const,
        isRegeneration: true,
        variationSeed: 987654321
      }
    };

    const userPrompt = promptBuilderService.buildUserPrompt(inputContract);

    expect(userPrompt).toContain('Regeneration Variation Seed: 987654321');
    expect(userPrompt).toContain('REMINDER: Use ONLY the permitted facts');
  });

  // Scenario L: Schema validation failure
  it('Scenario L: Schema validation service detects missing required fields in model response', () => {
    const invalidListing = {
      // Missing required title and fullDescription!
      shortDescription: 'Only a short description'
    };

    const check = schemaValidationService.validateSchema(invalidListing, 'PRODUCT_LISTING');
    expect(check.valid).toBe(false);
    expect(check.error).toContain('title');
  });
});
