# Content & layout

```
content/          # Lesson Markdown (en/ + zh/)
docs/             # Project documentation
references/       # Official rulebook PDF and related sources
src/
  components/     # Layout and shared UI
  features/       # Tools, solo practice, standard vs-AI practice
  pages/          # Route pages
  data/           # Nobles, card samples, setup table
  lib/            # Lessons, gems, TOC helpers
  i18n/           # EN/ZH UI strings
public/assets/    # Gems, nobles, promo, rules diagrams
references/solo-automa/  # Solo Mode 3 print-and-play materials
```

## Editing lessons

- Mirror every change in both `content/en/` and `content/zh/`
- Frontmatter: `title`, `level`, `order`, `duration`
- Images under `public/assets/` use site-root paths such as `/assets/promo/setup.jpg` (rewritten for the GitHub Pages base URL at render time)
- Scanned rulebook pages (`public/assets/rules/1.jpg`–`12.jpg`) are shown only on the Rules quick-reference page, in order

## Curriculum levels

Frontmatter `level` values: `intro` | `basics` | `intermediate` | `advanced` | `duel` | `reference`.

- Parts I–IV (`intro`…`advanced`): base Splendor
- Part V (`duel`, `order` 40–46): Splendor Duel — source `references/splendor-duel-rulebook.pdf`
- Appendix (`reference`, `order` 48+): glossary, rules quick ref, expansions, Orient mini-lesson, solo

## Gem color names

In lessons and practice UI, refer to gems by table color (not mineral names): Green / White / Blue / Black / Red, and **Gold** for the wild (ZH: 绿 / 白 / 蓝 / 黑 / 红 / 黄金). Glossary may still note the official English mineral names for rulebook cross-reference.

Advanced sample games: 2p (`order` 36), 3p (`order` 35), 4p (`order` 37).

## Rule accuracy

When editing rules prose, prefer clear, unambiguous wording and cross-check against `references/splendor-rulebook.pdf`. For Duel lessons, cross-check against `references/splendor-duel-rulebook.pdf`.

## Tests

```bash
npm test
```

Runs Vitest unit tests (currently `src/lib/gems.test.ts` for purchase affordability, plus solo/standard engine tests).

## Solo practice decks

`src/data/solo-cards.ts` ships full print pools: Level 1 ×40, Level 2 ×30, Level 3 ×20.