<#
  session-brief.ps1 - SessionStart hook for the From Dust studio.

  DATA-DRIVEN off the per-agent cards in agents/<role>/<role>.md: each card's YAML
  frontmatter declares its `memory:` file and `memory_compact_at:` line budget, so new
  agents self-register just by existing - no role->path mapping is hardcoded here.

  Emits, as SessionStart additionalContext:
    - the recursive-learning doctrine reminder,
    - the latest release notes (CHANGELOG),
    - the newest crystallized memory entry per role,
    - a MAINTENANCE nudge for any memory file (or the shared session journal) over budget,
  then asks the agent to open with a brief executive summary.

  Output: a single JSON object on stdout (the SessionStart hook contract). Never throws
  in a way that fails the session - on any error it emits a minimal valid object.
#>
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Get-Block([string]$path, [string]$pattern, [int]$maxLines) {
  if (-not (Test-Path $path)) { return $null }
  $txt = Get-Content $path -Raw -Encoding UTF8
  $m = [regex]::Match($txt, $pattern)
  if (-not $m.Success) { return $null }
  $block = $m.Value.TrimEnd()
  if ($maxLines -gt 0) {
    $lines = $block -split "`r?`n"
    if ($lines.Count -gt $maxLines) {
      $block = (($lines | Select-Object -First $maxLines) -join "`n") + "`n  ... (truncated - see CHANGELOG.md)"
    }
  }
  return $block
}

function Get-NewestEntry([string]$path) {
  if (-not (Test-Path $path)) { return $null }
  $txt = Get-Content $path -Raw -Encoding UTF8
  $m = [regex]::Match($txt, '(?m)^### (.+)$')
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return $null
}

# Summarize one per-agent task doc (docs/tasks/<role>.md): status counts + top open titles.
# Emoji matched by codepoint (PS 5.1 mangles non-ASCII literals in script source).
function Get-LaneSummary([string]$path) {
  if (-not (Test-Path $path)) { return $null }
  $todo = [regex]::Escape([char]0x25FB)                       # white square (todo)
  $prog = [regex]::Escape([char]::ConvertFromUtf32(0x1F504))  # arrows (in-progress)
  $blk  = [regex]::Escape([char]0x26D4)                       # no-entry (blocked)
  $lines = Get-Content $path -Encoding UTF8
  $sum = @{ todo = 0; prog = 0; blocked = 0; top = @() }
  foreach ($l in $lines) {
    $isTodo = $l -match ('^- ' + $todo)
    if ($isTodo) { $sum.todo++ }
    elseif ($l -match ('^- ' + $prog)) { $sum.prog++ }
    elseif ($l -match ('^- ' + $blk)) { $sum.blocked++ }
    if ($isTodo -and $sum.top.Count -lt 3 -and $l -match '\*\*(.+?)\*\*') {
      $t = $matches[1]
      if ($t.Length -gt 64) { $t = $t.Substring(0, 61) + '...' }
      $sum.top += $t
    }
  }
  return $sum
}

# Parse an agent card's YAML frontmatter (the keys we care about) into a hashtable.
function Get-Card([string]$path) {
  if (-not (Test-Path $path)) { return $null }
  $txt = Get-Content $path -Raw -Encoding UTF8
  $m = [regex]::Match($txt, '(?s)^---\s*\r?\n(.*?)\r?\n---')
  if (-not $m.Success) { return $null }
  $card = @{ file = $path }
  foreach ($line in ($m.Groups[1].Value -split "`r?`n")) {
    if ($line -match '^\s*(agent|title|memory|memory_compact_at)\s*:\s*(.+?)\s*$') {
      $card[$matches[1]] = $matches[2].Trim()
    }
  }
  if (-not $card.ContainsKey('agent')) { return $null }
  return $card
}

