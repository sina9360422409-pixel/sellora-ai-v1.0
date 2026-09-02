import { sourceQualityService } from '../sourceQualityService';
import { productIdentityService } from '../productIdentityService';
import { factVerificationService } from '../factVerificationService';
import { knowledgeQualityGate } from '../knowledgeQualityGate';
import { KnowledgeFact, ProductKnowledgeProfile } from '../../types';

console.log('====================================================');
console.log('RUNNING EVIDENCE & SOURCE INTELLIGENCE LAYER TESTS');
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
// TEST CASE 1: Exact product + official manufacturer source
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
    'Test 1a: Official source classified with high authority score',
    `Type: ${source.sourceType}, Authority: ${source.authorityScore}`
  );
  assert(
    identity.identityStatus === 'CONFIRMED' && identity.identityConfidence >= 80,
    'Test 1b: Exact product identity CONFIRMED',
    `Status: ${identity.identityStatus}, Confidence: ${identity.identityConfidence}`
  );
  assert(
    evalRes.updatedFact.verificationStatus === 'VERIFIED' && evalRes.updatedFact.isPermittedForGeneration === true,
    'Test 1c: Fact with official evidence becomes VERIFIED and permitted'
  );
}

// ---------------------------------------------------
// TEST CASE 2: Exact product + reputable retailer
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
    'Test 2: Reputable retailer classified as AUTHORIZED_RETAILER with medium-high authority',
    `Type: ${source.sourceType}, Authority: ${source.authorityScore}`
  );
}

// ---------------------------------------------------
// TEST CASE 3: Similar product but wrong model
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
    identity.identityStatus === 'UNCONFIRMED' || identity.identityStatus === 'AMBIGUOUS',
    'Test 3a: Wrong model source results in UNCONFIRMED or AMBIGUOUS identity',
    `Status: ${identity.identityStatus}`
  );
  assert(
    evalRes.updatedFact.verificationStatus === 'UNVERIFIED' || evalRes.updatedFact.isPermittedForGeneration === false,
    'Test 3b: Fact from mismatched model source is rejected or unverified'
  );
}

// ---------------------------------------------------
// TEST CASE 4: Two reputable sources agree
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
    'Test 4: Two agreeing reputable sources trigger multi-source corroboration without conflict'
  );
}

// ---------------------------------------------------
// TEST CASE 5: Two reputable sources disagree (OPEN_CONFLICT)
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
    supportingText: 'Sony WH-1000XM4 battery life 24 hours in our testing',
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
    'Test 5a: Disagreeing sources trigger OPEN_CONFLICT and CONTRADICTED status',
    `Conflicts: ${evalRes.conflicts.length}`
  );
  assert(
    evalRes.updatedFact.isPermittedForGeneration === false,
    'Test 5b: Contradicted fact is blocked from single-claim generation'
  );
}

// ---------------------------------------------------
// TEST CASE 6: Unknown blog makes technical claim
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
    'Test 6: Spammy / unknown blog assigned low authority and reliability score',
    `Authority: ${source.authorityScore}, Overall: ${source.overallScore}`
  );
}

// ---------------------------------------------------
// TEST CASE 7: User-provided warranty
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
    evalRes.updatedFact.verificationStatus === 'VERIFIED' && evalRes.updatedFact.isPermittedForGeneration === true,
    'Test 7: User-provided warranty fact remains permitted under user truthfulness rules'
  );
}

// ---------------------------------------------------
// TEST CASE 8: AI inferred battery capacity
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
    'Test 8: AI inferred battery capacity is marked UNVERIFIED and blocked from generation'
  );
}

// ---------------------------------------------------
// TEST CASE 9: Search returns no reliable product identity
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
    'Test 9a: No research sources result in UNCONFIRMED product identity status',
    `Status: ${identity.identityStatus}, Confidence: ${identity.identityConfidence}`
  );
  assert(
    queries.length > 0 && queries.some((q) => q.includes('Super Niche Mystery Item XYZ-99')),
    'Test 9b: Dynamic research queries generated gracefully without hardcoded categories'
  );
}

// ---------------------------------------------------
// TEST CASE 10: Existing content generation via Quality Gate
// ---------------------------------------------------
{
  const profile: ProductKnowledgeProfile = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    freshnessTimestamp: Date.now(),
    productId: 'test-p10',
    identity: {
      productName: { id: 'p1', name: 'Product Name', value: 'Anker PowerBank 10K', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true },
      brand: { id: 'p2', name: 'Brand', value: 'Anker', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true },
      model: { id: 'p3', name: 'Model', value: 'A1229', category: 'Identity', provenance: 'VERIFIED', confidence: 'HIGH', status: 'VERIFIED', isPermittedForGeneration: true },
      category: { id: 'p4', name: 'Category', value: 'Electronics', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true },
      subcategory: { id: 'p5', name: 'Subcategory', value: 'Power Banks', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true },
      productType: { id: 'p6', name: 'Product Type', value: 'Charger', category: 'Identity', provenance: 'USER_PROVIDED', confidence: 'HIGH', status: 'USER_PROVIDED', isPermittedForGeneration: true }
    },
    attributes: {},
    categoryAttributes: {},
    userProvidedFacts: [],
    observedFacts: [],
    researchedFacts: [],
    verifiedFacts: [
      { id: 'vf1', name: 'Capacity', value: '10000 mAh', category: 'Battery', provenance: 'VERIFIED', confidence: 'HIGH', status: 'VERIFIED', isPermittedForGeneration: true, evidence: { retrievedAt: new Date().toISOString(), confidence: 'HIGH', sourceUrl: 'https://anker.com/specs' } }
    ],
    inferredFacts: [],
    unknownFacts: [],
    potentialAssumptions: [],
    conflicts: [],
    evidenceSources: [],
    overallConfidenceScore: 90,
    qualityGatePassed: true,
    warnings: [],
    summaryNotes: 'Ready for generation'
  };

  const gateResult = knowledgeQualityGate.evaluate(profile);

  assert(
    gateResult.passed === true && gateResult.permittedFacts.length > 0,
    'Test 10: Verified profile passes Quality Gate and yields permitted facts for content pipeline'
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
