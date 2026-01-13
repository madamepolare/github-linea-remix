// Mapping of common country names (French) to ISO 3166-1 alpha-2 codes
const COUNTRY_TO_CODE: Record<string, string> = {
  // French names
  "france": "FR",
  "allemagne": "DE",
  "belgique": "BE",
  "suisse": "CH",
  "luxembourg": "LU",
  "italie": "IT",
  "espagne": "ES",
  "portugal": "PT",
  "royaume-uni": "GB",
  "angleterre": "GB",
  "pays-bas": "NL",
  "hollande": "NL",
  "autriche": "AT",
  "pologne": "PL",
  "irlande": "IE",
  "danemark": "DK",
  "suède": "SE",
  "norvège": "NO",
  "finlande": "FI",
  "grèce": "GR",
  "république tchèque": "CZ",
  "tchéquie": "CZ",
  "hongrie": "HU",
  "roumanie": "RO",
  "bulgarie": "BG",
  "croatie": "HR",
  "slovénie": "SI",
  "slovaquie": "SK",
  "estonie": "EE",
  "lettonie": "LV",
  "lituanie": "LT",
  "malte": "MT",
  "chypre": "CY",
  "monaco": "MC",
  "andorre": "AD",
  "états-unis": "US",
  "usa": "US",
  "canada": "CA",
  "mexique": "MX",
  "brésil": "BR",
  "argentine": "AR",
  "chili": "CL",
  "colombie": "CO",
  "pérou": "PE",
  "japon": "JP",
  "chine": "CN",
  "corée du sud": "KR",
  "corée": "KR",
  "inde": "IN",
  "australie": "AU",
  "nouvelle-zélande": "NZ",
  "singapour": "SG",
  "hong kong": "HK",
  "taiwan": "TW",
  "thaïlande": "TH",
  "vietnam": "VN",
  "indonésie": "ID",
  "malaisie": "MY",
  "philippines": "PH",
  "russie": "RU",
  "ukraine": "UA",
  "turquie": "TR",
  "israël": "IL",
  "émirats arabes unis": "AE",
  "arabie saoudite": "SA",
  "qatar": "QA",
  "maroc": "MA",
  "algérie": "DZ",
  "tunisie": "TN",
  "égypte": "EG",
  "afrique du sud": "ZA",
  "nigeria": "NG",
  "kenya": "KE",
  "sénégal": "SN",
  "côte d'ivoire": "CI",
  // English names
  "france ": "FR",
  "germany": "DE",
  "belgium": "BE",
  "switzerland": "CH",
  "italy": "IT",
  "spain": "ES",
  "portugal ": "PT",
  "united kingdom": "GB",
  "uk": "GB",
  "england": "GB",
  "netherlands": "NL",
  "austria": "AT",
  "poland": "PL",
  "ireland": "IE",
  "denmark": "DK",
  "sweden": "SE",
  "norway": "NO",
  "finland": "FI",
  "greece": "GR",
  "czech republic": "CZ",
  "czechia": "CZ",
  "hungary": "HU",
  "romania": "RO",
  "bulgaria": "BG",
  "croatia": "HR",
  "slovenia": "SI",
  "slovakia": "SK",
  "estonia": "EE",
  "latvia": "LV",
  "lithuania": "LT",
  "malta": "MT",
  "cyprus": "CY",
  "united states": "US",
  "mexico": "MX",
  "brazil": "BR",
  "japan": "JP",
  "china": "CN",
  "south korea": "KR",
  "korea": "KR",
  "india": "IN",
  "australia": "AU",
  "new zealand": "NZ",
  "singapore": "SG",
  "thailand": "TH",
  "indonesia": "ID",
  "malaysia": "MY",
  "russia": "RU",
  "turkey": "TR",
  "israel": "IL",
  "uae": "AE",
  "saudi arabia": "SA",
  "morocco": "MA",
  "algeria": "DZ",
  "tunisia": "TN",
  "egypt": "EG",
  "south africa": "ZA",
  "ivory coast": "CI",
};

// ISO country code to flag emoji
const CODE_TO_EMOJI: Record<string, string> = {
  FR: "🇫🇷", DE: "🇩🇪", BE: "🇧🇪", CH: "🇨🇭", LU: "🇱🇺", IT: "🇮🇹", ES: "🇪🇸", PT: "🇵🇹",
  GB: "🇬🇧", NL: "🇳🇱", AT: "🇦🇹", PL: "🇵🇱", IE: "🇮🇪", DK: "🇩🇰", SE: "🇸🇪", NO: "🇳🇴",
  FI: "🇫🇮", GR: "🇬🇷", CZ: "🇨🇿", HU: "🇭🇺", RO: "🇷🇴", BG: "🇧🇬", HR: "🇭🇷", SI: "🇸🇮",
  SK: "🇸🇰", EE: "🇪🇪", LV: "🇱🇻", LT: "🇱🇹", MT: "🇲🇹", CY: "🇨🇾", MC: "🇲🇨", AD: "🇦🇩",
  US: "🇺🇸", CA: "🇨🇦", MX: "🇲🇽", BR: "🇧🇷", AR: "🇦🇷", CL: "🇨🇱", CO: "🇨🇴", PE: "🇵🇪",
  JP: "🇯🇵", CN: "🇨🇳", KR: "🇰🇷", IN: "🇮🇳", AU: "🇦🇺", NZ: "🇳🇿", SG: "🇸🇬", HK: "🇭🇰",
  TW: "🇹🇼", TH: "🇹🇭", VN: "🇻🇳", ID: "🇮🇩", MY: "🇲🇾", PH: "🇵🇭", RU: "🇷🇺", UA: "🇺🇦",
  TR: "🇹🇷", IL: "🇮🇱", AE: "🇦🇪", SA: "🇸🇦", QA: "🇶🇦", MA: "🇲🇦", DZ: "🇩🇿", TN: "🇹🇳",
  EG: "🇪🇬", ZA: "🇿🇦", NG: "🇳🇬", KE: "🇰🇪", SN: "🇸🇳", CI: "🇨🇮",
};

