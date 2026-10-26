import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_PRO_PRICE_USD,
  BASE_COMPANY_PRICE_USD,
  MACRO_TIER_DEFINITIONS,
  GLOBAL_PPP_COUNTRIES,
  getPppCountryByCode,
  calculatePppPrice,
  verifyCardBinCountryMatch,
} from './pppPricingUtils.ts';

test('Global PPP: defines 4 macro-economic tiers with proper discount scales', () => {
  assert.equal(MACRO_TIER_DEFINITIONS.tier_1.discountPercent, 0);
  assert.equal(MACRO_TIER_DEFINITIONS.tier_1.proPriceUsd, BASE_PRO_PRICE_USD);
  assert.equal(MACRO_TIER_DEFINITIONS.tier_1.companyPriceUsd, BASE_COMPANY_PRICE_USD);

  assert.equal(MACRO_TIER_DEFINITIONS.tier_2.discountPercent, 25);
  assert.equal(MACRO_TIER_DEFINITIONS.tier_2.proPriceUsd, 14.25);
  assert.equal(MACRO_TIER_DEFINITIONS.tier_2.companyPriceUsd, 749);

  assert.equal(MACRO_TIER_DEFINITIONS.tier_3.discountPercent, 50);
  assert.equal(MACRO_TIER_DEFINITIONS.tier_3.proPriceUsd, 9.5);
  assert.equal(MACRO_TIER_DEFINITIONS.tier_3.companyPriceUsd, 499);

  assert.equal(MACRO_TIER_DEFINITIONS.tier_4.discountPercent, 75);
  assert.equal(MACRO_TIER_DEFINITIONS.tier_4.proPriceUsd, 4.75);
  assert.equal(MACRO_TIER_DEFINITIONS.tier_4.companyPriceUsd, 199);
});

test('Global PPP: contains comprehensive World Bank A-to-Z country coverage', () => {
  assert.ok(GLOBAL_PPP_COUNTRIES.length >= 90);

  const firstCountry = GLOBAL_PPP_COUNTRIES[0];
  assert.equal(firstCountry.code, 'AF');
  assert.equal(firstCountry.name, 'Afghanistan');

  const lastCountry = GLOBAL_PPP_COUNTRIES[GLOBAL_PPP_COUNTRIES.length - 1];
  assert.equal(lastCountry.code, 'ZW');
  assert.equal(lastCountry.name, 'Zimbabwe');
});

test('Global PPP: correctly looks up countries by ISO code', () => {
  const us = getPppCountryByCode('US');
  assert.ok(us);
  assert.equal(us?.name, 'United States');
  assert.equal(us?.macroTier, 'tier_1');

  const brazil = getPppCountryByCode('BR');
  assert.ok(brazil);
  assert.equal(brazil?.name, 'Brazil');
  assert.equal(brazil?.macroTier, 'tier_3');
  assert.equal(brazil?.discountPercent, 40);

  const poland = getPppCountryByCode('PL');
  assert.ok(poland);
  assert.equal(poland?.name, 'Poland');
  assert.equal(poland?.macroTier, 'tier_2');

  const india = getPppCountryByCode('IN');
  assert.ok(india);
  assert.equal(india?.name, 'India');
  assert.equal(india?.macroTier, 'tier_4');

  const fallback = getPppCountryByCode('UNKNOWN_XYZ');
  assert.ok(fallback);
  assert.equal(fallback?.code, 'US');
});

test('Global PPP: calculates localized PPP prices with standard discounts', () => {
  const us = getPppCountryByCode('US')!;
  const usPro = calculatePppPrice(us, 'individual');
  assert.equal(usPro.discountedUsd, 19);
  assert.equal(usPro.discountPercent, 0);

  const usCompany = calculatePppPrice(us, 'company');
  assert.equal(usCompany.discountedUsd, 999);

  const brazil = getPppCountryByCode('BR')!;
  const brazilPro = calculatePppPrice(brazil, 'individual');
  // 40% discount on $19 = $11.40
  assert.equal(brazilPro.discountedUsd, 11.4);
  assert.equal(brazilPro.localCurrencyCode, 'BRL');
  assert.ok(brazilPro.localAmount > 50);
});

test('Global PPP: preserves official India localized pricing (INR 999 / INR 99,999)', () => {
  const india = getPppCountryByCode('IN')!;
  const indiaPro = calculatePppPrice(india, 'individual');
  assert.equal(indiaPro.localAmount, 999);
  assert.equal(indiaPro.localCurrencyCode, 'INR');
  assert.equal(indiaPro.localCurrencySymbol, '₹');
  assert.equal(indiaPro.isSpecialLocalRate, true);

  const indiaCompany = calculatePppPrice(india, 'company');
  assert.equal(indiaCompany.localAmount, 99999);
  assert.equal(indiaCompany.localCurrencyCode, 'INR');
  assert.equal(indiaCompany.isSpecialLocalRate, true);
});

test('Global PPP: validates card BIN to prevent regional cross-border exploitation', () => {
  // US card buying in US -> match
  const validUS = verifyCardBinCountryMatch('411111', 'US', 'US');
  assert.equal(validUS.isValidMatch, true);
  assert.equal(validUS.isVpnDetected, false);

  // US card trying to claim India PPP discount -> mismatch
  const exploitedIN = verifyCardBinCountryMatch('411111', 'IN', 'IN');
  assert.equal(exploitedIN.isValidMatch, false);
  assert.equal(exploitedIN.detectedCountryCode, 'US');
  assert.ok(exploitedIN.statusMessage.includes('Region mismatch'));

  // Indian card in India -> match
  const validIN = verifyCardBinCountryMatch('400000', 'IN', 'IN');
  assert.equal(validIN.isValidMatch, true);

  // Brazilian card in Brazil -> match
  const validBR = verifyCardBinCountryMatch('520000', 'BR', 'BR');
  assert.equal(validBR.isValidMatch, true);
});

test('Global PPP: verifies subscription.json structure and tier data', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const jsonPath = path.resolve(process.cwd(), 'subscription.json');
  assert.ok(fs.existsSync(jsonPath), 'subscription.json should exist');

  const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.equal(content.strategy, 'Purchasing Power Parity (PPP)');
  assert.equal(content.referenceBasePriceUsd, 10.0);
  assert.ok(content.tiers.tier_1);
  assert.ok(content.tiers.tier_2);
  assert.ok(content.tiers.tier_3);
  assert.ok(content.tiers.tier_4);
  assert.ok(content.tiers.tier_1.countries.includes('United States'));
  assert.ok(content.tiers.tier_4.countries.includes('India'));
});

test('Global PPP: verifies subscription.md documentation exists and covers all tiers', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const mdPath = path.resolve(process.cwd(), 'subscription.md');
  assert.ok(fs.existsSync(mdPath), 'subscription.md should exist');

  const content = fs.readFileSync(mdPath, 'utf8');
  assert.ok(content.includes('Global Subscription Pricing Tiers'));
  assert.ok(content.includes('Tier 1: Full Price'));
  assert.ok(content.includes('Tier 2: Regional Discount'));
  assert.ok(content.includes('Tier 3: Emerging Markets'));
  assert.ok(content.includes('Tier 4: Parity Pricing'));
  assert.ok(content.includes('Anti-Exploitation & Fraud Prevention Policy'));
});
