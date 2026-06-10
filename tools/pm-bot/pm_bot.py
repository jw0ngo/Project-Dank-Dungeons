#!/usr/bin/env python3
"""
To Dust — Product Manager Telegram bot.

A long-polling Telegram bot that lets the developer chat with the Product Manager
agent (operating per agents/product/product.md) from a phone, to work the product
roadmap on the go. The PM can read the repo's product docs for grounding, rewrite
docs/ROADMAP.md, and commit + push approved changes so the engineering session sees
them.

Architecture: vanilla Python (no Node). Telegram via the Bot API (long polling, so
it runs behind NAT from the dev's PC — no public webhook needed). Claude via the
Anthropic Messages API with a manual tool-use loop.

Run:  python tools/pm-bot/pm_bot.py   (see tools/pm-bot/README.md for setup)
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Missing dependency. Run: pip install -r tools/pm-bot/requirements.txt")

from llm_backends import LLMError, get_backend


# ── Config (from environment / .env) ─────────────────────────────────────────

REPO_DIR = Path(__file__).resolve().parents[2]  # tools/pm-bot/ -> repo root
STATE_DIR = Path(__file__).resolve().parent / "state"
CONVO_PATH = STATE_DIR / "conversation.json"

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"
TELEGRAM_MSG_LIMIT = 4000  # Telegram hard limit is 4096; leave headroom
MAX_HISTORY_MESSAGES = 60  # bound context so token cost stays sane
ROADMAP_REL = "docs/ROADMAP.md"

# Files the PM may read for grounding (relative to repo root). Read access is
# restricted to this allow-list so the bot can't be coaxed into reading secrets.
READABLE_DOCS = [
    "agents/product/product.md",
    "docs/ROADMAP.md",
    "agents/engineer/engineer.md",
    "docs/WORKING_AGREEMENT.md",
    "docs/TO_DUST_CTO_DOC.md",
    "docs/SESSION_JOURNAL.md",
    "CHANGELOG.md",
    "CLAUDE.md",
]


def _load_dotenv() -> None:
    """Minimal .env loader (no python-dotenv dependency)."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv()

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
ALLOWED_CHAT_ID = os.environ.get("TELEGRAM_ALLOWED_CHAT_ID", "").strip()

if not BOT_TOKEN:
    sys.exit("Set TELEGRAM_BOT_TOKEN (see tools/pm-bot/README.md).")

# The LLM provider is selected by LLM_PROVIDER (default: anthropic). The chosen
# backend validates its own API key / endpoint here and fails fast on misconfig.
try:
    backend = get_backend()
except LLMError as exc:
    sys.exit(str(exc))


# ── Telegram helpers ─────────────────────────────────────────────────────────

def tg(method: str, **params):
    """Call a Telegram Bot API method, returning the parsed `result`."""
    url = TELEGRAM_API.format(token=BOT_TOKEN, method=method)
    resp = requests.post(url, json=params, timeout=70)
    data = resp.json()
    if not data.get("ok"):
        print(f"[telegram] {method} failed: {data}", flush=True)
        return None
    return data.get("result")


def send_message(chat_id, text: str) -> None:
    """Send a (possibly long) plain-text message, chunked to Telegram's limit."""
    if not text:
        text = "(no response)"
    for i in range(0, len(text), TELEGRAM_MSG_LIMIT):
        tg("sendMessage", chat_id=chat_id, text=text[i:i + TELEGRAM_MSG_LIMIT])


def send_typing(chat_id) -> None:
    tg("sendChatAction", chat_id=chat_id, action="typing")


# ── Conversation persistence ─────────────────────────────────────────────────

