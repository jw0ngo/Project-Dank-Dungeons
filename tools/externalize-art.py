"""Full art externalization: move every inline base64 image in index.html out to a
file under assets/, and rewrite each reference (ART_MANIFEST value, F*_SPR .src, and
figure const) to the file path. Also relocates the 4 POC god cards (art/gods/cards/)
into assets/gods/ so there's a single runtime-art convention.

gInitArt already does `im.src = <value>` generically, so swapping a data: URL for a
path is behaviour-preserving. Single write at the end; OK/FAIL reported per blob.

Layout:  ART_MANIFEST 'a.b.c'  -> assets/<a>/<b-c>.<ext>   (char/, tile/, fx/)
         CILIA_FIG_IMG/KNIGHT  -> assets/portraits/<god>.<ext>
         F?_SPR                -> assets/fx/<var-without-_SPR>.<ext>
         god cards             -> assets/gods/<god>.jpg
"""
import base64, re, os, sys, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")
html = open(HTML, "r", encoding="utf-8").read()
before = len(html)

uri_re = re.compile(r'data:(?P<mime>[\w/+.-]+);base64,(?P<b64>[A-Za-z0-9+/=]+)')
bind = [
    ("manifest", re.compile(r"""['"]([\w.]+)['"]\s*:\s*['"]$""")),
    ("const",    re.compile(r"""(?:const|let|var)\s+(\w+)\s*=\s*['"]$""")),
    ("img_src",  re.compile(r"""(\w+)\.src\s*=\s*['"]$""")),
]
CONST_MAP = {"CILIA_FIG_IMG": "portraits/cilia", "KNIGHT_FIG_IMG": "portraits/knight"}

def truefmt(d):
    if d[:3]==b"\xff\xd8\xff": return "jpg"
    if d[:8]==b"\x89PNG\r\n\x1a\n": return "png"
    if d[:4]==b"RIFF" and d[8:12]==b"WEBP": return "webp"
    if d[:6] in (b"GIF87a",b"GIF89a"): return "gif"
    return "bin"

def target_for(kind, name, ext):
    if kind == "manifest":
        parts = name.split(".")
        return f"assets/{parts[0]}/{'-'.join(parts[1:])}.{ext}"
    if kind == "const":
        if name not in CONST_MAP: raise ValueError(f"unmapped const {name}")
        return f"assets/{CONST_MAP[name]}.{ext}"
    if kind == "img_src":
        base = re.sub(r"_SPR$", "", name).lower()
        return f"assets/fx/{base}.{ext}"
    raise ValueError(f"unknown kind for {name}")

# --- pass 1: find every blob, decode, decide target, collect line-by-line ---
repl = {}   # data-uri text -> path
seen_paths = {}
fails = []
counts = {"manifest":0,"const":0,"img_src":0}
lines = html.split("\n")
for i, ln in enumerate(lines, 1):
    for m in uri_re.finditer(ln):
        pre = ln[:m.start()]
        kind = name = None
        for k, p in bind:
            mm = p.search(pre)
            if mm: kind, name = k, mm.group(1); break
        if not kind:
            fails.append((i, "no binding detected")); continue
        data = base64.b64decode(m.group("b64"))
        ext = truefmt(data)
        if ext == "bin":
            fails.append((i, f"{name}: unknown format")); continue
        try:
            rel = target_for(kind, name, ext)
        except ValueError as e:
            fails.append((i, str(e))); continue
        if rel in seen_paths and seen_paths[rel] != m.group(0):
            fails.append((i, f"path collision {rel}")); continue
        seen_paths[rel] = m.group(0)
        absdir = os.path.join(ROOT, os.path.dirname(rel))
        os.makedirs(absdir, exist_ok=True)
        with open(os.path.join(ROOT, rel), "wb") as f:
            f.write(data)
        repl[m.group(0)] = rel
        counts[kind] += 1

if fails:
    print("FAILURES — aborting, no rewrite:", file=sys.stderr)
    for ln, why in fails: print(f"  L{ln}: {why}", file=sys.stderr)
    sys.exit(1)

# --- pass 2: rewrite references (exact data-uri substring -> path) ---
for uri, path in repl.items():
    html = html.replace(uri, path)

# --- pass 3: relocate the 4 POC god cards art/gods/cards -> assets/gods ---
src_dir = os.path.join(ROOT, "art", "gods", "cards")
dst_dir = os.path.join(ROOT, "assets", "gods")
moved = 0
if os.path.isdir(src_dir):
    os.makedirs(dst_dir, exist_ok=True)
    for fn in os.listdir(src_dir):
        shutil.move(os.path.join(src_dir, fn), os.path.join(dst_dir, fn)); moved += 1
    os.rmdir(src_dir)
    html = html.replace("art/gods/cards/", "assets/gods/")

# sanity: no literal base64 image data left
left = len(uri_re.findall(html))
open(HTML, "w", encoding="utf-8").write(html)

print(f"externalized: manifest={counts['manifest']} const={counts['const']} img_src={counts['img_src']}  god-cards relocated={moved}")
print(f"remaining inline base64 image URIs: {left}")
print(f"index.html: {before//1024//1024}MB -> {len(html)//1024//1024}MB  ({before//1024}KB -> {len(html)//1024}KB)")
