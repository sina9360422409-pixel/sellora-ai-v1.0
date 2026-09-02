import { sourceQualityService } from '../sourceQualityService';
import { productIdentityService } from '../productIdentityService';
import { factVerificationService } from '../factVerificationService';
import { knowledgeQualityGate } from '../knowledgeQualityGate';
import { KnowledgeFact, ProductKnowledgeProfile } from '../../types';

console.log('====================================================');
console.log('RUNNING EVIDENCE & SOURCE INTELLIGENCE LAYER TESTS (TEST A - TEST O)');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   Detail: ${detail}`);
  }
}

// ---------------------------------------------------
// TEST A: Exact product + official manufacturer source
// ---------------------------------------------------
{
  const source = sourceQualityService.evaluateSourceQuality({
    url: 'https://support.sony.com/manual/WH-1000XM4/specs',
    title: 'Sony WH-1000XM4 Official Specifications & Manual',
    domain: 'support.sony.com',
    publisher: 'Sony Electronics',
    supportingText: 'Sony WH-1000XM4 Noise Canceling Headphones battery life 30 hours Bluetooth 5.0',
    productContext: { brand: 'Sony', model: 'WH-1000XM4', productName: 'Sony WH-1000XM4 Headphones' }
  });

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', model: 'WH-1000XM4' },
    [source]
  );

  const fact: KnowledgeFact = {
    id: 'f1',
    name: 'Battery Life',
    value: '30 hours',
    category: 'Battery',
    provenance: 'RESEARCHED',
    confidence: 'HIGH',
    status: 'VERIFIED',
    isPermittedForGeneration: true
  };

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [source], identity);

  assert(
    source.sourceType === 'OFFICIAL_DOCUMENTATION' && source.authorityScore >= 90,
    'TEST A1: Official source classified with high authority score',
    `Type: ${source.sourceType}, Authority: ${source.authorityScore}`
  );
  assert(
    identity.identityStatus === 'CONFIRMED' && identity.identityConfidence >= 80,
    'TEST A2: Exact product identity CONFIRMED',
    `Status: ${identity.identityStatus}, Confidence: ${identity.identityConfidence}`
  );
  assert(
    evalRes.updatedFact.verificationStatus === 'VERIFIED' && evalRes.updatedFact.isPermittedForGeneration === true,
    'TEST A3: Fact with official evidence becomes VERIFIED and permitted'
  );
}

// ---------------------------------------------------
// TEST B: Exact product + reputable retailer
// ---------------------------------------------------
{
  const source = sourceQualityService.evaluateSourceQuality({
    url: 'https://www.bestbuy.com/site/sony-wh-1000xm4-wireless-headphones/6408300.p',
    title: 'Sony WH-1000XM4 Wireless Noise-Canceling Headphones - Best Buy',
    publisher: 'Best Buy',
    supportingText: 'Sony WH-1000XM4 battery life 30 hours active noise cancellation',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  assert(
    source.sourceType === 'AUTHORIZED_RETAILER' && source.authorityScore >= 70 && source.authorityScore < 90,
    'TEST B: Reputable retailer classified as AUTHORIZED_RETAILER with medium-high authority',
    `Type: ${source.sourceType}, Authority: ${source.authorityScore}`
  );
}

// ---------------------------------------------------
// TEST C: Similar product but wrong model (Mismatched)
// ---------------------------------------------------
{
  const source = sourceQualityService.evaluateSourceQuality({
    url: 'https://support.sony.com/manual/WH-1000XM5/specs',
    title: 'Sony WH-1000XM5 Official Specifications',
    publisher: 'Sony Electronics',
    supportingText: 'Sony WH-1000XM5 battery life 40 hours',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', model: 'WH-1000XM4' },
    [source]
  );

  const fact: KnowledgeFact = {
    id: 'f3',
    name: 'Battery Life',
    value: '40 hours',
    category: 'Battery',
    provenance: 'RESEARCHED',
    confidence: 'HIGH',
    status: 'VERIFIED',
    isPermittedForGeneration: true
  };

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [source], identity);

  assert(
    source.productMatch === 'MISMATCHED',
    'TEST C1: Source for XM5 evaluated against XM4 target yields MISMATCHED productMatch',
    `ProductMatch: ${source.productMatch}`
  );
  assert(
    evalRes.updatedFact.verificationStatus === 'UNVERIFIED' || evalRes.updatedFact.isPermittedForGeneration === false,
    'TEST C2: Fact from mismatched model source is rejected and blocked'
  );
}

// ---------------------------------------------------
// TEST D: Two reputable sources agree (Corroboration)
// ---------------------------------------------------
{
  const source1 = sourceQualityService.evaluateSourceQuality({
    url: 'https://www.rtings.com/headphones/reviews/sony/wh-1000xm4',
    title: 'Sony WH-1000XM4 Headphones Review - RTINGS.com',
    publisher: 'RTINGS',
    supportingText: 'Sony WH-1000XM4 battery life 30 hours tested',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const source2 = sourceQualityService.evaluateSourceQuality({
    url: 'https://www.cnet.com/reviews/sony-wh-1000xm4-review/',
    title: 'Sony WH-1000XM4 review: CNET',
    publisher: 'CNET',
    supportingText: 'Sony WH-1000XM4 wireless noise canceling battery life 30 hours',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', model: 'WH-1000XM4' },
    [source1, source2]
  );

  const fact: KnowledgeFact = {
    id: 'f4',
    name: 'Battery Life',
    value: '30 hours',
    category: 'Battery',
    provenance: 'RESEARCHED',
    confidence: 'HIGH',
    status: 'VERIFIED',
    isPermittedForGeneration: true
  };

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [source1, source2], identity);

  assert(
    evalRes.updatedFact.verificationStatus === 'VERIFIED' && evalRes.conflicts.length === 0,
    'TEST D: Two agreeing reputable sources trigger multi-source corroboration without conflict'
  );
}

// ---------------------------------------------------
// TEST E: Two reputable sources disagree (OPEN_CONFLICT)
// ---------------------------------------------------
{
  const source1 = sourceQualityService.evaluateSourceQuality({
    url: 'https://www.rtings.com/headphones/reviews/sony/wh-1000xm4',
    title: 'Sony WH-1000XM4 Review',
    publisher: 'RTINGS',
    supportingText: 'Sony WH-1000XM4 battery life 30 hours',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const source2 = sourceQualityService.evaluateSourceQuality({
    url: 'https://www.techradar.com/reviews/sony-wh-1000xm4',
    title: 'Sony WH-1000XM4 Review - TechRadar',
    publisher: 'TechRadar',
    supportingText: 'Sony WH-1000XM4 battery life 20 hours',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', model: 'WH-1000XM4' },
    [source1, source2]
  );

  const fact: KnowledgeFact = {
    id: 'f5',
    name: 'battery life',
    value: '30 hours',
    category: 'Battery',
    provenance: 'RESEARCHED',
    confidence: 'HIGH',
    status: 'VERIFIED',
    isPermittedForGeneration: true
  };

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [source1, source2], identity);

  assert(
    evalRes.conflicts.length > 0 && evalRes.updatedFact.verificationStatus === 'CONTRADICTED',
    'TEST E1: Disagreeing sources trigger OPEN_CONFLICT and CONTRADICTED status'
  );
  assert(
    evalRes.updatedFact.isPermittedForGeneration === false,
    'TEST E2: Contradicted fact is blocked from single-claim generation'
  );
}

// ---------------------------------------------------
// TEST F: Spam/unknown website claims technical spec
// ---------------------------------------------------
{
  const source = sourceQualityService.evaluateSourceQuality({
    url: 'https://best-cheap-deals-blog.com/top10-headphones',
    title: 'Top 10 Best Cheap Headphones Review - Discount Coupon',
    publisher: 'Cheap Deals Blog',
    supportingText: 'Sony WH-1000XM4 military-grade waterproof IP68 rating',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  assert(
    source.authorityScore < 30 && source.overallScore < 30,
    'TEST F: Spam/unknown blog assigned low authority and reliability score',
    `Authority: ${source.authorityScore}, Overall: ${source.overallScore}`
  );
}

// ---------------------------------------------------
// TEST G: User-provided warranty terms
// ---------------------------------------------------
{
  const fact: KnowledgeFact = {
    id: 'f7',
    name: 'Warranty Terms',
    value: '2-Year Manufacturer Limited Warranty',
    category: 'Warranty',
    provenance: 'USER_PROVIDED',
    confidence: 'HIGH',
    status: 'USER_PROVIDED',
    isPermittedForGeneration: true
  };

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Custom Gadget', brand: 'MyBrand' },
    []
  );

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [], identity);

  assert(
    evalRes.updatedFact.provenance === 'USER_PROVIDED' && evalRes.updatedFact.isPermittedForGeneration === true,
    'TEST G: User-provided warranty remains USER_PROVIDED provenance and permitted under user truthfulness rules'
  );
}

// ---------------------------------------------------
// TEST H: AI inferred battery capacity
// ---------------------------------------------------
{
  const fact: KnowledgeFact = {
    id: 'f8',
    name: 'Battery Capacity',
    value: '1000 mAh',
    category: 'Battery',
    provenance: 'INFERRED',
    confidence: 'LOW',
    status: 'INFERRED',
    isPermittedForGeneration: false
  };

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Unknown Widget' },
    []
  );

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [], identity);

  assert(
    evalRes.updatedFact.verificationStatus === 'UNVERIFIED' && evalRes.updatedFact.isPermittedForGeneration === false,
    'TEST H: AI inferred battery capacity is marked UNVERIFIED and blocked from generation'
  );
}

// ---------------------------------------------------
// TEST I: Search returns no reliable product identity
// ---------------------------------------------------
{
  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Super Niche Mystery Item XYZ-99' },
    []
  );

  const queries = productIdentityService.generateResearchQueries({
    productName: 'Super Niche Mystery Item XYZ-99'
  });

  assert(
    identity.identityStatus === 'UNCONFIRMED' && identity.identityConfidence <= 40,
    'TEST I1: No research sources result in UNCONFIRMED product identity status'
  );
  assert(
    queries.length > 0 && queries.some((q) => q.includes('Super Niche Mystery Item XYZ-99')),
    'TEST I2: Dynamic research queries generated gracefully without hardcoded categories'
  );
}

// ---------------------------------------------------
// TEST J: Authoritative source supports a different fact
// ---------------------------------------------------
{
  const source = sourceQualityService.evaluateSourceQuality({
    url: 'https://support.sony.com/manual/WH-1000XM4/specs',
    title: 'Sony WH-1000XM4 Bluetooth Connectivity',
    publisher: 'Sony Electronics',
    supportingText: 'Sony WH-1000XM4 supports Bluetooth 5.0 wireless audio connection',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', model: 'WH-1000XM4' },
    [source]
  );

  // Evaluated fact is Battery Life = 30 hours, but source only discusses Bluetooth 5.0
  const fact: KnowledgeFact = {
    id: 'fj',
    name: 'Battery Life',
    value: '30 hours',
    category: 'Battery',
    provenance: 'RESEARCHED',
    confidence: 'HIGH',
    status: 'VERIFIED',
    isPermittedForGeneration: true
  };

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [source], identity);

  assert(
    evalRes.updatedFact.verificationStatus === 'UNVERIFIED' && evalRes.updatedFact.isPermittedForGeneration === false,
    'TEST J: Authoritative source supporting a DIFFERENT fact does NOT verify an unrelated fact'
  );
}

// ---------------------------------------------------
// TEST K: Grounding returns multiple sources (No first-source fallback)
// ---------------------------------------------------
{
  const source1 = sourceQualityService.evaluateSourceQuality({
    url: 'https://support.sony.com/manual/WH-1000XM4/battery',
    title: 'Sony WH-1000XM4 Battery Details',
    supportingText: 'Battery life 30 hours',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const source2 = sourceQualityService.evaluateSourceQuality({
    url: 'https://support.sony.com/manual/WH-1000XM4/weight',
    title: 'Sony WH-1000XM4 Physical Weight',
    supportingText: 'Weight 254g',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', model: 'WH-1000XM4' },
    [source1, source2]
  );

  const weightFact: KnowledgeFact = {
    id: 'fk',
    name: 'Weight',
    value: '254g',
    category: 'Dimensions',
    provenance: 'RESEARCHED',
    confidence: 'HIGH',
    status: 'VERIFIED',
    isPermittedForGeneration: true
  };

  const evalRes = factVerificationService.evaluateFactEvidence(weightFact, [source1, source2], identity);

  assert(
    evalRes.evidenceReferences.some((ref) => ref.sourceId === source2.id) &&
    !evalRes.evidenceReferences.some((ref) => ref.sourceId === source1.id),
    'TEST K: Fact maps only to the specific relevant source, without fallback to source1'
  );
}

// ---------------------------------------------------
// TEST L: Manufacturer rating vs independent measurement
// ---------------------------------------------------
{
  const source1 = sourceQualityService.evaluateSourceQuality({
    url: 'https://support.sony.com/specs',
    title: 'Sony WH-1000XM4 Official Specifications',
    supportingText: 'Battery life rated up to 30 hours',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const source2 = sourceQualityService.evaluateSourceQuality({
    url: 'https://www.rtings.com/headphones/reviews/sony/wh-1000xm4',
    title: 'RTINGS Review',
    supportingText: 'Battery life measured 24 hours in our lab testing',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', model: 'WH-1000XM4' },
    [source1, source2]
  );

  const fact: KnowledgeFact = {
    id: 'fl',
    name: 'Battery Life',
    value: '30 hours',
    category: 'Battery',
    provenance: 'RESEARCHED',
    confidence: 'HIGH',
    status: 'VERIFIED',
    isPermittedForGeneration: true
  };

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [source1, source2], identity);

  assert(
    evalRes.conflicts.length > 0 && evalRes.conflicts[0].conflictType === 'MEASUREMENT_DIFFERENCE',
    'TEST L: Lab measurement vs manufacturer claim classified as MEASUREMENT_DIFFERENCE',
    `Type: ${evalRes.conflicts[0]?.conflictType}`
  );
}

// ---------------------------------------------------
// TEST M: Client attempts to submit VERIFIED / permitted facts
// ---------------------------------------------------
{
  const clientSubmittedProfile: ProductKnowledgeProfile = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    freshnessTimestamp: Date.now(),
    productId: 'test-pm',
    identity: {
      productName: { id: 'pm1', name: 'Product Name', value: 'Unverified Charger', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true },
      brand: { id: 'pm2', name: 'Brand', value: 'Generic', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true },
      model: { id: 'pm3', name: 'Model', value: 'UNKNOWN', category: 'Identity', provenance: 'UNKNOWN', confidence: 'LOW', status: 'UNKNOWN', isPermittedForGeneration: false },
      category: { id: 'pm4', name: 'Category', value: 'Electronics', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true },
      subcategory: { id: 'pm5', name: 'Subcategory', value: 'Accessories', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true },
      productType: { id: 'pm6', name: 'Product Type', value: 'Charger', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true }
    },
    attributes: {},
    categoryAttributes: {},
    userProvidedFacts: [],
    observedFacts: [],
    researchedFacts: [
      { id: 'client-fake-1', name: 'IP68 Waterproof', value: 'Yes 100 meters', category: 'Specs', provenance: 'RESEARCHED', confidence: 'HIGH', status: 'VERIFIED', isPermittedForGeneration: true }
    ],
    verifiedFacts: [
      { id: 'client-fake-1', name: 'IP68 Waterproof', value: 'Yes 100 meters', category: 'Specs', provenance: 'RESEARCHED', confidence: 'HIGH', status: 'VERIFIED', isPermittedForGeneration: true }
    ],
    inferredFacts: [],
    unknownFacts: [],
    potentialAssumptions: [],
    conflicts: [],
    evidenceSources: [],
    overallConfidenceScore: 90,
    qualityGatePassed: true,
    warnings: [],
    summaryNotes: 'Client claims this is verified'
  };

  const serverEvaluated = knowledgeQualityGate.evaluate(clientSubmittedProfile);

  assert(
    serverEvaluated.permittedFacts.every((f) => f.name !== 'IP68 Waterproof') &&
    serverEvaluated.blockedFacts.some((f) => f.name === 'IP68 Waterproof'),
    'TEST M: Server Quality Gate re-evaluates client payload and blocks unverified IP68 claim'
  );
}

// ---------------------------------------------------
// TEST N: Generated content passed back as evidence is rejected
// ---------------------------------------------------
{
  const generatedSource = sourceQualityService.evaluateSourceQuality({
    url: 'https://sellora.ai/generated-copy/123',
    title: 'Generated Marketing Copy by Sellora AI',
    publisher: 'Sellora AI',
    supportingText: 'Synthetic text generated content battery life 100 hours',
    productContext: { brand: 'Sony', model: 'WH-1000XM4' }
  });

  const identity = productIdentityService.evaluateProductIdentity(
    { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', model: 'WH-1000XM4' },
    [generatedSource]
  );

  const fact: KnowledgeFact = {
    id: 'fn',
    name: 'Battery Life',
    value: '100 hours',
    category: 'Battery',
    provenance: 'RESEARCHED',
    confidence: 'HIGH',
    status: 'VERIFIED',
    isPermittedForGeneration: true
  };

  const evalRes = factVerificationService.evaluateFactEvidence(fact, [generatedSource], identity);

  assert(
    evalRes.updatedFact.verificationStatus === 'UNVERIFIED' && evalRes.updatedFact.isPermittedForGeneration === false,
    'TEST N: Generated content source is rejected as factual evidence'
  );
}

// ---------------------------------------------------
// TEST O: Malformed or unsafe evidence URL
// ---------------------------------------------------
{
  const unsafeSource = sourceQualityService.evaluateSourceQuality({
    url: 'javascript:alert("hacked")',
    title: 'XSS Attack Link',
    supportingText: 'Battery life 50 hours'
  });

  assert(
    sourceQualityService.isValidEvidenceUrl('javascript:alert("hacked")') === false,
    'TEST O1: isValidEvidenceUrl rejects javascript: scheme'
  );
  assert(
    unsafeSource.overallScore === 0 && unsafeSource.productMatch === 'MISMATCHED',
    'TEST O2: Unsafe source downgraded to zero authority and MISMATCHED productMatch'
  );
}

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('====================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
