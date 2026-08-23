from __future__ import annotations

import argparse
import io
import os
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[5]
FACE_ROOT = ROOT / "assets/source/doyun/face-continuity-2026-08-23"
SOURCE_ROOT = ROOT / "assets/source/doyun/delivery"
RUNTIME_ROOT = ROOT / "assets/runtime/char"
CANVAS = (1200, 2000)
BASELINE_SHA = "39f4370ab731377b77f3898f48496990961b81cc"

# These envelopes were audited against each 1200x2000 target. They stay inside
# the face and above the original mouth so crown, hair silhouette, ears, neck,
# mouth, costume, hands, staff and pose remain baseline pixels.
TARGETS: dict[str, dict[str, object]] = {
    "char_doyun_magical.png": {
        "candidate": "char_doyun_magical_candidate.png",
        "polygon": (
            (550, 154),
            (582, 132),
            (661, 132),
            (703, 164),
            (700, 220),
            (670, 260),
            (615, 276),
            (568, 246),
            (546, 202),
        ),
        "offset": (0, 0),
    },
    "char_doyun_magical_defend.png": {
        "candidate": "char_doyun_magical_defend_candidate.png",
        "polygon": (
            (484, 148),
            (516, 128),
            (590, 130),
            (635, 164),
            (634, 220),
            (607, 264),
            (541, 276),
            (492, 238),
            (472, 188),
        ),
        "offset": (0, 0),
    },
    "char_doyun_magical_attack.png": {
        "candidate": "char_doyun_magical_attack_candidate.png",
        "polygon": (
            (578, 365),
            (608, 346),
            (679, 347),
            (718, 374),
            (720, 418),
            (690, 462),
            (628, 470),
            (582, 426),
            (566, 386),
        ),
        "offset": (0, 35),
    },
    "char_doyun_magical_finish.png": {
        "candidate": "char_doyun_magical_finish_candidate.png",
        "polygon": (
            (557, 310),
            (590, 290),
            (680, 294),
            (718, 326),
            (720, 390),
            (690, 454),
            (622, 464),
            (570, 420),
            (546, 350),
        ),
        "offset": (0, 5),
    },
}


def build_internal_feather_mask(
    polygon: tuple[tuple[int, int], ...]
) -> Image.Image:
    hard = Image.new("L", CANVAS, 0)
    ImageDraw.Draw(hard).polygon(polygon, fill=255)
    blurred = hard.filter(ImageFilter.GaussianBlur(radius=3))
    return ImageChops.multiply(blurred, hard)


def fit_candidate(candidate: Image.Image, offset: tuple[int, int]) -> Image.Image:
    resized = candidate.convert("RGBA").resize(CANVAS, Image.Resampling.LANCZOS)
    if offset == (0, 0):
        return resized
    return resized.transform(
        CANVAS,
        Image.Transform.AFFINE,
        (1, 0, -offset[0], 0, 1, -offset[1]),
        resample=Image.Resampling.BICUBIC,
        fillcolor=(0, 0, 0, 0),
    )


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True, compress_level=9)
    return buffer.getvalue()


def git_baseline(path: Path, baseline: str) -> Image.Image:
    relative = path.relative_to(ROOT).as_posix()
    data = subprocess.check_output(["git", "show", f"{baseline}:{relative}"], cwd=ROOT)
    return Image.open(io.BytesIO(data)).copy()


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


def indexed_face_composite(
    baseline: Image.Image, candidate: Image.Image, mask: Image.Image
) -> Image.Image:
    if baseline.mode != "P" or baseline.getpalette() is None:
        raise ValueError(f"Expected indexed baseline, got {baseline.mode}")
    baseline_rgba = np.asarray(baseline.convert("RGBA"), dtype=np.uint8)
    candidate_rgba = np.asarray(candidate.convert("RGBA"), dtype=np.uint8)
    mask_values = np.asarray(mask, dtype=np.uint8)
    weights = mask_values[:, :, None].astype(np.float32) / 255.0
    desired_rgb = np.rint(
        candidate_rgba[:, :, :3] * weights
        + baseline_rgba[:, :, :3] * (1.0 - weights)
    ).astype(np.uint8)

    palette = np.asarray(baseline.getpalette(), dtype=np.uint8).reshape(256, 3)
    alpha = np.asarray(palette_alpha(baseline), dtype=np.uint8)
    changed_coordinates = np.argwhere(mask_values > 0)
    changed_colors = desired_rgb[mask_values > 0]
    unique_values, inverse = np.unique(changed_colors, axis=0, return_inverse=True)
    mapped = np.empty(len(unique_values), dtype=np.uint8)
    # The audited masks sit wholly inside the opaque face silhouette. Limiting
    # colors to the baseline pixel's exact (often one-off) alpha entry can
    # reintroduce the old gray eye band because that entry has no skin/eye
    # colors. Reuse only the baseline's high-opacity palette entries inside the
    # mask; every index and palette entry outside the mask stays byte-for-byte
    # authoritative.
    palette_indices = np.flatnonzero(alpha >= 249)
    available_palette = palette[palette_indices].astype(np.int32)
    for start in range(0, len(unique_values), 256):
        rows = np.arange(start, min(start + 256, len(unique_values)))
        batch = unique_values[rows].astype(np.int32)
        distances = ((batch[:, None, :] - available_palette[None, :, :]) ** 2).sum(
            axis=2
        )
        mapped[rows] = palette_indices[np.argmin(distances, axis=1)]

    indices = np.asarray(baseline, dtype=np.uint8).copy()
    indices[changed_coordinates[:, 0], changed_coordinates[:, 1]] = mapped[inverse]
    edited = Image.fromarray(indices, mode="P")
    edited.putpalette(baseline.getpalette())
    transparency = baseline.info.get("transparency")
    if transparency is not None:
        edited.info["transparency"] = transparency
    return edited


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.stem}-", suffix=path.suffix, dir=path.parent
    )
    os.close(descriptor)
    temporary = Path(temporary_name)
    try:
        temporary.write_bytes(data)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def apply_target(
    name: str, config: dict[str, object], write_masks: bool, baseline_sha: str
) -> None:
    source_path = SOURCE_ROOT / name
    runtime_path = RUNTIME_ROOT / name
    candidate_path = FACE_ROOT / "candidates" / str(config["candidate"])
    mask_path = FACE_ROOT / "masks" / name.replace(".png", "_mask.png")

    baseline = git_baseline(source_path, baseline_sha)
    if baseline.size != CANVAS:
        raise ValueError(f"Unexpected baseline size for {name}: {baseline.size}")
    candidate = fit_candidate(Image.open(candidate_path), tuple(config["offset"]))
    mask = build_internal_feather_mask(tuple(config["polygon"]))
    if write_masks or not mask_path.exists():
        atomic_write(mask_path, png_bytes(mask))

    edited = indexed_face_composite(baseline, candidate, mask)
    output = png_bytes(edited)
    atomic_write(source_path, output)
    atomic_write(runtime_path, output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-masks", action="store_true")
    parser.add_argument("--target", choices=tuple(TARGETS))
    parser.add_argument("--baseline", default=BASELINE_SHA)
    args = parser.parse_args()
    selected = {args.target: TARGETS[args.target]} if args.target else TARGETS
    for name, config in selected.items():
        apply_target(name, config, args.write_masks, args.baseline)
        print(name)


if __name__ == "__main__":
    main()
