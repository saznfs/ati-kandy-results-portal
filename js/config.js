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

  // SLIATE Academic Grading Scale (Section 5.10)
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
    "I(SE)": 0.00,
    "I(CA)": 0.00,
    "INC": 0.00,
    "DFR": 0.00,
    "AB":  0.00,
    "NE":  0.00,
    "*":   0.00
  },

  // Official Section 5.10: Range of Marks & Grade Points
  gradingScale: [
    { range: "85 - 100", grade: "A+", points: 4.00 },
    { range: "70 - 84",  grade: "A",  points: 4.00 },
    { range: "65 - 69",  grade: "A-", points: 3.70 },
    { range: "60 - 64",  grade: "B+", points: 3.30 },
    { range: "55 - 59",  grade: "B",  points: 3.00 },
    { range: "50 - 54",  grade: "B-", points: 2.70 },
    { range: "45 - 49",  grade: "C+", points: 2.30 },
    { range: "40 - 44",  grade: "C",  points: 2.00 },
    { range: "35 - 39",  grade: "C-", points: 1.70 },
    { range: "30 - 34",  grade: "D+", points: 1.30 },
    { range: "25 - 29",  grade: "D",  points: 1.00 },
    { range: "0 - 24",   grade: "E",  points: 0.00 }
  ],

  // Official Section 5.9: Special Grade Descriptions
  specialGradeDescriptions: {
    "I(SE)": "Incomplete: Semester Exam mark < 40 (Assignment Submitted, Exam Repeat Required)",
    "I(CA)": "Incomplete: Continuous Assessment Assignment Not Submitted (Resubmission Required)",
    "INC":   "Incomplete: Assignment Not Submitted & Exam mark < 40 (Both Repeat Required)",
    "DFR":   "Deferred: Absent with Approved / Valid Medical Justification",
    "AB":    "Absent: Absent from examination without valid justification",
    "A+":    "Marks 85 - 100 (Grade Point: 4.00)",
    "A":     "Marks 70 - 84 (Grade Point: 4.00)",
    "A-":    "Marks 65 - 69 (Grade Point: 3.70)",
    "B+":    "Marks 60 - 64 (Grade Point: 3.30)",
    "B":     "Marks 55 - 59 (Grade Point: 3.00)",
    "B-":    "Marks 50 - 54 (Grade Point: 2.70)",
    "C+":    "Marks 45 - 49 (Grade Point: 2.30)",
    "C":     "Marks 40 - 44 (Grade Point: 2.00 - Benchmark Pass)",
    "C-":    "Marks 35 - 39 (Grade Point: 1.70 - Conditional Pass)",
    "D+":    "Marks 30 - 34 (Grade Point: 1.30 - Weak Pass)",
    "D":     "Marks 25 - 29 (Grade Point: 1.00 - Weak Pass)",
    "E":     "Marks 0 - 24 (Grade Point: 0.00 - Fail)"
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