try {
  $sb = [System.Text.StringBuilder]::new()
  [void]$sb.AppendLine('[From Dust - session start briefing]')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('DOCTRINE (recursive learning): at the end of a substantive session, crystallize your')
  [void]$sb.AppendLine('highest-level, transferable lessons into your role''s memory (agents/<role>/memory.md;')
  [void]$sb.AppendLine('CD: studio/creative-director/LEARNINGS.md), and compact it yourself when it grows past the')
  [void]$sb.AppendLine('card''s memory_compact_at. See studio/STUDIO.md.')
  [void]$sb.AppendLine('')

  $rel = Get-Block (Join-Path $root 'CHANGELOG.md') '(?ms)^## \[\d+\.\d+\.\d+\].*?(?=^## \[|\z)' 28
  if ($rel) {
    [void]$sb.AppendLine('LATEST RELEASE (CHANGELOG.md):')
    [void]$sb.AppendLine($rel)
    [void]$sb.AppendLine('')
  }

  # Discover the craft-role cards (data-driven). CD is not an agents/ card - appended explicitly.
  $order = @('engineer', 'product', 'artist')
  $cards = @()
  foreach ($r in $order) {
    $c = Get-Card (Join-Path $root ("agents/{0}/{0}.md" -f $r))
    if ($c) { $cards += $c }
  }

  # Newest crystallized memory entry per role.
  $lb = [System.Text.StringBuilder]::new()
  foreach ($c in $cards) {
    $title = if ($c.ContainsKey('title')) { $c.title } else { $c.agent }
    $entry = Get-NewestEntry (Join-Path $root $c.memory)
    if ($entry) { [void]$lb.AppendLine(('- {0}: {1}' -f $title, $entry)) }
  }
  $cd = Get-NewestEntry (Join-Path $root 'studio/creative-director/LEARNINGS.md')
  if ($cd) { [void]$lb.AppendLine(('- Creative Director: {0}' -f $cd)) }
  if ($lb.Length -gt 0) {
    [void]$sb.AppendLine('NEWEST CRYSTALLIZED MEMORY PER ROLE:')
    [void]$sb.Append($lb.ToString())
    [void]$sb.AppendLine('')
  }

  # MAINTENANCE: memory files over their declared budget + the shared session journal.
  $over = @()
  foreach ($c in $cards) {
    $memPath = Join-Path $root $c.memory
    if (Test-Path $memPath) {
      $lines = (Get-Content $memPath | Measure-Object -Line).Lines
      $budget = 0; [void][int]::TryParse([string]$c.memory_compact_at, [ref]$budget)
      if ($budget -gt 0 -and $lines -gt $budget) {
        $over += ('{0} ({1} lines > {2})' -f $c.memory, $lines, $budget)
      }
    }
  }
  $journal = Join-Path $root 'docs/SESSION_JOURNAL.md'
  if (Test-Path $journal) {
    $jlines = (Get-Content $journal | Measure-Object -Line).Lines
    if ($jlines -gt 400) { $over += ('docs/SESSION_JOURNAL.md ({0} lines > 400)' -f $jlines) }
  }
  if ($over.Count -gt 0) {
    [void]$sb.AppendLine('MAINTENANCE (self-compact before ending a substantive session):')
    foreach ($o in $over) { [void]$sb.AppendLine(('- ' + $o)) }
    [void]$sb.AppendLine('Compact each: merge overlapping entries, supersede outdated ones, raise altitude; move')
    [void]$sb.AppendLine('superseded raw entries to agents/<role>/archive/ (the journal archives by session block).')
    [void]$sb.AppendLine('')
  }

  # Per-agent task docs: open counts per lane + the engineer's (default role) top open items.
  $laneOrder = @(@('engineer', 'Engineer'), @('pm', 'PM'), @('artist', 'Artist'))
  $tb = [System.Text.StringBuilder]::new()
  $pendingCanaries = 0
  foreach ($pair in $laneOrder) {
    $lanePath = Join-Path $root ('docs/tasks/{0}.md' -f $pair[0])
    $s = Get-LaneSummary $lanePath
    if ($null -eq $s) { continue }
    $counts = ('{0} todo / {1} in-progress / {2} blocked' -f $s.todo, $s.prog, $s.blocked)
    [void]$tb.AppendLine(('- {0}: {1}' -f $pair[1], $counts))
    if ($pair[0] -eq 'engineer' -and $s.top.Count -gt 0) {
      foreach ($t in $s.top) { [void]$tb.AppendLine(('    top: ' + $t)) }
    }
    foreach ($l in (Get-Content $lanePath -Encoding UTF8)) {
      if ($l -match '(?i)canary' -and $l -match '(?i)pending') { $pendingCanaries++ }
    }
  }
  if ($tb.Length -gt 0) {
    [void]$sb.AppendLine('TASK DOCS (docs/tasks/<role>.md - your lane is your backlog):')
    [void]$sb.Append($tb.ToString())
    if ($pendingCanaries -gt 0) {
      [void]$sb.AppendLine(('- ! {0} task line(s) mention a PENDING canary - close them with: node tools/canary/run.mjs' -f $pendingCanaries))
    }
    [void]$sb.AppendLine('')
  }

  # Deploy-gate hook active in this clone? (tools/install-githooks.ps1 sets core.hooksPath)
  $hooksPath = ''
  try { $hooksPath = (git -C $root config core.hooksPath) } catch {}
  if ($hooksPath -ne 'tools/githooks') {
    [void]$sb.AppendLine('SETUP: the git deploy gate is NOT active in this clone - run tools/install-githooks.ps1')
    [void]$sb.AppendLine('(sets core.hooksPath=tools/githooks; holds deploy-affecting pushes for Josh''s auth).')
    [void]$sb.AppendLine('')
  }

  [void]$sb.AppendLine('INSTRUCTION: before anything else, open this session with a super-brief (<=5 line)')
  [void]$sb.AppendLine('executive summary of the latest updates and learnings above, then await direction.')

  $out = @{ hookSpecificOutput = @{ hookEventName = 'SessionStart'; additionalContext = $sb.ToString() } }
  $out | ConvertTo-Json -Depth 6 -Compress
}
catch {
  @{ hookSpecificOutput = @{ hookEventName = 'SessionStart'; additionalContext = '[From Dust] Session-brief hook error: ' + $_.Exception.Message } } | ConvertTo-Json -Depth 6 -Compress
}
