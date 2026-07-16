---
title: Solo Modes
level: reference
order: 52
duration: Anytime
---

## Solo Mode 1: Fixed-Fund Challenge

**Concept**: A closed-resource engine puzzle. After taking your starting gems, you **never take gems from the bank again**—only buy and reset the display.

### Setup

1. **Starting funds**: Take **3 of each** of the six gem types (green, blue, red, white, black, **gold**)—**18 tokens** total—all held by the player.  
2. **Development cards**: Use only the **Level 1** deck. Shuffle and **display 4 face up**; the rest is the draw pile. Levels 2 and 3 are **not used**.  
3. **Nobles**: Draw **3** at random. In this mode nobles give **no prestige**—they are **reset charges** only.

### Turns and Actions

No standard "take gems / reserve." The player mainly:

| Action | Description |
|--------|-------------|
| Buy | Buy 1 Level 1 card from the display; bonuses and gold allowed; refill |
| Reset | See "Stuck: Noble Reset" (spend a noble) |

**Forbidden**: Taking any more gems from the bank. Paid gems return to the bank and cannot be taken again in this mode.

### Clear Condition

bonuses of **≥4 in each of the five colors**.

### Stuck: Noble Reset

1. Spend 1 unused noble (remove it; no prestige).  
2. Remove the current 4 display cards (suggested: do not return them to the deck).  
3. Flip 4 new cards to refill. At most **3** resets.

**Practice**: [Fixed-fund challenge](/tools/solo/fixed) (in-browser).

---

## Solo Mode 2: Dice Automa

**Concept**: You act under standard multiplayer rules; the automa contests the display with "buy the highest eligible card if possible, else roll a die."

### Setup

2-player display + 3 nobles + 1 six-sided die; gems as in a 2-player game. The automa starts with no colored gems in hand.

### Turn Flow

Player turn (standard four actions) → player noble check → automa action → automa noble check → refill.

### Automa Actions

1. **Prefer buy**: Level 3 → Level 1, left → right within a level; affordability uses only its **bonuses + gold**; buy the highest-level card it can pay for.  
2. **Otherwise roll**: 1–4 take the Level 1 display card in that position for free; 5–6 take 1 gold.

### Endgame

When either side reaches ≥15 prestige, settle as a race; **both player and automa can attract nobles**.

**Practice**: [Dice automa](/tools/solo/dice) (in-browser). Browser decks match the full print run (Level 1 ×40, Level 2 ×30, Level 3 ×20).

---

## Solo Mode 3: Splendor Solo Automa (Card Automa)

**Concept**: Full 2-player table layout plus an **Automa action deck**. The Automa does **not** buy at standard costs—it either "takes numbered gems" or "discards N chips from the bottom of its stack, then takes a specified display card." Source: *Splendor Solo Automa* (components in `references/solo`).

![Automa action cards AI-1–AI-9](/assets/solo3/ai-cards-1-9.jpg)

![Automa action cards AI-10–AI-12](/assets/solo3/ai-cards-10-12.jpg)

### Extra Components

| Component | Count / notes |
|-----------|---------------|
| Automa action cards | **12** total (AI-1–AI-12); **4** have a ★ in the lower right |
| Token placement board | **1**—bank gems stacked by number |
| Card backs | Splendor SOLO AUTOMA backs (print-and-play) |

**Practice**: [Card automa](/tools/solo/card) (in-browser). Print sheets and PDF remain available under `public/assets/solo3/` for table play.

### Token Board Numbers

Gems are taken by board number (matching the card faces), not as free piles:

| Number | Color |
|--------|-------|
| **1** | Black (black) |
| **2** | Green (green) |
| **3** | Blue (blue) |
| **4** | Red (red) |
| **5** | White (white) |

![Token placement board / number key](/assets/solo3/page5.jpg)

> This mode does **not** use gold jokers as Automa take targets (card numbers are only 1–5 colored stacks). The player may still take gold under standard rules.

### Reading Action Cards

Each card has **top / middle / bottom** bands for the three game phases (see "Phases" below):

| Icon | Meaning |
|------|---------|
| Colored circles (or digit strings like `5,1,4`) | **Take gems**: take 1 of each listed number from the board; stack onto the Automa's **vertical chip stack** (new chips on top) |
| Circular arrow + number (e.g. 2 / 3 / 4) + level dots + four-slot marker | **Gain a development card**: see "Gaining Cards" below |
| • / •• / ••• | Target level: Level 1 / 2 / 3 |
| One of four slots filled | 1st–4th card left-to-right in that level's display |
| ★ | Harder card; special handling when building the deck |

Color labels on Chinese print sheets match the number board: black=1, green=2, blue=3, red=4, white=5.

### Setup

1. Set up development display, nobles, and gems as a **2-player** game; place gems on the **token board** by number.  
2. Take all **12** Automa cards; find the **4** with ★.  
3. Shuffle those 4 ★ cards; **draw 2 face down** and mix them into the other **8** non-star cards; return the remaining 2 ★ **unseen** to the box.  
4. Shuffle the resulting **10** cards face down beside the table as the Automa draw deck.  
5. Automa area: vertical chip stack, plus space for its **prestige-bearing** development cards.

### Phases and Reshuffling

The Automa deck cycles three times—**at most 30 turns**:

