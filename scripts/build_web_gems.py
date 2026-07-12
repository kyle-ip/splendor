"""Build crisp Splendor-style gem tokens from high-res web gem PNGs."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps

ROOT = Path(r"c:\Projects\splendor-guide\public\assets\gems")
WEB = ROOT / "_web"
SIZE = 512
RIM = 38  # rim thickness in px


def load_rgba(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    return im


def white_to_alpha(im: Image.Image, threshold: int = 245) -> Image.Image:
    """Treat near-white as transparent (HiClipart JPG)."""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
            elif r > 230 and g > 230 and b > 230:
                # soft edge
                fade = int(255 * (threshold - min(r, g, b)) / max(1, threshold - 230))
                px[x, y] = (r, g, b, max(0, min(255, fade)))
    return im


def black_to_alpha(im: Image.Image, threshold: int = 18) -> Image.Image:
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r <= threshold and g <= threshold and b <= threshold:
                px[x, y] = (r, g, b, 0)
    return im


def trim_alpha(im: Image.Image, pad: int = 4) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    return im.crop(
        (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))
    )


def fit_gem(gem: Image.Image, box: int) -> Image.Image:
    gem = trim_alpha(gem)
    gem.thumbnail((box, box), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    ox = (box - gem.width) // 2
    oy = (box - gem.height) // 2
    canvas.alpha_composite(gem, (ox, oy))
    return canvas


def make_onyx_from_diamond(diamond: Image.Image) -> Image.Image:
    """Recolor a clear diamond into Splendor-like brown/black onyx."""
    im = diamond.convert("RGBA")
    # grayscale then tint
    gray = ImageOps.grayscale(im)
    tinted = ImageOps.colorize(gray, black="#1a100c", white="#6b4a32")
    tinted = tinted.convert("RGBA")
    # restore alpha from original
    tinted.putalpha(im.split()[-1])
    # deepen
    enhancer = ImageEnhance.Brightness(tinted)
    tinted = enhancer.enhance(0.72)
    return tinted


def draw_token(rim_rgb: tuple[int, int, int], gem: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # soft drop shadow
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    margin = 18
    sd.ellipse(
        (margin + 6, margin + 10, SIZE - margin + 6, SIZE - margin + 10),
        fill=(0, 0, 0, 70),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    canvas.alpha_composite(shadow)

    # outer rim
    outer = (margin, margin, SIZE - margin, SIZE - margin)
    draw.ellipse(outer, fill=(*rim_rgb, 255))

    # inner bevel highlight on rim
    inner_rim = (
        margin + 6,
        margin + 6,
        SIZE - margin - 6,
        SIZE - margin - 6,
    )
    # face disc
    face = (
        margin + RIM,
        margin + RIM,
        SIZE - margin - RIM,
        SIZE - margin - RIM,
    )
    # slightly lighter rim lip
    lip = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lip)
    ld.ellipse(inner_rim, fill=(255, 255, 255, 40))
    canvas.alpha_composite(lip)

    draw.ellipse(face, fill=(245, 236, 220, 255))

    # subtle radial warmth on face
    face_overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    fd = ImageDraw.Draw(face_overlay)
    cx = cy = SIZE // 2
    for i, alpha in enumerate((18, 10, 0)):
        pad = 28 + i * 18
        fd.ellipse(
            (cx - 90 + pad, cy - 100 + pad, cx + 90 - pad, cy + 70 - pad),
            fill=(255, 250, 240, alpha),
        )
    canvas.alpha_composite(face_overlay)

    # place gem
    gem_box = SIZE - 2 * (margin + RIM) - 36
    gem_fitted = fit_gem(gem, gem_box)
    gx = (SIZE - gem_fitted.width) // 2
    gy = (SIZE - gem_fitted.height) // 2 - 4
    canvas.alpha_composite(gem_fitted, (gx, gy))

    return canvas


def main() -> None:
    # Prefer clean transparent PNGs from pngimg; HiClipart JPG has baked checkerboard.
    sapphire = black_to_alpha(load_rgba(WEB / "src_sapphire.png"))
    # Prefer the clearer round-brilliant ruby download when present
    ruby_path = WEB / "pngimg_ruby.png"
    if not ruby_path.exists():
        ruby_path = WEB / "src_ruby.png"
    emerald = black_to_alpha(load_rgba(WEB / "src_emerald.png"))
    ruby = black_to_alpha(load_rgba(ruby_path))
    diamond = black_to_alpha(load_rgba(WEB / "src_diamond.png"))
    gold_bar = black_to_alpha(load_rgba(WEB / "src_gold2.png"))
    onyx = make_onyx_from_diamond(diamond)

    tokens = {
        "sapphire": ((30, 90, 170), sapphire),
        "emerald": ((40, 130, 70), emerald),
        "ruby": ((180, 40, 45), ruby),
        "diamond": ((230, 230, 235), diamond),
        "onyx": ((35, 28, 24), onyx),
        "gold": ((220, 175, 40), gold_bar),
    }

    sheet = Image.new("RGBA", (SIZE * 6 + 40, SIZE + 40), (255, 255, 255, 255))
    for i, (name, (rim, gem)) in enumerate(tokens.items()):
        token = draw_token(rim, gem)
        out = ROOT / f"{name}.png"
        token.save(out, optimize=True)
        print("wrote", out.name, token.size, out.stat().st_size)
        sheet.alpha_composite(token.resize((120, 120), Image.Resampling.LANCZOS), (20 + i * 130, 20))

    sheet.save(WEB / "preview_sheet.png")
    print("preview", WEB / "preview_sheet.png")


if __name__ == "__main__":
    main()
