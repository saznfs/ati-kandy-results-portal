<#
.SYNOPSIS
  Parses kandy_y2s2_raw.csv and outputs kandy_y2s2.json
#>

[CmdletBinding()]
param()

$csvPath = Join-Path $PSScriptRoot "..\data\raw\kandy_y2s2_raw.csv"
$outJsonPath = Join-Path $PSScriptRoot "..\data\raw\kandy_y2s2.json"

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
    "AB" = 0.00; "INC" = 0.00; "NE" = 0.00; "*" = 0.00
}

$coreDefs = @(
    @{ code = "HNDIT4012"; title = "Software Engineering"; credits = 3 },
    @{ code = "HNDIT4022"; title = "Software Quality Assurance"; credits = 3 },
    @{ code = "HNDIT4032"; title = "IT Project Management"; credits = 3 },
    @{ code = "HNDIT4042"; title = "Professional World"; credits = 3 },
    @{ code = "HNDIT4052"; title = "Programming Individual Project"; credits = 2 }
)

$elecDefs = @(
    @{ code = "HNDIT4212"; title = "Machine Learning"; credits = 3 },
    @{ code = "IT4222"; title = "Business Analysis Practice"; credits = 3 },
    @{ code = "IT4232"; title = "Enterprise Architecture"; credits = 3 },
    @{ code = "HNDIT4252"; title = "Mobile Application Development"; credits = 3 }
)

$lines = Get-Content -Path $csvPath -Encoding utf8

$students = [ordered]@{}

for ($i = 79; $i -le 178; $i++) {
    $line = $lines[$i].Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $parts = $line.Split(',')

    $sno = $parts[0].Trim()
    $category = $parts[2].Trim()
    $name = $parts[3].Trim()
    $rawIndex = $parts[4].Trim()
    $normIndex = $rawIndex.ToUpper() -replace '\s+', ''

    $cGrades = @(
        $parts[5].Trim(),
        $parts[6].Trim(),
        $parts[7].Trim(),
        $parts[8].Trim(),
        $parts[9].Trim()
    )

    $eGrades = @(
        $parts[10].Trim(),
        $parts[11].Trim(),
        $parts[12].Trim(),
        $parts[13].Trim()
    )

    $officialSgpa = $parts[14].Trim()
    $academicStatus = if ($parts.Length -ge 19) { $parts[18].Trim() } elseif ($parts.Length -ge 18) { $parts[17].Trim() } else { "" }

    $courses = @()
    $totalQP = 0.0
    $totalGpaCredits = 0.0
    $hasWithheld = $false
    $hasPending = $false

    # Add core modules (if grade is non-empty)
    for ($m = 0; $m -lt 5; $m++) {
        $g = $cGrades[$m]
        if ([string]::IsNullOrEmpty($g)) { continue }

        $mDef = $coreDefs[$m]
        if ($g -eq "*") { $hasWithheld = $true }
        if ($g -in @("I(SE)", "I(CA)", "AB", "E", "INC", "DFR", "NE")) { $hasPending = $true }

        $gp = if ($gradePoints.ContainsKey($g)) { $gradePoints[$g] } else { 0.00 }
        
        $totalQP += ($mDef.credits * $gp)
        $totalGpaCredits += $mDef.credits

        $courses += [ordered]@{
            code = $mDef.code
            title = $mDef.title
            credits = $mDef.credits
            grade = $g
            gradePoint = $gp
        }
    }

    # Add elective modules
    # Find all non-empty electives
    $nonEmptyElecs = @()
    for ($k = 0; $k -lt 4; $k++) {
        $eg = $eGrades[$k]
        if (![string]::IsNullOrEmpty($eg)) {
            $nonEmptyElecs += @{ def = $elecDefs[$k]; grade = $eg }
        }
    }

    # If student took 3 electives with 1 AB and 2 passed (e.g. SNo 18 & 30), SLIATE counted the 2 passed ones
    $activeElecs = $nonEmptyElecs
    if ($nonEmptyElecs.Count -eq 3) {
        $passed = $nonEmptyElecs | Where-Object { $_.grade -ne "AB" }
        if ($passed.Count -eq 2) {
            $activeElecs = $passed
        }
    }

    foreach ($el in $activeElecs) {
        $eg = $el.grade
        $mDef = $el.def
        if ($eg -eq "*") { $hasWithheld = $true }
        if ($eg -in @("I(SE)", "I(CA)", "AB", "E", "INC", "DFR", "NE")) { $hasPending = $true }

        $gp = if ($gradePoints.ContainsKey($eg)) { $gradePoints[$eg] } else { 0.00 }

        $totalQP += ($mDef.credits * $gp)
        $totalGpaCredits += $mDef.credits

        $courses += [ordered]@{
            code = $mDef.code
            title = $mDef.title
            credits = $mDef.credits
            grade = $eg
            gradePoint = $gp
        }
    }

    $calcSgpa = if ($hasWithheld) { 0.00 } elseif ($totalGpaCredits -gt 0) { [Math]::Round($totalQP / 20.0, 2, [System.MidpointRounding]::AwayFromZero) } else { 0.00 }

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
        academicYear = "2024/2025"
        officialSgpa = [string]$sgpa
        academicStatus = $academicStatus
        hasWithheld = $hasWithheld
        hasPending = $hasPending
        courses = $courses
    }
}

Write-Host "Parsed $($students.Count) students from 2nd Year 2nd Semester Examination." -ForegroundColor Green

$outputData = [ordered]@{
    academicYear = "2024/2025"
    year = 2
    semester = 2
    semesterTitle = "Year 2 Semester 2"
    examinationName = "Second Year Second Semester Examination 2025"
    institute = "SLIATE Kandy Institute"
    program = "Higher National Diploma in Information Technology (HNDIT)"
    totalStudents = $students.Count
    records = @($students.Values)
}

$outputData | ConvertTo-Json -Depth 10 | Set-Content -Path $outJsonPath -Encoding utf8
Write-Host "Successfully generated $outJsonPath ($($students.Count) student records)" -ForegroundColor Green
