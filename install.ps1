# claude-onboard — one-line installer for Windows
# Usage:
#   irm https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.ps1 | iex

$ErrorActionPreference = 'Stop'
function Section($t) { Write-Host "`n>>> $t" -ForegroundColor Cyan }
function Have($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

Write-Host "`n=== claude-onboard: all-in-one Claude setup ===" -ForegroundColor Green

Section "Installing tools (winget — can take a few minutes)"
Write-Host "  installing the Claude desktop app (Anthropic.Claude) ..."
winget install --id Anthropic.Claude -e --accept-source-agreements --accept-package-agreements 2>$null | Out-Null
$pkgs = @(
  @{ id = 'Anthropic.ClaudeCode'; cmd = 'claude' },
  @{ id = 'OpenJS.NodeJS.LTS';    cmd = 'node'   },
  @{ id = 'Git.Git';              cmd = 'git'    }
)
foreach ($p in $pkgs) {
  if (Have $p.cmd) { Write-Host "  $($p.cmd): already installed" }
  else {
    Write-Host "  installing $($p.id) ..."
    winget install --id $p.id -e --accept-source-agreements --accept-package-agreements | Out-Null
  }
}
Refresh-Path

Section "Signing in to Claude"
$authed = $false
try { & claude -p "ok" 1>$null 2>$null; if ($LASTEXITCODE -eq 0) { $authed = $true } } catch {}
if (-not $authed) {
  Write-Host "  One manual step: open the Claude app (or run 'claude') and sign in," -ForegroundColor Yellow
  Write-Host "  then run this installer again. Nothing else is needed." -ForegroundColor Yellow
  return
}
Write-Host "  signed in."

Section "Getting the setup"
$base = Join-Path $HOME 'Desktop\Projects'
$dest = Join-Path $base 'claude-onboard'
New-Item -ItemType Directory -Force -Path $base | Out-Null
if (Test-Path (Join-Path $dest '.git')) { git -C $dest pull --quiet }
else { git clone --depth 1 https://github.com/nicholasanderson7419-afk/claude-onboard.git $dest }
Set-Location $dest

Section "Configuring everything (no questions — using recommended defaults)"
npm install --silent
node bin/cli.js --express

Write-Host "`n[OK] All set!  Open the Claude app -> Code tab -> open Desktop\Projects -> type /om-standup`n" -ForegroundColor Green
