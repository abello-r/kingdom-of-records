# Story — The Kingdom of Records

| | ES | EN | FR |
|---|---|---|---|
| Title (brand, not translated) | The Kingdom of Records | The Kingdom of Records | The Kingdom of Records |
| Subtitle | Las Crónicas del Registro | The Chronicles of the Registry | Les Chroniques du Registre |

This document is the narrative source for all level texts. Level JSON files (`/src/levels/*.json`)
must follow it. Table and column names stay in English in every language (they are SQL identifiers);
only titles, narrative and hints are translated.

## Premise

Goblins raid the village of the **Blue Kingdom** and burn the royal archive. Only the **Great
Registry** survives: a magic book that answers questions asked in an ancient tongue — SQL.

The player is a humble **pawn** who can read it. **Sir Aldric**, an old knight, names them royal
scribe. But the Registry was damaged in the fire: its records are disordered, lost and even forged.
Every query recovers a piece of the truth.

## Cast

Portraits come from TS-2 `Human Avatars` unless stated otherwise (see `/docs/ASSETS.md`).

| Character | Role | Sprite / portrait |
|---|---|---|
| **The scribe** (player) | Blue pawn who reads the Registry | TS-2 Blue `Pawn` + Pawn portrait |
| **Sir Aldric** | Old Blue knight, mentor and main narrator | TS-2 Blue `Warrior` + Warrior portrait |
| **King of the Blue Kingdom** | Receives reports; never shown on screen | — (no king sprite; only mentioned) |
| **Sir Garrick** | Red Kingdom knight (ally), last guard of the key tower | TS-2 Red `Warrior` / `Lancer` + portrait |
| **Treasurer Corvin** | Red Kingdom treasurer — the traitor | TS-2 Red `Monk`-type portrait (no treasurer sprite) |
| **Grubnak** | Goblin chief | TS-1 Goblin `Torch` sprite; portrait cropped from it |
| Goblins | Raiders | TS-1 Goblins `Torch`, `TNT` (+ `Dynamite`), `Barrel` |
| Villagers, archers, guards | Background characters | TS-2 Blue `Pawn`, `Archer`, `Warrior`, `Lancer`, `Monk` |
| Sheep | Lost flock | TS-2 `Sheep_*` |

Names other than Sir Aldric are proposals and can be changed.

The player's name is not asked for: in Easy 5 the scribe registers under the fixed name **Pip** so that
the validation is deterministic.

## Stage 1 — Easy: The Village in Ashes

Scene: spring meadow (`Tilemap_color1`/`color2`), burnt houses, sheep, villagers.

| Level | Concept | Story beat |
|---|---|---|
| Easy 1 | `SELECT` | Sir Aldric opens the Registry: *who lives here?* List every villager. |
| Easy 2 | `WHERE` | Find the archers to man the towers. |
| Easy 3 | `AND` / `OR` / `IN` | Find pawns who are woodcutters or miners **and** available to rebuild. |
| Easy 4 | `LIKE` + `ORDER BY` | Lost sheep whose name starts with "Lan…", most recently seen first. |
| Easy 5 | `INSERT` / `UPDATE` | Register yourself as scribe and mark the rebuilt houses. |

**Stage ending:** while checking the storehouse records, Sir Aldric notices something odd — the
goblins went straight to the gold storehouse. *They knew where it was.*

## Stage 2 — Medium: The Blue Castle

Scene: autumn fields (`Tilemap_color4`), castle, resources, soldiers.

| Level | Concept | Story beat |
|---|---|---|
| Medium 1 | Aggregates | Report to the king: how much gold, wood and meat is left. |
| Medium 2 | `GROUP BY` | Resources per village. |
| Medium 3 | `HAVING` | Choose which villages to defend: only those whose production is above a threshold. |
| Medium 4 | Conditional `DELETE` / `UPDATE` | Remove forged records (goblins registered as merchants) and reassign guards. |
| Medium 5 | First `JOIN` | Soldiers × towers. A key tower was unguarded on the night of the raid; its last guard was Sir Garrick, a knight of the **Red Kingdom** (an ally). |

**Stage ending:** Sir Garrick is not a traitor — he was ordered off his post. But by whom?

## Stage 3 — Hard: The Goblin Frontier

Scene: dusk (`Tilemap_color5`), goblin camps, towers, fire and TNT.

