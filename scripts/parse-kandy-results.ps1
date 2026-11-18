<#
.SYNOPSIS
  Parses kandy_y1s1_raw.csv, applies 2025 repeat upgrades, and outputs kandy_y1s1.json
#>

[CmdletBinding()]
param()

$csvPath = Join-Path $PSScriptRoot "..\data\raw\kandy_y1s1_raw.csv"
$outJsonPath = Join-Path $PSScriptRoot "..\data\raw\kandy_y1s1.json"

if (!(Test-Path $csvPath)) {
    Write-Error "CSV file not found: $csvPath"
    exit 1
}

$gradePoints = @{
    "A+" = 4.00; "A" = 4.00; "A-" = 3.70;
    "B+" = 3.30; "B" = 3.00; "B-" = 2.70;
    "C+" = 2.30; "C" = 2.00; "C-" = 1.70;
    "D+" = 1.30; "D" = 1.00; "E" = 0.00;
    "I(SE)" = 0.00; "I(CA)" = 0.00; "DFR" = 0.00;
    "AB" = 0.00; "INC" = 0.00; "*" = 0.00
}

$moduleDefs = @(
    @{ code = "HNDIT1012"; title = "Visual Application Programming"; credits = 4 },
    @{ code = "HNDIT1022"; title = "Web Design"; credits = 4 },
    @{ code = "HNDIT1032"; title = "Computer and Network Systems"; credits = 3 },
    @{ code = "HNDIT1042"; title = "Information Management & IS"; credits = 4 },
    @{ code = "HNDIT1062"; title = "Communication Skills"; credits = 2 },
    @{ code = "HNDIT1052"; title = "ICT Project"; credits = 3 }
)

$lines = Get-Content -Path $csvPath -Encoding utf8

# 1. Parse Proper Examination (lines 68 to 175)
$students = [ordered]@{}

for ($i = 68; $i -le 175; $i++) {
    $line = $lines[$i].Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $parts = $line.Split(',')
    # Expected columns:
    # 0: S.No
    # 1: Page
    # 2: Batch Category
    # 3: Student Name
    # 4: Index Number
    # 5: HNDIT1012
    # 6: HNDIT1022
    # 7: HNDIT1032
    # 8: HNDIT1042
    # 9: HNDIT1062
    # 10: HNDIT1052
    # 11: Official SGPA
    # 12: Verified SGPA
    # 13: Accuracy Audit
    # 14: Academic Status

    $sno = $parts[0].Trim()
    $category = $parts[2].Trim()
    $name = $parts[3].Trim()
    $rawIndex = $parts[4].Trim()
    $normIndex = $rawIndex.ToUpper() -replace '\s+', ''

    $regNo = $normIndex -replace '/F/','/2324/' -replace '/P/','/2324/'

    $grades = @(
        $parts[5].Trim(),
        $parts[6].Trim(),
        $parts[7].Trim(),
        $parts[8].Trim(),
        $parts[9].Trim(),
        $parts[10].Trim()
    )

    $officialSgpa = $parts[11].Trim()
    $academicStatus = if ($parts.Length -ge 15) { $parts[14].Trim() } else { "" }

    $courses = @()
    $totalQP = 0.0
    $totalCredits = 0.0
    $hasWithheld = $false
    $hasPending = $false

    for ($m = 0; $m -lt 6; $m++) {
        $mDef = $moduleDefs[$m]
        $g = $grades[$m]
        if ($g -eq "*") { $hasWithheld = $true }
        if ($g -in @("I(SE)", "I(CA)", "AB", "E", "INC", "DFR")) { $hasPending = $true }

        $gp = if ($gradePoints.ContainsKey($g)) { $gradePoints[$g] } else { 0.00 }
        $totalQP += ($mDef.credits * $gp)
        $totalCredits += $mDef.credits

        $courses += [ordered]@{
            code = $mDef.code
            title = $mDef.title
            credits = $mDef.credits
            grade = $g
            gradePoint = $gp
        }
    }

    $calcSgpa = if ($hasWithheld) { 0.00 } elseif ($totalCredits -gt 0) { [Math]::Round($totalQP / $totalCredits, 2, [System.MidpointRounding]::AwayFromZero) } else { 0.00 }

    $students[$normIndex] = [ordered]@{
        indexNumber = $normIndex
        registrationNumber = $normIndex
        name = $name
        batchCategory = $category
        campus = "Advanced Technological Institute, Kandy"
        campusCode = "KAN"
        program = "Higher National Diploma in Information Technology"
        programCode = "IT"
        academicYear = "2023/2024"
        officialSgpa = $officialSgpa
        academicStatus = $academicStatus
        hasWithheld = $hasWithheld
        hasPending = $hasPending
        courses = $courses
        repeatUpgraded = $false
    }
}

