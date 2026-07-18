# Design direction

Merchant **ledger / woodcut folio**: white manuscript page, double ink frames, velvet woodblock CTAs, Cinzel + Garamond typography. Not a SaaS dashboard.

## Palette

| Token | Role |
|-------|------|
| `--vellum` / `--paper` | White page (`#ffffff`) — keep cool/neutral; avoid warm yellow wash |
| `--ink` / `--ink-muted` | Body and secondary text |
| `--velvet` | Primary woodblock button + brand accent |
| `--gilt` / `--lapis` | Secondary accents |
| `splendor-accent` | Lesson/tool secondary (`#6b4e1a`) |
| `--gem-*` | Splendor gem colors (match enamel SVG chips) |
| `--board-*` | Practice linen table surface (may be slightly warmer than the page) |

`theme-color` in `index.html` should stay aligned with `--paper` (white).

## Type

- **Display:** Cinzel Decorative / Cinzel (titles, TOC Romans)
- **UI serif:** Cormorant Garamond
- **Body:** EB Garamond; **CJK:** Noto Serif SC

## Surfaces

| Class | Use |
|-------|------|
| `frame-woodcut` / `WoodcutFrame` | Title plates, home hero |
| `panel` / `panel-soft` | Manuscript content blocks (sharp double-line) |
| `ledger-sheet` | Main reading column |
| `practice-board` | Play table — soft linen, **small** radius, hairline ink |
| `deck-back` / `deck-back--l*` | Development deck backs (level wash + optional art crop) |
| `btn-gilt` / `btn-velvet` | Primary CTA (velvet fill; name is historical) |
| `InkRule` | Section dividers (prefer over legacy `ornament-line`) |

Practice tiles (`SoloCardTile`, deck backs, nobles) use `rounded-sm` + ink borders so they read as printed components on the linen, not Material cards. Prefer cool white / ink-grey washes in FX chrome (toasts, inputs, dice) — not cream parchment.

## Art policy

- **Official Quidault / Space Cowboys** marketing and rules scans for promo plates (`logo.png`, `board-shot`, box art)
- **AI nobles / seat portraits** acceptable with sepia/plate framing; do not mix as if official
- **Gem chips:** flat enamel SVG discs under `public/assets/gems/*.svg` keyed to `--gem-*`
- Details: [`public/assets/ATTRIBUTION.md`](../public/assets/ATTRIBUTION.md)

## Motion

Prefer “pressed ink” (`ink-bloom`, `page-enter`). Practice FX live in `BankTakeFx`, `PurchaseFx`, `CeremonyFx`, `DiceFx`, `DragFx` — respect `prefers-reduced-motion` with JS short-circuit where timers gate input. Ceremony covers noble visit, turn pulse, and win glow.
