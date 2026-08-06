from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source"
OUT = ROOT / "delivery" / "char"
STATES = ("normal", "hit", "attack", "death")
FINAL_SIZE = (1200, 2000)


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def clean_key_spill(image: Image.Image, state: str) -> Image.Image:
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if state == "normal" and g > r + 18 and g > b + 12:
                gray = round((r + g + b) / 3)
                pixels[x, y] = (gray, gray, min(255, gray + 5), a)
            elif state != "normal" and r > g + 20 and b > g + 20:
                gray = round((r + g + b) / 3)
                pixels[x, y] = (gray, gray, min(255, gray + 5), a)
    return image


def normalize_states() -> dict[str, Image.Image]:
    result: dict[str, Image.Image] = {}
    for state in STATES:
        image = clean_key_spill(
            load_rgba(SOURCE / f"gray_wraith_{state}_transparent.png"), state
        )
        bbox = image.getchannel("A").getbbox()
        if bbox is None:
            raise RuntimeError(f"{state} has no visible pixels")
        left, top, right, bottom = bbox
        crop_w, crop_h = right - left, bottom - top
        scale = min(1040 / crop_w, 1260 / crop_h)
        draw_w = round(crop_w * scale)
        draw_h = round(crop_h * scale)
        crop = image.crop(bbox).resize((draw_w, draw_h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", FINAL_SIZE, (0, 0, 0, 0))
        canvas.alpha_composite(crop, ((FINAL_SIZE[0] - draw_w) // 2, 90))
        result[state] = canvas
    return result


def flatten_for_palette(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    transparent_mask = image.getchannel("A").point(lambda a: 255 if a < 128 else 0)
    rgb.paste((255, 0, 255), mask=transparent_mask)
    return rgb


def save_indexed(images: dict[str, Image.Image]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    strip = Image.new("RGB", (220 * len(STATES), 370), (255, 0, 255))
    for index, state in enumerate(STATES):
        thumb = flatten_for_palette(images[state]).resize((220, 370), Image.Resampling.LANCZOS)
        strip.paste(thumb, (index * 220, 0))
    palette = strip.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    probe = Image.new("RGB", (1, 1), (255, 0, 255)).quantize(
        palette=palette, dither=Image.Dither.NONE
    )
    transparent_index = probe.getpixel((0, 0))

    for state, image in images.items():
        indexed = flatten_for_palette(image).quantize(
            palette=palette, dither=Image.Dither.NONE
        )
        alpha = image.getchannel("A")
        pixels = indexed.load()
        alpha_pixels = alpha.load()
        for y in range(indexed.height):
            for x in range(indexed.width):
                if alpha_pixels[x, y] < 128:
                    pixels[x, y] = transparent_index
        indexed.save(
            OUT / f"char_gray_wraith_{state}.png",
            format="PNG",
            optimize=True,
            compress_level=9,
            transparency=transparent_index,
        )


def save_preview() -> None:
    tile_w, tile_h, label_h = 350, 560, 46
    preview = Image.new("RGB", (tile_w * len(STATES), tile_h + label_h), "#151820")
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default(size=19)
    for index, state in enumerate(STATES):
        x0 = index * tile_w
        checker = Image.new("RGB", (tile_w, tile_h), "#cfd4dc")
        checker_draw = ImageDraw.Draw(checker)
        cell = 22
        for y in range(0, tile_h, cell):
            for x in range(0, tile_w, cell):
                if (x // cell + y // cell) % 2:
                    checker_draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill="#e7eaf0")
        sprite = Image.open(OUT / f"char_gray_wraith_{state}.png").convert("RGBA")
        sprite.thumbnail((tile_w, tile_h), Image.Resampling.LANCZOS)
        checker.paste(sprite, ((tile_w - sprite.width) // 2, 0), sprite)
        preview.paste(checker, (x0, 0))
        label = state.upper()
        bbox = draw.textbbox((0, 0), label, font=font)
        draw.text((x0 + (tile_w - (bbox[2] - bbox[0])) // 2, tile_h + 12), label, font=font, fill="white")
    preview.save(ROOT / "preview_gray_wraith_actions.png", optimize=True)


if __name__ == "__main__":
    images = normalize_states()
    save_indexed(images)
    save_preview()
