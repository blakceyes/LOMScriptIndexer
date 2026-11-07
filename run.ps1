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
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
        throw "uv not found on PATH; run: python -m pip install --user uv"
    }
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        throw "pnpm not found on PATH; run: corepack enable pnpm"
    }
    if (-not $GameDir) {
        throw "game directory not set; pass -GameDir or set the MORTAL_GAME_DIR environment variable"
    }
    Write-Host ("uv    {0}" -f ((uv --version) -replace "^uv\s+", ""))
    Write-Host ("game  {0}" -f $GameDir)

    Write-Host "`n== sync python environment ==" -ForegroundColor Cyan
    uv sync
    if ($LASTEXITCODE -ne 0) { throw "uv sync failed (exit code $LASTEXITCODE)" }

    Write-Host "`n== extract scripts and locale tables ==" -ForegroundColor Cyan
    $extractArgs = @("scriptindexer-extract", "--game", $GameDir, "--langs", $Langs)
    if ($Force) { $extractArgs += "--force" }
    uv run @extractArgs
    if ($LASTEXITCODE -ne 0) { throw "scriptindexer-extract failed (exit code $LASTEXITCODE)" }

    Write-Host "`n== build script index data ==" -ForegroundColor Cyan
    uv run scriptindexer-build --langs $BuildLangs
    if ($LASTEXITCODE -ne 0) { throw "scriptindexer-build failed (exit code $LASTEXITCODE)" }

    Write-Host "`n== build web bundle ==" -ForegroundColor Cyan
    $web = Join-Path $root "web"
    $modules = Join-Path $web "node_modules"
    Push-Location $web
    try {
        if (-not (Test-Path $modules)) {
            pnpm install --frozen-lockfile
            if ($LASTEXITCODE -ne 0) { throw "pnpm install failed (exit code $LASTEXITCODE)" }
        }
        pnpm build
        if ($LASTEXITCODE -ne 0) { throw "pnpm build failed (exit code $LASTEXITCODE)" }
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
        $pythonPath = if (Get-Command python -ErrorAction SilentlyContinue) {
            (Get-Command python).Source
        } else {
            "python"
        }
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
