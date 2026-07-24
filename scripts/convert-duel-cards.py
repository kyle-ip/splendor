"""One-shot converter: tmp-cartes.json → src/data/duel-card-pool.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
with open(ROOT / "tmp-cartes.json", encoding="utf-8") as f:
    raw = json.load(f)

COLOR = {
    "vert": "green",
    "blanc": "white",
    "bleu": "blue",
    "noir": "black",
    "rouge": "red",
    "joker": "associate",
    None: None,
}
ABILITY = {
    None: None,
    "rejouer": "extraTurn",
    "prendre_sur_plateau": "takeMatching",
    "prendre_privilege": "privilege",
    "voler_pion_adverse": "steal",
}


def convert_jewel(c, idx):
    return {
        "id": f"d{c['niveau']}-{idx}",
        "level": c["niveau"],
        "bonus": COLOR[c["bonus_couleur"]],
        "bonusCount": c["bonus_nombre"] if c["bonus_nombre"] else 0,
        "prestige": c["points_prestige"],
        "crowns": c["nb_couronne"],
        "ability": ABILITY[c.get("capacite")],
        "cost": {
            "green": c["cout_vert"],
            "white": c["cout_blanc"],
            "blue": c["cout_bleu"],
            "black": c["cout_noir"],
            "red": c["cout_rouge"],
            "pearl": c["cout_perle"],
        },
        "_source": c.get("lien"),
    }


jewels = []
by_level = {1: 0, 2: 0, 3: 0}
for c in raw["cartes_joailleries"]:
    by_level[c["niveau"]] += 1
    jewels.append(convert_jewel(c, by_level[c["niveau"]]))

royals = []
for i, r in enumerate(raw["cartes_royales"], 1):
    royals.append(
        {
            "id": f"royal-{i}",
            "prestige": r["points_prestige"],
            "ability": ABILITY[r.get("capacite")],
            "_source": r.get("lien"),
        }
    )

out = {
    "_readme": [
        "Authoritative Splendor Duel jewel + royal pool for duel practice.",
        "Community-sourced (AubinVert/SplendorDuel cartes.json); review/adjust as needed.",
        "Gem keys: green, white, blue, black, red, pearl.",
        "bonus: green|white|blue|black|red|associate|null (null = prestige-only / no bonus).",
        "ability: extraTurn|takeMatching|privilege|steal|null (associate placement uses bonus=associate).",
        "Mapped in code: green->emerald, white->diamond, blue->sapphire, black->onyx, red->ruby.",
    ],
    "level1": [c for c in jewels if c["level"] == 1],
    "level2": [c for c in jewels if c["level"] == 2],
    "level3": [c for c in jewels if c["level"] == 3],
    "royals": royals,
}

path = ROOT / "src" / "data" / "duel-card-pool.json"
path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(
    "wrote",
    path,
    "L1",
    len(out["level1"]),
    "L2",
    len(out["level2"]),
    "L3",
    len(out["level3"]),
    "R",
    len(out["royals"]),
)
