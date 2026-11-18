<#
.SYNOPSIS
  Parses kandy_y1s2_raw.csv and outputs kandy_y1s2.json
#>

[CmdletBinding()]
param()

$csvPath = Join-Path $PSScriptRoot "..\data\raw\kandy_y1s2_raw.csv"
$outJsonPath = Join-Path $PSScriptRoot "..\data\raw\kandy_y1s2.json"

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
    @{ code = "HNDIT2012"; title = "Fundamentals of Programming"; credits = 4; isNgpa = $false },
    @{ code = "HNDIT2022"; title = "Software Development"; credits = 3; isNgpa = $false },
    @{ code = "HNDIT2032"; title = "System Analysis and Design"; credits = 3; isNgpa = $false },
    @{ code = "HNDIT2042"; title = "Data Comm. & Computer Network"; credits = 3; isNgpa = $false },
    @{ code = "HNDIT2052"; title = "Principles of User Interface Design"; credits = 3; isNgpa = $false },
    @{ code = "HNDIT2062"; title = "ICT Project"; credits = 2; isNgpa = $false },
    @{ code = "HNDIT2072"; title = "Technical Writing"; credits = 2; isNgpa = $false },
    @{ code = "HNDIT2082"; title = "Human Value & Professional Ethics"; credits = 0; isNgpa = $true }
)

$lines = Get-Content -Path $csvPath -Encoding utf8

$students = [ordered]@{}

for ($i = 74; $i -le 185; $i++) {
    $line = $lines[$i].Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $parts = $line.Split(',')
    # Expected columns:
    # 0: S.No
    # 1: Page
    # 2: Batch Category
    # 3: Student Name
    # 4: Index Number
    # 5: HNDIT2012
    # 6: HNDIT2022
    # 7: HNDIT2032
    # 8: HNDIT2042
    # 9: HNDIT2052
    # 10: HNDIT2062
    # 11: HNDIT2072
    # 12: HNDIT2082
    # 13: Official SGPA
    # 14: Verified SGPA
    # 15: Accuracy Audit
    # 16: Academic Status

    $sno = $parts[0].Trim()
    $category = $parts[2].Trim()
    $name = $parts[3].Trim()
    $rawIndex = $parts[4].Trim()
    $normIndex = $rawIndex.ToUpper() -replace '\s+', ''

    $grades = @(
        $parts[5].Trim(),
        $parts[6].Trim(),
        $parts[7].Trim(),
        $parts[8].Trim(),
        $parts[9].Trim(),
        $parts[10].Trim(),
        $parts[11].Trim(),
        $parts[12].Trim()
    )

    $officialSgpa = $parts[13].Trim()
    $academicStatus = if ($parts.Length -ge 17) { $parts[16].Trim() } else { "" }

    $courses = @()
    $totalQP = 0.0
    $totalGpaCredits = 0.0
    $hasWithheld = $false
    $hasPending = $false

    for ($m = 0; $m -lt 8; $m++) {
        $mDef = $moduleDefs[$m]
        $g = $grades[$m]
        if ($g -eq "*") { $hasWithheld = $true }
        if ($g -in @("I(SE)", "I(CA)", "AB", "E", "INC", "DFR")) { $hasPending = $true }

        $gp = if ($gradePoints.ContainsKey($g)) { $gradePoints[$g] } else { 0.00 }
        
        if (-not $mDef.isNgpa) {
            $totalQP += ($mDef.credits * $gp)
            $totalGpaCredits += $mDef.credits
        }

        $courseObj = [ordered]@{
            code = $mDef.code
            title = $mDef.title
            credits = $mDef.credits
            grade = $g
            gradePoint = $gp
        }
        if ($mDef.isNgpa) {
            $courseObj["isNgpa"] = $true
        }
        $courses += $courseObj
    }

    $calcSgpa = if ($hasWithheld) { 0.00 } elseif ($totalGpaCredits -gt 0) { [Math]::Round($totalQP / $totalGpaCredits, 2, [System.MidpointRounding]::AwayFromZero) } else { 0.00 }

    # Audit check against Official SGPA
    if (![string]::IsNullOrEmpty($officialSgpa) -and $officialSgpa -ne "*") {
        $offVal = [double]$officialSgpa
        if ([Math]::Abs($calcSgpa - $offVal) -gt 0.019) {
            Write-Warning "SGPA discrepancy for $normIndex : Calc $calcSgpa vs Official $officialSgpa"
        }
    }

    $sgpa = if (![string]::IsNullOrEmpty($officialSgpa) -and $officialSgpa -ne "*") {
        try { [double]$officialSgpa } catch { $calcSgpa }
    } else {
        $calcSgpa
    }

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
        officialSgpa = [string]$sgpa
        academicStatus = $academicStatus
        hasWithheld = $hasWithheld
        hasPending = $hasPending
        courses = $courses
    }
}

Write-Host "Parsed $($students.Count) students from 1st Year 2nd Semester Examination." -ForegroundColor Green

$outputData = [ordered]@{
    academicYear = "2023/2024"
    year = 1
    semester = 2
    semesterTitle = "Year 1 Semester 2"
    examinationName = "First Year Second Semester Examination 2023"
    institute = "SLIATE Kandy Institute"
    program = "Higher National Diploma in Information Technology (HNDIT)"
    totalStudents = $students.Count
    records = @($students.Values)
}

$outputData | ConvertTo-Json -Depth 10 | Set-Content -Path $outJsonPath -Encoding utf8
Write-Host "Successfully generated $outJsonPath ($($students.Count) student records)" -ForegroundColor Green