| Phase | Turns | Read band |
|-------|-------|-----------|
| Phase 1 | Turns 1–10 | **Top** |
| Phase 2 | Turns 11–20 | **Middle** |
| Phase 3 | Turns 21–30 | **Bottom** |

- Before each phase (including game start): ensure the deck is shuffled.  
- Within a phase: flip **1** card per turn; after all 10 are used, **reshuffle the discard** into a new deck before the next phase and switch to the next band.  
- At the **start of turn 31**: if there is still no winner, the **player loses** (timeout).

### Turn Flow

1. **Automa first**: Flip the top deck card; execute **only the band for the current phase**.  
2. **Player turn**: Full base 2-player rules (take gems, reserve, buy, hand limits, etc.).  
3. **Nobles**: Only the **player** may attract nobles; the **Automa never interacts with nobles**.  
4. After both have acted: if either has prestige **≥15**, the game ends and the **higher prestige wins**; otherwise continue.

### Automa Action Details

#### A. Taking Tokens

1. Take **1** token of each number (or color label) listed on the card from the board.  
2. Stack all onto the Automa's vertical chip stack (on top of any existing chips).  
3. If a number's pile is empty: **skip that number**; take the rest.  
4. The Automa **may exceed 10** chips (allowed by the rules, though uncommon).

#### B. Gaining Cards

1. Take the display card matching the card's level dots and four-slot marker.  
2. From the **bottom** of the Automa chip stack upward, discard the number of chips shown by the circular arrow (e.g. 3 = discard 3); discarded chips return to the board/bank.  
3. **Even if there are not enough chips to discard—or zero—the Automa still gets the card** (it does not pay the printed card cost).  
4. If the card has prestige: place it face up in the Automa scoring area.  
5. If the card has **0 prestige**: remove it from play / return to the box—**no need** to track Automa bonuses (the Automa does not buy via bonuses).  
6. Refill the display from the matching deck as usual.

If the target slot is empty: suggested—take the nearest non-empty card of the same level, or treat the action as void this turn and only discard the Automa card; agree on one ruling before you start.

### Victory (Mode 3)

| Situation | Result |
|-----------|--------|
| After both act in a turn, either side ≥15 | Compare totals; higher wins |
| Start of turn 31 with no ≥15 ending yet | **Player loses** |
| Tie | Rules silent; suggested: player wins, or compare development card counts |

Player prestige = development cards + nobles.  
Automa prestige = sum of its retained **point-bearing development cards** (no nobles).

### Mode 2 vs Mode 3 (Don't Confuse Them)

| | Mode 2 (Dice Automa) | Mode 3 (Solo Automa) |
|--|----------------------|----------------------|
| Opponent drive | Priority buy + die | 10 action cards × three phases |
| Payment | bonuses + gold; try to pay in full | Discard N chips from stack bottom; may underpay |
| Tracks bonuses? | Yes (keeps bought cards) | 0-point cards may be discarded; no bonus tracking |
| Nobles | Both may attract | **Player only** |
| First player | Suggested: player first (as in Mode 2 above) | **Automa first each turn** |
| Time limit | No hard 30-turn cap | **Max 30 turns** |

### Suggested Rulings (Mode 3)

| Question | Suggestion |
|----------|------------|
| Can the player reserve the slot Automa will take? | Yes (standard reserve) |
| Automa stack "bottom" | The end that went in first; new takes always go on top |
| Which 2 ★ cards are drawn | Must be face-down draws for difficulty variance |
| Chinese print vs English PDF art differs | Use the set you printed; logic is the same |

---

## Three-Mode Comparison

| | Mode 1 | Mode 2 | Mode 3 |
|--|--------|--------|--------|
| Core | Closed-fund challenge | Dice automa | Card Automa |
| Extra gear | None | One die | Automa cards + token board |
| Gems | 18 at start, then none | Player standard; bot almost never takes colored | Player standard; bot takes by number |
| Nobles | Reset charges | Both may attract | Player only |
| Victory | ≥4 bonus each of five colors | ≥15 race | ≥15 race, and ≤30 turns |

---

## Browser practice tiers (Modes 2–3)

In-browser practice can optionally dial pressure without rewriting the published Automa rules. These levers are **practice options only**—they are not official printed variants.

| Tier | Mode 2 (dice) | Mode 3 (★ cards) |
|------|---------------|------------------|
| Easy | ~50% chance to reroll a 5–6 into 1–4 (fewer gold / free-skew faces) | **1** ★ card in the Automa deck |
| Normal | Fair d6 (as published) | **2** ★ cards (as published) |
| Hard | If 1–4 targets an empty Level 1 slot, reroll once | **4** ★ cards in the Automa deck |

Mode 1 has no practice tier. Switch tier in the practice header to start a new session.

---

## Relation to Main Rules

- The main tutorial assumes **multiplayer base Splendor**.  
- All three solo write-ups live in this appendix; Mode 3 print files and original rules are in `references/solo-automa/`.  
- Mode 1 trains cost planning; Mode 2 trains reading the row and endgame; Mode 3 trains tempo and reserving under Automa card pressure.

| Mode | Skills from Parts 2–3 |
|------|------------------------|
| 1 Fixed fund | Gem economy, Level 1 engine, opportunity cost |
| 2 Dice | Table reading, denial, endgame race |
| 3 Card Automa | Tempo, reservation tactics, paced scoring |
