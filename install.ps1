# claude-onboard - one-line installer for Windows
# Usage:
#   irm https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.ps1 | iex
#
# NOTE: intentionally NO $ErrorActionPreference='Stop'. winget and other native
# tools write progress/warnings to stderr; under EAP Stop, PowerShell 5.1 turns
# that stderr into a TERMINATING error and kills the whole script silently.
# (Confirmed root cause of the "zero plugins / no Obsidian" failure, 2026-06-11.)
# Each step checks its own exit code and reports loudly instead.
$ErrorActionPreference = 'Continue'

function Section($t) { Write-Host "`n>>> $t" -ForegroundColor Cyan }
function Have($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Fail($t) { Write-Host "`n[FAILED] $t" -ForegroundColor Red }
function Refresh-Path {
  # Hardcode known Git install locations so we find git even if the NSIS installer
  # hasn't finished flushing its PATH writes to the registry yet (PS 5.1 race).
  $gitPaths = @(
    "$env:ProgramFiles\Git\cmd",
    "$env:ProgramFiles\Git\bin",
    "${env:ProgramFiles(x86)}\Git\cmd",
    "$env:LOCALAPPDATA\Programs\Git\cmd"
  ) -join ';'
  $wingetLinks = "$env:LOCALAPPDATA\Microsoft\WinGet\Links"
  $claudeBin   = "$HOME\.local\bin"
  $extra = "$claudeBin;$wingetLinks;$gitPaths"
  $env:Path = $extra + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

# Install one winget package; report the real result. Never redirect stderr
# (winget writes progress there - redirecting it is what killed v1 of this script).
function Install-Pkg($id, $label) {
  Write-Host "  installing $label ($id) ..."
  winget install --id $id -e --accept-source-agreements --accept-package-agreements | Out-Null
  $code = $LASTEXITCODE
  # winget: 0 = installed, -1978335189 (0x8A15002B) = already installed / no applicable upgrade
  if ($code -eq 0 -or $code -eq -1978335189) { Write-Host "  [OK] $label" -ForegroundColor Green; return $true }
  Write-Host "  [FAIL] $label (winget exit $code) - continuing, will re-check later" -ForegroundColor Yellow
  return $false
}

Write-Host "`n=== claude-onboard: all-in-one Claude setup ===" -ForegroundColor Green

Section "Installing apps (winget - can take a few minutes)"
Write-Host "  [SKIP] Claude desktop app - you already have it installed" -ForegroundColor Green
Install-Pkg 'Obsidian.Obsidian'    'Obsidian (notes app)' | Out-Null
if (Have claude) { Write-Host "  [OK] Claude Code CLI: already installed" -ForegroundColor Green }
else { Install-Pkg 'Anthropic.ClaudeCode' 'Claude Code CLI' | Out-Null }
if (Have node)   { Write-Host "  [OK] Node.js: already installed" -ForegroundColor Green }
else { Install-Pkg 'OpenJS.NodeJS.LTS' 'Node.js LTS' | Out-Null }
if (Have git)    { Write-Host "  [OK] Git: already installed" -ForegroundColor Green }
else {
  Install-Pkg 'Git.Git' 'Git' | Out-Null
  Start-Sleep -Seconds 3  # NSIS installer flushes PATH to registry async; give it a moment
}
# Python: several ECC library skills shell out to python scripts.
if (Have python) { Write-Host "  [OK] Python: already installed" -ForegroundColor Green }
else { Install-Pkg 'Python.Python.3.12' 'Python 3.12' | Out-Null }
Refresh-Path

Section "Checking the tools are reachable"
$missing = @()
foreach ($c in @('claude', 'node', 'git')) {
  if (Have $c) { Write-Host "  [OK] $c on PATH" -ForegroundColor Green }
  else { Write-Host "  [MISSING] $c" -ForegroundColor Red; $missing += $c }
}
if ($missing.Count -gt 0) {
  Fail "These tools are not reachable yet: $($missing -join ', '). Close this window, open a NEW PowerShell window, and paste the install line again - a fresh window picks up the new PATH."
  return
}

Section "Signing in to Claude"
function Test-ClaudeAuth { try { return ((claude auth status 2>&1 | Out-String) -match '"loggedIn"\s*:\s*true') } catch { return $false } }
if (-not (Test-ClaudeAuth)) {
  Write-Host "  A sign-in will open - log into your Anthropic account, then come back here." -ForegroundColor Yellow
  claude auth login
}
if (-not (Test-ClaudeAuth)) {
  Fail "Not signed in. Run 'claude auth login' (needs a Claude Pro/Max/Team plan), then paste the install line again."
  return
}
# Plan gate: the plugin/skill stack needs a paid plan. `claude auth status` reports
# subscriptionType (e.g. "max") for claude.ai logins.
$authOut = claude auth status 2>&1 | Out-String
if ($authOut -match '"subscriptionType"\s*:\s*"([^"]+)"') {
  $plan = $Matches[1]
  if ($plan -eq 'free') {
    Fail "This account is on the FREE plan. The setup needs Claude Pro or Max. Upgrade at claude.ai/upgrade, then paste the install line again."
    return
  }
  Write-Host "  signed in (plan: $plan)." -ForegroundColor Green
} else {
  Write-Host "  signed in. [WARN] could not confirm plan tier - if plugins fail to install, check that this account has Pro or Max." -ForegroundColor Yellow
}

Section "Getting the setup"
$desktop = [Environment]::GetFolderPath('Desktop')   # OneDrive-aware real Desktop
$base = Join-Path $desktop 'Projects'
$dest = Join-Path $base 'claude-onboard'
New-Item -ItemType Directory -Force -Path $base | Out-Null
if (Test-Path (Join-Path $dest '.git')) { git -C $dest pull --quiet }
else { git clone --depth 1 https://github.com/nicholasanderson7419-afk/claude-onboard.git $dest }
if (-not (Test-Path (Join-Path $dest 'bin\cli.js'))) {
  Fail "Could not download the setup (git clone failed). Check your internet connection and re-run."
  return
}
Set-Location $dest

Section "Setting up your Claude (a couple quick questions to tailor it)"
npm install --silent
if ($LASTEXITCODE -ne 0) {
  Fail "npm install failed (exit $LASTEXITCODE). Re-run the install line; if it persists, run 'npm install' inside $dest to see the error."
  return
}
node bin/cli.js --guided --project "$base"
$wizardExit = $LASTEXITCODE

Section "Verifying installation"
Write-Host "  Plugins installed:"
$pluginOut = claude plugin list 2>&1 | Out-String
if ($pluginOut -match '\S') { Write-Host $pluginOut } else { Write-Host "  (none - check errors above)" -ForegroundColor Yellow }
if ($wizardExit -ne 0) {
  Write-Host "[WARN] Setup wizard exited with code $wizardExit - some items may not have installed." -ForegroundColor Yellow
  Write-Host "  Run 'claude plugin list' to check. If plugins are missing, re-run this installer." -ForegroundColor Yellow
}

Write-Host "`n[OK] All set!  Open the Claude app -> Code tab -> open '$base' -> start talking. Your vault is at '$base\vault' - open it in Obsidian once and click 'Enable community plugins'." -ForegroundColor Green
Write-Host "One more thing for email: go to claude.ai -> Settings -> Connectors -> connect Gmail (one click). That gives your email assistant inbox access.`n" -ForegroundColor Cyan
