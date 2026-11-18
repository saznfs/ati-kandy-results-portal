#!/usr/bin/env node

/**
 * ATI SLIATE Unofficial Results Portal - Data Encryptor & Compiler
 * Merges raw 4-semester result datasets, computes SGPAs & CGPA,
 * and securely encrypts individual student records using AES-256-GCM.
 *
 * ZERO EXTERNAL NPM DEPENDENCIES:
 * Uses Node.js built-in `crypto`, `fs`, and `path`.
 *
 * Usage:
 *   node scripts/build-data.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Configuration (Must strictly match js/config.js)
const CONFIG = {
  salt: "SLIATE_ATI_COMMUNITY_KEY_SALT_2026_SECURE",
  pbkdf2Iterations: 10000,
  keyLengthBytes: 32, // 256-bit AES
  ivLengthBytes: 12,  // 96-bit standard for AES-GCM
  rawDir: path.join(__dirname, "..", "data", "raw"),
  encryptedDir: path.join(__dirname, "..", "data", "encrypted"),
  gradePoints: {
    "A+": 4.00, "A": 4.00, "A-": 3.70,
    "B+": 3.30, "B": 3.00, "B-": 2.70,
    "C+": 2.30, "C": 2.00, "C-": 1.70,
    "D+": 1.30, "D": 1.00, "E": 0.00,
    "I(SE)": 0.00, "I(CA)": 0.00, "DFR": 0.00,
    "AB": 0.00, "INC": 0.00, "NE": 0.00, "*": 0.00
  }
};

/**
 * Normalizes index number (trimmed, uppercase, single spaces removed)
 */
