import {
  EvidenceSource,
  EvidenceReference,
  NormalizedProductIdentity,
  KnowledgeFact,
  KnowledgeConflict,
  FactVerificationStatus,
  SupportLevel,
  SupportStrength,
  EvidenceType,
  ConflictType,
  ResolutionStatus,
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

    // Rule: User-provided facts retain their tier unless contradicted
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
    const factNameLower = fact.name.toLowerCase().trim();
    const factValueLower = fact.value.toLowerCase().trim();

    const supportingSources: Array<{ source: EvidenceSource; level: SupportLevel; strength: SupportStrength; score: number }> = [];
    const conflictingValuesMap = new Map<string, Array<{ source: EvidenceSource; foundValue: string; conflictType: ConflictType }>>();

    evidenceSources.forEach((src) => {
      // Rejection of Generated Content as Evidence:
      // Never allow Sellora-generated copy, AI outputs, or synthetic text as factual evidence.
      const rawText = `${src.title || ''} ${src.url || ''} ${src.publisher || ''} ${src.supportingText || ''}`.toLowerCase();
      if (
        rawText.includes('generated content') ||
        rawText.includes('sellora ai') ||
        rawText.includes('synthetic text')
      ) {
        return; // Ignore generated content as evidence
      }

      // Reject sources with mismatched product model
      if (src.productMatch === 'MISMATCHED') {
        return;
      }

      const srcText = `${src.title || ''} ${src.supportingText || ''}`.toLowerCase();
      if (!srcText) return;

      // Determine support level and claim relevance
      let level: SupportLevel = 'INDIRECT';
      let strength: SupportStrength = 'NONE';
      let score = src.overallScore;

      const mentionsFactName = srcText.includes(factNameLower) || containsKeyKeywords(srcText, factNameLower);
      const mentionsFactValue = srcText.includes(factValueLower) || containsKeyKeywords(srcText, factValueLower);

      if (mentionsFactName && mentionsFactValue) {
        level = 'DIRECT';
        strength = src.authorityScore >= 75 ? 'STRONG' : 'MODERATE';
        score += 20;
      } else if (mentionsFactValue) {
        level = 'PARTIAL';
        strength = 'WEAK';
      }

      // Check if source explicitly contradicts fact value or has measurement differences
      const contradictionCheck = checkValueContradiction(factNameLower, factValueLower, srcText);
      if (contradictionCheck.hasContradiction) {
        level = 'CONTRADICTORY';
        strength = 'NONE';
        score -= 20;
        const list = conflictingValuesMap.get(contradictionCheck.foundValue) || [];
        list.push({ source: src, foundValue: contradictionCheck.foundValue, conflictType: contradictionCheck.conflictType });
        conflictingValuesMap.set(contradictionCheck.foundValue, list);
      }

      if (level !== 'INDIRECT' && level !== 'CONTRADICTORY') {
        supportingSources.push({ source: src, level, strength, score });
        
        let evidenceType: EvidenceType = 'OTHER';
        if (src.sourceType === 'OFFICIAL_DOCUMENTATION') evidenceType = 'TECHNICAL_DOCUMENTATION';
        else if (src.sourceType === 'OFFICIAL_MANUFACTURER') evidenceType = 'DIRECT_SPECIFICATION';
        else if (src.sourceType === 'AUTHORIZED_RETAILER') evidenceType = 'PRODUCT_PAGE';
        else if (src.sourceType === 'REPUTABLE_REVIEW') evidenceType = 'REVIEW_TEST';
        else if (src.sourceType === 'REPUTABLE_DATABASE') evidenceType = 'DATABASE_RECORD';

        evidenceReferences.push({
          sourceId: src.id,
          factName: fact.name,
          supportingText: src.supportingText,
          evidenceType,
          supportStrength: strength,
          productMatch: src.productMatch,
          createdAt: new Date().toISOString(),
          supportLevel: level,
          confidence: Math.min(100, score),
          reasoning: `Source ${src.publisher || src.domain} (${level}, ${strength}) for ${fact.name}`
        });
      }
    });

    // Handle Conflicts
    if (conflictingValuesMap.size > 0) {
      const allConflictEntries: Array<{ value: string; sourceId: string; authorityScore: number; relevanceScore: number }> = [];
      let primaryConflictType: ConflictType = 'DIRECT_CONTRADICTION';

      conflictingValuesMap.forEach((items, foundVal) => {
        items.forEach((item) => {
          allConflictEntries.push({
            value: foundVal,
            sourceId: item.source.id,
            authorityScore: item.source.authorityScore,
            relevanceScore: item.source.relevanceScore
          });
          if (item.conflictType) primaryConflictType = item.conflictType;
        });
      });

      const newConflict: KnowledgeConflict = {
        id: `conflict-${fact.id}-${Date.now()}`,
        factName: fact.name,
        field: fact.name,
        userValue: fact.value,
        researchedValue: allConflictEntries[0]?.value || 'Conflicting value',
        userProvenance: 'USER_PROVIDED',
        researchedProvenance: 'RESEARCHED',
        description: `Contradictory values or measurement differences found across research sources for ${fact.name}`,
        status: 'OPEN_CONFLICT',
        conflictType: primaryConflictType,
        resolutionStatus: 'OPEN',
        values: allConflictEntries
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

function containsKeyKeywords(text: string, phrase: string): boolean {
  const words = phrase.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return false;
  const matches = words.filter((w) => text.includes(w));
  return matches.length / words.length >= 0.7;
}

function checkValueContradiction(
  factName: string,
  factValue: string,
  sourceText: string
): { hasContradiction: boolean; foundValue: string; conflictType: ConflictType } {
  // Simple heuristic for numbers or specs e.g. "20 hours" vs "24 hours" or "8GB" vs "12GB"
  const numMatch = factValue.match(/(\d+)\s*([a-z]+)?/i);
  if (numMatch && sourceText.includes(factName)) {
    const valNum = numMatch[1];
    const unit = numMatch[2] || '';
    const srcNumMatch = sourceText.match(new RegExp(`${escapeRegExp(factName)}[^\\d]*(\\d+)\\s*${unit}`, 'i'));
    if (srcNumMatch && srcNumMatch[1] !== valNum) {
      // Check if source uses testing/measurement language
      const isMeasurement = /tested|testing|in our tests|real-world|measured/i.test(sourceText);
      return {
        hasContradiction: true,
        foundValue: `${srcNumMatch[1]} ${unit}`.trim(),
        conflictType: isMeasurement ? 'MEASUREMENT_DIFFERENCE' : 'DIRECT_CONTRADICTION'
      };
    }
  }
  return { hasContradiction: false, foundValue: '', conflictType: 'UNRESOLVED' };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
