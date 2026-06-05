# Reopen the live-reload dev window iff it's closed.
#
# Invoked as a Claude Code PostToolUse hook after Write/Edit. python-livereload
# (dev.py) holds a persistent websocket to port 5500 while the page is open, so:
#   - server listening + >=1 ESTABLISHED conn on 5500  => window is OPEN  (livereload
#     auto-reloads it; do nothing)
#   - server listening + 0 ESTABLISHED conns           => window is CLOSED (reopen)
#   - server not listening                             => dev.py isn't running; nothing
#     to reopen onto, so stay out of the way.
#
# Hook JSON arrives on stdin; we only act for edits to the live artifact (index.html).

$ErrorActionPreference = 'SilentlyContinue'

# --- only react to changes to the live game file ------------------------------
$raw = [Console]::In.ReadToEnd()
try { $hook = $raw | ConvertFrom-Json } catch { $hook = $null }
$fp = $hook.tool_input.file_path
if ($fp -and ($fp -notlike '*index.html')) { exit 0 }

# --- is the dev server up? ----------------------------------------------------
$port = 5500
$listening = @(Get-NetTCPConnection -LocalPort $port -State Listen)
if ($listening.Count -eq 0) { exit 0 }   # server down — can't reopen usefully

# --- is a browser already connected (window open)? ----------------------------
$connected = @(Get-NetTCPConnection -LocalPort $port -State Established)
if ($connected.Count -eq 0) {
    Start-Process "http://localhost:$port"
}
exit 0
