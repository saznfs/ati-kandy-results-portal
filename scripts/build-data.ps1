<#
.SYNOPSIS
  ATI SLIATE Unofficial Results Portal - Windows Native Data Encryptor (PowerShell / CNG)
.DESCRIPTION
  Zero-dependency Windows PowerShell script that merges raw semester JSON files
  and encrypts student records with hardware-accelerated AES-256-GCM (Windows CNG)
  matching scripts/build-data.js and Web Crypto API.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

# Configuration
$SALT = "SLIATE_ATI_COMMUNITY_KEY_SALT_2026_SECURE"
$RAW_DIR = Join-Path $PSScriptRoot "..\data\raw"
$OUT_DIR = Join-Path $PSScriptRoot "..\data\encrypted"

if (!(Test-Path $OUT_DIR)) {
    New-Item -ItemType Directory -Path $OUT_DIR -Force | Out-Null
}

# Compile Windows CNG AES-GCM & PBKDF2 Helper
$cngTypeDef = @"
using System;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

public class NativeCrypto {
    [DllImport("bcrypt.dll")]
    public static extern uint BCryptOpenAlgorithmProvider(out IntPtr phAlgorithm, [MarshalAs(UnmanagedType.LPWStr)] string pszAlgId, [MarshalAs(UnmanagedType.LPWStr)] string pszImplementation, uint dwFlags);

    [DllImport("bcrypt.dll")]
    public static extern uint BCryptSetProperty(IntPtr hObject, [MarshalAs(UnmanagedType.LPWStr)] string pszProperty, byte[] pbInput, int cbInput, uint dwFlags);

    [DllImport("bcrypt.dll")]
    public static extern uint BCryptGenerateSymmetricKey(IntPtr hAlgorithm, out IntPtr phKey, IntPtr pbKeyObject, int cbKeyObject, byte[] pbSecret, int cbSecret, uint dwFlags);

    [DllImport("bcrypt.dll")]
    public static extern uint BCryptEncrypt(IntPtr hKey, byte[] pbInput, int cbInput, IntPtr pPaddingInfo, byte[] pbIV, int cbIV, byte[] pbOutput, int cbOutput, out int pcbResult, uint dwFlags);

    [DllImport("bcrypt.dll")]
    public static extern uint BCryptDestroyKey(IntPtr hKey);

    [DllImport("bcrypt.dll")]
    public static extern uint BCryptCloseAlgorithmProvider(IntPtr hAlgorithm, uint dwFlags);

    [StructLayout(LayoutKind.Sequential)]
    public struct BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO {
        public int cbSize;
        public int dwInfoVersion;
        public IntPtr pbNonce;
        public int cbNonce;
        public IntPtr pbAuthData;
        public int cbAuthData;
        public IntPtr pbTag;
        public int cbTag;
        public IntPtr pbMacContext;
        public int cbMacContext;
        public int cbAAD;
        public long cbData;
        public int dwFlags;
    }

    public static byte[] DeriveKey(string password, string salt) {
        using (var kdf = new Rfc2898DeriveBytes(password, Encoding.UTF8.GetBytes(salt), 10000, HashAlgorithmName.SHA256)) {
            return kdf.GetBytes(32);
        }
    }

    public static string ComputeSha256(string input) {
        using (var sha = SHA256.Create()) {
            byte[] bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }
    }

