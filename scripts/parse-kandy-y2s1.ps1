<#
.SYNOPSIS
  Parses kandy_y2s1_raw.csv and outputs kandy_y2s1.json
#>

[CmdletBinding()]
param()

$csvPath = Join-Path $PSScriptRoot "..\data\raw\kandy_y2s1_raw.csv"
$outJsonPath = Join-Path $PSScriptRoot "..\data\raw\kandy_y2s1.json"

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

$moduleDefs = @(
    @{ code = "HNDIT3012"; title = "Object Oriented Programming"; credits = 4 },
    @{ code = "HNDIT3022"; title = "Web Programming"; credits = 4 },
    @{ code = "HNDIT3032"; title = "Data Structures and Algorithms"; credits = 2 },
    @{ code = "HNDIT3042"; title = "Database Management Systems"; credits = 3 },
    @{ code = "HNDIT3052"; title = "Operating Systems"; credits = 2 },
    @{ code = "HNDIT3062"; title = "Information and Computer Security"; credits = 2 },
    @{ code = "HNDIT3072"; title = "Statistics for IT"; credits = 3 }
)

$lines = Get-Content -Path $csvPath -Encoding utf8

$students = [ordered]@{}

for ($i = 73; $i -le 176; $i++) {
    $line = $lines[$i].Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $parts = $line.Split(',')

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
        $parts[11].Trim()
    )

    $officialSgpa = $parts[12].Trim()
    $academicStatus = if ($parts.Length -ge 16) { $parts[15].Trim() } else { "" }

    $courses = @()
    $totalQP = 0.0
    $totalGpaCredits = 0.0
    $hasWithheld = $false
    $hasPending = $false

    for ($m = 0; $m -lt 7; $m++) {
        $mDef = $moduleDefs[$m]
        $g = $grades[$m]
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
        academicYear = "2024/2025"
        officialSgpa = [string]$sgpa
        academicStatus = $academicStatus
        hasWithheld = $hasWithheld
        hasPending = $hasPending
        courses = $courses
    }
}

Write-Host "Parsed $($students.Count) students from 2nd Year 1st Semester Examination." -ForegroundColor Green

$outputData = [ordered]@{
    academicYear = "2024/2025"
    year = 2
    semester = 1
    semesterTitle = "Year 2 Semester 1"
    examinationName = "Second Year First Semester Examination 2025"
    institute = "SLIATE Kandy Institute"
    program = "Higher National Diploma in Information Technology (HNDIT)"
    totalStudents = $students.Count
    records = @($students.Values)
}

$outputData | ConvertTo-Json -Depth 10 | Set-Content -Path $outJsonPath -Encoding utf8
Write-Host "Successfully generated $outJsonPath ($($students.Count) student records)" -ForegroundColor Green
