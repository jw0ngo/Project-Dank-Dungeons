#!/usr/bin/env python3
"""
Local Claude key-proxy for AI playtesting of Dungeon Forge.

The game's §8 Sim harness (Sim.aiConnect) POSTs an observe() snapshot here a few
times per second; this server calls Claude with a structured-output action schema
and returns a high-level INTENT the browser executes frame-by-frame.

WHY A PROXY: the Anthropic API key must never ship inside index.html (it would leak
to every player). It lives here, server-side, and never reaches the browser.

RUN:
    pip install anthropic
    setx ANTHROPIC_API_KEY "sk-ant-..."     # Windows (new shell after), or:  $env:ANTHROPIC_API_KEY="sk-ant-..."
    python tools/ai-playtest/server.py       # serves http://localhost:8788

Then open the game (the -sim build) and in the console:
    Sim.aiConnect()                          # default model claude-opus-4-8
    Sim.aiConnect({ model: 'claude-haiku-4-5', decideMs: 250 })

Stop with Sim.aiDisconnect() in the browser, Ctrl+C here.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Literal, Optional

try:
    import anthropic
    from pydantic import BaseModel, Field
except ImportError:
    sys.exit("Missing deps. Run:  pip install anthropic")

PORT = int(os.environ.get("AI_PLAYTEST_PORT", "8788"))

# Models the proxy will accept from the browser (configurable per request).
ALLOWED_MODELS = {
    "claude-opus-4-8",
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-haiku-4-5",
}
DEFAULT_MODEL = "claude-opus-4-8"

# Reads ANTHROPIC_API_KEY from the environment.
client = anthropic.Anthropic()


class Intent(BaseModel):
    """The high-level plan the browser executes each frame until the next decision."""
    target: Optional[int] = Field(description="Index into enemies[] (0 = nearest), or null for none/crowd.")
    range: Literal["melee", "kite"] = Field(description="Preferred spacing to the target.")
    action: Literal["attack", "retreat", "whirlwind", "collect", "hold"] = Field(
        description="attack=fight target; retreat=back off; whirlwind=AoE spin (uses MP, good vs crowds); "
                    "collect=grab XP orbs; hold=stand still.")
    dashIfThreatened: bool = Field(description="Dash to dodge when an enemy attack is imminent and dash is off cooldown.")
    cardPick: Optional[int] = Field(description="When draftPending: index into draftOptions[] to take. Else null.")
    note: str = Field(description="One short clause of rationale (for the human watching).")


SYSTEM_PROMPT = """You are playing Dungeon Forge, a real-time survival action-RPG, as the hero. \
You decide STRATEGY a few times per second; a low-level controller executes your intent each frame, \
so give a high-level plan, not twitch inputs.

THE GAME
- A wilderness run with a day/night cycle. Nights bring hordes; difficulty (threat) steps up each night. Survive as long as possible.
- Enemies (goblin family): goblin (melee), archer (ranged), bomber (drops explosive zones), warrior (tough bruiser), shaman (lobs fireballs / buffs), king (dangerous miniboss). enemies[] is sorted nearest-first.
- You: usually a sword (melee). Abilities have cooldowns (player.cd): swing (auto while attacking), dash (i-frame dodge), whirlwind (AoE spin, costs MP — great vs crowds), leap, heavy. iFrames>0 means briefly invulnerable.
- Leveling: collecting XP orbs levels you up; each level-up offers a card draft (draftOptions). Cards are permanent power for the run; rarity (mult) is magnitude. PICK ONE whenever draftPending is true.

HOW TO PLAY WELL
- Don't die. If HP is low or several enemies are close, kite/retreat and dash through danger; reset to a safer angle.
- Focus dangerous targets: kings, shamans, and archers usually before plain goblins. Use range="kite" vs ranged/bombers, "melee" to burst down a priority target.
- Use whirlwind when 4+ enemies are clustered and you have MP.
- During the day or a lull with no threats, action="collect" to grab XP orbs and level up.
- When draftPending: ALWAYS return a cardPick. Prefer survivability (max HP, lifesteal, regen) and damage/attack-speed; pick the highest-impact card for staying alive longer.

Return one Intent. Keep `note` to a short clause."""


def decide(obs: dict, last_intent, model: str) -> dict:
    # Trim the enemy list to keep the prompt small; the browser still sees them all.
    trimmed = dict(obs)
    if isinstance(obs.get("enemies"), list):
        trimmed["enemies"] = obs["enemies"][:10]
    user = (
        "GAME STATE:\n" + json.dumps(trimmed, separators=(",", ":")) +
        "\n\nYOUR PREVIOUS INTENT:\n" + json.dumps(last_intent, separators=(",", ":")) +
        "\n\nReturn the best next intent."
    )
    resp = client.messages.parse(
        model=model,
        max_tokens=512,
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user}],
        output_format=Intent,
    )
    return resp.parsed_output.model_dump()


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        # Health check.
        self.send_response(200 if self.path == "/health" else 404)
        self._cors()
        self.send_header("content-type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok":true}' if self.path == "/health" else b'{"error":"not found"}')

    def do_POST(self):
        if self.path != "/decide":
            self.send_response(404); self._cors(); self.end_headers(); return
        try:
            length = int(self.headers.get("content-length", "0"))
            body = json.loads(self.rfile.read(length) or b"{}")
            obs = body.get("obs") or {}
            last_intent = body.get("lastIntent")
            model = body.get("model", DEFAULT_MODEL)
            if model not in ALLOWED_MODELS:
                model = DEFAULT_MODEL
            intent = decide(obs, last_intent, model)
            payload = json.dumps({"intent": intent}).encode()
            self.send_response(200)
            self._cors()
            self.send_header("content-type", "application/json")
            self.end_headers()
            self.wfile.write(payload)
            print(f"[decide] {model}  lv{obs.get('level','?')} hp{(obs.get('player') or {}).get('hp','?')}"
                  f"  -> {intent.get('action')}/{intent.get('range')} (t={intent.get('target')})  {intent.get('note','')}")
        except Exception as e:  # keep the server alive; the browser falls back to its heuristic
            print(f"[error] {type(e).__name__}: {e}", file=sys.stderr)
            self.send_response(502)
            self._cors()
            self.send_header("content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, *_):  # silence default per-request noise; we print our own
        pass


def main():
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        print("WARNING: ANTHROPIC_API_KEY is not set — every /decide will fail.", file=sys.stderr)
    print(f"AI playtest proxy on http://localhost:{PORT}  (default model {DEFAULT_MODEL})")
    print("In the game console:  Sim.aiConnect()   (or Sim.aiConnect({ model:'claude-haiku-4-5' }))")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
