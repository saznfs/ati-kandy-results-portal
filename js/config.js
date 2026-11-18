/**
 * ATI SLIATE Unofficial Results Portal - Configuration
 * Centralized site constants, salt, disclaimers, and grading maps.
 */

const CONFIG = {
  // Brand & Identity
  siteTitle: "ATI SLIATE Unofficial Results Portal",
  shortTitle: "ATI Results",
  tagline: "Student Community Results Portal & Social Share Generator",
  version: "1.0.0",

  // Academic Emblem & Logo (Graceful fallback)
  logoPath: "assets/images/sliate-logo.png",
  logoFallback: "assets/images/logo-placeholder.svg",

  // STRICT Non-Government Disclaimer
  disclaimer: "Unofficial portal for viewing and social sharing only. Not affiliated with SLIATE or the Government of Sri Lanka. For official transcripts, contact your ATI administration.",
  pdfDisclaimer: "UNOFFICIAL RESULT STATEMENT - FOR COMMUNITY VIEWING ONLY. Not an official transcript. Not valid for legal, immigration, or government recruitment verification.",
  socialDisclaimer: "Unofficial Student Portal • Not an official SLIATE transcript",

  // Report Issue / Removal Request
  reportIssueEmail: "sliate.community.portal@gmail.com",
  reportIssueUrl: "mailto:sliate.community.portal@gmail.com?subject=ATI%20Results%20Portal%20Inquiry%20or%20Result%20Removal%20Request",

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
    "AMP": "Hardy Advanced Technological Institute, Ampara",
    "COL": "Advanced Technological Institute, Colombo",
    "KAN": "Advanced Technological Institute, Kandy",
    "GAL": "Advanced Technological Institute, Galle (Labuduwa)",
    "KUR": "Advanced Technological Institute, Kurunegala",
    "JAF": "Advanced Technological Institute, Jaffna",
    "BAD": "Advanced Technological Institute, Badulla",
    "TRI": "Advanced Technological Institute, Trincomalee",
    "KEG": "Advanced Technological Institute, Kegalle",
    "DEH": "Advanced Technological Institute, Dehiwala",
    "MAT": "Advanced Technological Institute, Mattakkuliya"
  },

  // Known SLIATE HND Programs
  programNames: {
    "IT": "Higher National Diploma in Information Technology (HNDIT)",
    "AC": "Higher National Diploma in Accountancy (HNDA)",
    "MA": "Higher National Diploma in Management (HNDM)",
    "ENG": "Higher National Diploma in Engineering (HNDE)",
    "THM": "Higher National Diploma in Tourism & Hospitality Management (HNDTHM)",
    "FT": "Higher National Diploma in Food Technology (HNDFT)",
    "QS": "Higher National Diploma in Quantity Surveying (HNDQS)",
    "BA": "Higher National Diploma in Business Administration (HNDBA)"
  }
};

// Freeze config to prevent modification
if (typeof Object.freeze === "function") {
  Object.freeze(CONFIG);
  Object.freeze(CONFIG.gradePoints);
  Object.freeze(CONFIG.campusNames);
  Object.freeze(CONFIG.programNames);
}
