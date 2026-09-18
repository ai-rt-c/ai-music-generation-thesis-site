"""Package the sanitised public thesis PDF as deterministic base64 parts."""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "public" / "thesis" / "AI_Music_Thesis_Public_Edition.pdf"
PARTS_DIR = ROOT / "data" / "thesis-pdf"
MANIFEST_PATH = PARTS_DIR / "manifest.json"
PART_CHARS = 600_000  # Must be divisible by four for independent base64 boundaries.


def main() -> None:
    if PART_CHARS % 4:
        raise RuntimeError("PART_CHARS must be divisible by four")
    if not PDF_PATH.exists():
        raise FileNotFoundError(PDF_PATH)

    raw = PDF_PATH.read_bytes()
    encoded = base64.b64encode(raw).decode("ascii")
    PARTS_DIR.mkdir(parents=True, exist_ok=True)
    for existing in PARTS_DIR.glob("part-*.b64"):
        existing.unlink()

    part_names: list[str] = []
    for index, start in enumerate(range(0, len(encoded), PART_CHARS), start=1):
        name = f"part-{index:03d}.b64"
        (PARTS_DIR / name).write_text(encoded[start : start + PART_CHARS], encoding="ascii")
        part_names.append(name)

    manifest = {
        "file": PDF_PATH.name,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "size": len(raw),
        "parts": part_names,
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=True, separators=(",", ":")) + "\n",
        encoding="ascii",
    )
    print(f"Packaged {len(raw)} bytes into {len(part_names)} parts")


if __name__ == "__main__":
    main()
