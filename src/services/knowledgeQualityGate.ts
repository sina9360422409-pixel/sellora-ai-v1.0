import {
  ProductKnowledgeProfile,
  KnowledgeFact,
  QualityGateResult,
  KnowledgeConflict
} from '../types';

const PROHIBITED_UNVERIFIED_PATTERNS: { pattern: RegExp; term: string; category: string }[] = [
  { pattern: /warranty/i, term: 'warranty terms', category: 'Guarantee/Warranty' },
  { pattern: /guarantee/i, term: 'money-back guarantee', category: 'Guarantee/Warranty' },
  { pattern: /30-day/i, term: '30-day trial/return', category: 'Return Policy' },
  { pattern: /return policy/i, term: 'return policy details', category: 'Return Policy' },
  { pattern: /shipping time/i, term: 'shipping time promises', category: 'Shipping' },
  { pattern: /worldwide shipping/i, term: 'worldwide shipping claim', category: 'Shipping' },
  { pattern: /same-day dispatch/i, term: 'same-day dispatch', category: 'Shipping' },
  { pattern: /discount/i, term: 'unverified discount percentage', category: 'Pricing' },
  { pattern: /reviews/i, term: 'fake review count', category: 'Social Proof' },
  { pattern: /ratings/i, term: 'fake star rating', category: 'Social Proof' },
  { pattern: /sold/i, term: 'fake sales volume statistics', category: 'Social Proof' },
  { pattern: /military-grade/i, term: 'military-grade rating', category: 'Spec Claim' },
  { pattern: /ip68/i, term: 'IP68 waterproof rating', category: 'Spec Claim' },
  { pattern: /magsafe/i, term: 'MagSafe compatibility', category: 'Spec Claim' },
  { pattern: /medical/i, term: 'medical/health claim', category: 'Safety Claim' }
];

export const knowledgeQualityGate = {
  /**
   * Evaluates a Product Knowledge Profile against Sellora's Quality Gate rules.
   * Filters out unverified, conflicting, or low-confidence facts before content generation.
   */
  evaluate(profile: ProductKnowledgeProfile): QualityGateResult {
    const permittedFacts: KnowledgeFact[] = [];
    const blockedFacts: KnowledgeFact[] = [];
    const warnings: string[] = [];
    const prohibitedClaimsDetected: string[] = [];

    // Collect all facts across all categories & provenance tiers
    const allFacts: KnowledgeFact[] = [
      ...profile.userProvidedFacts,
      ...profile.observedFacts,
      ...profile.verifiedFacts,
      ...profile.researchedFacts,
      ...profile.inferredFacts,
      ...profile.potentialAssumptions
    ];

    // Build a map of user-provided and verified text for ground-truth validation
    const groundTruthText = profile.userProvidedFacts
      .map((f) => `${f.name} ${f.value}`.toLowerCase())
      .concat(profile.verifiedFacts.map((f) => `${f.name} ${f.value}`.toLowerCase()))
      .join(' ');

    // Open conflicts ledger
    const unresolvedConflicts: KnowledgeConflict[] = (profile.conflicts || []).filter(
      (c) => c.status === 'OPEN_CONFLICT'
    );

    if (unresolvedConflicts.length > 0) {
      unresolvedConflicts.forEach((c) => {
        warnings.push(`Open conflict in field "${c.field}": User says "${c.userValue}", research says "${c.researchedValue}". Flagged for review.`);
      });
    }

    // Process each fact strictly
    allFacts.forEach((fact) => {
      let permitted = true;
      let blockReason = '';

      // Rule 1: INFERRED facts must NEVER silently pass as verified
      if (fact.provenance === 'INFERRED' || fact.status === 'INFERRED') {
        permitted = false;
        blockReason = 'AI inferred assumption blocked from factual generation';
      }

      // Rule 2: Low confidence facts without authoritative evidence are blocked
      else if (fact.confidence === 'LOW' && !fact.evidence?.sourceUrl) {
        permitted = false;
        blockReason = 'Low confidence fact without verified source evidence';
      }

      // Rule 3: Conflicting facts cannot make definitive single claims
      else if (unresolvedConflicts.some((c) => c.field.toLowerCase() === fact.name.toLowerCase())) {
        permitted = false;
        blockReason = `Unresolved conflict in field "${fact.name}"`;
      }

      // Rule 4: Prohibited fabricated claims
      else {
        for (const item of PROHIBITED_UNVERIFIED_PATTERNS) {
          if (item.pattern.test(`${fact.name} ${fact.value}`)) {
            const isExplicitInUserOrVerified = groundTruthText.includes(item.term.toLowerCase()) ||
              (fact.provenance === 'USER_PROVIDED' || (fact.provenance === 'VERIFIED' && Boolean(fact.evidence?.sourceUrl)));

            if (!isExplicitInUserOrVerified) {
              permitted = false;
              blockReason = `Unverified ${item.category} claim (${item.term}) blocked by Quality Gate`;
              if (!prohibitedClaimsDetected.includes(item.term)) {
                prohibitedClaimsDetected.push(item.term);
              }
              break;
            }
          }
        }
      }

      const updatedFact: KnowledgeFact = {
        ...fact,
        isPermittedForGeneration: permitted,
        reasonIfNotPermitted: permitted ? undefined : blockReason
      };

      if (permitted) {
        // Prevent duplicate permitted facts
        const isDuplicate = permittedFacts.some(
          (p) => p.name.toLowerCase() === updatedFact.name.toLowerCase() && p.value.toLowerCase() === updatedFact.value.toLowerCase()
        );
        if (!isDuplicate) {
          permittedFacts.push(updatedFact);
        }
      } else {
        blockedFacts.push(updatedFact);
      }
    });

    // Compute Quality Gate Score (0-100)
    let qualityScore = 100;
    if (unresolvedConflicts.length > 0) qualityScore -= unresolvedConflicts.length * 15;
    if (prohibitedClaimsDetected.length > 0) qualityScore -= prohibitedClaimsDetected.length * 10;
    if (profile.unknownFacts.length > 0) qualityScore -= Math.min(20, profile.unknownFacts.length * 4);
    qualityScore = Math.max(20, Math.min(100, qualityScore));

    const passed = qualityScore >= 60 && unresolvedConflicts.length === 0;

    if (profile.unknownFacts.length > 0) {
      warnings.push(`${profile.unknownFacts.length} product specifications remain unknown and will be handled defensively.`);
    }

    return {
      passed,
      permittedFacts,
      blockedFacts,
      unresolvedConflicts,
      warnings,
      qualityScore,
      prohibitedClaimsDetected
    };
  }
};
