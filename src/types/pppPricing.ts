export type MacroEconomicTier = 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';

export type WorldBankCategory = 'High Income' | 'Upper-Middle' | 'Lower-Middle' | 'Low Income';

export interface PppCountryData {
  code: string;
  name: string;
  flag: string;
  annualIncomeGni: string;
  economicTier: WorldBankCategory;
  macroTier: MacroEconomicTier;
  discountPercent: number; // e.g. 0, 25, 50, 75, 85
  currencyCode: string;
  currencySymbol: string;
  exchangeRateToUsd: number; // e.g. 1 USD = 86.5 INR, 5.5 BRL, 0.92 EUR
  strategyNote: string;
}

export interface MacroTierDefinition {
  id: MacroEconomicTier;
  name: string;
  label: string;
  discountPercent: number;
  proPriceUsd: number;
  companyPriceUsd: number;
  description: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  sampleCountries: string[];
}

export interface CardBinVerificationResult {
  cardBin: string;
  detectedCountryCode: string;
  ipCountryCode: string;
  isValidMatch: boolean;
  isVpnDetected: boolean;
  statusMessage: string;
}
