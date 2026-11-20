# Story — The Kingdom of Records

| | ES | EN | FR |
|---|---|---|---|
| Title (brand, not translated) | The Kingdom of Records | The Kingdom of Records | The Kingdom of Records |
| Subtitle | Las Crónicas del Registro | The Chronicles of the Registry | Les Chroniques du Registre |

This document is the narrative source for all level texts. Level JSON files (`/src/levels/*.json`)
follow it. Table and column names and the data values stay in English in every language (they are SQL
identifiers and values the player must type); titles, narrative, tasks and hints are translated.

## Premise

Goblins raid the village of **Bluebrook**, in the **Blue Kingdom**, and burn the royal archive on the
night of **14 March 1247**. Only the **Great Registry** survives: a magic book that answers questions
asked in an ancient tongue — SQL.

The player is **Pip**, a humble pawn and shepherd who can read it. **Sir Aldric**, an old knight and the
player's mentor, has them named royal scribe. But the Registry was damaged in the fire: its records are
disordered, lost and even forged. Every query recovers a piece of the truth.

The player's gender is never stated: texts address them neutrally in ES and FR.

## Cast

Portraits come from TS-2 `Human Avatars` unless stated otherwise (see `/docs/ASSETS.md`).

| Character | Role | Sprite / portrait |
|---|---|---|
| **Pip** (player, `scribe` speaker) | Blue pawn and shepherd who reads the Registry | TS-2 Blue `Pawn` + Pawn portrait |
| **Sir Aldric** | Old Blue knight, mentor and main narrator | TS-2 Blue `Warrior` + Warrior portrait |
| **King of the Blue Kingdom** | Receives reports; never shown on screen | — (no king sprite; only mentioned) |
| **Sir Garrick** | Red Kingdom knight lent to the Blue Kingdom; last guard of Riverwatch | TS-2 Red `Warrior` / `Lancer` + portrait |
| **Lady Maud** | Blue Kingdom noble, keeper of the royal storehouse; the red herring | TS-2 Purple `Monk` (purple sets her apart from the Blue monks) |
| **Corvin** | Treasurer of the Red Kingdom — the traitor | TS-2 Red `Monk`-type portrait (no treasurer sprite) |
| **Grubnak** | Goblin chief, at Skull Rock | TS-1 Goblin `Torch` sprite; portrait cropped from it |
| Snik, Kragg, Gorb, Mogg, Zib, Nub, Fizzwick | Goblins | TS-1 Goblins `Torch`, `TNT` (+ `Dynamite`), `Barrel` |
| Villagers (Hob, Marta, Tam, Wren, Bram…) | Background characters | TS-2 Blue `Pawn`, `Archer`, `Warrior`, `Lancer`, `Monk` |
| The Lan flock (Lancelot, Lanky, Lanolin…) | Pip's lost sheep | TS-2 `Sheep_*` |

## The clue thread

Each stage plants clues that pay off in the final level.

