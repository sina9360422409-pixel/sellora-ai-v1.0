import {
  EvidenceSource,
  EvidenceReference,
  NormalizedProductIdentity,
  KnowledgeFact,
  KnowledgeConflict,
  FactVerificationStatus,
  SupportLevel,
  KnowledgeConfidence
} from '../types';

export interface FactEvaluationResult {
  updatedFact: KnowledgeFact;
  evidenceReferences: EvidenceReference[];
  conflicts: KnowledgeConflict[];
}

const SENSITIVE_FACT_PATTERNS = [
  /warranty/i, /guarantee/i, /return policy/i, /shipping/i, /discount/i,
  /review/i, /rating/i, /sold/i, /sales/i, /military-grade/i, /ip68/i,
  /waterproof/i, /battery capacity/i, /medical/i, /safety/i, /certification/i
];

export const factVerificationService = {
  /**
   * Evaluates evidence for a single product fact across evidence sources and identity confidence.
   */
  evaluateFactEvidence(
    fact: KnowledgeFact,
    evidenceSources: EvidenceSource[],
    identity: NormalizedProductIdentity
  ): FactEvaluationResult {
    const evidenceReferences: EvidenceReference[] = [];
    const conflicts: KnowledgeConflict[] = [];

    // Rule: User-provided and image-observed facts retain their tier unless contradicted
    if (fact.provenance === 'USER_PROVIDED') {
      return {
        updatedFact: {
          ...fact,
          verificationStatus: 'VERIFIED',
          lastVerifiedAt: new Date().toISOString()
        },
        evidenceReferences: [],
        conflicts: []
      };
    }

    if (fact.provenance === 'INFERRED' || fact.status === 'INFERRED') {
      return {
        updatedFact: {
          ...fact,
          verificationStatus: 'UNVERIFIED',
          isPermittedForGeneration: false,
          reasonIfNotPermitted: 'AI inferred assumption blocked from factual generation'
        },
        evidenceReferences: [],
        conflicts: []
      };
    }

    // Check if identity status is unconfirmed
    const isIdentityUnconfirmed = identity.identityStatus === 'UNCONFIRMED' || identity.identityConfidence < 40;
    if (isIdentityUnconfirmed && fact.provenance === 'RESEARCHED') {
      return {
        updatedFact: {
          ...fact,
          verificationStatus: 'UNVERIFIED',
          confidence: 'LOW',
          status: 'UNKNOWN',
          isPermittedForGeneration: false,
          reasonIfNotPermitted: 'Product identity could not be confirmed against external sources.'
        },
        evidenceReferences: [],
        conflicts: []
      };
    }

    // Evaluate evidence sources against fact
    const factNameLower = fact.name.toLowerCase();
    const factValueLower = fact.value.toLowerCase();

    const supportingSources: Array<{ source: EvidenceSource; level: SupportLevel; score: number }> = [];
    const conflictingValuesMap = new Map<string, string[]>(); // value -> sourceIds[]

    evidenceSources.forEach((src) => {
      const srcText = `${src.title || ''} ${src.supportingText || ''}`.toLowerCase();
      if (!srcText) return;

      // Determine support level
      let level: SupportLevel = 'INDIRECT';
      let score = src.overallScore;

      const mentionsFactName = srcText.includes(factNameLower);
      const mentionsFactValue = srcText.includes(factValueLower);

      if (mentionsFactName && mentionsFactValue) {
        level = 'DIRECT';
        score += 20;
      } else if (mentionsFactValue || mentionsFactName) {
        level = 'PARTIAL';
      }

      // Check if source explicitly contradicts fact value
      const isContradictory = checkValueContradiction(factNameLower, factValueLower, srcText);
      if (isContradictory.hasContradiction) {
        level = 'CONTRADICTORY';
        score -= 20;
        const list = conflictingValuesMap.get(isContradictory.foundValue) || [];
        list.push(src.id);
        conflictingValuesMap.set(isContradictory.foundValue, list);
      }

      if (level !== 'INDIRECT') {
        supportingSources.push({ source: src, level, score });
        evidenceReferences.push({
          sourceId: src.id,
          factName: fact.name,
          supportLevel: level,
          confidence: Math.min(100, score),
          reasoning: `Source ${src.publisher || src.domain} (${level}) for ${fact.name}`
        });
      }
    });

    // Handle Conflicts
    if (conflictingValuesMap.size > 0) {
      const conflictValues = Array.from(conflictingValuesMap.entries()).map(([val, ids]) => ({
        value: val,
        sourceIds: ids
      }));

      const newConflict: KnowledgeConflict = {
        id: `conflict-${fact.id}-${Date.now()}`,
        field: fact.name,
        userValue: fact.value,
        researchedValue: conflictValues[0]?.value || 'Conflicting research value',
        userProvenance: 'USER_PROVIDED',
        researchedProvenance: 'RESEARCHED',
        description: `Contradictory values found across research sources for ${fact.name}`,
        status: 'OPEN_CONFLICT',
        values: conflictValues
      };

      conflicts.push(newConflict);

      return {
        updatedFact: {
          ...fact,
          verificationStatus: 'CONTRADICTED',
          status: 'CONFLICTING',
          confidence: 'LOW',
          isPermittedForGeneration: false,
          reasonIfNotPermitted: `Contradictory sources found for ${fact.name}`
        },
        evidenceReferences,
        conflicts
      };
    }

    // Determine Verification Status & Multi-source Corroboration
    const directHighAuthSources = supportingSources.filter(
      (s) => s.level === 'DIRECT' && s.source.authorityScore >= 60
    );

    let verificationStatus: FactVerificationStatus = 'UNVERIFIED';
    let confidence: KnowledgeConfidence = fact.confidence || 'LOW';
    let isPermitted = false;
    let reasonIfNotPermitted: string | undefined = undefined;

    // Check sensitive facts rule
    const isSensitive = SENSITIVE_FACT_PATTERNS.some((p) => p.test(`${fact.name} ${fact.value}`));

    if (directHighAuthSources.length >= 2) {
      // Multi-source corroboration boost!
      verificationStatus = 'VERIFIED';
      confidence = 'HIGH';
      isPermitted = true;
    } else if (directHighAuthSources.length === 1) {
      if (isSensitive && directHighAuthSources[0].source.authorityScore < 80) {
        verificationStatus = 'PARTIALLY_VERIFIED';
        confidence = 'MEDIUM';
        isPermitted = false;
        reasonIfNotPermitted = `Sensitive claim (${fact.name}) requires official manufacturer verification before generation.`;
      } else {
        verificationStatus = 'VERIFIED';
        confidence = 'HIGH';
        isPermitted = true;
      }
    } else if (supportingSources.some((s) => s.level === 'PARTIAL')) {
      verificationStatus = 'PARTIALLY_VERIFIED';
      confidence = 'MEDIUM';
      isPermitted = !isSensitive;
      if (!isPermitted) {
        reasonIfNotPermitted = `Unverified claim (${fact.name}) lacks direct evidence source.`;
      }
    } else {
      verificationStatus = 'UNVERIFIED';
      confidence = 'LOW';
      isPermitted = false;
      reasonIfNotPermitted = `No supporting evidence found for ${fact.name}`;
    }

    const primaryEvidence = directHighAuthSources[0]?.source || supportingSources[0]?.source;

    const updatedFact: KnowledgeFact = {
      ...fact,
      verificationStatus,
      confidence,
      isPermittedForGeneration: isPermitted,
      reasonIfNotPermitted,
      lastVerifiedAt: new Date().toISOString(),
      evidence: primaryEvidence ? {
        sourceUrl: primaryEvidence.url,
        sourceTitle: primaryEvidence.title,
        publisher: primaryEvidence.publisher || primaryEvidence.domain,
        sourceType: primaryEvidence.sourceType,
        extractedFact: `${fact.name}: ${fact.value}`,
        retrievedAt: primaryEvidence.retrievedAt,
        confidence,
        relationshipToProduct: identity.identityStatus === 'CONFIRMED' ? 'EXACT_MATCH' : 'HIGHLY_SIMILAR',
        sourceId: primaryEvidence.id,
        authorityScore: primaryEvidence.authorityScore
      } : fact.evidence
    };

    return {
      updatedFact,
      evidenceReferences,
      conflicts
    };
  }
};

function checkValueContradiction(
  factName: string,
  factValue: string,
  sourceText: string
): { hasContradiction: boolean; foundValue: string } {
  // Simple heuristic for numbers or specs e.g. "20 hours" vs "24 hours" or "8GB" vs "12GB"
  const numMatch = factValue.match(/(\d+)\s*([a-z]+)?/i);
  if (numMatch && sourceText.includes(factName)) {
    const valNum = numMatch[1];
    const unit = numMatch[2] || '';
    const srcNumMatch = sourceText.match(new RegExp(`${factName}[^\\d]*(\\d+)\\s*${unit}`, 'i'));
    if (srcNumMatch && srcNumMatch[1] !== valNum) {
      return {
        hasContradiction: true,
        foundValue: `${srcNumMatch[1]} ${unit}`.trim()
      };
    }
  }
  return { hasContradiction: false, foundValue: '' };
}
