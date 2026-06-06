# Product Manager Telegram bot

Chat with the Dungeon Forge **Product Manager** agent from your phone, on the go, to
work the product roadmap. The PM operates per [`docs/PRODUCT_MANIFESTO.md`](../../docs/PRODUCT_MANIFESTO.md):
it brings decision-ready proposals, runs them by you for approval, and — once you say
yes — updates [`docs/ROADMAP.md`](../../docs/ROADMAP.md) and pushes it to `main` so your
engineering Claude session picks the work up.

It's a plain Python long-polling bot (no Node, no public server). It runs on your PC
and reaches Telegram outbound, so it works behind your home network with no port
forwarding. Your PC must stay on while you're away for the bot to answer.

**Provider-agnostic.** The PM agent's brain is swappable — any LLM can drive it, not
just Claude. The bot speaks one neutral message/tool-call format internally and
translates to whichever backend you select with `LLM_PROVIDER`:

| `LLM_PROVIDER` | Backend | Covers |
|---|---|---|
| `anthropic` (default) | Anthropic Messages API | Claude (`claude-opus-4-8`, …) |
| `openai` | OpenAI-compatible `/v1/chat/completions` | OpenAI, OpenRouter, Groq, Together, Mistral, DeepSeek, local Ollama / LM Studio / vLLM |

The agent's *operating model* is plain markdown (`docs/PRODUCT_MANIFESTO.md`,
`product/CLAUDE.md`), loaded as the system prompt — so any model reads the same brief.
The PM needs a **tool-calling-capable** model to write/commit the roadmap; models
without function calling can still chat but can't update `ROADMAP.md`. Backend
translation lives in `llm_backends.py` — add a new provider by adding one class there.

## What it can do

- **Talk product** — propose features, rank ideas, pull the top of the backlog.
- **Ground itself** — read the manifesto, roadmap, changelog, and CTO doc (read-only,
  allow-listed) so proposals fit the real game.
- **Maintain the roadmap** — rewrite `docs/ROADMAP.md` on your approval and
  `commit + push` it to `origin/main`. (It only ever writes that one file.)

Commands in chat: `/start`, `/roadmap` (dump the current roadmap), `/reset` (clear the
conversation; the roadmap on disk is untouched).

## One-time setup (~5 min)

1. **Create the bot.** In Telegram, message **@BotFather** → `/newbot` → pick a name and
   username. Copy the **bot token** it gives you.

2. **Install deps:**
   ```powershell
   pip install -r tools\pm-bot\requirements.txt
   ```

3. **Configure.** Copy `tools\pm-bot\.env.example` to `tools\pm-bot\.env` and fill in:
   - `TELEGRAM_BOT_TOKEN` — from BotFather
   - `TELEGRAM_ALLOWED_CHAT_ID` — leave blank for now
   - `LLM_PROVIDER` — `anthropic` (default) or `openai`
   - the credential for your provider:
     - `anthropic` → `ANTHROPIC_API_KEY` (from console.anthropic.com)
     - `openai` → `OPENAI_API_KEY` (+ `OPENAI_BASE_URL` and `LLM_MODEL` for non-OpenAI hosts)

4. **Find your chat id.** Start the bot (`.\tools\pm-bot\run.ps1`), open the bot in
   Telegram, send it any message. It replies with your chat id. Paste that into
   `TELEGRAM_ALLOWED_CHAT_ID` in `.env`, stop the bot (Ctrl+C), and start it again. This
   locks the bot to you — important, since it holds your API key and can push to your repo.

5. **Chat.** Message the bot. Try: *"what's next on the roadmap?"* or *"pitch me a second
   god's imbue arc."*

## Running it

```powershell
.\tools\pm-bot\run.ps1
```

Leave that window open (or run it on an always-on machine) so the bot stays reachable
while you're out. To keep it alive across reboots, run it as a Scheduled Task or a
service — out of scope here, but the script is a normal long-running Python process.

## How approvals flow to engineering

```
You (Telegram) ⇄ PM bot ──approve──▶ writes docs/ROADMAP.md ──▶ git push origin/main
                                                                       │
                                                          your engineering Claude
                                                          session pulls the approved
                                                          item from "Now" and builds it
```

Pushing `ROADMAP.md` does **not** affect the deployed game — GitHub Pages serves
`index.html`; the roadmap is just a tracked doc.

## Security notes

- `.env` and `state/` are gitignored — your keys and chat history never get committed.
- The chat-id lock is the only thing standing between your API key / repo and anyone who
  finds the bot. Don't skip step 4.
- Read access is restricted to an allow-list of docs (see `READABLE_DOCS` in `pm_bot.py`);
  write access is restricted to `docs/ROADMAP.md`. The bot cannot read arbitrary files or
  edit game code.

## Cost

Each turn is a normal Opus 4.8 Messages API call (the manifesto + roadmap ride along as
the system prompt). Roadmapping is low-volume, so cost is modest, but it is billed to
your Anthropic key. Use `/reset` to drop accumulated history when starting a fresh topic.
