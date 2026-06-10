#!/usr/bin/env python3
"""
clean-anim-scratch.py — delete the regenerable animation-slicing scratch.

Intended to run from a SessionEnd hook (once, at session end — after QA on the
confirmed sprites is done), so the big frame dumps don't linger. It is SAFE by
construction: it deletes only paths that are **untracked by git**, so nothing
committed (assets/, the .mp4 source masters, committed QA sheets, handoffs) is
ever touched — only the disposable extractions/analysis sheets.

What it removes (under art/, only if git-untracked):
  - `_frames*` directories  (per-clip extracted PNG dumps — hundreds of MB, regenerable from the .mp4)
  - `_*.png` / `_*.gif` scratch files  (contact sheets, candidate strips, zoom/diagnostic images)

It deliberately keeps: the final cutouts in assets/char/, the `.mp4` masters,
the committed `_magenta-contact.png`/`_preview_2x.gif`/`manifest-snippet.txt`/HANDOFF files
(those are git-tracked → skipped), and any non-underscore files.

Usage:  python tools/clean-anim-scratch.py [--dry-run]
"""
import os, sys, glob, shutil, subprocess

ART_ROOTS = ["art"]
DRY = "--dry-run" in sys.argv


def chdir_repo_root():
    """cd to the git repo root so relative globs work no matter where the hook fires from."""
    try:
        root = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                              capture_output=True, text=True, check=True).stdout.strip()
        if root:
            os.chdir(root)
    except Exception:
        pass  # fall back to cwd


def git_tracked():
    try:
        out = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout
    except Exception:
        return None  # not a git repo / git unavailable → be conservative (handled by caller)
    return set(p.replace("/", os.sep) for p in out.splitlines())


def main():
    chdir_repo_root()
    tracked = git_tracked()
    if tracked is None:
        print("clean-anim-scratch: git unavailable — refusing to delete (can't verify what's committed).")
        return 0

    targets_dirs, targets_files = [], []
    for root in ART_ROOTS:
        # 1. _frames* extraction dirs (never committed)
        for d in glob.glob(os.path.join(root, "**", "_frames*"), recursive=True):
            if os.path.isdir(d):
                targets_dirs.append(d)
        # 2. underscore-prefixed scratch images, only if untracked
        for pat in ("_*.png", "_*.gif"):
            for f in glob.glob(os.path.join(root, "**", pat), recursive=True):
                if os.path.isfile(f) and os.path.normpath(f) not in tracked:
                    targets_files.append(f)

    def size_of(p):
        if os.path.isfile(p):
            return os.path.getsize(p)
        return sum(os.path.getsize(os.path.join(dp, fn))
                   for dp, _, fns in os.walk(p) for fn in fns)

    freed = 0
    for p in targets_dirs + targets_files:
        try:
            freed += size_of(p)
        except OSError:
            pass

    if not targets_dirs and not targets_files:
        print("clean-anim-scratch: nothing to clean.")
        return 0

    verb = "[dry-run] would remove" if DRY else "removed"
    for d in targets_dirs:
        if not DRY:
            shutil.rmtree(d, ignore_errors=True)
        print(f"  {verb} dir   {d}")
    for f in targets_files:
        if not DRY:
            try:
                os.remove(f)
            except OSError:
                pass
        print(f"  {verb} file  {f}")
    print(f"clean-anim-scratch: {verb.split(']')[-1].strip()} {len(targets_dirs)} dir(s) + "
          f"{len(targets_files)} file(s), ~{freed/1e6:.1f} MB.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