| Level | Concept | Story beat |
|---|---|---|
| Hard 1 | Multiple `JOIN` | Goblins → camps → stolen loot. |
| Hard 2 | `LEFT JOIN` | Sheep and gold that were never recovered. |
| Hard 3 | Subquery in `WHERE` | Goblins with more loot than average: the bosses. |
| Hard 4 | Subquery with aggregates | The camp with the most TNT. |
| Hard 5 | Final challenge | Unmask the traitor: Treasurer Corvin of the Red Kingdom paid the goblins to weaken the Blue Kingdom. He is exposed before the council and the Registry is restored. |

## Draft data model per level

Draft for Phase 3 (final schemas, seed data and solutions go into the level JSON files). Each level
recreates its database from scratch, so tables may repeat with more columns as the story advances.
Values in `role`, `trade`, `kind` etc. match available sprites so the scene can show what the data says.

| Level | Tables (main columns) | Expected solution shape |
|---|---|---|
| Easy 1 | `villagers(id, name, role, age)` — role ∈ pawn, archer, warrior, lancer, monk | `SELECT * FROM villagers` |
| Easy 2 | same | `… WHERE role = 'archer'` |
| Easy 3 | `villagers(id, name, role, trade, available)` — trade ∈ woodcutter, miner, builder, butcher (Pawn tools: axe, pickaxe, hammer, knife) | `… WHERE role = 'pawn' AND trade IN ('woodcutter','miner') AND available = 1` |
| Easy 4 | `sheep(id, name, status, last_seen_at, last_seen_place)` | `… WHERE status = 'lost' AND name LIKE 'Lan%' ORDER BY last_seen_at DESC` (order checked) |
| Easy 5 | `scribes(id, name, sworn_on)`, `houses(id, owner, status)` — status ∈ burnt, rebuilding, rebuilt | `INSERT INTO scribes …` + `UPDATE houses SET status = 'rebuilt' WHERE …` (final state checked) |
| Medium 1 | `storehouses(id, village, gold, wood, meat)` | `SELECT SUM(gold), SUM(wood), SUM(meat) FROM storehouses` |
| Medium 2 | same | `… GROUP BY village` |
| Medium 3 | `harvests(id, village, season, gold, wood, meat)` | `… GROUP BY village HAVING SUM(meat) > X` |
| Medium 4 | `merchants(id, name, goods, origin, seal)`, `guards(id, name, post)` | `DELETE FROM merchants WHERE …` + `UPDATE guards SET post = … WHERE …` |
| Medium 5 | `soldiers(id, name, kingdom, rank)`, `towers(id, name, last_guard_id, guarded_on_raid_night)` | `JOIN` towers ↔ soldiers, filter the unguarded tower |
| Hard 1 | `goblins(id, name, kind, camp_id)`, `camps(id, name, region)`, `loot(id, goblin_id, item, quantity)` — kind ∈ torch, tnt, barrel | three-table `JOIN` |
| Hard 2 | `stolen_goods(id, item, quantity, stolen_from)`, `recoveries(id, stolen_id, recovered_on)` | `LEFT JOIN … WHERE recoveries.id IS NULL` |
| Hard 3 | `goblins(id, name, kind, loot_value)` | `… WHERE loot_value > (SELECT AVG(loot_value) FROM goblins)` |
| Hard 4 | `camps(id, name)`, `supplies(id, camp_id, item, quantity)` | camp whose TNT total equals the maximum TNT total (subquery over a grouped subquery) |
| Hard 5 | `officials(id, name, title, kingdom)`, `payments(id, payer_id, goblin_id, amount, paid_on)`, `goblins`, `camps` | `JOIN` + aggregate + subquery: the official who paid the goblin camps the most |

## Asset adaptations

| Story element | Problem | Adaptation |
|---|---|---|
| Burnt houses | TS-2 has no burnt buildings | TS-1 `House_Destroyed` rubble + TS-2 `Fire_*` / `Dust_*` on intact TS-2 houses. To be checked visually in Phase 5 (palette rule). |
| King, treasurer, merchants | No dedicated sprites | King is only mentioned; treasurer uses a Red Monk-type portrait; merchants are pawns carrying gold (`Pawn_Idle Gold`). |
| Goblin chief | No chief sprite | TS-1 `Torch` goblin; the "chief" status is given by text and the camp, not by a new sprite. |
| Goblin camps | — | TS-1 `Goblin_House`, `Wood_Tower_*`. |
| TNT stock | — | TS-1 `TNT` goblin and `Dynamite`. |
| Council (final scene) | No council sprite | Row of portraits (Blue, Red, Yellow, Purple). |
