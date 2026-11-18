# 🎓 ATI SLIATE Unofficial Results Portal & Social Share Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Hosting: GitHub Pages](https://img.shields.io/badge/Hosting-GitHub%20Pages-success.svg)](https://pages.github.com/)
[![Web Crypto: AES--256--GCM](https://img.shields.io/badge/Security-AES--256--GCM-emerald.svg)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
[![Zero Build Step](https://img.shields.io/badge/Build-Zero%20Build%20Step-purple.svg)](#)

> [!IMPORTANT]
> **Strict Non-Government Community Disclaimer:**
> This is an **unofficial, student-created community portal** built solely for viewing results easily and generating aesthetic achievement cards for social media. It is **NOT** affiliated with, endorsed by, or connected to the **Sri Lanka Institute of Advanced Technological Education (SLIATE)** or the **Government of Sri Lanka**.
>
> All official examination results, transcripts, grade reports, and academic verifications must be obtained directly from your respective Advanced Technological Institute (ATI) administration or exam department.

---

## 🌟 Overview & Key Features

- **📱 Mobile-First Architecture:** Responsive UI built with pure semantic HTML5, modular CSS3 variables, and vanilla ES6 JavaScript. No heavy frontend frameworks or build steps required.
- **🔒 Zero-Knowledge Static Architecture:**
  - Raw student exam databases are **never** committed or exposed publicly on GitHub.
  - Every student's 4-semester record is individually encrypted using **AES-256-GCM** authenticated encryption with an individual key derived from their Index Number via **PBKDF2** (10,000 rounds).
  - Encrypted file names are hashed using salted **SHA-256**, preventing directory harvesting or student indexing.
  - Client-side decryption runs via the browser's hardware-accelerated **Web Crypto API** (`crypto.subtle`).
- **🛡️ Anti-Abuse Rate Limiting:** Built-in client rate limiting and cooldown timers prevent automated brute-forcing in browser sessions.
- **📊 Complete 4-Semester Academic View:**
  - Instant SGPA calculation for Year 1 Sem 1, Year 1 Sem 2, Year 2 Sem 1, Year 2 Sem 2.
  - Cumulative GPA (CGPA) and SLIATE Academic Honours classification (*First Class, Second Upper, Second Lower, General Pass*).
  - Responsive table on desktop that transforms into stacked grade cards on mobile screens.
- **📄 A4 Vector PDF Certificate Generator:** Client-side vector PDF generation using `jsPDF` & `AutoTable` with watermark and disclaimer.
- **✨ High-Resolution Social Share Generator:**
  - Native HTML5 Canvas export in **9:16 Story** (1080×1920) for Instagram Stories / WhatsApp Status and **1:1 Post** (1080×1080) for LinkedIn / Facebook.
  - 4 aesthetic color themes (*Academic Navy, Emerald Distinction, Royal Onyx, Cyber Crimson*).
  - Privacy toggles: Show/Hide individual subject grades, Show/Hide registration number.
  - Direct sharing via **Web Share API** (`navigator.share`) with instant high-res PNG download fallback.
- **🌓 Light / Dark Mode:** Respects system `prefers-color-scheme` with manual toggle stored in `localStorage`.

---

## 🗂️ Project Directory Structure

```text
ati-results-portal/
├── index.html                  # Main entry point (mobile-first layout)
├── 404.html                    # Clean fallback page for GitHub Pages
├── robots.txt                  # Disallow web search indexing of /data/
├── .gitignore                  # Enforces strict privacy: ignores data/raw/, *.csv, *.xlsx
├── README.md                   # This documentation guide
├── assets/
│   ├── images/
│   │   ├── logo-placeholder.svg  # Default vector academic emblem
│   │   ├── favicon.svg           # Scalable SVG favicon
│   │   └── sliate-logo.png       # (Optional) Drop official SLIATE crest here
│   └── fonts/                    # Optional local typography fallbacks
├── css/
│   ├── variables.css           # Design tokens, light & dark themes, safe-area insets
│   ├── base.css                # CSS reset, accessibility focus rings, container layout
│   ├── components.css          # Cards, semester tabs, search bar, modals, buttons
│   └── mobile.css              # Mobile breakpoints, stacked grade cards, touch targets
├── js/
│   ├── config.js               # Site title, logo paths, cryptographic salt, disclaimers
│   ├── crypto.js               # Client-side SHA-256 hashing & AES-256-GCM decryption
│   ├── security.js             # Input validation, anti-abuse rate limiter, DOM sanitization
│   ├── app.js                  # Main controller, search flow, URL routing, state
│   ├── ui.js                   # Safe DOM rendering (NO innerHTML with untrusted data)
│   ├── pdfGenerator.js         # A4 Vector PDF Certificate generator (jsPDF + AutoTable)
│   └── socialCardGenerator.js  # High-res Canvas generator for 9:16 & 1:1 PNGs + Web Share
├── data/
│   ├── raw/                    # [GITIGNORED] Drop raw semester JSON files here locally
│   │   ├── sample_y1s1.json    # Sample records for Year 1 Semester 1
│   │   ├── sample_y1s2.json    # Sample records for Year 1 Semester 2
│   │   ├── sample_y2s1.json    # Sample records for Year 2 Semester 1
│   │   └── sample_y2s2.json    # Sample records for Year 2 Semester 2
│   └── encrypted/              # [COMMITTED] Hashed filenames with AES-256-GCM encrypted blobs
└── scripts/
    ├── build-data.js           # Zero-dependency Node.js compiler & AES-256-GCM encryptor
    └── build-data.ps1          # Zero-dependency Windows PowerShell / CNG native encryptor
```

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Adding or Swapping the Logo

By default, the application uses an SVG academic emblem (`assets/images/logo-placeholder.svg`).

To add the official or preferred SLIATE crest:
1. Save your image as `assets/images/sliate-logo.png` (transparent PNG, recommended 256×256 px or larger).
2. The portal automatically detects `assets/images/sliate-logo.png`. If not found, it gracefully falls back to `assets/images/logo-placeholder.svg`.
3. To customize the fallback path or image names, edit `js/config.js`:
   ```javascript
   logoPath: "assets/images/sliate-logo.png",
   logoFallback: "assets/images/logo-placeholder.svg",
   ```

---

### Step 2: Preparing and Adding 4-Semester Raw Data

Place your raw examination result files in `data/raw/`. 

> [!CAUTION]
> The `data/raw/` folder and all `*.csv` / `*.xlsx` files are automatically excluded by `.gitignore`. **Never remove `data/raw/` from `.gitignore`** to ensure confidential student lists and spreadsheets are never published to GitHub.

Raw semester files follow this simple JSON structure:

```json
{
  "academicYear": "2021/2022",
  "year": 1,
  "semester": 1,
  "semesterTitle": "Year 1 Semester 1",
  "records": [
    {
      "indexNumber": "AMP/IT/2021/F/0001",
      "registrationNumber": "AMP/IT/2021/0001",
      "name": "K. L. Kasun Perera",
      "campus": "Hardy Advanced Technological Institute, Ampara",
      "campusCode": "AMP",
      "program": "Higher National Diploma in Information Technology",
      "programCode": "IT",
      "courses": [
        { "code": "IT1101", "title": "Personal Computer Applications", "credits": 3, "grade": "A+", "gradePoint": 4.0 },
        { "code": "IT1102", "title": "Computer Hardware & Operating Systems", "credits": 4, "grade": "A", "gradePoint": 4.0 },
        { "code": "IT1103", "title": "Structured Programming", "credits": 4, "grade": "A+", "gradePoint": 4.0 },
        { "code": "IT1104", "title": "Mathematics for Computing", "credits": 3, "grade": "A", "gradePoint": 4.0 },
        { "code": "EN1101", "title": "Technical English I", "credits": 2, "grade": "A-", "gradePoint": 3.7 }
      ]
    }
  ]
}
```

Repeat this for `sample_y1s2.json`, `sample_y2s1.json`, and `sample_y2s2.json`.

---

### Step 3: Compiling and Encrypting Student Records

Run the encryption script to consolidate the 4 semesters, compute SGPA/CGPA, and generate the encrypted JSON files in `data/encrypted/`.

#### Option A: Using Node.js (Zero external npm packages needed)
```bash
node scripts/build-data.js
```

#### Option B: Using Windows PowerShell (Native CNG hardware acceleration)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-data.ps1
```

**What the script does:**
1. Merges subjects across all semesters by matching each student's `indexNumber`.
2. Computes the credit-weighted SGPA and overall CGPA using the SLIATE GPA formula:
   $$\text{GPA} = \frac{\sum (\text{Credits} \times \text{GradePoint})}{\sum \text{Credits}}$$
3. Hashes the student's normalized index with the secret portal salt:
   $$\text{FileHash} = \text{SHA-256}(\text{SALT} + \text{":"} + \text{INDEX})$$
4. Derives a 256-bit AES key via PBKDF2 with 10,000 iterations:
   $$\text{Key} = \text{PBKDF2}(\text{INDEX}, \text{SALT\_KEY}, 10000, 32, \text{SHA-256})$$
5. Encrypts the consolidated payload with AES-256-GCM and writes `data/encrypted/<FileHash>.json`.

---

### Step 4: Testing Locally

Because the application fetches encrypted JSON files from `data/encrypted/`, run a lightweight local HTTP server (browsers restrict `fetch()` on `file:///` URLs due to CORS):

```bash
# Python 3
python -m http.server 8000

# OR Node.js npx
npx serve .

# OR VS Code
# Right-click index.html -> "Open with Live Server"
```

Open `http://localhost:8000` in your web browser.

**Sample indices included for immediate testing:**
- `AMP/IT/2021/F/0001` (First Class Honours, CGPA 3.96)
- `AMP/IT/2021/F/0042` (Second Class Upper, CGPA 3.64)
- `GAL/IT/2021/F/0022` (Second Class Upper, CGPA 3.60)
- `COL/IT/2021/F/0105` (Second Class Lower, CGPA 3.07)
- `KAN/IT/2021/F/0078` (General Pass, CGPA 2.34)

---

### Step 5: Deploying to GitHub Pages

1. **Commit and Push:**
   ```bash
   git add .
   git commit -m "Deploy ATI SLIATE Unofficial Results Portal"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub.
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment**:
     - Source: **Deploy from a branch**
     - Branch: `main` / Folder: `/ (root)`
   - Click **Save**.

3. Your website will be live in minutes at:
   `https://<username>.github.io/<repository-name>/`

---

## 🔒 Security & Privacy Architecture

| Component | Implementation | Purpose |
| :--- | :--- | :--- |
| **Data At Rest** | `data/encrypted/<hash>.json` | Encrypted blobs only. No plaintext student information is hosted. |
| **Lookup Hash** | SHA-256 (`SALT` + `INDEX`) | Prevents indexing, search crawling, or enumeration of student indices. |
| **Cipher** | AES-256-GCM | Authenticated AEAD encryption ensuring both confidentiality and data integrity. |
| **Key Derivation** | PBKDF2 (10,000 iterations) | Derives AES key directly from the student's normalized index. |
| **Web Crawlers** | `robots.txt` | Disallows search engines from indexing `/data/` and `/scripts/`. |
| **XSS Prevention** | Strict DOM Node Creation | Uses `document.createElement`, `textContent`, and safe DOM utilities. Zero `innerHTML` injection of untrusted data. |
| **Anti-Brute Force** | Client Rate Limiting | Enforces a cooldown after multiple rapid queries. |

---

## ⚖️ Legal Notice & Removal Requests

This portal is maintained as an open-source student community initiative. If any student or administration wishes to request correction or removal of an encrypted record, configure your contact email in `js/config.js`:

```javascript
reportIssueEmail: "sliate.community.portal@gmail.com",
reportIssueUrl: "mailto:sliate.community.portal@gmail.com?subject=ATI%20Results%20Portal%20Issue%20or%20Removal%20Request"
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
