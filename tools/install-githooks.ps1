<#
  install-githooks.ps1 - point this clone at the committed git hooks (one-time, idempotent).

  Activates tools/githooks/pre-push: the deploy gate that holds any push whose outgoing
  delta touches index.html or assets/ until Josh explicitly authorizes it
  (DEPLOY_OK=1 env, or a one-shot .git/DEPLOY_AUTH file). See CLAUDE.md "Git" section.
#>
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
git -C $root config core.hooksPath tools/githooks
Write-Host 'core.hooksPath -> tools/githooks (deploy gate active: tools/githooks/pre-push)'
