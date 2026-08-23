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

BASELINE_SHA = "39f4370ab731377b77f3898f48496990961b81cc"
MAX_BYTES = 800 * 1024
ARTIFACT_MIN_RED = 120
ARTIFACT_MAX_GREEN = 70
ARTIFACT_MIN_BLUE = 120


def saturated_magenta(rgba: np.ndarray) -> np.ndarray:
    return (
        (rgba[:, :, 0] >= ARTIFACT_MIN_RED)
        & (rgba[:, :, 1] <= ARTIFACT_MAX_GREEN)
        & (rgba[:, :, 2] >= ARTIFACT_MIN_BLUE)
        & (rgba[:, :, 3] >= 128)
    )


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


def clean_magenta_artifact(image: Image.Image) -> Image.Image:
    if image.mode != "P":
        raise ValueError(f"Expected indexed PNG, got {image.mode}")
    palette = image.getpalette()
    if palette is None:
        raise ValueError("Indexed PNG has no palette")
    alpha = palette_alpha(image)
    artifact_indices = []
    for index in range(256):
        offset = index * 3
        red, green, blue = palette[offset : offset + 3]
        if (
            red >= ARTIFACT_MIN_RED
            and green <= ARTIFACT_MAX_GREEN
            and blue >= ARTIFACT_MIN_BLUE
            and alpha[index] >= 128
        ):
            artifact_indices.append(index)
    if not artifact_indices:
        raise ValueError("No opaque saturated-magenta palette entry found")
    cleaned = image.copy()
    cleaned.putpalette(palette)
    for index in artifact_indices:
        alpha[index] = 0
    cleaned.info["transparency"] = bytes(alpha)
    return cleaned


def git_blob(baseline: str, path: Path) -> bytes:
    repository_path = path.as_posix()
    return subprocess.check_output(["git", "show", f"{baseline}:{repository_path}"])


def decoded_rgba(data: bytes) -> tuple[np.ndarray, str, bool]:
    with Image.open(io.BytesIO(data)) as image:
        return (
            np.array(image.convert("RGBA")),
            image.mode,
            "transparency" in image.info,
        )


def build_report(baseline_bytes: bytes, source_bytes: bytes, runtime_bytes: bytes) -> dict[str, object]:
    before, _, _ = decoded_rgba(baseline_bytes)
    after, mode, has_transparency = decoded_rgba(source_bytes)
    if before.shape != after.shape:
        raise ValueError(f"Dimension mismatch: {before.shape} != {after.shape}")
    artifact = saturated_magenta(before)
    changed = np.any(before != after, axis=2)
    report: dict[str, object] = {
        "baselineSha256": hashlib.sha256(baseline_bytes).hexdigest().upper(),
        "cleanedSha256": hashlib.sha256(source_bytes).hexdigest().upper(),
        "beforeArtifactPixels": int(artifact.sum()),
        "opaqueSaturatedMagenta": int(saturated_magenta(after).sum()),
        "nonArtifactChangedPixels": int((changed & ~artifact).sum()),
        "artifactRgbChangedPixels": int(
            (np.any(before[:, :, :3] != after[:, :, :3], axis=2) & artifact).sum()
        ),
        "artifactOpaquePixelsAfter": int(((after[:, :, 3] != 0) & artifact).sum()),
        "width": int(after.shape[1]),
        "height": int(after.shape[0]),
        "mode": mode,
        "transparentPng": has_transparency,
        "sourceRuntimeEqual": source_bytes == runtime_bytes,
        "bytes": len(source_bytes),
    }
    return report


def assert_report(report: dict[str, object]) -> None:
    expected = {
        "opaqueSaturatedMagenta": 0,
        "nonArtifactChangedPixels": 0,
        "artifactRgbChangedPixels": 0,
        "artifactOpaquePixelsAfter": 0,
        "width": 1200,
        "height": 2000,
        "mode": "P",
        "transparentPng": True,
        "sourceRuntimeEqual": True,
    }
    if int(report["beforeArtifactPixels"]) <= 0:
        raise ValueError("Baseline contains no audited artifact pixels")
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
        cleaned = clean_magenta_artifact(image)
    source.parent.mkdir(parents=True, exist_ok=True)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    source_temp_fd, source_temp_name = tempfile.mkstemp(
        prefix=f".{source.stem}-", suffix=".png", dir=source.parent
    )
    os.close(source_temp_fd)
    source_temp = Path(source_temp_name)
    runtime_temp_fd, runtime_temp_name = tempfile.mkstemp(
        prefix=f".{runtime.stem}-", suffix=".png", dir=runtime.parent
    )
    os.close(runtime_temp_fd)
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
