<#
  release.ps1 - cut a versioned release of To Dust.

  Promotes the CHANGELOG "[Unreleased]" section to a numbered version, commits that,
  creates an annotated git tag, and pushes both main and the tag (which redeploys via
  GitHub Pages). This makes the deployed build a named, retrievable version:
      git checkout vX.Y.Z   /   git show vX.Y.Z:index.html

  Run AFTER your build (index.html etc.) is already committed to main - this script
  refuses to run with other pending tracked changes, so a tag always points at a
  committed build.

  Usage:
      .\tools\release.ps1 0.10.1
      .\tools\release.ps1 v0.11.0 "Boss rework + new shrine"
#>
param(
  [Parameter(Mandatory=$true)][string]$Version,
  [string]$Message
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Normalize: tag is vX.Y.Z, CHANGELOG heading is X.Y.Z
$ver = $Version.TrimStart('v','V')
if ($ver -notmatch '^\d+\.\d+\.\d+$') { Write-Error "Version must be X.Y.Z (e.g. 0.10.1)"; exit 1 }
$tag = "v$ver"

# Must be on main (Pages deploys from main)
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { Write-Error "On '$branch', not main - releases deploy from main."; exit 1 }

# Tag must be new
if (git tag --list $tag) { Write-Error "Tag $tag already exists."; exit 1 }

# Build must already be committed: no pending TRACKED changes except CHANGELOG.md
$dirty = git status --porcelain --untracked-files=no | Where-Object { $_ -and ($_ -notmatch 'CHANGELOG\.md$') }
if ($dirty) { Write-Error ("Commit your build first. Pending changes:`n" + ($dirty -join "`n")); exit 1 }

# Promote CHANGELOG: insert the version heading right under the first [Unreleased]
$clPath = Join-Path $root 'CHANGELOG.md'
$text = Get-Content $clPath -Raw -Encoding UTF8  # WS 5.1 default is cp1252; UTF-8 file would mojibake
if ($text -notmatch '## \[Unreleased\]') { Write-Error "No '## [Unreleased]' heading in CHANGELOG.md"; exit 1 }
$unrel = [regex]::Match($text, '## \[Unreleased\](.*?)(?=\n## \[)', 'Singleline').Groups[1].Value
if ($unrel.Trim() -eq '') { Write-Error "The [Unreleased] section is empty - add entries before releasing."; exit 1 }
$date = Get-Date -Format 'yyyy-MM-dd'
$text2 = [regex]::new('## \[Unreleased\]').Replace($text, "## [Unreleased]`n`n## [$ver] - $date", 1)
[System.IO.File]::WriteAllText($clPath, $text2, [System.Text.UTF8Encoding]::new($false))  # UTF-8, no BOM

# Commit, tag, push
if (-not $Message) { $Message = "Release $tag" }
git add CHANGELOG.md
git commit -m $Message
git tag -a $tag -m $Message
git push origin main
git push origin $tag

Write-Host ""
Write-Host "Released $tag - CHANGELOG promoted, committed, tagged, pushed (Pages will redeploy)." -ForegroundColor Green
Write-Host "Retrieve this build later with:  git show ${tag}:index.html"