def load_history() -> list:
    if CONVO_PATH.exists():
        try:
            return json.loads(CONVO_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []
    return []


def save_history(messages: list) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    # Keep the tail so context stays bounded; never split a tool_use/tool_result pair
    trimmed = messages[-MAX_HISTORY_MESSAGES:]
    while trimmed and trimmed[0].get("role") != "user":
        trimmed.pop(0)
    CONVO_PATH.write_text(json.dumps(trimmed, indent=2), encoding="utf-8")


# ── Repo / roadmap tools (executed by this script, host-side) ─────────────────

def _safe_doc_path(rel: str) -> Path | None:
    """Resolve a repo-relative path, only if it's in the read allow-list."""
    if rel not in READABLE_DOCS:
        return None
    path = (REPO_DIR / rel).resolve()
    if REPO_DIR not in path.parents and path != REPO_DIR:
        return None
    return path


def tool_list_docs(_: dict) -> str:
    return "Readable docs:\n" + "\n".join(f"- {d}" for d in READABLE_DOCS)


def tool_read_doc(args: dict) -> str:
    rel = (args.get("path") or "").strip()
    path = _safe_doc_path(rel)
    if path is None:
        return f"Error: '{rel}' is not in the readable allow-list. Use list_repo_docs."
    if not path.exists():
        return f"Error: {rel} does not exist."
    return path.read_text(encoding="utf-8")


def tool_write_roadmap(args: dict) -> str:
    content = args.get("content")
    if not isinstance(content, str) or not content.strip():
        return "Error: 'content' must be the full new roadmap markdown."
    path = (REPO_DIR / ROADMAP_REL).resolve()
    path.write_text(content, encoding="utf-8")
    return f"Wrote {len(content)} chars to {ROADMAP_REL}. Not committed yet — call commit_and_push to publish."


def tool_commit_and_push(args: dict) -> str:
    message = (args.get("message") or "").strip()
    if not message:
        return "Error: 'message' (commit message) is required."
    try:
        subprocess.run(["git", "-C", str(REPO_DIR), "add", ROADMAP_REL],
                       check=True, capture_output=True, text=True)
        status = subprocess.run(["git", "-C", str(REPO_DIR), "status", "--porcelain", ROADMAP_REL],
                                capture_output=True, text=True).stdout.strip()
        if not status:
            return "Nothing to commit — ROADMAP.md has no staged changes."
        body = f"{message}\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
        subprocess.run(["git", "-C", str(REPO_DIR), "commit", "-m", body],
                       check=True, capture_output=True, text=True)
        push = subprocess.run(["git", "-C", str(REPO_DIR), "push", "origin", "main"],
                              capture_output=True, text=True)
        if push.returncode != 0:
            return f"Committed locally, but push failed:\n{push.stderr.strip()[:500]}"
        return f"Committed and pushed: {message}"
    except subprocess.CalledProcessError as e:
        return f"Git error: {(e.stderr or str(e)).strip()[:500]}"


# Neutral tool schemas (name / description / JSON-Schema parameters). The active
# backend translates these into Anthropic or OpenAI-compatible tool definitions.
TOOLS = [
    {
        "name": "list_repo_docs",
        "description": "List the product/engineering docs you may read for grounding.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "read_repo_doc",
        "description": (
            "Read a repo doc for grounding a proposal (the manifesto, current roadmap, "
            "changelog, CTO architecture doc, etc.). Call this before pitching anything "
            "non-trivial so the idea fits the real game."
        ),
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Repo-relative path, e.g. CHANGELOG.md"}},
            "required": ["path"],
        },
    },
    {
        "name": "write_roadmap",
        "description": (
            "Overwrite docs/ROADMAP.md with the full new markdown. Use after the developer "
            "approves a change (promote an item to Now, re-rank, add a proposal). Read the "
            "current roadmap first, then pass the COMPLETE updated document. Does not commit."
        ),
        "parameters": {
            "type": "object",
            "properties": {"content": {"type": "string", "description": "The complete new ROADMAP.md contents"}},
            "required": ["content"],
        },
    },
    {
        "name": "commit_and_push",
        "description": (
            "Commit docs/ROADMAP.md and push to origin/main so the engineering session sees "
            "approved items. Call only after write_roadmap and after the developer has approved."
        ),
        "parameters": {
            "type": "object",
            "properties": {"message": {"type": "string", "description": "Short commit message, e.g. 'Roadmap: approve second-god imbue arc'"}},
            "required": ["message"],
        },
    },
]

TOOL_IMPLS = {
    "list_repo_docs": tool_list_docs,
    "read_repo_doc": tool_read_doc,
    "write_roadmap": tool_write_roadmap,
    "commit_and_push": tool_commit_and_push,
}


# ── System prompt ─────────────────────────────────────────────────────────────

def build_system() -> str:
    manifesto_path = REPO_DIR / "agents" / "product" / "product.md"
    roadmap_path = REPO_DIR / ROADMAP_REL
    manifesto = manifesto_path.read_text(encoding="utf-8") if manifesto_path.exists() else "(manifesto missing)"
    roadmap = roadmap_path.read_text(encoding="utf-8") if roadmap_path.exists() else "(roadmap missing)"
    return (
        "You are the Product Manager for To Dust, a browser action-RPG, talking to the "
        "developer (Josh) over Telegram on his phone. Operate exactly per the manifesto below.\n\n"
        "TELEGRAM STYLE: This is a chat on a phone. Keep replies SHORT and scannable — a few "
        "lines, not a wall of text. Plain text only (no markdown tables, no code fences). When "
        "you pitch a proposal, compress the one-pager: pillar, one-liner, why-now, size, and a "
        "clear recommendation + 'Approve?' Lead with the recommendation. Ask one question at a "
        "time.\n\n"
        "GROUNDING: Before pitching anything non-trivial, use read_repo_doc to check the "
        "changelog (what just shipped) and the CTO doc (how the game works). Don't invent "
        "systems that don't fit a vanilla-JS one-file game.\n\n"
        "APPROVAL GATE: New features need Josh's explicit approval before they reach engineering. "
        "When he approves a change, use write_roadmap to update the roadmap (move the item to Now, "
        "set status 'approved', re-rank), then commit_and_push so the engineering session sees it. "
        "Confirm in one line after pushing.\n\n"
        "=== PRODUCT MANIFESTO ===\n" + manifesto +
        "\n\n=== CURRENT ROADMAP (docs/ROADMAP.md) ===\n" + roadmap
    )


