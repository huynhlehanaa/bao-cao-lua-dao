# test-suite.ps1 -- Full test, ASCII-safe labels only
param([string]$BaseUrl = "http://localhost:3000")

$BASE = $BaseUrl
$PASS = 0; $FAIL = 0; $TOTAL = 0

function Test-Assert {
    param([string]$Label, [bool]$Ok, [string]$Extra = "")
    $script:TOTAL++
    if ($Ok) { Write-Host "  [PASS] $Label" -ForegroundColor Green; $script:PASS++ }
    else      { Write-Host "  [FAIL] $Label  >> $Extra" -ForegroundColor Red; $script:FAIL++ }
}

function Invoke-Safe {
    param([hashtable]$Params)
    try {
        $r = Invoke-WebRequest @Params -UseBasicParsing
        return @{ Code=$r.StatusCode; Body=$r.Content; Raw=$r.RawContentLength; Headers=$r.Headers }
    } catch [System.Net.WebException] {
        $code = [int]$_.Exception.Response.StatusCode
        $s = $_.Exception.Response.GetResponseStream()
        $rd = New-Object System.IO.StreamReader($s)
        return @{ Code=$code; Body=$rd.ReadToEnd(); Raw=0; Headers=@{} }
    }
}

function Get-Page([string]$Path) {
    return Invoke-Safe @{ Uri="$BASE$Path" }
}

function Post-Json([string]$Path, [string]$Json) {
    return Invoke-Safe @{ Uri="$BASE$Path"; Method="POST"; Body=$Json;
        Headers=@{"Content-Type"="application/json"} }
}

function Patch-Json([string]$Path, [string]$Json, [object]$Session) {
    $p = @{ Uri="$BASE$Path"; Method="PATCH"; Body=$Json;
        Headers=@{"Content-Type"="application/json"} }
    if ($Session) { $p["WebSession"] = $Session }
    return Invoke-Safe @p
}

function Send-Report {
    param([string]$Phone, [string]$FType, [string]$Desc,
          [string]$When = "2026-09-27T08:00", [bool]$Anon = $true)
    $bnd = "Bnd" + [guid]::NewGuid().ToString("N")
    $raw  = "--$bnd`r`nContent-Disposition: form-data; name=`"isAnonymous`"`r`n`r`n$( if($Anon){'true'}else{'false'} )`r`n"
    $raw += "--$bnd`r`nContent-Disposition: form-data; name=`"fraudType`"`r`n`r`n$FType`r`n"
    $raw += "--$bnd`r`nContent-Disposition: form-data; name=`"targetPhone`"`r`n`r`n$Phone`r`n"
    $raw += "--$bnd`r`nContent-Disposition: form-data; name=`"description`"`r`n`r`n$Desc`r`n"
    $raw += "--$bnd`r`nContent-Disposition: form-data; name=`"incidentAt`"`r`n`r`n$When`r`n"
    $raw += "--$bnd--"
    return Invoke-Safe @{
        Uri="$BASE/api/reports"; Method="POST"
        Body=[System.Text.Encoding]::UTF8.GetBytes($raw)
        Headers=@{"Content-Type"="multipart/form-data; boundary=$bnd"}
    }
}

function New-AdminSession {
    $sv = $null
    Invoke-WebRequest -Uri "$BASE/api/auth/login" -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"admin","password":"admin123"}' `
        -UseBasicParsing -SessionVariable sv | Out-Null
    return $sv
}

function Get-AuthPage([string]$Path, [object]$Session) {
    return Invoke-Safe @{ Uri="$BASE$Path"; WebSession=$Session }
}

# ================================================================
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  TEST SUITE: Scam Hotline Report App" -ForegroundColor Cyan
Write-Host "  $BASE" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# ── GROUP 1: Public Pages (HTML) ──────────────────────────────────
Write-Host "`n[GROUP 1] Public pages HTML structure" -ForegroundColor Yellow

