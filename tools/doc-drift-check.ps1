# Doc-drift nudge — Claude Code Stop hook.
#
# Fires when Claude finishes a turn. If index.html has uncommitted changes but none
# of the project docs do, it prints a one-line reminder (as a Stop-hook systemMessage)
# to update the docs before committing. Throttled so it nudges at most once per 20 min.
#
# Costs no model tokens (systemMessage shows in the UI, not to the model). Once you DO
# touch a doc (or commit everything), the condition goes false and it stays quiet.
#
# -Porcelain lets tests inject a synthetic `git status --porcelain` instead of shelling out.

param([string]$Porcelain = $null)

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot          # tools/ -> repo root

# Read the working-tree status (real git unless a test override was passed).
if ($null -eq $Porcelain) {
    $Porcelain = (& git -C $root status --porcelain) -join "`n"
    if (-not $?) { exit 0 }                         # not a git repo / git missing
}
$changed = $Porcelain -split "`n" | Where-Object { $_ -ne '' } | ForEach-Object { $_.Substring([Math]::Min(3, $_.Length)) }

$codeDirty = @($changed | Where-Object { $_ -match 'index\.html$' }).Count -gt 0
$docsDirty = @($changed | Where-Object { $_ -match '(CHANGELOG\.md|CLAUDE\.md|SESSION_JOURNAL\.md|DUNGEON_FORGE_CTO_DOC\.md)$' }).Count -gt 0

if (-not ($codeDirty -and -not $docsDirty)) { exit 0 }   # nothing to nag about

# Throttle: at most one nudge per 20 minutes (sentinel lives in .git, never committed).
$stamp = Join-Path $root '.git/.doc-drift-last'
$now   = [int][double]::Parse((Get-Date -UFormat %s))
if (Test-Path $stamp) {
    $last = 0; [int]::TryParse((Get-Content $stamp -Raw).Trim(), [ref]$last) | Out-Null
    if (($now - $last) -lt 1200) { exit 0 }
}
Set-Content -Path $stamp -Value $now -NoNewline

$msg = 'NOTE: index.html changed but the docs (CHANGELOG / SESSION_JOURNAL / CLAUDE.md) have not - update them before committing.'
Write-Output (@{ systemMessage = $msg } | ConvertTo-Json -Compress)
exit 0
