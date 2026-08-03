from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source"
OUT = ROOT / "delivery" / "char"
NAMES = ("neutral", "happy", "shy", "upset", "surprised")
FINAL_SIZE = (1200, 2000)


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def expression_composites() -> dict[str, Image.Image]:
    neutral = load_rgba(SOURCE / "juno_neutral_transparent.png")
    width, height = neutral.size

    # The mask stays entirely inside the smooth yellow face and above the
    # pendant cord. Thus every silhouette, prop and body pixel comes from the
    # reference-based neutral master.
    face_mask = Image.new("L", neutral.size, 0)
    ellipse = Image.new("L", (420, 250), 0)
    ImageDraw.Draw(ellipse).ellipse((3, 3, 416, 246), fill=255)
    ellipse = ellipse.filter(ImageFilter.GaussianBlur(5))
    face_mask.paste(ellipse, (275, 355))

    result = {"neutral": neutral}
    for name in NAMES[1:]:
        variant = load_rgba(SOURCE / f"juno_{name}_transparent.png")
        if variant.size != neutral.size:
            variant = variant.resize((width, height), Image.Resampling.LANCZOS)
        composed = neutral.copy()
        composed.paste(variant, (0, 0), face_mask)
        result[name] = composed
    return result


def normalize_canvas(images: dict[str, Image.Image]) -> dict[str, Image.Image]:
    neutral_bbox = images["neutral"].getchannel("A").getbbox()
    if neutral_bbox is None:
        raise RuntimeError("Neutral master has no visible pixels")

    left, top, right, bottom = neutral_bbox
    crop_w, crop_h = right - left, bottom - top
    scale = min(1040 / crop_w, 1260 / crop_h)
    draw_w = round(crop_w * scale)
    draw_h = round(crop_h * scale)
    x = (FINAL_SIZE[0] - draw_w) // 2
    y = 90

    result: dict[str, Image.Image] = {}
    for name, image in images.items():
        crop = image.crop(neutral_bbox).resize((draw_w, draw_h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", FINAL_SIZE, (0, 0, 0, 0))
        canvas.alpha_composite(crop, (x, y))
        result[name] = canvas
    return result


def flatten_for_palette(image: Image.Image) -> Image.Image:
    background = Image.new("RGB", image.size, (255, 0, 255))
    background.paste(image.convert("RGB"), mask=image.getchannel("A"))
    return background


def build_shared_palette(images: dict[str, Image.Image]) -> Image.Image:
    strip = Image.new("RGB", (240 * len(NAMES), 400), (255, 0, 255))
    for index, name in enumerate(NAMES):
        thumb = flatten_for_palette(images[name]).resize((240, 400), Image.Resampling.LANCZOS)
        strip.paste(thumb, (240 * index, 0))
    return strip.quantize(colors=256, method=Image.Quantize.MEDIANCUT)


def save_indexed(images: dict[str, Image.Image]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    palette = build_shared_palette(images)
    probe = Image.new("RGB", (1, 1), (255, 0, 255)).quantize(
        palette=palette, dither=Image.Dither.NONE
    )
    transparent_index = probe.getpixel((0, 0))

    for name, image in images.items():
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
            OUT / f"char_juno_{name}.png",
            format="PNG",
            optimize=True,
            compress_level=9,
            transparency=transparent_index,
        )


def save_preview() -> None:
    tile_w, tile_h, label_h = 280, 500, 42
    preview = Image.new("RGB", (tile_w * len(NAMES), tile_h + label_h), "#18202b")
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default(size=18)

    for index, name in enumerate(NAMES):
        x0 = index * tile_w
        checker = Image.new("RGB", (tile_w, tile_h), "#d9dde4")
        checker_draw = ImageDraw.Draw(checker)
        cell = 20
        for y in range(0, tile_h, cell):
            for x in range(0, tile_w, cell):
                if (x // cell + y // cell) % 2:
                    checker_draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill="#eef0f4")
        sprite = Image.open(OUT / f"char_juno_{name}.png").convert("RGBA")
        sprite.thumbnail((tile_w, tile_h), Image.Resampling.LANCZOS)
        checker.paste(sprite, ((tile_w - sprite.width) // 2, 0), sprite)
        preview.paste(checker, (x0, 0))
        bbox = draw.textbbox((0, 0), name.upper(), font=font)
        text_w = bbox[2] - bbox[0]
        draw.text((x0 + (tile_w - text_w) // 2, tile_h + 10), name.upper(), font=font, fill="white")

    preview.save(ROOT / "preview_juno_expressions.png", optimize=True)


if __name__ == "__main__":
    save_indexed(normalize_canvas(expression_composites()))
    save_preview()
