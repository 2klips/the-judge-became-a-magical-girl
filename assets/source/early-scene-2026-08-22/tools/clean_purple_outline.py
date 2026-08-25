from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

BASELINE_SHA = "7a3e9630e569521d6e56a2c1376c453ba1e49692"
MAX_BYTES = 800 * 1024
MAX_OUTLINE_LAYERS = 32
PURPLE_MIN_RED = 45
PURPLE_MIN_BLUE = 45
PURPLE_GREEN_GAP = 25
PURPLE_RED_BLUE_DELTA = 24


def palette_alpha(image: Image.Image) -> list[int]:
    transparency = image.info.get("transparency")
    alpha = [255] * 256
    if isinstance(transparency, int):
        alpha[transparency] = 0
    elif isinstance(transparency, bytes):
        alpha[: len(transparency)] = transparency
    elif isinstance(transparency, (list, tuple)):
        alpha[: len(transparency)] = [int(value) for value in transparency]
    return alpha


def purple_pixels(rgba: np.ndarray) -> np.ndarray:
    red = rgba[:, :, 0].astype(np.int16)
    green = rgba[:, :, 1].astype(np.int16)
    blue = rgba[:, :, 2].astype(np.int16)
    return (
        (red >= PURPLE_MIN_RED)
        & (blue >= PURPLE_MIN_BLUE)
        & (np.minimum(red, blue) >= green + PURPLE_GREEN_GAP)
        & (np.abs(red - blue) <= PURPLE_RED_BLUE_DELTA)
    )


def transparent_neighbor(alpha: np.ndarray) -> np.ndarray:
    transparent = alpha == 0
    neighbor = np.zeros(transparent.shape, dtype=bool)
    neighbor[1:, :] |= transparent[:-1, :]
    neighbor[:-1, :] |= transparent[1:, :]
    neighbor[:, 1:] |= transparent[:, :-1]
    neighbor[:, :-1] |= transparent[:, 1:]
    return neighbor


def purple_boundary(rgba: np.ndarray) -> np.ndarray:
    alpha = rgba[:, :, 3]
    return (alpha >= 128) & transparent_neighbor(alpha) & purple_pixels(rgba)


def audited_outline(rgba: np.ndarray) -> np.ndarray:
    working = rgba.copy()
    selected = np.zeros(working.shape[:2], dtype=bool)
    for _ in range(MAX_OUTLINE_LAYERS):
        boundary = purple_boundary(working)
        if not boundary.any():
            return selected
        selected |= boundary
        working[:, :, 3][boundary] = 0
    if purple_boundary(working).any():
        raise ValueError(f"Purple boundary exceeds {MAX_OUTLINE_LAYERS} audited layers")
    return selected


def clean_outline(image: Image.Image) -> Image.Image:
    if image.mode != "P":
        raise ValueError(f"Expected indexed PNG, got {image.mode}")
    palette = image.getpalette()
    if palette is None:
        raise ValueError("Indexed PNG has no palette")

    indices = np.array(image)
    rgba = np.array(image.convert("RGBA"))
    outline = audited_outline(rgba)
    if not outline.any():
        raise ValueError("No opaque purple boundary pixel found")

    used_indices = {int(value) for value in np.unique(indices)}
    free_indices = [index for index in range(256) if index not in used_indices]
    target_indices = [int(value) for value in np.unique(indices[outline])]
    if len(free_indices) < len(target_indices):
        raise ValueError("Not enough unused palette entries for RGB-preserving transparency")

    cleaned_indices = indices.copy()
    alpha = palette_alpha(image)
    for source_index, transparent_index in zip(
        target_indices, free_indices[: len(target_indices)], strict=True
    ):
        source_offset = source_index * 3
        target_offset = transparent_index * 3
        palette[target_offset : target_offset + 3] = palette[source_offset : source_offset + 3]
        alpha[transparent_index] = 0
        selected_index = outline & (indices == source_index)
        cleaned_indices[selected_index] = transparent_index

    cleaned = Image.fromarray(cleaned_indices.astype(np.uint8), mode="P")
    cleaned.putpalette(palette)
    cleaned.info["transparency"] = bytes(alpha)
    return cleaned


def git_blob(baseline: str, path: Path) -> bytes:
    return subprocess.check_output(["git", "show", f"{baseline}:{path.as_posix()}"])


