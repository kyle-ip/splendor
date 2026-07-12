"""Crop official gem tokens from Chinese rules page 2 and export PNGs."""
from pathlib import Path
from PIL import Image

src = Image.open(r"c:\Projects\splendor-guide\public\assets\rules\2.jpg").convert("RGBA")
out = Path(r"c:\Projects\splendor-guide\public\assets\gems")
preview = Path(r"c:\Projects\splendor-guide\public\assets\gems\_extract")

# Absolute boxes on rules/2.jpg (2422x3130) — top-down official token art
# Tuned from grid overlay on the tokens column.
boxes = {
    "emerald": (248, 882, 428, 1062),
    "diamond": (710, 878, 900, 1068),
    "sapphire": (248, 1074, 428, 1254),
    "onyx": (710, 1070, 900, 1260),
    "ruby": (248, 1266, 428, 1446),
    "gold": (710, 1262, 900, 1452),
}


def trim_white(im: Image.Image, threshold: int = 245) -> Image.Image:
    """Tighten crop around non-near-white pixels."""
    px = im.load()
    w, h = im.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and not (r >= threshold and g >= threshold and b >= threshold):
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if not found:
        return im
    pad = 4
    return im.crop(
        (
            max(0, min_x - pad),
            max(0, min_y - pad),
            min(w, max_x + 1 + pad),
            min(h, max_y + 1 + pad),
        )
    )


sheet = Image.new("RGBA", (1200, 220), (255, 255, 255, 255))
for i, (name, box) in enumerate(boxes.items()):
    crop = src.crop(box)
    crop = trim_white(crop)
    # Upscale 2× for crisp UI at larger display sizes
    big = crop.resize((crop.width * 2, crop.height * 2), Image.Resampling.LANCZOS)
    dest = out / f"{name}.png"
    big.save(dest, optimize=True)
    # Keep jpg path working: also write jpg for backwards compat OR update assets.ts
    print(name, "crop", crop.size, "→", big.size, dest.name)
    sheet.paste(big.resize((180, 180), Image.Resampling.LANCZOS), (i * 200, 20))

sheet.save(preview / "gems_sheet.png")
print("sheet saved")
