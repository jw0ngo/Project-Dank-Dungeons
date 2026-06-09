"""Census every inline base64 data URI in index.html so the migration is complete,
not partial. For each: line number, the JS key/var it's bound to (best-effort),
declared mime, true format (magic bytes), and decoded size. Groups by binding kind.
Read-only.
"""
import base64, re, os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")
lines = open(HTML, "r", encoding="utf-8").read().split("\n")

uri_re = re.compile(r'data:(?P<mime>[\w/+.-]+);base64,(?P<b64>[A-Za-z0-9+/=]+)')

# best-effort binding detector on the chars before the data URI on the same line
bind_patterns = [
    ("manifest", re.compile(r"""['"]([\w.]+)['"]\s*:\s*['"]$""")),         # 'char.goblin.n':'
    ("const",    re.compile(r"""(?:const|let|var)\s+(\w+)\s*=\s*['"]$""")),# const X = '
    ("img_src",  re.compile(r"""(\w+)\.src\s*=\s*['"]$""")),               # FOO.src = '
    ("html_img", re.compile(r"""src=["']$""")),                            # <img ... src="
]

def truefmt(d):
    if d[:3]==b"\xff\xd8\xff": return "jpg"
    if d[:8]==b"\x89PNG\r\n\x1a\n": return "png"
    if d[:4]==b"RIFF" and d[8:12]==b"WEBP": return "webp"
    if d[:6] in (b"GIF87a",b"GIF89a"): return "gif"
    if d[:5]==b"<?xml" or d[:4]==b"<svg": return "svg"
    return "?"

kinds = Counter(); mismatch=0; total_b64=0; rows=[]
for i, ln in enumerate(lines, 1):
    for m in uri_re.finditer(ln):
        pre = ln[:m.start()]
        kind, name = "UNKNOWN", ""
        for k, p in bind_patterns:
            mm = p.search(pre)
            if mm:
                kind = k; name = mm.group(1) if mm.groups() else ""
                break
        data = base64.b64decode(m.group("b64"))
        tf = truefmt(data); declared = m.group("mime")
        mis = (declared.split("/")[-1] != tf) and tf not in ("?",)
        if mis: mismatch += 1
        kinds[kind]+=1; total_b64+=len(m.group("b64"))
        rows.append((i, kind, name, declared, tf, len(data), mis))

print(f"=== {len(rows)} inline base64 URIs, {total_b64//1024//1024} MB of base64 source ===\n")
print("by binding kind:", dict(kinds))
print(f"mislabelled mime (declared != actual): {mismatch}\n")
# show the non-manifest ones in full (the tricky cases), summarise manifest
print("--- non-manifest bindings (handle explicitly) ---")
for (i,kind,name,decl,tf,sz,mis) in rows:
    if kind=="manifest": continue
    flag = "  <-- MIME MISLABEL" if mis else ""
    print(f"  L{i:<6} {kind:9} {name:18} {decl} -> .{tf} {sz//1024}KB{flag}")
print(f"\n--- manifest entries: {kinds['manifest']} (uniform handling) ---")
# print a few sample keys
samp=[r for r in rows if r[1]=='manifest'][:6]
for (i,kind,name,decl,tf,sz,mis) in samp:
    print(f"  L{i:<6} {name:22} {decl} -> .{tf} {sz//1024}KB")
print("  ...")