// Pastel colors for each country (based on flag dominant colors)
const CODE_TO_PASTEL: Record<string, string> = {
  FR: "hsl(220, 80%, 92%)", DE: "hsl(0, 0%, 90%)", BE: "hsl(45, 80%, 90%)", CH: "hsl(0, 80%, 92%)",
  LU: "hsl(200, 70%, 90%)", IT: "hsl(140, 60%, 90%)", ES: "hsl(45, 90%, 90%)", PT: "hsl(140, 60%, 90%)",
  GB: "hsl(220, 80%, 92%)", NL: "hsl(20, 90%, 92%)", AT: "hsl(0, 80%, 92%)", PL: "hsl(0, 70%, 92%)",
  IE: "hsl(140, 60%, 90%)", DK: "hsl(0, 80%, 92%)", SE: "hsl(210, 80%, 92%)", NO: "hsl(0, 80%, 92%)",
  FI: "hsl(210, 80%, 92%)", GR: "hsl(210, 70%, 92%)", CZ: "hsl(210, 70%, 92%)", HU: "hsl(0, 70%, 92%)",
  RO: "hsl(210, 70%, 92%)", BG: "hsl(140, 60%, 90%)", HR: "hsl(0, 70%, 92%)", SI: "hsl(210, 70%, 92%)",
  SK: "hsl(210, 70%, 92%)", EE: "hsl(210, 80%, 92%)", LV: "hsl(0, 60%, 90%)", LT: "hsl(50, 80%, 90%)",
  MT: "hsl(0, 70%, 92%)", CY: "hsl(45, 70%, 90%)", MC: "hsl(0, 70%, 92%)", AD: "hsl(210, 70%, 92%)",
  US: "hsl(220, 80%, 92%)", CA: "hsl(0, 80%, 92%)", MX: "hsl(140, 60%, 90%)", BR: "hsl(140, 70%, 90%)",
  AR: "hsl(200, 80%, 92%)", CL: "hsl(210, 80%, 92%)", CO: "hsl(50, 80%, 90%)", PE: "hsl(0, 70%, 92%)",
  JP: "hsl(0, 70%, 95%)", CN: "hsl(0, 80%, 92%)", KR: "hsl(220, 70%, 92%)", IN: "hsl(25, 90%, 92%)",
  AU: "hsl(220, 80%, 92%)", NZ: "hsl(220, 80%, 92%)", SG: "hsl(0, 70%, 92%)", HK: "hsl(0, 70%, 92%)",
  TW: "hsl(210, 70%, 92%)", TH: "hsl(210, 70%, 92%)", VN: "hsl(0, 80%, 92%)", ID: "hsl(0, 70%, 92%)",
  MY: "hsl(210, 70%, 92%)", PH: "hsl(210, 70%, 92%)", RU: "hsl(220, 70%, 92%)", UA: "hsl(50, 80%, 90%)",
  TR: "hsl(0, 80%, 92%)", IL: "hsl(210, 80%, 92%)", AE: "hsl(140, 60%, 90%)", SA: "hsl(140, 70%, 90%)",
  QA: "hsl(0, 60%, 90%)", MA: "hsl(0, 70%, 92%)", DZ: "hsl(140, 70%, 90%)", TN: "hsl(0, 70%, 92%)",
  EG: "hsl(0, 70%, 92%)", ZA: "hsl(140, 60%, 90%)", NG: "hsl(140, 70%, 90%)", KE: "hsl(0, 70%, 92%)",
  SN: "hsl(140, 70%, 90%)", CI: "hsl(25, 90%, 92%)",
};

/**
 * Get ISO country code from country name
 */
export function getCountryCode(country: string | null | undefined): string | null {
  if (!country) return null;
  
  // Check if it's already a valid code
  const upperCode = country.toUpperCase().trim();
  if (upperCode.length === 2 && CODE_TO_EMOJI[upperCode]) {
    return upperCode;
  }
  
  // Normalize and look up
  const normalized = country.toLowerCase().trim();
  return COUNTRY_TO_CODE[normalized] || null;
}

/**
 * Get flag emoji from country name or code
 */
export function getCountryEmoji(country: string | null | undefined): string | null {
  if (!country) return null;
  
  const code = getCountryCode(country);
  if (!code) return null;
  
  return CODE_TO_EMOJI[code] || null;
}

/**
 * Get pastel background color for country
 */
export function getCountryPastelColor(country: string | null | undefined): string {
  if (!country) return "hsl(0, 0%, 94%)";
  
  const code = getCountryCode(country);
  if (!code) return "hsl(0, 0%, 94%)";
  
  return CODE_TO_PASTEL[code] || "hsl(0, 0%, 94%)";
}

/**
 * Extract country from a location string (e.g., "Paris, France" -> "France")
 */
export function extractCountryFromLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  
  // Try to find a comma and take the last part
  const parts = location.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (getCountryCode(lastPart)) {
      return lastPart;
    }
  }
  
  // Check if the whole string is a country
  if (getCountryCode(location)) {
    return location;
  }
  
  return null;
}
