---
title: Card Evaluation Framework
level: advanced
order: 30
duration: 10 min
---

Don’t look only at printed points. A card’s true value is multi-dimensional—and the weights **change by phase**.

## Four Dimensions

1. **Prestige**: Printed points—obvious
2. **Bonus value**: +1 of a color ≈ saving 1 of that color on every future buy
3. **Noble contribution**: Does it move you toward or complete a noble?
4. **Opportunity cost**: Does buying this delay a better path?

## Phase Weights (Mental Model)

Use rough weights, not a spreadsheet:

| Phase | Points | Bonus | Noble fit | Cost burden |
|-------|-------:|------:|----------:|------------:|
| Early (≈T1–T6) | low | **high** | medium | medium |
| Mid (≈T7–T14) | medium | high | **high** if contested | rising |
| Late (race to 15) | **high** | low | only if it finishes a noble *this turn* | ignore if you can cash |

```
Card value ≈ w_p·points + w_b·bonus + w_n·noble − w_c·netCost
```

- Level 1 0-point cards: high `w_b` early
- Level 3 5-point cards: high `w_p` late, heavy `w_c` until the engine is ready

## Scored Pair Drill

Assume mid-game: contested noble needs **sapphire ×3**; your bonuses are sapphire ×2. Score each pair with mid-game weights (bonus + noble > raw points).

### Pair 1 — L1 noble finish vs L2 score

| Card | Pts | Bonus | Net cost | Prefer |
|------|----:|-------|----------|--------|
| A | 0 | +1 sapphire | 2 mixed | **A** — completes noble (+3) next visit check |
| B | 2 | +1 ruby | 3 mixed | B only if the noble is already lost |

### Pair 2 — Cheap engine vs mono 5-cost

| Card | Pts | Bonus | Net cost | Prefer |
|------|----:|-------|----------|--------|
| C | 0 | +1 emerald | 3 mixed | **C** early if emerald is on ≥2 nobles |
| D | 0 | +1 diamond | 4 diamond (mono) | D when you already have diamond depth / 4/4 path |

### Pair 3 — L2 flexible 2 vs L3 5-trap

| Card | Pts | Bonus | Net cost | Prefer |
|------|----:|-------|----------|--------|
| E | 2 | +1 onyx | 2 after bonuses | **E** mid — points + color that still matter |
| F | 5 | +1 sapphire | 6+ still owed | F only when you can buy it **this turn** near 15 |

**Rule of thumb:** If a 0-pt card finishes a contested noble or unlocks two future buys, it often beats a 2–3 pt card that stalls the engine.

## Worked Comparison (Recap)

| Card | Points | Bonus | Cost after your bonuses | Read |
|------|--------|-------|-------------------------|------|
| X | 0 | +1 sapphire | 1 ruby + 1 onyx | Completes the noble next visit check |
| Y | 3 | +1 ruby | 2 sapphire + 2 diamond | Scores now, but delays the noble |

Early/mid game, **X often beats Y** if the noble is contested. Late game with a lead, **Y** can be correct.

Use the site’s [card value scorer](/tools/card-value?sapphire=1&points=1&bonusWeight=1.5&nobleFit=2) (mid-game weights, one sapphire gap left) to tweak for the current nobles and display.

## Common Misjudgments

- “3 points always beats 0” — often wrong early
- “Too expensive, skip it” — if the bonus color is what a noble needs, expensive can still be worth it
- “5-point cards guarantee a win” — without an engine, by the time you buy one it’s too late
- “Late game still buy 0-pt engines” — usually wrong once someone can trigger next round