$pg = Get-Page "/"
Test-Assert "Home page HTTP 200" ($pg.Code -eq 200)
Test-Assert "Home page has main heading" ($pg.Body -match "ng.*day.*n.*ng|duong day nong|hotline")
Test-Assert "Home page has /report link" ($pg.Body -match 'href="/report"')
Test-Assert "Home page has /lookup link" ($pg.Body -match 'href="/lookup"')
Test-Assert "Home page has emergency number 113" ($pg.Body -match "113")
Test-Assert "Home page has admin login link" ($pg.Body -match "admin")

$rp = Get-Page "/report"
Test-Assert "Report page HTTP 200" ($rp.Code -eq 200)
Test-Assert "Report page has fraudType field" ($rp.Body -match "fraudType")
Test-Assert "Report page has targetPhone field" ($rp.Body -match "targetPhone")
Test-Assert "Report page has anonymous checkbox" ($rp.Body -match "isAnonymous")
Test-Assert "Report page has file input" ($rp.Body -match 'type="file"')
Test-Assert "Report page has submit button" ($rp.Body -match 'type="submit"')

$lp = Get-Page "/lookup"
Test-Assert "Lookup page HTTP 200" ($lp.Code -eq 200)
Test-Assert "Lookup page has search input" ($lp.Body -match "lookup-input")
Test-Assert "Lookup page has search button" ($lp.Body -match "type.*submit|Kiem tra|Tra cuu")

$al = Get-Page "/admin/login"
Test-Assert "Admin login page HTTP 200" ($al.Code -eq 200)
Test-Assert "Admin login has username field" ($al.Body -match 'id="username"')
Test-Assert "Admin login has password field" ($al.Body -match 'type="password"')

# ── GROUP 2: Admin route protection ──────────────────────────────
Write-Host "`n[GROUP 2] Admin route protection (no auth)" -ForegroundColor Yellow

$dash = Get-Page "/admin/dashboard"
# Middleware redirects to login; Next.js follows redirect -> lands on login page
Test-Assert "Dashboard without auth -> redirected to login" (
    $dash.Body -match "admin/login|Dang nhap can bo|password" -or $dash.Code -eq 307 -or $dash.Code -eq 302
)

$reports = Get-Page "/admin/reports"
Test-Assert "Reports page without auth -> redirected to login" (
    $reports.Body -match "admin/login|password" -or $reports.Code -eq 307
)

# ── GROUP 3: Auth API ─────────────────────────────────────────────
Write-Host "`n[GROUP 3] Auth API" -ForegroundColor Yellow

$ok = Post-Json "/api/auth/login" '{"username":"admin","password":"admin123"}'
Test-Assert "Login correct credentials -> 200" ($ok.Code -eq 200)
Test-Assert "Login returns success:true" ($ok.Body -match '"success":true')
Test-Assert "Login returns username" ($ok.Body -match '"username":"admin"')

$bad = Post-Json "/api/auth/login" '{"username":"admin","password":"wrongpwd"}'
Test-Assert "Login wrong password -> 401" ($bad.Code -eq 401)

$empty = Post-Json "/api/auth/login" '{"username":"","password":""}'
Test-Assert "Login empty credentials -> 400 or 401" ($empty.Code -ge 400)

# ── GROUP 4: Submit Reports ───────────────────────────────────────
Write-Host "`n[GROUP 4] Submit reports (POST /api/reports)" -ForegroundColor Yellow

$PHONE_A = "0934567890"

$r1 = Send-Report -Phone $PHONE_A -FType "fake_police" `
    -Desc "Gia danh canh sat, yeu cau chuyen tien xac minh tai khoan ngan hang, da mat 30 trieu dong"
Test-Assert "Valid report (anonymous) -> 201" ($r1.Code -eq 201)
$parsed1 = $r1.Body | ConvertFrom-Json
Test-Assert "Response contains reportId" ($parsed1.reportId -ne $null -and $parsed1.reportId.Length -gt 5)
Test-Assert "Response success=true" ($parsed1.success -eq $true)
$rId1 = $parsed1.reportId
Write-Host "    -> reportId: $rId1" -ForegroundColor Gray

$r2 = Send-Report -Phone $PHONE_A -FType "fake_bank" -Anon $false `
    -Desc "Gia danh nhan vien Techcombank, yeu cau cung cap OTP de mo khoa tai khoan bi dong bang"
Test-Assert "Valid report (named) -> 201" ($r2.Code -eq 201)

