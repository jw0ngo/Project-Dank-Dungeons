# Uncommitted-work reminder — Claude Code SessionEnd hook.
#
# Fires when a session ends (/clear, /quit, exit). If the working tree has any
# uncommitted changes (staged, unstaged, or untracked), it prints a one-line
# reminder (as a systemMessage) so work doesn't get left un-snapshotted between
# sessions. When the tree is clean it stays silent.
#
# Costs no model tokens (systemMessage shows in the UI, not to the model).
#
# -Porcelain lets tests inject a synthetic `git status --porcelain` instead of shelling out.

param([string]$Porcelain = $null)

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot          # tools/ -> repo root

# Read the working-tree status (real git unless a test override was passed).
# NB: check whether -Porcelain was actually bound, not `$null -eq` — a [string]
# param defaults to '' (empty), not $null, so a null-guard would skip git entirely.
if (-not $PSBoundParameters.ContainsKey('Porcelain')) {
    $Porcelain = (& git -C $root status --porcelain) -join "`n"
    if (-not $?) { exit 0 }                         # not a git repo / git missing
}

$changed = @($Porcelain -split "`n" | Where-Object { $_ -ne '' })
$n = $changed.Count
if ($n -eq 0) { exit 0 }                             # clean tree — nothing to warn about

$subject = if ($n -eq 1) { '1 file has' } else { "$n files have" }
$msg = "REMINDER: $subject uncommitted changes - commit before ending the session, or the work stays un-snapshotted (it is not lost, just not in git history)."
Write-Output (@{ systemMessage = $msg } | ConvertTo-Json -Compress)
exit 0
