<#
  session-brief.ps1 - SessionStart hook for the From Dust studio.

  Gathers the latest release notes (CHANGELOG) + the newest crystallized learning
  from each role's LEARNINGS file, and emits them as SessionStart additionalContext
  with an instruction to open the session with a super-brief executive summary and a
  reminder of the recursive-learning crystallization doctrine.

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

function Get-NewestLearning([string]$path) {
  if (-not (Test-Path $path)) { return $null }
  $txt = Get-Content $path -Raw -Encoding UTF8
  $m = [regex]::Match($txt, '(?m)^### (.+)$')
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return $null
}

try {
  $sb = [System.Text.StringBuilder]::new()
  [void]$sb.AppendLine('[From Dust - session start briefing]')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('DOCTRINE (recursive learning): at the end of a substantive session, crystallize your')
  [void]$sb.AppendLine('highest-level, transferable lessons into your role''s LEARNINGS.md (engineer:')
  [void]$sb.AppendLine('docs/learnings/engineer.md; PM: product/LEARNINGS.md; artist: artist/LEARNINGS.md;')
  [void]$sb.AppendLine('CD: studio/creative-director/LEARNINGS.md). See studio/STUDIO.md.')
  [void]$sb.AppendLine('')

  $rel = Get-Block (Join-Path $root 'CHANGELOG.md') '(?ms)^## \[\d+\.\d+\.\d+\].*?(?=^## \[|\z)' 28
  if ($rel) {
    [void]$sb.AppendLine('LATEST RELEASE (CHANGELOG.md):')
    [void]$sb.AppendLine($rel)
    [void]$sb.AppendLine('')
  }

  $roles = @(
    @{ n = 'Engineer';          p = (Join-Path $root 'docs/learnings/engineer.md') },
    @{ n = 'Product Manager';   p = (Join-Path $root 'product/LEARNINGS.md') },
    @{ n = 'Artist';            p = (Join-Path $root 'artist/LEARNINGS.md') },
    @{ n = 'Creative Director'; p = (Join-Path $root 'studio/creative-director/LEARNINGS.md') }
  )
  $any = $false
  $lb = [System.Text.StringBuilder]::new()
  foreach ($r in $roles) {
    $t = Get-NewestLearning $r.p
    if ($t) { [void]$lb.AppendLine(('- {0}: {1}' -f $r.n, $t)); $any = $true }
  }
  if ($any) {
    [void]$sb.AppendLine('NEWEST CRYSTALLIZED LEARNING PER ROLE:')
    [void]$sb.Append($lb.ToString())
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