$rBadType = Send-Report -Phone $PHONE_A -FType "" `
    -Desc "Bao cao hop le but thieu fraudType can bao loi"
Test-Assert "Missing fraudType -> 400" ($rBadType.Code -eq 400)

$rBadPhone = Send-Report -Phone "12" -FType "lottery" `
    -Desc "So dien thoai qua ngan phai bao loi nghiem ngat"
Test-Assert "targetPhone too short (<5) -> 400" ($rBadPhone.Code -eq 400)

$rBadDesc = Send-Report -Phone $PHONE_A -FType "fake_job" -Desc "Ngan"
Test-Assert "Description too short (<20) -> 400" ($rBadDesc.Code -eq 400)

# ── GROUP 5: URGENT FLAG (core business rule) ─────────────────────
Write-Host "`n[GROUP 5] *** URGENT FLAG: >= 3 reports / 7 days ***" -ForegroundColor Yellow

$URGENT_PHONE = "0988777666"

# Before any report
$pre = Get-Page "/api/lookup?q=$URGENT_PHONE"
$preD = $pre.Body | ConvertFrom-Json
Test-Assert "Pre: warningLevel=none (no reports yet)" ($preD.warningLevel -eq "none")
Test-Assert "Pre: totalCount=0" ($preD.totalCount -eq 0)

# Report #1
$u1 = Send-Report -Phone $URGENT_PHONE -FType "investment" `
    -Desc "San giao dich Forex gia mao, cam ket loi nhuan 30 phan tram moi thang, da mat 100 trieu"
Test-Assert "Report #1 -> 201" ($u1.Code -eq 201)
Write-Host "    Sent report #1 for $URGENT_PHONE" -ForegroundColor Gray

$after1 = (Get-Page "/api/lookup?q=$URGENT_PHONE").Body | ConvertFrom-Json
Test-Assert "After #1: warningLevel=warning" ($after1.warningLevel -eq "warning")
Test-Assert "After #1: totalCount=1" ($after1.totalCount -eq 1)
Test-Assert "After #1: recentCount=1" ($after1.recentCount -eq 1)
Write-Host "    -> warningLevel=$($after1.warningLevel), total=$($after1.totalCount)" -ForegroundColor Gray

# Report #2
$u2 = Send-Report -Phone $URGENT_PHONE -FType "investment" `
    -Desc "Tiep tuc moi goi dau tu tien ao, Website khong ro nguon goc, da bi mat toan bo von dau tu"
Test-Assert "Report #2 -> 201" ($u2.Code -eq 201)
Write-Host "    Sent report #2 for $URGENT_PHONE" -ForegroundColor Gray

$after2 = (Get-Page "/api/lookup?q=$URGENT_PHONE").Body | ConvertFrom-Json
Test-Assert "After #2: still warning (not urgent yet)" ($after2.warningLevel -eq "warning")
Test-Assert "After #2: totalCount=2" ($after2.totalCount -eq 2)
Write-Host "    -> warningLevel=$($after2.warningLevel), total=$($after2.totalCount)" -ForegroundColor Gray

# Report #3 — TRIGGERS urgent
$u3 = Send-Report -Phone $URGENT_PHONE -FType "investment" `
    -Desc "Lan thu ba so nay bi bao cao lua dao dau tu, nhieu nguoi trong to chuc da mat tien roi"
Test-Assert "Report #3 -> 201" ($u3.Code -eq 201)
Write-Host "    Sent report #3 for $URGENT_PHONE -- SHOULD TRIGGER URGENT" -ForegroundColor Gray

$after3 = (Get-Page "/api/lookup?q=$URGENT_PHONE").Body | ConvertFrom-Json

Write-Host ""
Write-Host "  === URGENT FLAG RESULT ===" -ForegroundColor Magenta
Write-Host "  Phone       : $URGENT_PHONE" -ForegroundColor White
Write-Host "  warningLevel: $($after3.warningLevel)" -ForegroundColor $(if($after3.warningLevel -eq "urgent"){"Red"}else{"Yellow"})
Write-Host "  totalCount  : $($after3.totalCount)" -ForegroundColor White
Write-Host "  recentCount : $($after3.recentCount) (last 7 days)" -ForegroundColor White
Write-Host ""

Test-Assert "*** After #3: warningLevel=URGENT ***" ($after3.warningLevel -eq "urgent") `
    "Got '$($after3.warningLevel)', expected 'urgent'"
