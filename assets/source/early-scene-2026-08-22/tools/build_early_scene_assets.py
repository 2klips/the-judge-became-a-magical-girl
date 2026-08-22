from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path
from shutil import copyfile

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / "assets" / "source" / "early-scene-2026-08-22"
ORIGINALS = SOURCE / "originals"
DELIVERY = SOURCE / "delivery"
RUNTIME = ROOT / "assets" / "runtime"

CHARACTER_OUTPUTS = {
    "image_02_doyun_suspicious.png": "char_doyun_normal_suspicious.png",
    "image_03_doyun_employee_id_surprised.png": "char_doyun_employee_id_surprised.png",
}
CUT_OUTPUTS = {
    "image_04_juno_monitor_emerge.png": "cut_juno_monitor_emerge.webp",
    "image_05_monitor_direct_wish_prompt.png": "cut_monitor_direct_wish_prompt.webp",
}


def components(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    found: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or seen[y, x]:
                continue
            queue = deque([(y, x)])
            seen[y, x] = True
            current: list[tuple[int, int]] = []
            while queue:
                cy, cx = queue.popleft()
                current.append((cy, cx))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        if dx == 0 and dy == 0:
                            continue
                        ny, nx = cy + dy, cx + dx
                        if (
                            0 <= ny < height
                            and 0 <= nx < width
                            and mask[ny, nx]
                            and not seen[ny, nx]
                        ):
                            seen[ny, nx] = True
                            queue.append((ny, nx))
            found.append(current)
    return sorted(found, key=len, reverse=True)


def remove_punctuation(image: Image.Image) -> Image.Image:
    pixels = np.array(image.convert("RGBA"))
    found = components(pixels[:, :, 3] > 0)
    if len(found) < 2 or len(found[1]) < 1_000:
        raise RuntimeError("Expected detached punctuation was not found")
    ys = [y for y, _ in found[1]]
    xs = [x for _, x in found[1]]
    if max(ys) >= 220 or min(xs) <= 560:
        raise RuntimeError("Detached component is outside the audited safe zone")
    for y, x in found[1]:
        pixels[y, x] = (0, 0, 0, 0)
    return Image.fromarray(pixels, mode="RGBA")


def normalize_character(source: Path) -> Image.Image:
    cleaned = remove_punctuation(Image.open(source))
    bbox = cleaned.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"No visible subject: {source}")
    subject = cleaned.crop(bbox)
    target_height = 1935
    target_width = round(subject.width * target_height / subject.height)
    subject = subject.resize((target_width, target_height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (1200, 2000), (0, 0, 0, 0))
    canvas.alpha_composite(subject, ((1200 - target_width) // 2, 30))
    return canvas


def save_indexed(image: Image.Image, destination: Path) -> None:
    flat = Image.new("RGB", image.size, (255, 0, 255))
    flat.paste(image.convert("RGB"), mask=image.getchannel("A"))
    palette = flat.resize((240, 400), Image.Resampling.LANCZOS).quantize(
        colors=256, method=Image.Quantize.MEDIANCUT
    )
    transparent_index = Image.new("RGB", (1, 1), (255, 0, 255)).quantize(
        palette=palette, dither=Image.Dither.NONE
    ).getpixel((0, 0))
    indexed = flat.quantize(palette=palette, dither=Image.Dither.NONE)
    indexed_pixels = np.array(indexed)
    indexed_pixels[np.array(image.getchannel("A")) < 128] = transparent_index
    output = Image.fromarray(indexed_pixels.astype("uint8"), mode="P")
    output.putpalette(indexed.getpalette())
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(
        destination,
        format="PNG",
        optimize=True,
        compress_level=9,
        transparency=transparent_index,
    )


def normalize_cut(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGB")
    width = round(image.width * 1080 / image.height)
    image = image.resize((width, 1080), Image.Resampling.LANCZOS)
    left = max(0, (image.width - 1920) // 2)
    image = image.crop((left, 0, left + 1920, 1080))
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, format="WEBP", quality=84, method=6)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("image_02", type=Path)
    parser.add_argument("image_03", type=Path)
    parser.add_argument("image_04", type=Path)
    parser.add_argument("image_05", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    user_files = {
        "image_02_doyun_suspicious.png": args.image_02,
        "image_03_doyun_employee_id_surprised.png": args.image_03,
        "image_04_juno_monitor_emerge.png": args.image_04,
        "image_05_monitor_direct_wish_prompt.png": args.image_05,
    }
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    for name, user_path in user_files.items():
        if not user_path.is_file():
            raise FileNotFoundError(user_path)
        with Image.open(user_path) as probe:
            probe.verify()
        copyfile(user_path, ORIGINALS / name)
    for source_name, output_name in CHARACTER_OUTPUTS.items():
        delivery = DELIVERY / "char" / output_name
        save_indexed(normalize_character(ORIGINALS / source_name), delivery)
        runtime = RUNTIME / "char" / output_name
        runtime.parent.mkdir(parents=True, exist_ok=True)
        copyfile(delivery, runtime)
    for source_name, output_name in CUT_OUTPUTS.items():
        delivery = DELIVERY / "cut" / output_name
        normalize_cut(ORIGINALS / source_name, delivery)
        runtime = RUNTIME / "cut" / output_name
        runtime.parent.mkdir(parents=True, exist_ok=True)
        copyfile(delivery, runtime)


if __name__ == "__main__":
    main()