    public static void EncryptAesGcm(byte[] key, byte[] iv, byte[] plaintext, out string ciphertextHex, out string tagHex) {
        IntPtr hAlg = IntPtr.Zero;
        IntPtr hKey = IntPtr.Zero;
        try {
            uint status = BCryptOpenAlgorithmProvider(out hAlg, "AES", null, 0);
            if (status != 0) throw new Exception("BCryptOpenAlgorithmProvider failed: " + status);

            byte[] chainMode = Encoding.Unicode.GetBytes("ChainingModeGCM\0");
            status = BCryptSetProperty(hAlg, "ChainingMode", chainMode, chainMode.Length, 0);
            if (status != 0) throw new Exception("BCryptSetProperty failed: " + status);

            status = BCryptGenerateSymmetricKey(hAlg, out hKey, IntPtr.Zero, 0, key, key.Length, 0);
            if (status != 0) throw new Exception("BCryptGenerateSymmetricKey failed: " + status);

            byte[] tag = new byte[16];
            GCHandle hNonce = GCHandle.Alloc(iv, GCHandleType.Pinned);
            GCHandle hTag = GCHandle.Alloc(tag, GCHandleType.Pinned);
            try {
                BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO authInfo = new BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO();
                authInfo.cbSize = Marshal.SizeOf(typeof(BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO));
                authInfo.dwInfoVersion = 1;
                authInfo.pbNonce = hNonce.AddrOfPinnedObject();
                authInfo.cbNonce = iv.Length;
                authInfo.pbTag = hTag.AddrOfPinnedObject();
                authInfo.cbTag = tag.Length;

                IntPtr pAuthInfo = Marshal.AllocHGlobal(authInfo.cbSize);
                Marshal.StructureToPtr(authInfo, pAuthInfo, false);

                byte[] ciphertext = new byte[plaintext.Length];
                int resultLen = 0;
                status = BCryptEncrypt(hKey, plaintext, plaintext.Length, pAuthInfo, null, 0, ciphertext, ciphertext.Length, out resultLen, 0);
                Marshal.FreeHGlobal(pAuthInfo);

                if (status != 0) throw new Exception("BCryptEncrypt failed: " + status);

                tagHex = BitConverter.ToString(tag).Replace("-", "").ToLower();
                ciphertextHex = BitConverter.ToString(ciphertext).Replace("-", "").ToLower();
            } finally {
                hNonce.Free();
                hTag.Free();
            }
        } finally {
            if (hKey != IntPtr.Zero) BCryptDestroyKey(hKey);
            if (hAlg != IntPtr.Zero) BCryptCloseAlgorithmProvider(hAlg, 0);
        }
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'NativeCrypto').Type) {
    Add-Type -TypeDefinition $cngTypeDef
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🎓 ATI SLIATE Native Results Encryptor & Compiler" -ForegroundColor Cyan
Write-Host "==========================================================`n"

$rawFiles = Get-ChildItem -Path $RAW_DIR -Filter "*.json" | Sort-Object Name
if ($rawFiles.Count -eq 0) {
    Write-Warning "No raw JSON files found in $RAW_DIR."
    exit 0
}

Write-Host "Found $($rawFiles.Count) raw semester file(s):" -ForegroundColor Green
$rawFiles | ForEach-Object { Write-Host " - $($_.Name)" }

# Grade point mapping
$gradePoints = @{
    "A+" = 4.00; "A" = 4.00; "A-" = 3.70;
    "B+" = 3.30; "B" = 3.00; "B-" = 2.70;
    "C+" = 2.30; "C" = 2.00; "C-" = 1.50;
    "D+" = 1.30; "D" = 1.00; "E" = 0.00
}

$students = @{}

foreach ($file in $rawFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding utf8 | ConvertFrom-Json
    $year = if ($content.year) { $content.year } else { 1 }
    $sem = if ($content.semester) { $content.semester } else { 1 }
    $semTitle = if ($content.semesterTitle) { $content.semesterTitle } else { "Year $year Semester $sem" }
    $acadYear = if ($content.academicYear) { $content.academicYear } else { "2021/2022" }

    foreach ($rec in $content.records) {
        $idx = $rec.indexNumber.Trim().ToUpper() -replace '\s+', ''
        if (-not $students.ContainsKey($idx)) {
            $parts = $idx -split '[\/\-]'
            $campusCode = if ($rec.campusCode) { $rec.campusCode } elseif ($parts.Length -ge 1) { $parts[0] } else { "AMP" }
            $progCode = if ($rec.programCode) { $rec.programCode } elseif ($parts.Length -ge 2) { $parts[1] } else { "IT" }

            $students[$idx] = [ordered]@{
                indexNumber = $idx
                registrationNumber = if ($rec.registrationNumber) { $rec.registrationNumber } else { $rec.regNo }
                name = if ($rec.name) { $rec.name } else { "Student" }
                campus = if ($rec.campus) { $rec.campus } else { "Hardy Advanced Technological Institute, Ampara" }
                campusCode = $campusCode
                program = if ($rec.program) { $rec.program } else { "Higher National Diploma in Information Technology" }
                programCode = $progCode
                academicYear = $acadYear
                semesters = [System.Collections.ArrayList]@()
            }
        }

        # Calculate SGPA
        $courses = $rec.courses
        $semQP = 0.0
        $semCredits = 0.0
        $coursesList = [System.Collections.ArrayList]@()

        foreach ($c in $courses) {
            $cr = [double]$c.credits
            $gp = if ($null -ne $c.gradePoint) { [double]$c.gradePoint } elseif ($gradePoints.ContainsKey($c.grade)) { $gradePoints[$c.grade] } else { 0.0 }
            $semQP += ($cr * $gp)
            $semCredits += $cr

            $coursesList.Add([ordered]@{
                code = $c.code
                title = $c.title
                credits = $cr
                grade = $c.grade
                gradePoint = $gp
            }) | Out-Null
        }

        $sgpa = if ($semCredits -gt 0) { [Math]::Round($semQP / $semCredits, 2) } else { 0.0 }

        $students[$idx].semesters.Add([ordered]@{
            year = $year
            semester = $sem
            semesterTitle = $semTitle
            sgpa = $sgpa
            semesterCredits = $semCredits
            courses = $coursesList
        }) | Out-Null
    }
}

Write-Host "`nConsolidated $($students.Count) student records across semesters.`n" -ForegroundColor Yellow

$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

foreach ($idx in $students.Keys) {
    $student = $students[$idx]
    
    # Calculate CGPA
    $totQP = 0.0
    $totCredits = 0.0
    foreach ($sem in $student.semesters) {
        foreach ($c in $sem.courses) {
            $totQP += ($c.credits * $c.gradePoint)
            $totCredits += $c.credits
        }
    }

    $cgpa = if ($totCredits -gt 0) { [Math]::Round($totQP / $totCredits, 2) } else { 0.0 }
    $student["cgpa"] = $cgpa
    $student["totalCreditsEarned"] = $totCredits

    # JSON representation
    $jsonString = $student | ConvertTo-Json -Depth 10 -Compress
    $ptBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonString)

    # Filename hash: SHA-256(SALT:INDEX)
    $fileHash = [NativeCrypto]::ComputeSha256("$SALT`:$idx")
    
    # AES-256 Key via PBKDF2
    $aesKey = [NativeCrypto]::DeriveKey($idx, "$SALT`_KEY")

    # 12-byte random IV
    $iv = New-Object byte[] 12
    $rng.GetBytes($iv)
    $ivHex = ([System.BitConverter]::ToString($iv) -replace '-','').ToLower()

    # Encrypt
    $ctHex = ""
    $tagHex = ""
    [NativeCrypto]::EncryptAesGcm($aesKey, $iv, $ptBytes, [ref]$ctHex, [ref]$tagHex)

    $outBlob = [ordered]@{
        v = 1
        iv = $ivHex
        tag = $tagHex
        data = $ctHex
    }

    $outPath = Join-Path $OUT_DIR "$fileHash.json"
    $outBlob | ConvertTo-Json | Set-Content -Path $outPath -Encoding utf8

    Write-Host "✅ Encrypted: $idx -> $fileHash.json (CGPA: $cgpa)" -ForegroundColor Green
}

Write-Host "`nAll records securely encrypted in $OUT_DIR" -ForegroundColor Cyan
