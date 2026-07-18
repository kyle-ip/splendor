# Design direction

**Illuminated woodcut folio on cool white** — white manuscript page, double ink frames, vine-scroll corners, rubricated eyebrows, velvet woodblock CTAs, Cinzel + Garamond typography. Pentiment-inspired: split-ink accents, illuminated initials, pressed-ink motion — **not** a warm parchment wash, and not a SaaS dashboard.

## Palette

| Token | Role |
|-------|------|
| `--vellum` / `--paper` | White page (`#ffffff`) — keep cool/neutral; avoid warm yellow wash |
| `--ink` / `--ink-muted` | Body and secondary text |
| `--velvet` | Primary woodblock button + brand accent |
| `--gilt` / `--illum-gilt` | Secondary accent + illumination gold |
| `--lapis` / `--illum-lapis` | Secondary accent + illumination blue wash |
| `--illum-vermilion` | Rubrication (eyebrows, chapter marks) — distinct from velvet |
| `splendor-accent` | Lesson/tool secondary (`#6b4e1a`) |
| `--gem-*` | Splendor gem colors (match enamel SVG chips) |
| `--board-*` | Practice linen table surface (may be slightly warmer than the page) |

Illumination tokens are **ornament only** (corners, initials, rubrics, CTA gilt stroke). Body copy stays high-contrast ink on white.

`theme-color` in `index.html` should stay aligned with `--paper` (white).

## Type

- **Display:** Cinzel Decorative / Cinzel (titles, TOC Romans, illuminated initials)
- **UI serif:** Cormorant Garamond
- **Body:** EB Garamond; **CJK:** Noto Serif SC
- Do **not** use blackletter for body (readability + CJK mix)

## Surfaces

| Class / component | Use |
|-------------------|-----|
| `frame-woodcut` / `WoodcutFrame` | Title plates, home hero — vine-scroll corner fleurons |
| `panel` / `panel-soft` | Manuscript content blocks (sharp double-line) |
| `ledger-sheet` | Main reading column |
| `practice-board` | Play table — soft linen, **small** radius, hairline ink |
| `deck-back` / `deck-back--l*` | Development deck backs (level wash + optional art crop) |
| `btn-gilt` / `btn-velvet` | Primary CTA (velvet fill + gilt inner stroke) |
| `InkRule` / `Rubric` / `IlluminatedInitial` | Dividers, red eyebrows, drop-cap initials |
| `plate-window` | Official promo photography as engraved plate inserts |

Practice tiles (`SoloCardTile`, deck backs, nobles) use `rounded-sm` + ink borders so they read as printed components on the linen, not Material cards. Prefer cool white / ink-grey washes in FX chrome (toasts, inputs, dice) — not cream parchment.

## Art policy

- **Official Quidault / Space Cowboys** marketing and rules scans for promo plates (`logo.png`, box art)
- **AI nobles / seat portraits** acceptable with sepia/plate framing; do not mix as if official
- **Gem chips:** flat enamel SVG discs under `public/assets/gems/*.svg` keyed to `--gem-*`
- **UI ornaments:** inline SVG + CSS (vine corners, rules, initials); optional faint multiply noise only — no warm paper texture
- Details: [`public/assets/ATTRIBUTION.md`](../public/assets/ATTRIBUTION.md)

## Motion

Reading chrome prefers **pressed ink / page settle** (`ink-bloom`, `ink-draw`, `page-enter`). Avoid particles or glow bursts on tutorial surfaces. Practice FX live in `BankTakeFx`, `PurchaseFx`, `CeremonyFx`, `DiceFx`, `DragFx` — respect `prefers-reduced-motion` with JS short-circuit where timers gate input. Ceremony covers noble visit, turn pulse, and win glow.
