[CmdletBinding()]
param(
    [string]$GameDir = $env:MORTAL_GAME_DIR,
    [string]$Langs = "zh-tw,zh-cn",
    [string]$BuildLangs = "zh-tw",
    [switch]$Force,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root
$env:PYTHONIOENCODING = "utf-8"

try {
    Write-Host "== environment ==" -ForegroundColor Cyan
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) { throw "python not found on PATH; install Python 3.10+ and add it to PATH" }
    python -c "import UnityPy" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "UnityPy is missing; run: python -m pip install -r requirements.txt"
    }
    if (-not $GameDir) {
        throw "game directory not set; pass -GameDir or set the MORTAL_GAME_DIR environment variable"
    }
    Write-Host ("python   {0}" -f (python --version))
    Write-Host ("game dir {0}" -f $GameDir)

    Write-Host "`n== extract scripts and locale tables ==" -ForegroundColor Cyan
    $extractArgs = @("extract.py", "--game", $GameDir, "--langs", $Langs)
    if ($Force) { $extractArgs += "--force" }
    python @extractArgs
    if ($LASTEXITCODE -ne 0) { throw "extract.py failed (exit code $LASTEXITCODE)" }

    Write-Host "`n== build explorer data ==" -ForegroundColor Cyan
    python "build.py" "--langs" $BuildLangs
    if ($LASTEXITCODE -ne 0) { throw "build.py failed (exit code $LASTEXITCODE)" }

    Write-Host "`n== build web bundle ==" -ForegroundColor Cyan
    $web = Join-Path $root "web"
    $modules = Join-Path $web "node_modules"
    Push-Location $web
    try {
        if (-not (Test-Path $modules)) {
            npm install --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw "npm install failed (exit code $LASTEXITCODE)" }
        }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed (exit code $LASTEXITCODE)" }
    } finally {
        Pop-Location
    }

    $site = Join-Path $root "docs"
    $index = Join-Path $site "index.html"
    $assets = Join-Path $site "assets"
    if (-not (Test-Path $index)) { throw "docs/index.html not found" }
    if (-not (Test-Path $assets)) { throw "docs/assets not found" }

    Write-Host "`n== done ==" -ForegroundColor Green
    Write-Host ("report: {0}" -f (Join-Path $root "data" "report.json"))
    if (-not $NoBrowser) {
        $port = 8123
        $pythonPath = if ($python.Source) { $python.Source } else { "python" }
        $pythonPath = $pythonPath.Replace("'", "''")
        $url = "http://localhost:{0}/" -f $port
        Write-Host ("serving {0} at {1}" -f $site, $url)
        Start-Process pwsh -WorkingDirectory $site -ArgumentList @(
            "-NoExit",
            "-Command",
            "& '$pythonPath' -m http.server $port"
        )
        Start-Process $url
    } else {
        Write-Host ("serve with: python -m http.server 8123 --directory `"{0}`"" -f $site)
    }
} finally {
    Pop-Location
}
