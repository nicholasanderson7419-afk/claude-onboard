# claude-onboard - one-line installer for Windows
# Usage:
#   irm https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.ps1 | iex

$ErrorActionPreference = 'Stop'
function Section($t) { Write-Host "`n>>> $t" -ForegroundColor Cyan }
function Have($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

Write-Host "`n=== claude-onboard: all-in-one Claude setup ===" -ForegroundColor Green

Section "Installing apps (winget - can take a few minutes)"
Write-Host "  installing the Claude desktop app ..."
winget install --id Anthropic.Claude -e --accept-source-agreements --accept-package-agreements 2>$null | Out-Null
Write-Host "  installing Obsidian (notes app) ..."
winget install --id Obsidian.Obsidian -e --accept-source-agreements --accept-package-agreements 2>$null | Out-Null
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
function Test-ClaudeAuth { try { return ((claude auth status 2>$null | Out-String) -match '"loggedIn"\s*:\s*true') } catch { return $false } }
if (-not (Test-ClaudeAuth)) {
  Write-Host "  A sign-in will open - log into your Anthropic account, then come back here." -ForegroundColor Yellow
  claude auth login
}
if (-not (Test-ClaudeAuth)) {
  Write-Host "  Not signed in yet. Run 'claude auth login', then paste the install line again." -ForegroundColor Yellow
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

Section "Configuring everything (no questions - using recommended defaults)"
npm install --silent
node bin/cli.js --express

Write-Host "`n[OK] All set!  Open the Claude app -> Code tab -> open Desktop\Projects -> type /om-standup`n" -ForegroundColor Green
