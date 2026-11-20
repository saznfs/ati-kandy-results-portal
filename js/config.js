/**
 * ATI SLIATE Unofficial Results Portal - Configuration
 * Centralized site constants, salt, disclaimers, and grading maps.
 */

const CONFIG = {
  // Brand & Identity
  siteTitle: "SLIATE KANDY Results Portal",
  shortTitle: "SLIATE KANDY",
  tagline: "Results Portal & Social Card Generator",
  version: "1.0.0",

  // Academic Emblem & Logo (Graceful fallback)
  logoPath: "assets/images/sliate-logo.png",
  logoFallback: "assets/images/logo-placeholder.svg",

  // Portal text
  disclaimer: "SLIATE KANDY Results Portal.",
  pdfDisclaimer: "SLIATE KANDY - Examination Result Statement",
  socialDisclaimer: "SLIATE KANDY",

  // Report Issue / Removal Request
  reportIssueEmail: "sazninfs@gmail.com",
  reportIssueUrl: "mailto:sazninfs@gmail.com?subject=SLIATE%20Kandy%20Results%20Portal%20-%20Issue%20or%20Result%20Removal%20Request",

  // Security & Web Crypto Salt (Matches scripts/build-data.js)
  salt: "SLIATE_ATI_COMMUNITY_KEY_SALT_2026_SECURE",

  // Rate Limiting settings
  rateLimit: {
    maxAttempts: 6,
    windowMs: 60 * 1000,      // 1 minute window
    cooldownMs: 30 * 1000     // 30 seconds lockout after exceeding
  },

  // SLIATE Academic Grading Scale
  gradePoints: {
    "A+": 4.00,
    "A":  4.00,
    "A-": 3.70,
    "B+": 3.30,
    "B":  3.00,
    "B-": 2.70,
    "C+": 2.30,
    "C":  2.00,
    "C-": 1.70,
    "D+": 1.30,
    "D":  1.00,
    "E":  0.00,
    "NE": 0.00
  },

  // Academic Honours Classification
  honoursClass: [
    { minCgpa: 3.70, title: "First Class Honours", badgeClass: "standing-first-class" },
    { minCgpa: 3.30, title: "Second Class (Upper Division)", badgeClass: "standing-second-upper" },
    { minCgpa: 3.00, title: "Second Class (Lower Division)", badgeClass: "standing-second-lower" },
    { minCgpa: 2.00, title: "General Pass", badgeClass: "standing-general-pass" },
    { minCgpa: 0.00, title: "Referred / Incomplete", badgeClass: "standing-referred" }
  ],

  // Known ATI Campuses
  campusNames: {
    "AMP": "SLIATE Ampara",
    "COL": "SLIATE Colombo",
    "KAN": "SLIATE Kandy",
    "GAL": "SLIATE Galle",
    "KUR": "SLIATE Kurunegala",
    "JAF": "SLIATE Jaffna",
    "BAD": "SLIATE Badulla",
    "TRI": "SLIATE Trincomalee",
    "KEG": "SLIATE Kegalle",
    "DEH": "SLIATE Dehiwala",
    "MAT": "SLIATE Mattakkuliya"
  },

  // Known SLIATE HND Programs (Short Form)
  programNames: {
    "IT": "HNDIT",
    "AC": "HNDA",
    "MA": "HNDM",
    "ENG": "HNDE",
    "THM": "HNDTHM",
    "FT": "HNDFT",
    "QS": "HNDQS",
    "BA": "HNDBA"
  }
};

// Freeze config to prevent modification
if (typeof Object.freeze === "function") {
  Object.freeze(CONFIG);
  Object.freeze(CONFIG.gradePoints);
  Object.freeze(CONFIG.campusNames);
  Object.freeze(CONFIG.programNames);
}