def decoded_rgba(data: bytes) -> tuple[np.ndarray, str, bool]:
    with Image.open(io.BytesIO(data)) as image:
        return np.array(image.convert("RGBA")), image.mode, "transparency" in image.info


def build_report(baseline_bytes: bytes, source_bytes: bytes, runtime_bytes: bytes) -> dict[str, object]:
    before, _, _ = decoded_rgba(baseline_bytes)
    after, mode, has_transparency = decoded_rgba(source_bytes)
    if before.shape != after.shape:
        raise ValueError(f"Dimension mismatch: {before.shape} != {after.shape}")

    outline = audited_outline(before)
    changed = np.any(before != after, axis=2)
    return {
        "baselineSha256": hashlib.sha256(baseline_bytes).hexdigest().upper(),
        "cleanedSha256": hashlib.sha256(source_bytes).hexdigest().upper(),
        "outlinePixelsBefore": int(outline.sum()),
        "changedPixels": int(changed.sum()),
        "opaquePurpleBoundaryAfter": int(purple_boundary(after).sum()),
        "nonOutlineChangedPixels": int((changed & ~outline).sum()),
        "outlineRgbChangedPixels": int(
            (np.any(before[:, :, :3] != after[:, :, :3], axis=2) & outline).sum()
        ),
        "outlineOpaquePixelsAfter": int(((after[:, :, 3] != 0) & outline).sum()),
        "width": int(after.shape[1]),
        "height": int(after.shape[0]),
        "mode": mode,
        "transparentPng": has_transparency,
        "sourceRuntimeEqual": source_bytes == runtime_bytes,
        "bytes": len(source_bytes),
    }


def assert_report(report: dict[str, object]) -> None:
    expected = {
        "opaquePurpleBoundaryAfter": 0,
        "nonOutlineChangedPixels": 0,
        "outlineRgbChangedPixels": 0,
        "outlineOpaquePixelsAfter": 0,
        "width": 1200,
        "height": 2000,
        "mode": "P",
        "transparentPng": True,
        "sourceRuntimeEqual": True,
    }
    if int(report["outlinePixelsBefore"]) <= 0:
        raise ValueError("Baseline contains no audited purple outline pixels")
    if report["changedPixels"] != report["outlinePixelsBefore"]:
        raise ValueError("Changed pixel count differs from the audited outline")
    for key, value in expected.items():
        if report[key] != value:
            raise ValueError(f"Verification failed: {key}={report[key]!r}, expected {value!r}")
    if int(report["bytes"]) > MAX_BYTES:
        raise ValueError(f"Cleaned asset exceeds {MAX_BYTES} bytes")


def save_palette_png(image: Image.Image, destination: Path) -> None:
    image.save(
        destination,
        format="PNG",
        optimize=True,
        compress_level=9,
        transparency=image.info["transparency"],
    )


def clean_files(source: Path, runtime: Path, baseline: str) -> dict[str, object]:
    baseline_bytes = git_blob(baseline, source)
    with Image.open(source) as image:
        cleaned = clean_outline(image)
    source_fd, source_temp_name = tempfile.mkstemp(
        prefix=f".{source.stem}-", suffix=".png", dir=source.parent
    )
    os.close(source_fd)
    runtime_fd, runtime_temp_name = tempfile.mkstemp(
        prefix=f".{runtime.stem}-", suffix=".png", dir=runtime.parent
    )
    os.close(runtime_fd)
    source_temp = Path(source_temp_name)
    runtime_temp = Path(runtime_temp_name)
    try:
        save_palette_png(cleaned, source_temp)
        cleaned_bytes = source_temp.read_bytes()
        runtime_temp.write_bytes(cleaned_bytes)
        report = build_report(baseline_bytes, cleaned_bytes, runtime_temp.read_bytes())
        assert_report(report)
        os.replace(source_temp, source)
        os.replace(runtime_temp, runtime)
        return report
    finally:
        source_temp.unlink(missing_ok=True)
        runtime_temp.unlink(missing_ok=True)


def verify_files(source: Path, runtime: Path, baseline: str) -> dict[str, object]:
    report = build_report(git_blob(baseline, source), source.read_bytes(), runtime.read_bytes())
    assert_report(report)
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--baseline", default=BASELINE_SHA)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--runtime", type=Path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    report = (
        verify_files(args.source, args.runtime, args.baseline)
        if args.verify
        else clean_files(args.source, args.runtime, args.baseline)
    )
    print(json.dumps(report, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