function normalizeIndex(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Derives the SHA-256 filename hash:
 * filename = SHA-256(SALT + ":" + NORMALIZED_INDEX) + ".json"
 */
function computeFileHash(normalizedIndex) {
  return crypto
    .createHash("sha256")
    .update(`${CONFIG.salt}:${normalizedIndex}`, "utf8")
    .digest("hex");
}

/**
 * Derives 256-bit AES-GCM key from normalized index using PBKDF2
 */
function deriveKey(normalizedIndex) {
  const saltBuf = Buffer.from(`${CONFIG.salt}_KEY`, "utf8");
  return crypto.pbkdf2Sync(
    normalizedIndex,
    saltBuf,
    CONFIG.pbkdf2Iterations,
    CONFIG.keyLengthBytes,
    "sha256"
  );
}

/**
 * Encrypts student data object with AES-256-GCM
 */
function encryptStudentRecord(studentObj, normalizedIndex) {
  const key = deriveKey(normalizedIndex);
  const iv = crypto.randomBytes(CONFIG.ivLengthBytes);

  const jsonString = JSON.stringify(studentObj);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(jsonString, "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    v: 1,
    iv: iv.toString("hex"),
    tag: authTag.toString("hex"),
    data: ciphertext.toString("hex")
  };
}

/**
 * Main Compiler & Encryptor Process
 */
function buildData() {
  console.log("==========================================================");
  console.log("🎓 ATI SLIATE Results Portal - Data Encryptor & Compiler");
  console.log("==========================================================\n");

  if (!fs.existsSync(CONFIG.rawDir)) {
    console.error(`❌ Raw data directory not found: ${CONFIG.rawDir}`);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.encryptedDir)) {
    fs.mkdirSync(CONFIG.encryptedDir, { recursive: true });
  }

  // 1. Scan and read raw semester JSON files
  const rawFiles = fs.readdirSync(CONFIG.rawDir).filter(f => f.endsWith(".json"));
  if (rawFiles.length === 0) {
    console.warn(`⚠️ No .json files found in ${CONFIG.rawDir}. Please add semester JSON files.`);
    process.exit(0);
  }

  console.log(`📁 Found ${rawFiles.length} raw semester file(s): ${rawFiles.join(", ")}`);

  // Map of student index -> consolidated student object
  const studentsMap = new Map();

  // Read each semester file
  rawFiles.sort().forEach(file => {
    const filePath = path.join(CONFIG.rawDir, file);
    try {
      const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const records = fileData.records || [];
      const year = fileData.year || 1;
      const semNumber = fileData.semester || 1;
      const semTitle = fileData.semesterTitle || `Year ${year} Semester ${semNumber}`;

      records.forEach(rec => {
        const normIndex = normalizeIndex(rec.indexNumber);
        if (!normIndex) return;

        if (!studentsMap.has(normIndex)) {
          studentsMap.set(normIndex, {
            indexNumber: normIndex,
            registrationNumber: rec.registrationNumber || rec.regNo || "",
            name: rec.name || "Student",
            campus: rec.campus || "Hardy Advanced Technological Institute, Ampara",
            campusCode: rec.campusCode || normIndex.split(/[\/\-]/)[0] || "AMP",
            program: rec.program || "Higher National Diploma in Information Technology",
            programCode: rec.programCode || normIndex.split(/[\/\-]/)[1] || "IT",
            academicYear: fileData.academicYear || rec.academicYear || "2021/2022",
            semesters: []
          });
        }

        const student = studentsMap.get(normIndex);

        // Compute Semester GPA (SGPA)
        const courses = rec.courses || [];
        let totalSemQualityPoints = 0;
        let totalSemCredits = 0;

        courses.forEach(c => {
          const credits = Number(c.credits) || 0;
          let gp = c.gradePoint;
          if (gp === undefined || gp === null) {
            gp = CONFIG.gradePoints[c.grade] !== undefined ? CONFIG.gradePoints[c.grade] : 0.0;
          }
          c.gradePoint = gp;
          if (!c.isNgpa && credits > 0) {
            totalSemQualityPoints += credits * gp;
            totalSemCredits += credits;
          }
        });

        const sgpa = (rec.officialSgpa && rec.officialSgpa !== "*")
          ? Number(rec.officialSgpa)
          : (totalSemCredits > 0 ? Math.round((totalSemQualityPoints / totalSemCredits) * 100) / 100 : 0.0);

        student.semesters.push({
          year,
          semester: semNumber,
          semesterTitle: semTitle,
          sgpa,
          semesterCredits: totalSemCredits,
          courses
        });
      });
    } catch (err) {
      console.error(`❌ Failed to parse ${file}:`, err.message);
    }
  });

  console.log(`\n👥 Consolidated ${studentsMap.size} unique student record(s).\n`);

  // 2. Compute Cumulative GPA (CGPA) and Encrypt
  let encryptedCount = 0;
  const manifest = [];

  studentsMap.forEach((student, normIndex) => {
    // Sort semesters chronologically
    student.semesters.sort((a, b) => (a.year * 10 + a.semester) - (b.year * 10 + b.semester));

    // Calculate overall CGPA
    let cumulativeQualityPoints = 0;
    let cumulativeGpaCredits = 0;
    let totalEarnedCredits = 0;
    let hasAnyPending = false;
    let hasAnyWithheld = false;

    student.semesters.forEach(s => {
      s.courses.forEach(c => {
        const cr = Number(c.credits) || 0;
        const gp = Number(c.gradePoint) || 0;
        if (!c.isNgpa && cr > 0) {
          cumulativeQualityPoints += cr * gp;
          cumulativeGpaCredits += cr;
        }
        if (gp > 0) {
          totalEarnedCredits += cr;
        }
        if (["I(SE)", "I(CA)", "AB", "E", "INC", "DFR"].includes(c.grade)) {
          hasAnyPending = true;
        }
        if (c.grade === "*") {
          hasAnyWithheld = true;
        }
      });
    });

    student.totalCreditsEarned = totalEarnedCredits;
    student.totalCreditsAttempted = cumulativeGpaCredits;
    student.hasPending = hasAnyPending;
    student.hasWithheld = hasAnyWithheld;
    student.academicStatus = hasAnyWithheld ? "Result Withheld" : (!hasAnyPending ? "All Modules Passed" : "Incomplete / Repeat");
    student.cgpa = hasAnyWithheld ? 0.0 : (cumulativeGpaCredits > 0
      ? Math.round((cumulativeQualityPoints / cumulativeGpaCredits) * 100) / 100
      : 0.0);

    // Encrypt record
    const encryptedBlob = encryptStudentRecord(student, normIndex);
    const fileHash = computeFileHash(normIndex);
    const outPath = path.join(CONFIG.encryptedDir, `${fileHash}.json`);

    fs.writeFileSync(outPath, JSON.stringify(encryptedBlob, null, 2), "utf8");
    encryptedCount++;

    manifest.push({
      index: normIndex,
      name: student.name,
      cgpa: student.cgpa.toFixed(2),
      semesters: student.semesters.length,
      hashFile: `${fileHash}.json`
    });
  });

  // Print Summary Table
  console.table(manifest);

  console.log(`\n✅ Successfully compiled and encrypted ${encryptedCount} student files into:`);
  console.log(`   📂 ${CONFIG.encryptedDir}\n`);
  console.log("🔒 Security Note: All student files are AES-256-GCM encrypted and keyed by individual index numbers.");
  console.log("   The filenames are salted SHA-256 hashes, preventing index directory enumeration.\n");
}

buildData();
