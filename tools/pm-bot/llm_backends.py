"""
Provider-agnostic LLM backends for the Product Manager bot.

The bot speaks ONE neutral format internally so any LLM can drive the PM agent.
Two backends are provided:

  - anthropic           → Claude via the Anthropic Messages API (official SDK)
  - openai              → any OpenAI-compatible /v1/chat/completions endpoint
                          (OpenAI, OpenRouter, Groq, Together, Mistral, DeepSeek,
                          local Ollama / LM Studio / vLLM, …) via raw HTTP

Select with the LLM_PROVIDER env var (default: anthropic).

Neutral formats the bot uses (translated to/from each provider here):

  message  := {"role": "user",      "content": "<text>"}
            | {"role": "assistant",  "content": "<text>",
               "tool_calls": [{"id","name","arguments": {...}}]}
            | {"role": "tool",       "tool_call_id": "<id>",
               "name": "<tool>", "content": "<result text>"}

  tool     := {"name", "description", "parameters": <JSON Schema>}

Each backend's complete(system, messages, tools) returns an LLMResponse.
"""

import json
import os

import requests


class LLMError(Exception):
    """Any backend failure the bot should surface to the user and recover from."""


class LLMResponse:
    def __init__(self, text: str, tool_calls: list):
        self.text = text or ""
        # list of {"id": str, "name": str, "arguments": dict}
        self.tool_calls = tool_calls or []


def get_backend():
    """Construct the backend selected by LLM_PROVIDER. Raises LLMError on misconfig."""
    provider = os.environ.get("LLM_PROVIDER", "anthropic").strip().lower()
    if provider in ("", "anthropic", "claude"):
        return AnthropicBackend()
    if provider in ("openai", "openai-compatible", "openrouter", "groq",
                    "together", "mistral", "deepseek", "ollama", "local"):
        return OpenAICompatibleBackend()
    raise LLMError(
        f"Unknown LLM_PROVIDER '{provider}'. Use 'anthropic' (Claude) or "
        "'openai' (any OpenAI-compatible endpoint)."
    )


# ── Claude (Anthropic Messages API) ──────────────────────────────────────────

class AnthropicBackend:
    name = "anthropic"

    def __init__(self):
        try:
            import anthropic
        except ImportError:
            raise LLMError("LLM_PROVIDER=anthropic needs the SDK: pip install anthropic")
        if not os.environ.get("ANTHROPIC_API_KEY", "").strip():
            raise LLMError("Set ANTHROPIC_API_KEY for the anthropic provider.")
        self._anthropic = anthropic
        self.client = anthropic.Anthropic()
        self.model = os.environ.get("LLM_MODEL", "").strip() or "claude-opus-4-8"
        self.max_tokens = int(os.environ.get("LLM_MAX_TOKENS", "8000"))

    def _tools(self, tools):
        return [{"name": t["name"], "description": t["description"],
                 "input_schema": t["parameters"]} for t in tools]

    def _messages(self, messages):
        """Neutral → Anthropic. Consecutive tool results merge into one user turn."""
        out, pending = [], []

        def flush():
            if pending:
                out.append({"role": "user", "content": list(pending)})
                pending.clear()

        for m in messages:
            role = m["role"]
            if role == "tool":
                pending.append({"type": "tool_result",
                                "tool_use_id": m["tool_call_id"],
                                "content": m["content"]})
                continue
            flush()
            if role == "user":
                out.append({"role": "user", "content": m["content"]})
            elif role == "assistant":
                content = []
                if m.get("content"):
                    content.append({"type": "text", "text": m["content"]})
                for tc in m.get("tool_calls") or []:
                    content.append({"type": "tool_use", "id": tc["id"],
                                    "name": tc["name"], "input": tc["arguments"]})
                if not content:
                    content = [{"type": "text", "text": "(no content)"}]
                out.append({"role": "assistant", "content": content})
        flush()
        return out

    def complete(self, system, messages, tools):
        try:
            resp = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system,
                tools=self._tools(tools),
                messages=self._messages(messages),
            )
        except self._anthropic.APIError as e:
            raise LLMError(str(e))
        text = "".join(b.text for b in resp.content if b.type == "text").strip()
        tool_calls = [{"id": b.id, "name": b.name, "arguments": b.input}
                      for b in resp.content if b.type == "tool_use"]
        return LLMResponse(text, tool_calls)


# ── OpenAI-compatible (/v1/chat/completions over raw HTTP) ────────────────────

class OpenAICompatibleBackend:
    name = "openai"

    def __init__(self):
        self.api_key = (os.environ.get("OPENAI_API_KEY")
                        or os.environ.get("LLM_API_KEY") or "").strip()
        self.base_url = (os.environ.get("OPENAI_BASE_URL")
                         or os.environ.get("LLM_BASE_URL")
                         or "https://api.openai.com/v1").strip().rstrip("/")
        self.model = os.environ.get("LLM_MODEL", "").strip() or "gpt-4o"
        self.max_tokens = int(os.environ.get("LLM_MAX_TOKENS", "8000"))
        # api_key may be empty for some local servers (e.g. Ollama); most hosts require it.

    def _tools(self, tools):
        return [{"type": "function",
                 "function": {"name": t["name"], "description": t["description"],
                              "parameters": t["parameters"]}} for t in tools]

    def _messages(self, system, messages):
        out = [{"role": "system", "content": system}]
        for m in messages:
            role = m["role"]
            if role == "user":
                out.append({"role": "user", "content": m["content"]})
            elif role == "assistant":
                msg = {"role": "assistant", "content": m.get("content") or None}
                tcs = m.get("tool_calls") or []
                if tcs:
                    msg["tool_calls"] = [
                        {"id": tc["id"], "type": "function",
                         "function": {"name": tc["name"],
                                      "arguments": json.dumps(tc["arguments"])}}
                        for tc in tcs
                    ]
                out.append(msg)
            elif role == "tool":
                out.append({"role": "tool", "tool_call_id": m["tool_call_id"],
                            "content": m["content"]})
        return out

    def complete(self, system, messages, tools):
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        payload = {
            "model": self.model,
            "messages": self._messages(system, messages),
            "tools": self._tools(tools),
            "max_tokens": self.max_tokens,
        }
        try:
            r = requests.post(f"{self.base_url}/chat/completions",
                              headers=headers, json=payload, timeout=120)
        except requests.RequestException as e:
            raise LLMError(f"request to {self.base_url} failed: {e}")
        if r.status_code >= 400:
            raise LLMError(f"{r.status_code} from {self.base_url}: {r.text[:400]}")
        try:
            msg = r.json()["choices"][0]["message"]
        except (ValueError, KeyError, IndexError):
            raise LLMError(f"unexpected response: {r.text[:400]}")

        text = (msg.get("content") or "").strip()
        tool_calls = []
        for tc in msg.get("tool_calls") or []:
            fn = tc.get("function", {})
            raw_args = fn.get("arguments") or "{}"
            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            except json.JSONDecodeError:
                args = {}
            tool_calls.append({"id": tc.get("id") or f"call_{len(tool_calls)}",
                               "name": fn.get("name"), "arguments": args})
        return LLMResponse(text, tool_calls)