| Clue | Planted in | Paid off in |
|---|---|---|
| **Riverwatch**, the tower next to the royal storehouse | Easy 2 (towers), Easy 4 (sheep last seen there at midnight) | Medium 5: unguarded on the raid night, last guard Sir Garrick |
| **The royal storehouse gold** | Easy 5 (only building looted, hidden behind the mill) | Medium 1–2 (0 gold left), Hard 1 (not in the camps), Hard 2 (300 coins never recovered), Hard 5 (found in Corvin's coffers) |
| **The Red Treasury** | Medium 4 (goblin "merchants" carry its permits) | Medium 5 (Garrick ordered off his post by it), Hard 5 (Corvin's payments) |
| **Snik** | Medium 4 ("Snik Honestman", fake merchant) | Hard 1 (in the loot list) |
| **Grubnak** | Hard 1 (loot at Skull Rock) | Hard 3 (one of the bosses), Hard 4 (found at Skull Rock with the ledger), Hard 5 |
| **Lancelot and Lanolin** | Easy 4 (lost near Riverwatch) | Hard 2 (never recovered), Hard 5 (found in Corvin's garden) |
| **Lady Maud — red herring** | Medium 2 (keeper of the emptied royal storehouse), Medium 4 (vouched for the three goblin "merchants"), Medium 5 (Garrick's order was signed in her name), Hard 4 (Grubnak: "soft hands, many rings"), Hard 5 (twists her rings; Corvin accuses her) | Hard 5: she paid the most *overall* — ransoms **after** the raid. Forgetting the date filter gives her as the answer, which is exactly Corvin's misdirection. She vouched for the merchants because of their Red Treasury permits, and Corvin forged the order in her name. |

## Stage 1 — Easy: The Village in Ashes

Scene: spring meadow (`Tilemap_color1`/`color2`), burnt houses, sheep, villagers.

| Level | Concept | Story beat | Tables |
|---|---|---|---|
| Easy 1 | `SELECT … FROM` | Aldric opens the Registry: *who lives here?* | `villagers(id, name, role, age)` |
| Easy 2 | `WHERE` | Find the four archers for the four towers. | same |
| Easy 3 | `AND` / `OR` / `IN` | Pawns who are woodcutters or miners **and** fit to work. | `villagers(id, name, role, trade, available)` |
| Easy 4 | `LIKE` + `ORDER BY … DESC` | Pip's lost "Lan…" sheep, most recently seen first. | `sheep(id, name, wool, status, last_seen_at, last_seen_place)` |
| Easy 5 | `INSERT` + `UPDATE` | Pip is sworn in; rebuilt houses are marked. | `scribes(id, name, sworn_on)`, `houses(id, building, owner, status)` |

**Stage ending:** only the royal storehouse, hidden behind the mill, was looted. *The goblins knew
where the gold was.*

## Stage 2 — Medium: The Blue Castle

Scene: autumn fields (`Tilemap_color4`), castle, resources, soldiers.

| Level | Concept | Story beat | Tables |
|---|---|---|---|
| Medium 1 | Aggregates (`SUM`; `COUNT`, `AVG`, `MIN`, `MAX` introduced) | Report to the king: total gold, wood, meat. | `storehouses(id, name, village, keeper, gold, wood, meat)` |
| Medium 2 | `GROUP BY` | Resources per village: Bluebrook has almost no gold left; the empty royal storehouse is kept by Lady Maud. | same |
| Medium 3 | `HAVING` | Garrison only villages with more than 150 meat a year. | `harvests(id, village, season, meat, wood)` |
| Medium 4 | `DELETE` + `UPDATE … WHERE` | Strike the goblin "merchants" (no seal, Red Treasury permits, vouched for by Lady Maud) and move the market guards. | `merchants(id, name, goods, permit_from, seal, vouched_by)`, `guards(id, name, post)` |
| Medium 5 | First `JOIN` | Unguarded towers on the raid night: Riverwatch, last guard Sir Garrick (Red Kingdom). | `soldiers(id, name, kingdom, rank)`, `towers(id, name, last_guard_id, guarded_on_raid_night)` |

**Stage ending:** Garrick was relieved that night by a written order signed in Lady Maud's name.
Aldric notes that a signature can be forged.

## Stage 3 — Hard: The Goblin Frontier

Scene: dusk (`Tilemap_color5`), goblin camps, towers, fire and TNT.

| Level | Concept | Story beat | Tables |
|---|---|---|---|
| Hard 1 | Multiple `JOIN`, table aliases | Goblins → camps → loot. 260 coins in the camps, but not the royal gold. | `camps(id, name, region)`, `goblins(id, name, kind, camp_id)`, `loot(id, goblin_id, item, quantity)` |
| Hard 2 | `LEFT JOIN` + `IS NULL` | Never recovered: Lancelot, Lanolin and the 300 royal coins. | `stolen_goods(id, item, quantity, stolen_from)`, `recoveries(id, stolen_id, recovered_on, recovered_at)` |
| Hard 3 | Subquery in `WHERE`, `AVG` | Goblins above the average loot: Grubnak, Kragg, Gorb. | `goblins(id, name, kind, camp, loot_value)` |
| Hard 4 | Subquery in `FROM`, `MAX` of a total, column alias `AS`, `LIMIT` (alternative) | Camp with the most TNT: Skull Rock. Grubnak is caught with his ledger: "a fancy human with soft hands and many rings paid". | `supplies(id, camp, item, quantity)` |
| Hard 5 | Final challenge: `JOIN` + `WHERE` + `GROUP BY` + `HAVING` + subquery | Corvin accuses Lady Maud (top payer overall). Counting only payments **before** the raid, the top payer is Corvin (300). | `officials(id, name, title, kingdom)`, `payments(id, payer_id, goblin, amount, paid_on, memo)` |

**Ending:** Maud's payments were ransoms after the raid; Corvin forged the order in her name. The 300
royal coins are found in Corvin's coffers, Lancelot and Lanolin in his garden; the Great Registry is
restored.

**Epilogue** (screen after the last level, texts `epilogue.*` in `src/i18n`): the coffers are opened,
the sheep are found among Corvin's eaten roses, Aldric apologises to Lady Maud, Garrick apologises for
the Red Kingdom, and the Registry is entrusted to Pip. Then the credits.

## Asset adaptations

| Story element | Problem | Adaptation |
|---|---|---|
| Burnt houses | TS-2 has no burnt buildings | TS-1 `House_Destroyed` rubble + TS-2 `Fire_*` / `Dust_*` on intact TS-2 houses. To be checked visually in Phase 5 (palette rule). |
| King, treasurer, merchants | No dedicated sprites | King is only mentioned; Corvin uses a Red Monk-type portrait; merchants are pawns carrying gold (`Pawn_Idle Gold`). |
| Goblin chief | No chief sprite | TS-1 `Torch` goblin; the "chief" status is given by text and the camp, not by a new sprite. |
| Goblin camps | — | TS-1 `Goblin_House`, `Wood_Tower_*`. |
| TNT stock | — | TS-1 `TNT` goblin and `Dynamite`. |
| Council (final scene) | No council sprite | Row of portraits (Blue, Red, Yellow). |
