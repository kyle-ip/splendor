import fitz
from pathlib import Path

out = Path(r"c:\Projects\splendor-guide\public\assets\gems\_extract")
out.mkdir(parents=True, exist_ok=True)
pdf_path = Path(r"C:\Users\kylei\AppData\Local\Temp\splendor-rules-en.pdf")
if not pdf_path.exists():
    import urllib.request

    urllib.request.urlretrieve(
        "https://cdn.1j1ju.com/medias/7f/91/ba-splendor-rulebook.pdf",
        pdf_path,
    )

doc = fitz.open(pdf_path)
print("pages", doc.page_count)
for pi in range(min(3, doc.page_count)):
    page = doc[pi]
    imgs = page.get_images(full=True)
    print(f"page {pi}: {len(imgs)} images")
    for i, info in enumerate(imgs):
        xref = info[0]
        base = doc.extract_image(xref)
        w, h = base["width"], base["height"]
        ext = base["ext"]
        name = out / f"p{pi}_{i}_{w}x{h}.{ext}"
        name.write_bytes(base["image"])
        print(name.name, w, h, len(base["image"]))
