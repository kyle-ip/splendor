from collections import Counter
from pathlib import Path
import colorsys
from PIL import Image, ImageDraw

im = Image.open(r"c:\Projects\splendor-guide\public\assets\rules\2.jpg").convert("RGB")
out = Path(r"c:\Projects\splendor-guide\public\assets\gems")
extract = out / "_extract"


def hsv(p):
    r, g, b = [x / 255 for x in p]
    return colorsys.rgb_to_hsv(r, g, b)


specs = {
    "emerald": lambda h, s, v: 0.25 <= h <= 0.45 and s > 0.4 and v > 0.3,
    "sapphire": lambda h, s, v: 0.55 <= h <= 0.72 and s > 0.35 and v > 0.25,
    "ruby": lambda h, s, v: (h <= 0.05 or h >= 0.95) and s > 0.45 and v > 0.35,
    "diamond": lambda h, s, v: s < 0.18 and v > 0.72,
    "onyx": lambda h, s, v: v < 0.22 and s < 0.4,
    "gold": lambda h, s, v: 0.08 <= h <= 0.2 and s > 0.4 and v > 0.4,
}

boxes = {}
for name, pred in specs.items():
    pts = []
    for y in range(780, 1500, 2):
        for x in range(100, 1100, 2):
            if pred(*hsv(im.getpixel((x, y)))):
                pts.append((x, y))
    if not pts:
        print(name, "NONE")
        continue
    cells = Counter(((x // 40) * 40, (y // 40) * 40) for x, y in pts)
    (cx, cy), n = cells.most_common(1)[0]
    near = [(x, y) for x, y in pts if abs(x - cx) < 100 and abs(y - cy) < 100]
    xs = [p[0] for p in near]
    ys = [p[1] for p in near]
    pad = 8
    box = (min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad)
    boxes[name] = box
    print(name, "n", n, "box", box, "size", box[2] - box[0], box[3] - box[1])

# Preview
preview = im.crop((80, 760, 1120, 1520)).copy()
draw = ImageDraw.Draw(preview)
for name, (x0, y0, x1, y1) in boxes.items():
    draw.rectangle(
        [x0 - 80, y0 - 760, x1 - 80, y1 - 760], outline=(255, 0, 0), width=2
    )
    draw.text((x0 - 80, y0 - 760), name, fill=(255, 0, 0))
preview.save(extract / "boxes_preview.png")
print("preview saved")