# ── Claude turn (manual tool-use loop) ───────────────────────────────────────

def run_turn(chat_id, history: list) -> list:
    """Run one PM turn via the active backend: call the LLM, execute any tool
    calls, loop until it stops calling tools. Mutates and returns the neutral
    message history (assistant + tool turns appended)."""
    system = build_system()
    while True:
        send_typing(chat_id)
        try:
            resp = backend.complete(system, history, TOOLS)
        except LLMError as e:
            send_message(chat_id, f"(LLM error: {e}. Try again in a moment.)")
            return history

        history.append({"role": "assistant", "content": resp.text,
                        "tool_calls": resp.tool_calls})

        if not resp.tool_calls:
            send_message(chat_id, resp.text or "(done)")
            return history

        # Execute each requested tool; append one neutral tool result per call.
        for call in resp.tool_calls:
            impl = TOOL_IMPLS.get(call["name"])
            args = call.get("arguments") or {}
            result = impl(args) if impl else f"Unknown tool: {call['name']}"
            history.append({"role": "tool", "tool_call_id": call["id"],
                            "name": call["name"], "content": result})


# ── Command handling ──────────────────────────────────────────────────────────

def handle_command(chat_id, text: str) -> bool:
    """Handle /commands. Returns True if the message was a command."""
    cmd = text.split()[0].lower().lstrip("/").split("@")[0]
    if cmd == "start":
        send_message(chat_id,
            "To Dust PM here. Tell me what you're thinking and I'll bring proposals, "
            "or say 'what's next?' for the top of the roadmap. I run ideas by you before "
            "anything reaches engineering.\n\nCommands: /roadmap  /reset")
        return True
    if cmd == "reset":
        if CONVO_PATH.exists():
            CONVO_PATH.unlink()
        send_message(chat_id, "Conversation cleared. Roadmap on disk is untouched.")
        return True
    if cmd == "roadmap":
        roadmap_path = REPO_DIR / ROADMAP_REL
        content = roadmap_path.read_text(encoding="utf-8") if roadmap_path.exists() else "(no roadmap)"
        send_message(chat_id, content)
        return True
    return False


# ── Main poll loop ────────────────────────────────────────────────────────────

def main() -> None:
    me = tg("getMe")
    if not me:
        sys.exit("Could not reach Telegram — check TELEGRAM_BOT_TOKEN.")
    print(f"[pm-bot] connected as @{me.get('username')}", flush=True)
    print(f"[pm-bot] LLM provider: {backend.name} (model: {backend.model})", flush=True)
    if not ALLOWED_CHAT_ID:
        print("[pm-bot] WARNING: TELEGRAM_ALLOWED_CHAT_ID is not set. The bot will reply to the "
              "first chat that messages it with its chat id, then refuse everyone. Set that id in "
              ".env and restart to lock the bot to you.", flush=True)
    print("[pm-bot] polling for messages (Ctrl+C to stop)...", flush=True)

    offset = None
    while True:
        try:
            updates = tg("getUpdates", offset=offset, timeout=50,
                         allowed_updates=["message"]) or []
        except requests.RequestException as e:
            print(f"[pm-bot] poll error: {e}; retrying in 5s", flush=True)
            time.sleep(5)
            continue

        for update in updates:
            offset = update["update_id"] + 1
            message = update.get("message") or {}
            text = (message.get("text") or "").strip()
            chat_id = (message.get("chat") or {}).get("id")
            if not text or chat_id is None:
                continue

            # Access control: lock to the allowed chat id.
            if ALLOWED_CHAT_ID:
                if str(chat_id) != ALLOWED_CHAT_ID:
                    send_message(chat_id, "This Product Manager bot is private.")
                    continue
            else:
                # No allow-list yet: help the owner discover their chat id, then refuse.
                send_message(chat_id,
                    f"Your chat id is {chat_id}.\nSet TELEGRAM_ALLOWED_CHAT_ID={chat_id} in "
                    "tools/pm-bot/.env and restart the bot to start chatting.")
                continue

            try:
                if handle_command(chat_id, text):
                    continue
                history = load_history()
                history.append({"role": "user", "content": text})
                history = run_turn(chat_id, history)
                save_history(history)
            except Exception as e:  # never let one bad message kill the loop
                print(f"[pm-bot] error handling message: {e}", flush=True)
                send_message(chat_id, f"(Something went wrong: {e})")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[pm-bot] stopped.", flush=True)
