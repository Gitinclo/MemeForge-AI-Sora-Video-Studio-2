# Global Subscription Pricing Tiers

> **Strategy:** Purchasing Power Parity (PPP)  
> **Base Reference Price (Tier 1):** $10.00 / month (USA Anchor)  
> **MemeForge Studio Anchor:** $19.00 / month (Creator Pro) • $999.00 / month (Team Enterprise)  
> **India Dedicated Anchor:** ₹999 / month (Creator Pro) • ₹99,999 / month (Enterprise + 18% GST)  
> **Primary Datasets & Tooling:**
> - [datasets/ppp](https://github.com/datasets/ppp): Raw Purchasing Power Parity dataset from the World Bank.
> - [iosdevmax/ppp-pricing](https://github.com/iosdevmax/ppp-pricing): Automated regional pricing calculator for App Store & Google Play.
> - [zachleat/parity-purchasing-power-price](https://github.com/zachleat/parity-purchasing-power-price): Parity purchasing web component for localized client pricing.

---

## 🟢 Tier 1: Full Price (100%)
- **Reference Price:** $10.00 USD / month  
- **MemeForge Pro:** $19.00 USD / month  
- **MemeForge Enterprise:** $999.00 USD / month  
- **Discount:** 0%  
- **Target Markets:** High purchasing power & stable currencies.
  - Australia
  - Austria
  - Belgium
  - Canada
  - Denmark
  - Finland
  - France
  - Germany
  - Iceland
  - Ireland
  - Israel
  - Japan
  - Luxembourg
  - Netherlands
  - New Zealand
  - Norway
  - Qatar
  - Singapore
  - South Korea
  - Sweden
  - Switzerland
  - United Arab Emirates
  - United Kingdom
  - United States

---

## 🟡 Tier 2: Regional Discount (20% – 30% OFF)
- **Reference Price:** ~$7.00 – $8.00 USD / month  
- **MemeForge Pro:** $14.25 USD / month (25% discount)  
- **MemeForge Enterprise:** $749.00 USD / month  
- **Discount Range:** 20% – 30% OFF  
- **Target Markets:** Strong economies with slightly lower disposable income or regional price sensitivity.
  - Bahamas
  - Chile
  - Costa Rica
  - Croatia
  - Czechia
  - Estonia
  - Greece
  - Hungary
  - Italy
  - Kuwait
  - Latvia
  - Lithuania
  - Malaysia
  - Panama
  - Poland
  - Portugal
  - Saudi Arabia
  - Slovakia
  - Slovenia
  - Spain
  - Taiwan
  - Uruguay

---

## 🟠 Tier 3: Emerging Markets (40% – 60% OFF)
- **Reference Price:** ~$4.00 – $6.00 USD / month  
- **MemeForge Pro:** $9.50 USD / month (50% discount)  
- **MemeForge Enterprise:** $499.00 USD / month  
- **Discount Range:** 40% – 60% OFF  
- **Target Markets:** Developing economies with growing tech sectors but lower currency strength.
  - Albania
  - Armenia
  - Azerbaijan
  - Brazil
  - Bulgaria
  - China
  - Colombia
  - Dominican Republic
  - Ecuador
  - Georgia
  - Indonesia
  - Kazakhstan
  - Maldives
  - Mexico
  - Moldova
  - Montenegro
  - Peru
  - Philippines
  - Romania
  - Serbia
  - South Africa
  - Thailand
  - Turkey
  - Vietnam

---

## 🔴 Tier 4: Parity Pricing (70% – 85% OFF)
- **Reference Price:** ~$2.00 – $3.00 USD / month  
- **MemeForge Pro:** $4.75 USD / month (75% discount)  
- **MemeForge Enterprise:** $199.00 USD / month  
- **India Creator Pro:** ₹999 INR / month (~$11.50 with instant UPI AutoPay)  
- **India Team Enterprise:** ₹99,999 INR / month (~50 seats + B2B GST invoice)  
- **Discount Range:** 70% – 85% OFF or Localized Micro-Pricing  
- **Target Markets:** High volume, price-sensitive markets where localized pricing is essential for conversion.
  - Afghanistan
  - Algeria
  - Bangladesh
  - Bolivia
  - Cambodia
  - Cameroon
  - Egypt
  - Ghana
  - India
  - Jordan
  - Kenya
  - Kyrgyzstan
  - Morocco
  - Nepal
  - Nigeria
  - Pakistan
  - Sri Lanka
  - Tunisia
  - Ukraine
  - Uzbekistan
  - Zambia

---

## 🛡️ Anti-Exploitation & Fraud Prevention Policy
To protect localized purchasing power parity rates from VPN arbitrage and unauthorized cross-border purchases:
1. **Card BIN Matching:** The customer's credit/debit card issuing bank BIN (first 6 digits) must match the country of the selected localized tier.
2. **GeoIP Cross-Validation:** IP address location (MaxMind GeoIP) is cross-checked against billing address and issuing country.
3. **Fallback Policy:** If a card issued in a Tier 1 country (e.g. US, UK) attempts to checkout using Tier 3 or Tier 4 parity pricing, the system automatically falls back to standard Tier 1 pricing.
