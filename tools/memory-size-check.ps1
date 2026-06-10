# Memory-size nudge — Claude Code Stop hook.
#
# Fires when Claude finishes a turn. Data-driven off the per-agent cards in
# agents/<role>/<role>.md: each card's frontmatter declares its `memory:` file and
# `memory_compact_at:` line budget. Also checks the shared docs/SESSION_JOURNAL.md (>400).
# If anything is over budget it prints a one-line systemMessage nudge to compact/archive,
# throttled to at most once per 20 min.
#
# WHY a nudge, not an auto-edit: compaction is value-preserving (merge/supersede/raise-
# altitude, archive superseded entries) - a judgment task the agent owns, not a mechanical
# line move. The model-facing instruction is surfaced at SessionStart by session-brief.ps1;
# this Stop hook is the in-session UI nudge to Josh.
#
# Costs no model tokens (systemMessage shows in the UI, not to the model).

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot          # tools/ -> repo root

function Get-CardBudget([string]$path) {
  # returns @{ memory = <rel path>; budget = <int> } or $null
  if (-not (Test-Path $path)) { return $null }
  $txt = Get-Content $path -Raw -Encoding UTF8
  $m = [regex]::Match($txt, '(?s)^---\s*\r?\n(.*?)\r?\n---')
  if (-not $m.Success) { return $null }
  $mem = $null; $budget = 0
  foreach ($line in ($m.Groups[1].Value -split "`r?`n")) {
    if ($line -match '^\s*memory\s*:\s*(.+?)\s*$')            { $mem = $matches[1].Trim() }
    elseif ($line -match '^\s*memory_compact_at\s*:\s*(\d+)') { $budget = [int]$matches[1] }
  }
  if ($mem -and $budget -gt 0) { return @{ memory = $mem; budget = $budget } }
  return $null
}

$over = @()

# Per-agent memories (any agents/<role>/<role>.md card).
foreach ($d in (Get-ChildItem (Join-Path $root 'agents') -Directory -ErrorAction SilentlyContinue)) {
  $card = Join-Path $d.FullName ($d.Name + '.md')
  $cb = Get-CardBudget $card
  if ($null -eq $cb) { continue }
  $memPath = Join-Path $root $cb.memory
  if (Test-Path $memPath) {
    $lines = (Get-Content $memPath | Measure-Object -Line).Lines
    if ($lines -gt $cb.budget) { $over += ('{0} ({1}>{2})' -f $cb.memory, $lines, $cb.budget) }
  }
}

# Shared session journal (archived by session block, not per-agent).
$journal = Join-Path $root 'docs/SESSION_JOURNAL.md'
if (Test-Path $journal) {
  $jlines = (Get-Content $journal | Measure-Object -Line).Lines
  if ($jlines -gt 400) { $over += ('docs/SESSION_JOURNAL.md ({0}>400)' -f $jlines) }
}

if ($over.Count -eq 0) { exit 0 }                  # nothing to nag about

# Throttle: at most one nudge per 20 minutes (sentinel lives in .git, never committed).
$stamp = Join-Path $root '.git/.memory-size-last'
$now   = [int][double]::Parse((Get-Date -UFormat %s))
if (Test-Path $stamp) {
  $last = 0; [void][int]::TryParse((Get-Content $stamp -Raw).Trim(), [ref]$last)
  if (($now - $last) -lt 1200) { exit 0 }
}
Set-Content -Path $stamp -Value $now -NoNewline

$msg = 'NOTE: over budget - ' + ($over -join '; ') + '. Self-compact (merge/supersede/raise-altitude; archive superseded entries) before ending the session.'
Write-Output (@{ systemMessage = $msg } | ConvertTo-Json -Compress)
exit 0
