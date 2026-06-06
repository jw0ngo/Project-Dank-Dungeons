# Launch the Dungeon Forge Product Manager Telegram bot.
# First run: `pip install -r tools/pm-bot/requirements.txt` and create tools/pm-bot/.env
# (copy from .env.example). Then: .\tools\pm-bot\run.ps1
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $here ".env"))) {
    Write-Host "No .env found in tools/pm-bot/. Copy .env.example to .env and fill it in." -ForegroundColor Yellow
    exit 1
}
python (Join-Path $here "pm_bot.py")
