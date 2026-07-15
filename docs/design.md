# Design direction

Merchant **ledger / woodcut folio**: parchment page, double ink frames, velvet woodblock CTAs, Cinzel + Garamond typography. Not a SaaS dashboard.

## Palette

| Token | Role |
|-------|------|
| `--vellum` / `--paper` | Warm parchment (`#f3ead8` / `#ebe2d0`) |
| `--ink` / `--ink-muted` | Body and secondary text |
| `--velvet` | Primary woodblock button + brand accent |
| `--gilt` / `--lapis` | Secondary accents |
| `--gem-*` | Splendor gem colors (match enamel SVG chips) |
| `--board-*` | Practice linen table surface |

`theme-color` in `index.html` should stay aligned with `--paper`.

## Type

- **Display:** Cinzel Decorative / Cinzel (titles, TOC Romans)
- **UI serif:** Cormorant Garamond
- **Body:** EB Garamond; **CJK:** Noto Serif SC

## Surfaces

| Class | Use |
|-------|-----|
| `frame-woodcut` / `WoodcutFrame` | Title plates, home hero |
| `panel` / `panel-soft` | Manuscript content blocks (sharp double-line) |
| `ledger-sheet` | Main reading column |
| `practice-board` | Play table — soft linen, **small** radius, hairline ink |
| `btn-gilt` / `btn-velvet` | Primary CTA (velvet fill; name is historical) |
| `InkRule` | Section dividers (prefer over legacy `ornament-line`) |

Practice tiles (`SoloCardTile`, deck backs, nobles) use `rounded-sm` + ink borders so they read as printed components on the linen, not Material cards.

## Art policy

- **Official Quidault / Space Cowboys** marketing and rules scans for promo plates
- **AI nobles / seat portraits** acceptable with sepia/plate framing; do not mix as if official
- **Gem chips:** flat enamel SVG discs under `public/assets/gems/*.svg` keyed to `--gem-*`
- Details: [`public/assets/ATTRIBUTION.md`](../public/assets/ATTRIBUTION.md)

## Motion

Prefer “pressed ink” (`ink-bloom`, `page-enter`). Keep dice/purchase FX inside practice only; respect `prefers-reduced-motion`.