Write-Host "Parsed $($students.Count) students from Proper Examination." -ForegroundColor Green

# 2. Parse Repeat Examination (lines 192 to 218) and apply upgrades
$repeatCount = 0
for ($i = 192; $i -le 218; $i++) {
    $line = $lines[$i].Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $parts = $line.Split(',')
    # 0: S.No
    # 1: Student Name
    # 2: Index Number
    # 3: HNDIT 1012
    # 4: HNDIT 1022
    # 5: HNDIT 1032
    # 6: HNDIT 1042
    # 7: HNDIT 1062
    # 8: HNDIT 1052
    # 13: Recalculated SGPA (if present)

    $name = $parts[1].Trim()
    $rawIndex = $parts[2].Trim()
    $normIndex = $rawIndex.ToUpper() -replace '\s+', ''

    if (-not $students.Contains($normIndex)) {
        Write-Warning "Repeat student $normIndex not found in Proper exam list!"
        continue
    }

    $student = $students[$normIndex]
    $repeatGrades = @(
        $parts[3].Trim(),
        $parts[4].Trim(),
        $parts[5].Trim(),
        $parts[6].Trim(),
        $parts[7].Trim(),
        $parts[8].Trim()
    )

    $anyUpgrade = $false
    for ($m = 0; $m -lt 6; $m++) {
        $rg = $repeatGrades[$m]
        if (![string]::IsNullOrEmpty($rg)) {
            if ($rg -eq "C") {
                # Cleared in repeat!
                $student.courses[$m].grade = "C"
                $student.courses[$m].gradePoint = 2.00
                $student.courses[$m]["repeatCleared"] = $true
                $anyUpgrade = $true
            } elseif ($rg -eq "I(SE)" -or $rg -eq "I(CA)") {
                # Still incomplete
                $student.courses[$m].grade = $rg
                $student.courses[$m].gradePoint = 0.00
            }
        }
    }

    if ($anyUpgrade) {
        $student.repeatUpgraded = $true
        # Recalculate SGPA
        $totQP = 0.0
        $totCr = 0.0
        $stillPending = $false
        foreach ($c in $student.courses) {
            $totQP += ($c.credits * $c.gradePoint)
            $totCr += $c.credits
            if ($c.grade -in @("I(SE)", "I(CA)", "AB", "E", "INC", "DFR", "*")) {
                $stillPending = $true
            }
        }
        $newSgpa = [Math]::Round($totQP / $totCr, 2, [System.MidpointRounding]::AwayFromZero)
        $student.officialSgpa = [string]$newSgpa
        $student.hasPending = $stillPending
        if (-not $stillPending) {
            $student.academicStatus = "All Modules Passed (Post-Repeat)"
        }
        $repeatCount++
        Write-Host "Upgraded Repeat: $normIndex -> New SGPA: $newSgpa" -ForegroundColor Cyan
    }
}

Write-Host "`nApplied $repeatCount repeat exam upgrades." -ForegroundColor Yellow

# 3. Export to JSON
$outputData = [ordered]@{
    academicYear = "2023/2024"
    year = 1
    semester = 1
    semesterTitle = "Year 1 Semester 1"
    examinationName = "First Year First Semester Examination 2023 / Repeat 2025"
    institute = "SLIATE Kandy Institute"
    program = "Higher National Diploma in Information Technology (HNDIT)"
    totalStudents = $students.Count
    records = @($students.Values)
}

$outputData | ConvertTo-Json -Depth 10 | Set-Content -Path $outJsonPath -Encoding utf8
Write-Host "Successfully generated $outJsonPath ($($students.Count) student records)" -ForegroundColor Green
