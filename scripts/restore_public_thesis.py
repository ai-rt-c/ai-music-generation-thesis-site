"""Restore and verify the sanitised public thesis PDF before a site build."""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PARTS_DIR = ROOT / "data" / "thesis-pdf"
MANIFEST_PATH = PARTS_DIR / "manifest.json"
OUTPUT_DIR = ROOT / "public" / "thesis"


def verified(path: Path, expected_size: int, expected_sha: str) -> bool:
    if not path.exists() or path.stat().st_size != expected_size:
        return False
    return hashlib.sha256(path.read_bytes()).hexdigest() == expected_sha


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="ascii"))
    output = OUTPUT_DIR / manifest["file"]
    if verified(output, manifest["size"], manifest["sha256"]):
        print("Public thesis PDF already verified")
        return

    encoded = "".join(
        (PARTS_DIR / part_name).read_text(encoding="ascii")
        for part_name in manifest["parts"]
    )
    raw = base64.b64decode(encoded, validate=True)
    if len(raw) != manifest["size"]:
        raise RuntimeError("Restored public thesis PDF has the wrong size")
    if hashlib.sha256(raw).hexdigest() != manifest["sha256"]:
        raise RuntimeError("Restored public thesis PDF failed SHA-256 verification")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(".pdf.tmp")
    temporary.write_bytes(raw)
    temporary.replace(output)
    print("Restored and verified public thesis PDF")


if __name__ == "__main__":
    main()