Test-Assert "After #3: totalCount=3" ($after3.totalCount -eq 3)
Test-Assert "After #3: recentCount=3 (within 7 days)" ($after3.recentCount -eq 3)

# ── GROUP 6: Admin Dashboard Stats ───────────────────────────────
Write-Host "`n[GROUP 6] Admin Dashboard Stats" -ForegroundColor Yellow

$adm = New-AdminSession
$sR = Invoke-WebRequest -Uri "$BASE/api/stats" -UseBasicParsing -WebSession $adm
$sd = $sR.Content | ConvertFrom-Json
Test-Assert "GET /api/stats (auth) -> 200" ($sR.StatusCode -eq 200)
Test-Assert "Stats: summary.total > 0" ($sd.summary.total -gt 0)
Test-Assert "Stats: summary.urgent > 0" ($sd.summary.urgent -gt 0)
Test-Assert "Stats: byDay has 30 entries" ($sd.byDay.Count -eq 30)
Test-Assert "Stats: today has reports (byDay last entry > 0)" ($sd.byDay[-1].count -gt 0)
Test-Assert "Stats: byType not empty" ($sd.byType.Count -gt 0)
Test-Assert "Stats: topTargets not empty" ($sd.topTargets.Count -gt 0)
Test-Assert "Stats: top target is urgent" ($sd.topTargets[0].isUrgent -eq $true)
Test-Assert "Stats: top target count >= 3" ($sd.topTargets[0].count -ge 3)

Write-Host "    summary: total=$($sd.summary.total) urgent=$($sd.summary.urgent) new=$($sd.summary.new)" -ForegroundColor Gray
Write-Host "    top #1 : $($sd.topTargets[0].phone) count=$($sd.topTargets[0].count) urgent=$($sd.topTargets[0].isUrgent)" -ForegroundColor Gray
Write-Host "    byType : $($sd.byType | ForEach-Object { "$($_.label)=$($_.count)" } | Join-String -Separator ', ')" -ForegroundColor Gray

# ── GROUP 7: Reports List & Filters ──────────────────────────────
Write-Host "`n[GROUP 7] Reports list & filters" -ForegroundColor Yellow

$listR = Invoke-WebRequest -Uri "$BASE/api/reports" -UseBasicParsing -WebSession $adm
$ld = $listR.Content | ConvertFrom-Json
Test-Assert "GET /api/reports (auth) -> 200" ($listR.StatusCode -eq 200)
Test-Assert "Response has reports array" ($ld.reports -ne $null)
Test-Assert "Response has pagination" ($ld.pagination -ne $null)
Test-Assert "Total > 0" ($ld.pagination.total -gt 0)
Test-Assert "Urgent reports listed first" ($ld.reports[0].isUrgent -eq $true)

$fStatus = Invoke-WebRequest -Uri "$BASE/api/reports?status=new" -UseBasicParsing -WebSession $adm
$fsD = $fStatus.Content | ConvertFrom-Json
Test-Assert "Filter by status=new works" ($fsD.pagination.total -ge 0)

$fType = Invoke-WebRequest -Uri "$BASE/api/reports?fraudType=investment" -UseBasicParsing -WebSession $adm
$ftD = $fType.Content | ConvertFrom-Json
Test-Assert "Filter by fraudType=investment works" ($ftD.pagination.total -ge 3)

$fSearch = Invoke-WebRequest -Uri "$BASE/api/reports?search=$URGENT_PHONE" -UseBasicParsing -WebSession $adm
$fsrD = $fSearch.Content | ConvertFrom-Json
Test-Assert "Search by phone number works" ($fsrD.pagination.total -ge 3)

# Status update
$firstReportId = $ld.reports[0].id
$patch = Patch-Json "/api/reports/$firstReportId" '{"status":"processing"}' $adm
Test-Assert "PATCH report status -> 200" ($patch.Code -eq 200)
Test-Assert "Status updated to processing" ($patch.Body -match '"status":"processing"')
Write-Host "    Updated report $firstReportId -> status:processing" -ForegroundColor Gray

