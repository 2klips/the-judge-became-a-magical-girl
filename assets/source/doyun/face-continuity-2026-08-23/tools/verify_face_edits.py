from __future__ import annotations

import argparse
import hashlib
import io
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

BASELINE_SHA = "39f4370ab731377b77f3898f48496990961b81cc"
MAX_BYTES = 800 * 1024
ROOT = Path(__file__).resolve().parents[5]
FACE_ROOT = ROOT / "assets/source/doyun/face-continuity-2026-08-23"
SOURCE_ROOT = ROOT / "assets/source/doyun/delivery"
RUNTIME_ROOT = ROOT / "assets/runtime/char"
TARGETS = (
    "char_doyun_magical.png",
    "char_doyun_magical_defend.png",
    "char_doyun_magical_attack.png",
    "char_doyun_magical_finish.png",
)


def git_blob(baseline: str, path: Path) -> bytes:
    relative = path.relative_to(ROOT).as_posix()
    return subprocess.check_output(["git", "show", f"{baseline}:{relative}"], cwd=ROOT)


def read_rgba(data: bytes) -> np.ndarray:
    with Image.open(io.BytesIO(data)) as image:
        return np.array(image.convert("RGBA"))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest().upper()


def verify_target(name: str, baseline: str) -> dict[str, object]:
    source_path = SOURCE_ROOT / name
    runtime_path = RUNTIME_ROOT / name
    mask_path = FACE_ROOT / "masks" / name.replace(".png", "_mask.png")
    if not mask_path.is_file():
        raise FileNotFoundError(f"Missing face mask: {mask_path}")

    baseline_bytes = git_blob(baseline, source_path)
    source_bytes = source_path.read_bytes()
    runtime_bytes = runtime_path.read_bytes()
    before = read_rgba(baseline_bytes)
    after = read_rgba(source_bytes)
    with Image.open(mask_path) as mask_image:
        mask = np.array(mask_image.convert("L"))
    if before.shape != (2000, 1200, 4) or after.shape != before.shape:
        raise ValueError(f"Unexpected dimensions for {name}: {after.shape}")
    if mask.shape != before.shape[:2]:
        raise ValueError(f"Mask dimensions differ for {name}: {mask.shape}")

    changed = np.any(before != after, axis=2)
    outside = mask == 0
    outside_changed = int((changed & outside).sum())
    outside_alpha_changed = int(((before[:, :, 3] != after[:, :, 3]) & outside).sum())
    inside_changed = int((changed & ~outside).sum())
    if outside_changed or outside_alpha_changed:
        raise ValueError(
            f"{name}: outside-mask changes={outside_changed}, alpha={outside_alpha_changed}"
        )
    if inside_changed == 0:
        raise ValueError(f"{name}: no changed pixel inside face mask")
    if source_bytes != runtime_bytes:
        raise ValueError(f"{name}: source/runtime bytes differ")
    if len(source_bytes) > MAX_BYTES:
        raise ValueError(f"{name}: {len(source_bytes)} exceeds {MAX_BYTES}")
    if not np.any(after[:, :, 3] == 0):
        raise ValueError(f"{name}: transparent canvas missing")

    masked_rgba = after[mask > 0].tobytes()
    return {
        "name": name,
        "sha256": sha256(source_bytes),
        "bytes": len(source_bytes),
        "insideChangedPixels": inside_changed,
        "outsideChangedPixels": outside_changed,
        "outsideAlphaChangedPixels": outside_alpha_changed,
        "faceHash": sha256(masked_rgba),
        "sourceRuntimeEqual": True,
    }


def verify_magical_pose_unchanged(baseline: str) -> dict[str, object]:
    name = "char_doyun_magical_pose.png"
    source_path = SOURCE_ROOT / name
    runtime_path = RUNTIME_ROOT / name
    baseline_bytes = git_blob(baseline, source_path)
    source_bytes = source_path.read_bytes()
    runtime_bytes = runtime_path.read_bytes()
    if baseline_bytes != source_bytes or source_bytes != runtime_bytes:
        raise ValueError("char_doyun_magical_pose.png changed from the comparison baseline")
    return {"sha256": sha256(source_bytes), "bytes": len(source_bytes), "unchanged": True}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", default=BASELINE_SHA)
    args = parser.parse_args()
    targets = [verify_target(name, args.baseline) for name in TARGETS]
    face_hashes = [target["faceHash"] for target in targets]
    if len(set(face_hashes)) != len(face_hashes):
        raise ValueError("Target-specific face regions are not unique")
    print(
        json.dumps(
            {
                "baseline": args.baseline,
                "targets": targets,
                "magicalPose": verify_magical_pose_unchanged(args.baseline),
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