# Bad status
$badPatch = Patch-Json "/api/reports/$firstReportId" '{"status":"invalid_status"}' $adm
Test-Assert "PATCH invalid status -> 400" ($badPatch.Code -eq 400)

# ── GROUP 8: Export ───────────────────────────────────────────────
Write-Host "`n[GROUP 8] Export CSV & Excel" -ForegroundColor Yellow

$csvR = Invoke-WebRequest -Uri "$BASE/api/export?format=csv" -UseBasicParsing -WebSession $adm
Test-Assert "Export CSV -> 200" ($csvR.StatusCode -eq 200)
Test-Assert "CSV Content-Type correct" ($csvR.Headers["Content-Type"] -match "text/csv")
Test-Assert "CSV Content-Disposition has filename" ($csvR.Headers["Content-Disposition"] -match "canh-bao-khan")
Test-Assert "CSV has content (>100 chars)" ($csvR.Content.Length -gt 100)
Test-Assert "CSV has STT column header" ($csvR.Content -match "STT")
Test-Assert "CSV has urgent phone numbers" ($csvR.Content -match $URGENT_PHONE)
Write-Host "    CSV size: $($csvR.Content.Length) chars, urgent phone in CSV: $($csvR.Content -match $URGENT_PHONE)" -ForegroundColor Gray

$xlsR = Invoke-WebRequest -Uri "$BASE/api/export?format=xlsx" -UseBasicParsing -WebSession $adm
Test-Assert "Export Excel -> 200" ($xlsR.StatusCode -eq 200)
Test-Assert "Excel Content-Type correct" ($xlsR.Headers["Content-Type"] -match "spreadsheetml")
Test-Assert "Excel file size >1KB" ($xlsR.RawContentLength -gt 1000)
Write-Host "    Excel size: $($xlsR.RawContentLength) bytes" -ForegroundColor Gray

# ── GROUP 9: Security (no-auth API calls) ────────────────────────
Write-Host "`n[GROUP 9] Security: admin APIs reject unauthenticated requests" -ForegroundColor Yellow

$noR  = Invoke-Safe @{ Uri="$BASE/api/reports" }
Test-Assert "GET /api/reports without auth -> 401" ($noR.Code -eq 401)

$noS  = Invoke-Safe @{ Uri="$BASE/api/stats" }
Test-Assert "GET /api/stats without auth -> 401" ($noS.Code -eq 401)

$noE  = Invoke-Safe @{ Uri="$BASE/api/export" }
Test-Assert "GET /api/export without auth -> 401" ($noE.Code -eq 401)

$noP  = Invoke-Safe @{ Uri="$BASE/api/reports/$rId1"; Method="PATCH"
    Body='{"status":"resolved"}'; Headers=@{"Content-Type"="application/json"} }
Test-Assert "PATCH /api/reports without auth -> 401" ($noP.Code -eq 401)

$pubL = Invoke-Safe @{ Uri="$BASE/api/lookup?q=0901234567" }
Test-Assert "GET /api/lookup (public) without auth -> 200 OK" ($pubL.Code -eq 200)

# ── FINAL SUMMARY ─────────────────────────────────────────────────
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  FINAL RESULTS" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ("  PASS  : {0}" -f $PASS) -ForegroundColor Green
Write-Host ("  FAIL  : {0}" -f $FAIL) -ForegroundColor Red
Write-Host ("  TOTAL : {0}" -f $TOTAL) -ForegroundColor White
$pct = if ($TOTAL -gt 0) { [math]::Round(($PASS / $TOTAL) * 100, 1) } else { 0 }
$pctColor = if ($pct -ge 95) {"Green"} elseif ($pct -ge 80) {"Yellow"} else {"Red"}
Write-Host ("  RATE  : {0}%" -f $pct) -ForegroundColor $pctColor
Write-Host "=================================================" -ForegroundColor Cyan
if ($FAIL -eq 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "  $FAIL TESTS FAILED - check output above" -ForegroundColor Red
}
Write-Host "=================================================" -ForegroundColor Cyan
