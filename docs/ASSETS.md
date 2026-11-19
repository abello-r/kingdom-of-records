# Asset inventory — The Kingdom of Records (Phase 0)

Status: **validated on 2026-11-19.** Assets are copied to `/public/assets` in Phase 5; the original
pack folders are never modified and are not tracked by git.

## Validated decisions

| Topic | Decision |
|---|---|
| Pack strategy | TS-2 is the base. TS-1 only for what TS-2 lacks (goblins, destroyed / construction states, gold mine, deco). SPE only as short UI feedback. On-screen text is always HTML, never baked into images. |
| Licences | Both Tiny Swords packs: personal and commercial use, modification allowed, credit optional (given anyway), older versions also allowed by the author, no AI training. SPE: credit "Will Tice / unTied Games", no redistribution of loose files. Details in `/public/assets/CREDITS.md`. |
| Audio | None for now. A mute toggle is present in the UI, ready for later. |
| Fonts | Jersey 10 (all UI text) and JetBrains Mono (SQL editor and result tables only), both SIL OFL 1.1, bundled locally (no CDN). Pixelify Sans was dropped: its "5" looks like "S" and "C" like "O" (see `docs/design/font-comparison.png`). Press Start 2P may be tried for the logo only in the Phase 4 mock-ups. |
| Hover / disabled buttons | CSS filters. |
| Language selector | Text labels `ES · EN · FR`. |
| Lock icon | CSS / inline SVG. |
| Goblin portrait | Cropped from a TS-1 goblin sprite. |

## 1. Packs found

| Code | Folder | Author | Files | Size | Licence file |
|---|---|---|---|---|---|
| **TS-2** | `Tiny Swords (Free Pack)/` | Pixel Frog (newest version of Tiny Swords) | 410 PNG, 18 `.aseprite`, 34 `.DS_Store` | 5.2 MB | ⚠️ **none** |
| **TS-1** | `Tiny Swords (Update 010)/` | Pixel Frog (older version of the same pack) | 197 PNG, 36 `.aseprite`, 1 `.zip`, 54 `.DS_Store` | 4.5 MB | ⚠️ **none** |
| **SPE** | `Super Pixel Effects Gigapack (Free Version)/` | Will Tice / unTied Games | 105 effects × 2 sizes: 5,781 frame PNGs + 210 spritesheets with 210 `.txt` metadata; 5 docs | 27 MB | ✅ `license.txt` |

No audio files and no fonts in any pack.

### Visual style (checked by opening the images, not by file names)

- **TS-2** — top-down ¾ medieval-fantasy pixel art, 64 px tile grid, chunky shapes with dark navy
  outlines, muted / slightly desaturated palette. Units are small "bean" characters in 192×192 frames
  (Lancer 320×320). Five factions coloured Blue, Red, Yellow, Purple, Black. Very complete UI kit
  (parchment, wood table, banners, ribbons, swords, bars, buttons, 12 colour icons, 25 portraits,
  cursors). Terrain comes in 5 palettes (`Tilemap_color1…5`).
- **TS-1** — same artist, perspective, outline weight and grid (64 px tile, 192 px unit frames), but an
  earlier palette: more teal and saturated; different building designs (e.g. wooden castle vs stone
  castle). Unique content: **Goblin faction** (Torch, TNT, Barrel, goblin house and tower),
  construction / destroyed states for buildings, gold mine, bridge, flat tilemap with **sand**,
  elevation tilemap, small deco (mushrooms, pumpkins, bones, scarecrows), UI with hover / disabled
  states and monochrome "carved" icons (numbers, +/−, lock, sound, cart).
- **SPE** — different artist. Bright, saturated "arcade" palette, glossy symbols, mostly thin or no
  outlines, 15 FPS animations. Two sizes per effect (large / small) and one colour each in the free
  version. Animated **text** symbols (`COMPLETE`, `Level Up!`, `You Won!`, `GAME OVER`, `ALERT`,
  `BONUS`, `WOW`, `COOL`, `You Lost`) have the English word baked into the pixels.

Legend for the *Style* column of the inventory: `TS-2`, `TS-1`, `SPE` as above.

## 2. Coherence between packs

| Combination | Verdict | Why |
|---|---|---|
| TS-2 alone | ✅ Fully coherent | One palette, one grid, one UI kit. **Proposed base for the whole game.** |
| TS-2 + TS-1 | 🟡 Compatible with rules | Same grid, outline and proportions. The palette shift is visible when the *same* kind of object from both packs sits side by side (two blue warriors, two castles, two grass tilesets). Rule: use TS-1 only for content TS-2 does not have, and never mix the same category from both packs in one scene. |
| TS-2 + SPE | 🟠 Only for UI feedback | Different palette and rendering. Acceptable as short, small overlays (success, failure, hint, sparkles), never as world art. |

Excluded from SPE: all text symbols (English baked in, breaks ES/FR), Sci-fi, Splatters (blood),
skull smoke, heartbeat, muzzle flash, lightning, explosions (TS-2/TS-1 already have explosions and fire
in the right style).

## 3. Proposed setting

**"The Kingdom of Records"** (working title). The player is the new royal scribe. Instead of a quill
they use SQL "scrolls" to answer questions from villagers, the castle and, finally, to stop a goblin
invasion. Each stage is a region of the same island kingdom, so the art stays in one style while the
scenery changes.

| Stage | Region | Terrain | Story hook | SQL topics |
|---|---|---|---|---|
| Easy 1–5 | **The Village** (spring meadow) | `Tilemap_color1` / `color2` (bright green) | Help the villagers: find sheep, list houses, register newcomers. | SELECT, WHERE, AND/OR/IN, LIKE + ORDER BY, INSERT/UPDATE |
| Medium 1–5 | **The Castle** (autumn fields) | `Tilemap_color4` (olive) | Run the castle: count gold/wood/meat, group soldiers by barracks, fix the tax ledger. | Aggregates, GROUP BY, HAVING, conditional DELETE/UPDATE, first JOIN |
| Hard 1–5 | **The Goblin Frontier** (dusk) | `Tilemap_color5` (teal) | Goblins raid the border: cross raid reports, find missing supplies, unmask the goblin chief. | Multiple JOIN, LEFT JOIN, subqueries, subqueries with aggregates, final challenge |

## 4. Proposed assets per stage

Scenes are small dioramas built from tiles + props (no painted backgrounds exist in the packs; the
"background" is water colour + clouds).

### Easy — The Village
- **Terrain:** TS-2 `Tilemap_color1` (+ `color2` for variety), `Water Background color`, `Water Foam`, `Shadow`.
- **Buildings:** TS-2 Blue `House1–3`, `Tower`.
- **Props:** TS-2 `Bushe1–4`, `Rock1–4`, `Tree1–4` (animated), `Stump 1–4`, `Clouds_01–08`, `Rubber duck` (easter egg).
- **Characters:** TS-2 Blue `Pawn` (idle / run / tools), `Monk` (idle), `Sheep_*` (idle, grass, move).
- **Narrator portraits:** TS-2 `Avatars` Pawn and Monk (blue).

### Medium — The Castle
- **Terrain:** TS-2 `Tilemap_color4` (with cliffs).
- **Buildings:** TS-2 Blue `Castle`, `Barracks`, `Archery`, `Monastery`, `Tower`.
- **Props / resources:** TS-2 `Gold Stone 1–6` (+ highlight), `Gold_Resource`, `Wood Resource`, `Meat Resource`, `Tools 1–4`, trees.
- **Characters:** TS-2 Blue `Warrior`, `Archer`, `Lancer`; Red / Yellow units as other guilds or visitors.
- **Narrator portraits:** TS-2 `Avatars` Warrior and Lancer.

### Hard — The Goblin Frontier
- **Terrain:** TS-2 `Tilemap_color5`.
- **Buildings:** TS-2 Black buildings (occupied fort); TS-1 `Goblin_House`, `Wood_Tower_*` (animated), `*_Destroyed`, `*_Construction`, `GoldMine_*`.
- **Characters:** TS-1 Goblins `Torch`, `TNT` (+ `Dynamite`), `Barrel`; TS-2 Blue `Warrior` / `Lancer` as defenders; TS-1 `Dead`.
- **Effects:** TS-2 `Fire_01–03`, `Explosion_01–02`, `Dust_01–02`; TS-1 `Fire`, `Explosions`.
- **Props:** TS-1 `Deco` bones, scarecrows, mushrooms.
- **Narrator portraits:** TS-2 `Avatars` Black/Purple Warrior. ⚠️ There is no goblin portrait.

### UI (all stages)
| Element | Asset |
|---|---|
| Story / mission panel | TS-2 `Papers/RegularPaper` (9-slice); `SpecialPaper` for the final challenge |
| SQL editor frame | TS-2 `Wood Table/WoodTable` (9-slice) around a dark CodeMirror theme |
| Results panel | TS-2 `Banners/Banner` (9-slice) |
| Level / stage titles | TS-2 `Ribbons/BigRibbons` (blue, red, yellow…) |
| Stage headers on the map | TS-2 `Swords/Swords` |
| Primary buttons (Run, Next) | TS-2 `BigBlueButton_Regular/Pressed` |
| Secondary / destructive (Reset) | TS-2 `BigRedButton_Regular/Pressed` |
| Icon buttons | TS-2 `Small*Button` / `Tiny*Button` + `Icons/Icon_01–12` (gear = settings, i = info, note = music, green arrow = next, orange arrow = back, red X = close, coin / log / meat = resources) |
| Progress bar | TS-2 `Bars/BigBar_*`, `SmallBar_*` |
| Cursors | TS-2 `Cursors/Cursor_01–04` |
| Correct answer | SPE `symbol_success_001` + `round_sparkle_burst_001` or `directional_coin_burst_001` |
| Wrong answer | SPE `symbol_failure_001` (small); optional TS-2 `Dust_01` |
| Hint | SPE `symbol_lightbulb_001` |
| Stage cleared | SPE `round_light_burst_001` + `round_firework_burst_002`, with the *text* drawn in HTML so it can be translated |
| Locked stage | CSS greyscale on the stage card (see gaps) |

## 5. Gaps found in Phase 0 (all resolved, see "Validated decisions" above)

1. **Licence of both Tiny Swords packs:** no licence or readme in either folder. My understanding
   (*not verified*) is that the itch.io page of Pixel Frog allows free use in personal and commercial
   projects and forbids redistributing or reselling the assets. Please confirm on the store page and,
   ideally, save a copy of the terms in the folder.
2. **Audio:** none of the packs contains sounds or music.
3. **Font:** no font. A pixel font with full Latin coverage (ñ, é, è, ç, à, ¿, ¡…) is needed for ES/FR.
4. **Hover / disabled button states:** TS-2 only has Regular and Pressed. Options: CSS filters
   (brightness / greyscale) or TS-1 `Button_Hover/Disable` (different palette).
5. **Lock icon:** only TS-1 has one (`Icons/Regular_10`, grey carved style). Alternative: CSS greyscale + ribbon.
6. **Language selector:** no flag icons. Proposal: text labels `ES · EN · FR` on small buttons (also better for accessibility).
7. **Goblin portrait** for the hard stage narrator: does not exist.
8. **Database concepts** (table, key, column): no dedicated icons; would be drawn with HTML/CSS inside the parchment.

## 6. Housekeeping notes for Phase 5

- Ignore `.DS_Store` (88), `__MACOSX` inside the zip and `.aseprite` sources (54): not needed on the web.
- `TS-1/Factions/Knights/Troops/Archer/Archer + Bow.zip` duplicates the already-extracted `Archer + Bow/` folder.
- Typo in the original pack: `TS-1/…/Archer/Purple/Archer_Purlple.png` (will be renamed on copy).
- SPE ships every effect twice (`PNG/` frames and `spritesheet/`). Only the spritesheets + `.txt` are needed.
- TS-1 unit sheets are grids (one animation per row, some empty cells); TS-2 sheets are one strip per animation.
- Pixel art must be rendered with `image-rendering: pixelated` and integer scaling.

---

## Appendix — Full inventory

Colour variants are grouped in one row, e.g. `{Blue|Red}` means one file per colour with identical size
and frame layout. Spritesheet frame counts for strips are width ÷ frame width; for grids they are the
number of cells (some cells are empty).

### Tiny Swords (Free Pack)

| Path | Type | Format | Size (px) | Spritesheet | Frame (px) | Style |
|---|---|---|---|---|---|---|
| `Buildings/{Black\|Blue\|Purple\|Red\|Yellow} Buildings/Archery.png` | terrain (building) | PNG | 192x256 | no | – | TS-2 |
| `Buildings/{Black\|Blue\|Purple\|Red\|Yellow} Buildings/Barracks.png` | terrain (building) | PNG | 192x256 | no | – | TS-2 |
| `Buildings/{Black\|Blue\|Purple\|Red\|Yellow} Buildings/Castle.png` | terrain (building) | PNG | 320x256 | no | – | TS-2 |
| `Buildings/{Black\|Blue\|Purple\|Red\|Yellow} Buildings/House1.png` | terrain (building) | PNG | 128x192 | no | – | TS-2 |
| `Buildings/{Black\|Blue\|Purple\|Red\|Yellow} Buildings/House2.png` | terrain (building) | PNG | 128x192 | no | – | TS-2 |
| `Buildings/{Black\|Blue\|Purple\|Red\|Yellow} Buildings/House3.png` | terrain (building) | PNG | 128x192 | no | – | TS-2 |
| `Buildings/{Black\|Blue\|Purple\|Red\|Yellow} Buildings/Monastery.png` | terrain (building) | PNG | 192x320 | no | – | TS-2 |
| `Buildings/{Black\|Blue\|Purple\|Red\|Yellow} Buildings/Tower.png` | terrain (building) | PNG | 128x256 | no | – | TS-2 |
| `Particle FX/Dust_01.png` | effect | PNG | 512x64 | yes – 8 frames | 64x64 | TS-2 |
| `Particle FX/Dust_02.png` | effect | PNG | 640x64 | yes – 10 frames | 64x64 | TS-2 |
| `Particle FX/Explosion_01.png` | effect | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Particle FX/Explosion_02.png` | effect | PNG | 1920x192 | yes – 10 frames | 192x192 | TS-2 |
| `Particle FX/Fire_01.png` | effect | PNG | 512x64 | yes – 8 frames | 64x64 | TS-2 |
| `Particle FX/Fire_02.png` | effect | PNG | 640x64 | yes – 10 frames | 64x64 | TS-2 |
| `Particle FX/Fire_03.png` | effect | PNG | 768x64 | yes – 12 frames | 64x64 | TS-2 |
| `Particle FX/Water Splash.png` | effect | PNG | 1728x192 | yes – 9 frames | 192x192 | TS-2 |
| `Terrain/Decorations/Bushes/Bushe1.png` | terrain (prop) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-2 |
| `Terrain/Decorations/Bushes/Bushe2.png` | terrain (prop) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-2 |
| `Terrain/Decorations/Bushes/Bushe3.png` | terrain (prop) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-2 |
| `Terrain/Decorations/Bushes/Bushe4.png` | terrain (prop) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-2 |
| `Terrain/Decorations/Clouds/Clouds_01.png` | background | PNG | 576x256 | no | – | TS-2 |
| `Terrain/Decorations/Clouds/Clouds_02.png` | background | PNG | 576x256 | no | – | TS-2 |
| `Terrain/Decorations/Clouds/Clouds_03.png` | background | PNG | 576x256 | no | – | TS-2 |
| `Terrain/Decorations/Clouds/Clouds_04.png` | background | PNG | 576x256 | no | – | TS-2 |
| `Terrain/Decorations/Clouds/Clouds_05.png` | background | PNG | 576x256 | no | – | TS-2 |
| `Terrain/Decorations/Clouds/Clouds_06.png` | background | PNG | 576x256 | no | – | TS-2 |
| `Terrain/Decorations/Clouds/Clouds_07.png` | background | PNG | 576x256 | no | – | TS-2 |
| `Terrain/Decorations/Clouds/Clouds_08.png` | background | PNG | 576x256 | no | – | TS-2 |
| `Terrain/Decorations/Rocks/Rock1.png` | terrain (prop) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Decorations/Rocks/Rock2.png` | terrain (prop) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Decorations/Rocks/Rock3.png` | terrain (prop) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Decorations/Rocks/Rock4.png` | terrain (prop) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Decorations/Rocks in the Water/Water Rocks_01.png` | terrain (prop) | PNG | 1024x64 | yes – 16 frames | 64x64 | TS-2 |
| `Terrain/Decorations/Rocks in the Water/Water Rocks_02.png` | terrain (prop) | PNG | 1024x64 | yes – 16 frames | 64x64 | TS-2 |
| `Terrain/Decorations/Rocks in the Water/Water Rocks_03.png` | terrain (prop) | PNG | 1024x64 | yes – 16 frames | 64x64 | TS-2 |
| `Terrain/Decorations/Rocks in the Water/Water Rocks_04.png` | terrain (prop) | PNG | 1024x64 | yes – 16 frames | 64x64 | TS-2 |
| `Terrain/Decorations/Rubber Duck/Rubber duck.png` | terrain (prop) | PNG | 96x32 | yes – 3 frames | 32x32 | TS-2 |
| `Terrain/Resources/Gold/Gold Resource/Gold_Resource.png` | icon (resource item) | PNG | 128x128 | no | – | TS-2 |
| `Terrain/Resources/Gold/Gold Resource/Gold_Resource_Highlight.png` | icon (resource item) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 1.png` | terrain (prop) | PNG | 128x128 | no | – | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 1_Highlight.png` | terrain (prop) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 2.png` | terrain (prop) | PNG | 128x128 | no | – | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 2_Highlight.png` | terrain (prop) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 3.png` | terrain (prop) | PNG | 128x128 | no | – | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 3_Highlight.png` | terrain (prop) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 4.png` | terrain (prop) | PNG | 128x128 | no | – | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 4_Highlight.png` | terrain (prop) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 5.png` | terrain (prop) | PNG | 128x128 | no | – | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 5_Highlight.png` | terrain (prop) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 6.png` | terrain (prop) | PNG | 128x128 | no | – | TS-2 |
| `Terrain/Resources/Gold/Gold Stones/Gold Stone 6_Highlight.png` | terrain (prop) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-2 |
| `Terrain/Resources/Meat/Meat Resource/Meat Resource.png` | icon (resource item) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Resources/Meat/Sheep/Sheep_Grass.png` | character (animal) | PNG | 1536x128 | yes – 12 frames | 128x128 | TS-2 |
| `Terrain/Resources/Meat/Sheep/Sheep_Idle.png` | character (animal) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-2 |
| `Terrain/Resources/Meat/Sheep/Sheep_Move.png` | character (animal) | PNG | 512x128 | yes – 4 frames | 128x128 | TS-2 |
| `Terrain/Resources/Tools/Tool_01.png` | icon (resource item) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Resources/Tools/Tool_02.png` | icon (resource item) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Resources/Tools/Tool_03.png` | icon (resource item) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Resources/Tools/Tool_04.png` | icon (resource item) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Resources/Wood/Trees/Stump 1.png` | terrain (prop) | PNG | 192x256 | no | – | TS-2 |
| `Terrain/Resources/Wood/Trees/Stump 2.png` | terrain (prop) | PNG | 192x256 | no | – | TS-2 |
| `Terrain/Resources/Wood/Trees/Stump 3.png` | terrain (prop) | PNG | 192x256 | no | – | TS-2 |
| `Terrain/Resources/Wood/Trees/Stump 4.png` | terrain (prop) | PNG | 192x256 | no | – | TS-2 |
| `Terrain/Resources/Wood/Trees/Tree1.png` | terrain (prop) | PNG | 1536x256 | yes – 8 frames | 192x256 | TS-2 |
| `Terrain/Resources/Wood/Trees/Tree2.png` | terrain (prop) | PNG | 1536x256 | yes – 8 frames | 192x256 | TS-2 |
| `Terrain/Resources/Wood/Trees/Tree3.png` | terrain (prop) | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Terrain/Resources/Wood/Trees/Tree4.png` | terrain (prop) | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Terrain/Resources/Wood/Wood Resource/Wood Resource.png` | icon (resource item) | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Tileset/Shadow.png` | terrain | PNG | 192x192 | no | – | TS-2 |
| `Terrain/Tileset/Tilemap_color1.png` | terrain | PNG | 576x384 | tileset (64 px tiles) | – | TS-2 |
| `Terrain/Tileset/Tilemap_color2.png` | terrain | PNG | 576x384 | tileset (64 px tiles) | – | TS-2 |
| `Terrain/Tileset/Tilemap_color3.png` | terrain | PNG | 576x384 | tileset (64 px tiles) | – | TS-2 |
| `Terrain/Tileset/Tilemap_color4.png` | terrain | PNG | 576x384 | tileset (64 px tiles) | – | TS-2 |
| `Terrain/Tileset/Tilemap_color5.png` | terrain | PNG | 576x384 | tileset (64 px tiles) | – | TS-2 |
| `Terrain/Tileset/Water Background color.png` | background | PNG | 64x64 | no | – | TS-2 |
| `Terrain/Tileset/Water Foam.png` | terrain | PNG | 3072x192 | yes – 16 frames | 192x192 | TS-2 |
| `UI Elements/UI Banners from the store page/Banner/Banner.png` | UI | PNG | 704x512 | multi-slice panel | – | TS-2 |
| `UI Elements/UI Banners from the store page/Banner/Slots.png` | UI | PNG | 320x320 | no | – | TS-2 |
| `UI Elements/UI Banners from the store page/Ribbons/Ribbon_{Black\|Blue\|Purple\|Red\|Yellow}.png` | UI | PNG | 960x576 | no | – | TS-2 |
| `UI Elements/UI Elements/Banners/Banner.png` | UI | PNG | 448x448 | 9-slice (3x3 cells of 64) | – | TS-2 |
| `UI Elements/UI Elements/Banners/Banner_Slots.png` | UI | PNG | 192x192 | no | – | TS-2 |
| `UI Elements/UI Elements/Bars/BigBar_Base.png` | UI | PNG | 320x64 | 3-slice | – | TS-2 |
| `UI Elements/UI Elements/Bars/BigBar_Fill.png` | UI | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Bars/SmallBar_Base.png` | UI | PNG | 320x64 | 3-slice | – | TS-2 |
| `UI Elements/UI Elements/Bars/SmallBar_Fill.png` | UI | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Buttons/BigBlueButton_Pressed.png` | UI | PNG | 320x320 | 9-slice (3x3 cells of 64) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/BigBlueButton_Regular.png` | UI | PNG | 320x320 | 9-slice (3x3 cells of 64) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/BigRedButton_Pressed.png` | UI | PNG | 320x320 | 9-slice (3x3 cells of 64) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/BigRedButton_Regular.png` | UI | PNG | 320x320 | 9-slice (3x3 cells of 64) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/SmallBlueRoundButton_Pressed.png` | UI | PNG | 128x128 | single (round/square button) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/SmallBlueRoundButton_Regular.png` | UI | PNG | 128x128 | single (round/square button) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/SmallBlueSquareButton_Pressed.png` | UI | PNG | 128x128 | single (round/square button) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/SmallBlueSquareButton_Regular.png` | UI | PNG | 128x128 | single (round/square button) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/SmallRedRoundButton_Pressed.png` | UI | PNG | 128x128 | single (round/square button) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/SmallRedRoundButton_Regular.png` | UI | PNG | 128x128 | single (round/square button) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/SmallRedSquareButton_Pressed.png` | UI | PNG | 128x128 | single (round/square button) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/SmallRedSquareButton_Regular.png` | UI | PNG | 128x128 | single (round/square button) | – | TS-2 |
| `UI Elements/UI Elements/Buttons/TinyRoundBlueButton.png` | UI | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Buttons/TinyRoundRedButton.png` | UI | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Buttons/TinySquareBlueButton.png` | UI | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Buttons/TinySquareRedButton.png` | UI | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Cursors/Cursor_01.png` | UI (cursor) | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Cursors/Cursor_02.png` | UI (cursor) | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Cursors/Cursor_03.png` | UI (cursor) | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Cursors/Cursor_04.png` | UI (cursor) | PNG | 128x128 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_01.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_02.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_03.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_04.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_05.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_06.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_07.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_08.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_09.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_10.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_11.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_12.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_13.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_14.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_15.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_16.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_17.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_18.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_19.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_20.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_21.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_22.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_23.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_24.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Human Avatars/Avatars_25.png` | character (portrait) | PNG | 256x256 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_01.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_02.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_03.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_04.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_05.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_06.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_07.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_08.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_09.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_10.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_11.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Icons/Icon_12.png` | icon | PNG | 64x64 | no | – | TS-2 |
| `UI Elements/UI Elements/Papers/RegularPaper.png` | UI | PNG | 320x320 | 9-slice (3x3 cells of 64) | – | TS-2 |
| `UI Elements/UI Elements/Papers/SpecialPaper.png` | UI | PNG | 320x320 | 9-slice (3x3 cells of 64) | – | TS-2 |
| `UI Elements/UI Elements/Ribbons/BigRibbons.png` | UI | PNG | 448x640 | 5 colours x 3-slice | – | TS-2 |
| `UI Elements/UI Elements/Ribbons/SmallRibbons.png` | UI | PNG | 320x640 | 5 colours x 3-slice | – | TS-2 |
| `UI Elements/UI Elements/Swords/Swords.png` | UI | PNG | 448x640 | 5 colours x 3-slice | – | TS-2 |
| `UI Elements/UI Elements/Wood Table/WoodTable.png` | UI | PNG | 448x448 | 9-slice (3x3 cells of 64) | – | TS-2 |
| `UI Elements/UI Elements/Wood Table/WoodTable_Slots.png` | UI | PNG | 192x192 | no | – | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Archer/Archer_Idle.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Archer/Archer_Run.png` | character | PNG | 768x192 | yes – 4 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Archer/Archer_Shoot.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Archer/Arrow.png` | effect | PNG | 64x64 | no | – | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_DownRight_Attack.png` | character | PNG | 960x320 | yes – 3 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_DownRight_Defence.png` | character | PNG | 1920x320 | yes – 6 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_Down_Attack.png` | character | PNG | 960x320 | yes – 3 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_Down_Defence.png` | character | PNG | 1920x320 | yes – 6 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_Idle.png` | character | PNG | 3840x320 | yes – 12 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_Right_Attack.png` | character | PNG | 960x320 | yes – 3 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_Right_Defence.png` | character | PNG | 1920x320 | yes – 6 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_Run.png` | character | PNG | 1920x320 | yes – 6 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_UpRight_Attack.png` | character | PNG | 960x320 | yes – 3 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_UpRight_Defence.png` | character | PNG | 1920x320 | yes – 6 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_Up_Attack.png` | character | PNG | 960x320 | yes – 3 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Lancer/Lancer_Up_Defence.png` | character | PNG | 1920x320 | yes – 6 frames | 320x320 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Monk/Heal.png` | character | PNG | 2112x192 | yes – 11 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Monk/Heal_Effect.png` | effect | PNG | 2112x192 | yes – 11 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Monk/Idle.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Monk/Run.png` | character | PNG | 768x192 | yes – 4 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Idle Axe.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Idle Gold.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Idle Hammer.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Idle Knife.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Idle Meat.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Idle Pickaxe.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Idle Wood.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Idle.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Interact Axe.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Interact Hammer.png` | character | PNG | 576x192 | yes – 3 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Interact Knife.png` | character | PNG | 768x192 | yes – 4 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Interact Pickaxe.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Run Axe.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Run Gold.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Run Hammer.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Run Knife.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Run Meat.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Run Pickaxe.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Run Wood.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Pawn/Pawn_Run.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Warrior/Warrior_Attack1.png` | character | PNG | 768x192 | yes – 4 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Warrior/Warrior_Attack2.png` | character | PNG | 768x192 | yes – 4 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Warrior/Warrior_Guard.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Warrior/Warrior_Idle.png` | character | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-2 |
| `Units/{Black\|Blue\|Purple\|Red\|Yellow} Units/Warrior/Warrior_Run.png` | character | PNG | 1152x192 | yes – 6 frames | 192x192 | TS-2 |

### Tiny Swords (Update 010)

| Path | Type | Format | Size (px) | Spritesheet | Frame (px) | Style |
|---|---|---|---|---|---|---|
| `Deco/01.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/02.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/03.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/04.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/05.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/06.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/07.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/08.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/09.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/10.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/11.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/12.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/13.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/14.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/15.png` | terrain (prop) | PNG | 64x64 | no | – | TS-1 |
| `Deco/16.png` | terrain (prop) | PNG | 64x128 | no | – | TS-1 |
| `Deco/17.png` | terrain (prop) | PNG | 64x128 | no | – | TS-1 |
| `Deco/18.png` | terrain (prop) | PNG | 192x192 | no | – | TS-1 |
| `Effects/Explosion/Explosions.png` | effect | PNG | 1728x192 | yes – 9 frames | 192x192 | TS-1 |
| `Effects/Fire/Fire.png` | effect | PNG | 896x128 | yes – 7 frames | 128x128 | TS-1 |
| `Factions/Goblins/Buildings/Wood_House/Goblin_House.png` | terrain (building) | PNG | 128x192 | no | – | TS-1 |
| `Factions/Goblins/Buildings/Wood_House/Goblin_House_Destroyed.png` | terrain (building) | PNG | 128x192 | no | – | TS-1 |
| `Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_{Blue\|Purple\|Red\|Yellow}.png` | terrain (building) | PNG | 1024x192 | yes – 4 frames | 256x192 | TS-1 |
| `Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_Destroyed.png` | terrain (building) | PNG | 256x192 | no | – | TS-1 |
| `Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_InConstruction.png` | terrain (building) | PNG | 256x192 | no | – | TS-1 |
| `Factions/Goblins/Troops/Barrel/{Blue\|Purple\|Red\|Yellow}/Barrel_{Blue\|Purple\|Red\|Yellow}.png` | character | PNG | 768x768 | yes – grid 6x6 = 36 cells (some empty; one animation per row) | 128x128 | TS-1 |
| `Factions/Goblins/Troops/TNT/{Blue\|Purple\|Red\|Yellow}/TNT_{Blue\|Purple\|Red\|Yellow}.png` | character | PNG | 1344x576 | yes – grid 7x3 = 21 cells (some empty; one animation per row) | 192x192 | TS-1 |
| `Factions/Goblins/Troops/TNT/Dynamite/Dynamite.png` | effect | PNG | 384x64 | yes – 6 frames | 64x64 | TS-1 |
| `Factions/Goblins/Troops/Torch/{Blue\|Purple\|Red\|Yellow}/Torch_{Blue\|Purple\|Red\|Yellow}.png` | character | PNG | 1344x960 | yes – grid 7x5 = 35 cells (some empty; one animation per row) | 192x192 | TS-1 |
| `Factions/Knights/Buildings/Castle/Castle_{Blue\|Purple\|Red\|Yellow}.png` | terrain (building) | PNG | 320x256 | no | – | TS-1 |
| `Factions/Knights/Buildings/Castle/Castle_Construction.png` | terrain (building) | PNG | 320x256 | no | – | TS-1 |
| `Factions/Knights/Buildings/Castle/Castle_Destroyed.png` | terrain (building) | PNG | 320x256 | no | – | TS-1 |
| `Factions/Knights/Buildings/House/House_{Blue\|Purple\|Red\|Yellow}.png` | terrain (building) | PNG | 128x192 | no | – | TS-1 |
| `Factions/Knights/Buildings/House/House_Construction.png` | terrain (building) | PNG | 128x192 | no | – | TS-1 |
| `Factions/Knights/Buildings/House/House_Destroyed.png` | terrain (building) | PNG | 128x192 | no | – | TS-1 |
| `Factions/Knights/Buildings/Tower/Tower_{Blue\|Purple\|Red\|Yellow}.png` | terrain (building) | PNG | 128x256 | no | – | TS-1 |
| `Factions/Knights/Buildings/Tower/Tower_Construction.png` | terrain (building) | PNG | 128x256 | no | – | TS-1 |
| `Factions/Knights/Buildings/Tower/Tower_Destroyed.png` | terrain (building) | PNG | 128x256 | no | – | TS-1 |
| `Factions/Knights/Troops/Archer/Archer + Bow/Archer_{Blue\|Purple\|Red\|Yellow}_(NoArms).png` | character | PNG | 1152x384 | yes – grid 6x2 = 12 cells (some empty; one animation per row) | 192x192 | TS-1 |
| `Factions/Knights/Troops/Archer/Archer + Bow/Archer_Bow_{Blue\|Purple\|Red\|Yellow}.png` | character | PNG | 1536x384 | yes – grid 8x2 = 16 cells (some empty; one animation per row) | 192x192 | TS-1 |
| `Factions/Knights/Troops/Archer/Arrow/Arrow.png` | effect | PNG | 64x128 | no | – | TS-1 |
| `Factions/Knights/Troops/Archer/{Blue\|Purple\|Red\|Yellow}/Archer_{Blue\|Purple\|Red\|Yellow}.png` | character | PNG | 1536x1344 | yes – grid 8x7 = 56 cells (some empty; one animation per row) | 192x192 | TS-1 |
| `Factions/Knights/Troops/Dead/Dead.png` | character | PNG | 896x256 | yes – grid 7x2 = 14 cells (some empty; one animation per row) | 128x128 | TS-1 |
| `Factions/Knights/Troops/Pawn/{Blue\|Purple\|Red\|Yellow}/Pawn_{Blue\|Purple\|Red\|Yellow}.png` | character | PNG | 1152x1152 | yes – grid 6x6 = 36 cells (some empty; one animation per row) | 192x192 | TS-1 |
| `Factions/Knights/Troops/Warrior/{Blue\|Purple\|Red\|Yellow}/Warrior_{Blue\|Purple\|Red\|Yellow}.png` | character | PNG | 1152x1536 | yes – grid 6x8 = 48 cells (some empty; one animation per row) | 192x192 | TS-1 |
| `Resources/Gold Mine/GoldMine_Active.png` | terrain (building) | PNG | 192x128 | no | – | TS-1 |
| `Resources/Gold Mine/GoldMine_Destroyed.png` | terrain (building) | PNG | 192x128 | no | – | TS-1 |
| `Resources/Gold Mine/GoldMine_Inactive.png` | terrain (building) | PNG | 192x128 | no | – | TS-1 |
| `Resources/Resources/G_Idle.png` | icon (resource item) | PNG | 128x128 | no | – | TS-1 |
| `Resources/Resources/G_Idle_(NoShadow).png` | icon (resource item) | PNG | 128x128 | no | – | TS-1 |
| `Resources/Resources/G_Spawn.png` | effect | PNG | 896x128 | yes – 7 frames | 128x128 | TS-1 |
| `Resources/Resources/M_Idle.png` | icon (resource item) | PNG | 128x128 | no | – | TS-1 |
| `Resources/Resources/M_Idle_(NoShadow).png` | icon (resource item) | PNG | 128x128 | no | – | TS-1 |
| `Resources/Resources/M_Spawn.png` | effect | PNG | 896x128 | yes – 7 frames | 128x128 | TS-1 |
| `Resources/Resources/W_Idle.png` | icon (resource item) | PNG | 128x128 | no | – | TS-1 |
| `Resources/Resources/W_Idle_(NoShadow).png` | icon (resource item) | PNG | 128x128 | no | – | TS-1 |
| `Resources/Resources/W_Spawn.png` | effect | PNG | 896x128 | yes – 7 frames | 128x128 | TS-1 |
| `Resources/Sheep/HappySheep_All.png` | character (animal) | PNG | 1024x256 | yes – grid 8x2 = 16 cells (some empty; one animation per row) | 128x128 | TS-1 |
| `Resources/Sheep/HappySheep_Bouncing.png` | character (animal) | PNG | 768x128 | yes – 6 frames | 128x128 | TS-1 |
| `Resources/Sheep/HappySheep_Idle.png` | character (animal) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-1 |
| `Resources/Trees/Tree.png` | terrain (prop) | PNG | 768x576 | yes – grid 4x3 = 12 cells (some empty; one animation per row) | 192x192 | TS-1 |
| `Terrain/Bridge/Bridge_All.png` | terrain | PNG | 192x256 | tileset (64 px tiles) | – | TS-1 |
| `Terrain/Ground/Shadows.png` | terrain | PNG | 192x192 | no | – | TS-1 |
| `Terrain/Ground/Tilemap_Elevation.png` | terrain | PNG | 256x512 | tileset (64 px tiles) | – | TS-1 |
| `Terrain/Ground/Tilemap_Flat.png` | terrain | PNG | 640x256 | tileset (64 px tiles) | – | TS-1 |
| `Terrain/Water/Water.png` | background | PNG | 64x64 | no | – | TS-1 |
| `Terrain/Water/Foam/Foam.png` | terrain | PNG | 1536x192 | yes – 8 frames | 192x192 | TS-1 |
| `Terrain/Water/Rocks/Rocks_01.png` | terrain (prop) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-1 |
| `Terrain/Water/Rocks/Rocks_02.png` | terrain (prop) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-1 |
| `Terrain/Water/Rocks/Rocks_03.png` | terrain (prop) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-1 |
| `Terrain/Water/Rocks/Rocks_04.png` | terrain (prop) | PNG | 1024x128 | yes – 8 frames | 128x128 | TS-1 |
| `UI/Banners/Banner_Connection_Down.png` | UI | PNG | 192x192 | 9-slice + connector | – | TS-1 |
| `UI/Banners/Banner_Connection_Left.png` | UI | PNG | 192x192 | 9-slice + connector | – | TS-1 |
| `UI/Banners/Banner_Connection_Right.png` | UI | PNG | 192x192 | 9-slice + connector | – | TS-1 |
| `UI/Banners/Banner_Connection_Up.png` | UI | PNG | 192x192 | 9-slice + connector | – | TS-1 |
| `UI/Banners/Banner_Horizontal.png` | UI | PNG | 192x192 | 9-slice | – | TS-1 |
| `UI/Banners/Banner_Vertical.png` | UI | PNG | 192x192 | 9-slice | – | TS-1 |
| `UI/Banners/Carved_3Slides.png` | UI | PNG | 192x64 | 3-slice | – | TS-1 |
| `UI/Banners/Carved_9Slides.png` | UI | PNG | 192x192 | 9-slice | – | TS-1 |
| `UI/Banners/Carved_Regular.png` | UI | PNG | 64x64 | single | – | TS-1 |
| `UI/Buttons/Button_{Blue\|Red}.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Buttons/Button_{Blue\|Red}_3Slides.png` | UI | PNG | 192x64 | 3-slice | – | TS-1 |
| `UI/Buttons/Button_{Blue\|Red}_3Slides_Pressed.png` | UI | PNG | 192x64 | 3-slice | – | TS-1 |
| `UI/Buttons/Button_{Blue\|Red}_9Slides.png` | UI | PNG | 192x192 | 9-slice | – | TS-1 |
| `UI/Buttons/Button_{Blue\|Red}_9Slides_Pressed.png` | UI | PNG | 192x192 | 9-slice | – | TS-1 |
| `UI/Buttons/Button_{Blue\|Red}_Pressed.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Buttons/Button_Disable.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Buttons/Button_Disable_3Slides.png` | UI | PNG | 192x64 | 3-slice | – | TS-1 |
| `UI/Buttons/Button_Disable_9Slides.png` | UI | PNG | 192x192 | 9-slice | – | TS-1 |
| `UI/Buttons/Button_Hover.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Buttons/Button_Hover_3Slides.png` | UI | PNG | 192x64 | 3-slice | – | TS-1 |
| `UI/Buttons/Button_Hover_9Slides.png` | UI | PNG | 192x192 | 9-slice | – | TS-1 |
| `UI/Icons/Disable_01.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_02.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_03.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_04.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_05.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_06.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_07.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_08.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_09.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Disable_10.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_01.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_02.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_03.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_04.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_05.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_06.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_07.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_08.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_09.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Pressed_10.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_01.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_02.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_03.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_04.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_05.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_06.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_07.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_08.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_09.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Icons/Regular_10.png` | icon | PNG | 64x64 | no | – | TS-1 |
| `UI/Pointers/01.png` | UI (cursor) | PNG | 64x64 | no | – | TS-1 |
| `UI/Pointers/02.png` | UI (cursor) | PNG | 64x64 | no | – | TS-1 |
| `UI/Pointers/03.png` | UI (cursor) | PNG | 64x64 | no | – | TS-1 |
| `UI/Pointers/04.png` | UI (cursor) | PNG | 64x64 | no | – | TS-1 |
| `UI/Pointers/05.png` | UI (cursor) | PNG | 64x64 | no | – | TS-1 |
| `UI/Pointers/06.png` | UI (cursor) | PNG | 64x64 | no | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_3Slides.png` | UI | PNG | 192x64 | 3-slice | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_Connection_Down.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_Connection_Down_Pressed.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_Connection_Left.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_Connection_Left_Pressed.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_Connection_Right.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_Connection_Right_Pressed.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_Connection_Up.png` | UI | PNG | 64x64 | no | – | TS-1 |
| `UI/Ribbons/Ribbon_{Blue\|Red\|Yellow}_Connection_Up_Pressed.png` | UI | PNG | 64x64 | no | – | TS-1 |

### Super Pixel Effects Gigapack (Free Version)

Each effect ships twice: `PNG/<category>/<effect>/<variant>/frameNNNN.png` (individual frames) and `spritesheet/<category>/<effect>/<variant>/spritesheet.png` + `spritesheet.txt` (frame rects). Only one colour per effect in the free version. Playback: 15 FPS.

| Effect (`spritesheet/…`) | Type | Colour | Frames | Frame large / small (px) | Sheet large (px) | Style |
|---|---|---|---|---|---|---|
| `Explosions/epic_explosion_001` | effect | orange | 13 | 128x128 / 64x64 | 1664x128 | SPE |
| `Explosions/epic_explosion_002` | effect | yellow | 15 | 192x192 / 96x96 | 2880x192 | SPE |
| `Explosions/stylized_explosion_001` | effect | yellow | 9 | 96x96 / 48x48 | 864x96 | SPE |
| `Explosions/stylized_explosion_002` | effect | violet | 10 | 96x96 / 48x48 | 960x96 | SPE |
| `Explosions/stylized_explosion_003` | effect | yellow | 14 | 128x96 / 64x48 | 1792x96 | SPE |
| `Explosions/symmetrical_explosion_001` | effect | orange | 8 | 64x64 / 32x32 | 512x64 | SPE |
| `Explosions/symmetrical_explosion_002` | effect | orange | 11 | 64x64 / 32x32 | 704x64 | SPE |
| `Explosions/symmetrical_explosion_004` | effect | orange | 12 / 10 | 96x96 / 48x48 | 1152x96 | SPE |
| `Fantasy Spells/spell_absorb_001` | effect | violet | 31 | 128x128 / 64x64 | 3968x128 | SPE |
| `Fantasy Spells/spell_attack_up_001` | effect | red | 18 | 128x128 / 64x64 | 2304x128 | SPE |
| `Fantasy Spells/spell_death_001` | effect | red | 50 | 64x64 / 32x32 | 3200x64 | SPE |
| `Fantasy Spells/spell_death_002` | effect | green | 24 | 64x128 / 32x64 | 512x512 | SPE |
| `Fantasy Spells/spell_defense_up_001` | effect | blue | 18 | 128x128 / 64x64 | 2304x128 | SPE |
| `Fantasy Spells/spell_haste_001` | effect | green | 29 | 128x128 / 64x64 | 3712x128 | SPE |
| `Fantasy Spells/spell_heal_001` | effect | red | 16 | 128x128 / 64x64 | 2048x128 | SPE |
| `Fantasy Spells/spell_poison_001` | effect | green | 17 | 128x128 / 64x64 | 2176x128 | SPE |
| `Fantasy Spells/status_poison_001` | effect | green | 24 | 96x96 / 48x48 | 512x512 | SPE |
| `Fantasy Spells/status_sparkling_001` | effect | yellow | 24 | 96x96 / 48x48 | 512x512 | SPE |
| `Fire/fire_looping_003A` | effect | orange | 5 | 80x128 / 40x64 | 256x256 | SPE |
| `Fire/fire_looping_003B` | effect | orange | 15 | 96x128 / 48x64 | 512x512 | SPE |
| `Fire/fire_looping_004A` | effect | orange | 5 | 80x128 / 40x64 | 256x256 | SPE |
| `Fire/fire_looping_004B` | effect | orange | 15 | 80x128 / 40x64 | 512x512 | SPE |
| `Impacts/directional_impact_001` | effect | blue | 7 | 64x64 / 32x32 | 448x64 | SPE |
| `Impacts/directional_impact_002` | effect | white | 7 | 140x50 / 70x25 | 980x50 | SPE |
| `Impacts/directional_impact_003` | effect | violet | 6 | 80x80 / 40x40 | 480x80 | SPE |
| `Impacts/directional_impact_004` | effect | yellow | 5 | 80x80 / 40x40 | 400x80 | SPE |
| `Impacts/symmetrical_impact_001` | effect | yellow | 7 | 96x96 / 48x48 | 672x96 | SPE |
| `Impacts/symmetrical_impact_002` | effect | blue | 10 | 96x96 / 48x48 | 960x96 | SPE |
| `Impacts/symmetrical_impact_003` | effect | yellow | 7 | 96x96 / 48x48 | 672x96 | SPE |
| `Impacts/symmetrical_impact_004` | effect | yellow | 8 | 96x96 / 48x48 | 768x96 | SPE |
| `Impacts/symmetrical_impact_006` | effect | yellow | 8 | 160x160 / 80x80 | 1280x160 | SPE |
| `Lightning/lightning_aura_002` | effect | blue | 16 | 96x96 / 48x48 | 512x512 | SPE |
| `Lightning/lightning_burst_001` | effect | violet | 8 | 64x64 / 32x32 | 512x64 | SPE |
| `Lightning/lightning_burst_002` | effect | violet | 9 | 64x64 / 32x32 | 576x64 | SPE |
| `Lightning/lightning_burst_003` | effect | violet | 10 | 96x96 / 48x48 | 960x96 | SPE |
| `Lightning/lightning_strike_001` | effect | violet | 7 | 128x128 / 64x64 | 896x128 | SPE |
| `Magic Bursts/directional_bubble_burst_001` | effect | green | 40 | 128x128 / 64x64 | 5120x128 | SPE |
| `Magic Bursts/directional_coin_burst_001` | effect | yellow | 31 | 128x128 / 64x64 | 3968x128 | SPE |
| `Magic Bursts/directional_music_burst_001` | effect | red | 21 | 128x128 / 64x64 | 2688x128 | SPE |
| `Magic Bursts/directional_music_burst_002` | effect | yellow | 17 | 128x128 / 64x64 | 2176x128 | SPE |
| `Magic Bursts/round_firework_burst_001` | effect | green | 15 | 96x96 / 48x48 | 512x512 | SPE |
| `Magic Bursts/round_firework_burst_002` | effect | yellow | 27 | 96x96 / 48x48 | 1024x512 | SPE |
| `Magic Bursts/round_heart_burst_001` | effect | red | 23 | 128x128 / 64x64 | 2944x128 | SPE |
| `Magic Bursts/round_light_burst_001` | effect | yellow | 9 | 256x144 / 128x72 | 2304x144 | SPE |
| `Magic Bursts/round_sparkle_burst_001` | effect | blue | 14 | 64x64 / 32x32 | 896x64 | SPE |
| `Magic Bursts/round_sparkle_burst_002` | effect | green | 18 | 64x64 / 32x32 | 1152x64 | SPE |
| `Magic Bursts/round_sparkle_burst_003` | effect | red | 17 | 64x64 / 32x32 | 1088x64 | SPE |
| `Sci-fi/scifi_charge_up_001` | effect | yellow | 12 | 96x96 / 48x48 | 1152x96 | SPE |
| `Sci-fi/scifi_heartbeat_fast_001` | effect | yellow | 22 | 64x32 / 32x16 | 1408x32 | SPE |
| `Sci-fi/scifi_heartbeat_flatline_001` | effect | red | 22 | 64x32 / 32x16 | 1408x32 | SPE |
| `Sci-fi/scifi_heartbeat_slow_001` | effect | green | 22 | 64x32 / 32x16 | 1408x32 | SPE |
| `Sci-fi/scifi_muzzle_flash_001` | effect | yellow | 6 | 32x32 / 16x16 | 128x64 | SPE |
| `Sci-fi/scifi_muzzle_flash_003` | effect | yellow | 8 | 96x48 / 48x24 | 256x256 | SPE |
| `Sci-fi/scifi_spark_burst_001` | effect | yellow | 12 | 128x128 / 64x64 | 1536x128 | SPE |
| `Sci-fi/scifi_warp_001` | effect | green | 10 | 128x128 / 64x64 | 1280x128 | SPE |
| `Sci-fi/scifi_warp_002` | effect | red | 10 | 96x96 / 48x48 | 960x96 | SPE |
| `Sci-fi/scifi_warp_003` | effect | blue | 12 | 128x128 / 64x64 | 1536x128 | SPE |
| `Smoke Bursts/directional_smoke_burst_001` | effect | white | 21 | 64x64 / 32x32 | 1344x64 | SPE |
| `Smoke Bursts/looping_smoke_burst_001` | effect | gray | 15 | 96x96 / 48x48 | 512x512 | SPE |
| `Smoke Bursts/looping_smoke_burst_002` | effect | gray | 16 | 64x64 / 32x32 | 256x256 | SPE |
| `Smoke Bursts/stylized_skull_smoke_burst_001` | effect | white | 12 | 64x64 / 32x32 | 768x64 | SPE |
| `Smoke Bursts/symmetrical_smoke_burst_001` | effect | brown | 10 | 64x64 / 32x32 | 640x64 | SPE |
| `Splatters/burst_splatter_001` | effect | red | 10 | 64x64 / 32x32 | 640x64 | SPE |
| `Splatters/burst_splatter_003` | effect | green | 8 | 96x96 / 48x48 | 512x256 | SPE |
| `Splatters/directional_splatter_001` | effect | red | 8 | 64x64 / 32x32 | 512x64 | SPE |
| `Splatters/directional_splatter_003` | effect | red | 7 | 48x48 / 24x24 | 256x128 | SPE |
| `Splatters/directional_splatter_006` | effect | red | 8 | 64x64 / 32x32 | 256x128 | SPE |
| `Symbols/symbol_alert_001` | icon (animated symbol) | red | 14 | 80x80 / 40x40 | 1120x80 | SPE |
| `Symbols/symbol_alert_002` | icon (animated symbol) | red | 16 | 80x80 / 40x40 | 1280x80 | SPE |
| `Symbols/symbol_alert_text_001` | UI (animated text, English baked in) | red | 32 | 144x96 / 72x48 | 4608x96 | SPE |
| `Symbols/symbol_attack_up_001` | icon (animated symbol) | red | 60 | 80x80 / 40x40 | 1024x512 | SPE |
| `Symbols/symbol_bonus_text_001` | UI (animated text, English baked in) | green | 38 / 37 | 256x128 / 128x64 | 2048x1024 | SPE |
| `Symbols/symbol_bonus_text_002` | UI (animated text, English baked in) | violet | 44 / 43 | 256x96 / 128x48 | 2048x1024 | SPE |
| `Symbols/symbol_complete_text_001` | UI (animated text, English baked in) | blue | 56 / 55 | 320x96 / 160x48 | 2048x1024 | SPE |
| `Symbols/symbol_cool_text_001` | UI (animated text, English baked in) | blue | 36 / 35 | 160x128 / 80x64 | 1024x1024 | SPE |
| `Symbols/symbol_crown_001` | icon (animated symbol) | yellow | 45 | 64x48 / 32x24 | 512x512 | SPE |
| `Symbols/symbol_defense_up_001` | icon (animated symbol) | blue | 60 | 80x80 / 40x40 | 1024x512 | SPE |
| `Symbols/symbol_failure_001` | icon (animated symbol) | red | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_game_over_text_001` | UI (animated text, English baked in) | red | 44 | 416x128 / 208x64 | 2048x2048 | SPE |
| `Symbols/symbol_game_over_text_002` | UI (animated text, English baked in) | red | 60 / 59 | 352x96 / 176x48 | 2048x2048 | SPE |
| `Symbols/symbol_level_up_text_001` | UI (animated text, English baked in) | blue | 44 / 43 | 320x128 / 160x64 | 2048x1024 | SPE |
| `Symbols/symbol_lightbulb_001` | icon (animated symbol) | yellow | 12 | 96x96 / 48x48 | 512x512 | SPE |
| `Symbols/symbol_magic_up_001` | icon (animated symbol) | violet | 60 | 80x80 / 40x40 | 1024x512 | SPE |
| `Symbols/symbol_place_1st_001` | icon (animated symbol) | yellow | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_place_2nd_001` | icon (animated symbol) | green | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_place_3rd_001` | icon (animated symbol) | orange | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_place_4th_001` | icon (animated symbol) | blue | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_place_5th_001` | icon (animated symbol) | violet | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_place_6th_001` | icon (animated symbol) | blue | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_place_7th_001` | icon (animated symbol) | violet | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_place_8th_001` | icon (animated symbol) | red | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_question_001` | icon (animated symbol) | red | 30 | 96x96 / 48x48 | 1024x512 | SPE |
| `Symbols/symbol_rank_A_001` | icon (animated symbol) | green | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_rank_B_001` | icon (animated symbol) | orange | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_rank_C_001` | icon (animated symbol) | blue | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_rank_D_001` | icon (animated symbol) | violet | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_rank_F_001` | icon (animated symbol) | red | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_rank_S_001` | icon (animated symbol) | yellow | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_success_001` | icon (animated symbol) | green | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_thumbs_down_001` | icon (animated symbol) | red | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_thumbs_up_001` | icon (animated symbol) | blue | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_warning_001` | icon (animated symbol) | yellow | 60 | 80x80 / 40x40 | 4800x80 | SPE |
| `Symbols/symbol_wow_text_001` | UI (animated text, English baked in) | yellow | 34 / 33 | 160x128 / 80x64 | 1024x1024 | SPE |
| `Symbols/symbol_you_lost_text_001` | UI (animated text, English baked in) | violet | 48 / 47 | 360x128 / 180x64 | 2048x2048 | SPE |
| `Symbols/symbol_you_won_text_001` | UI (animated text, English baked in) | green | 42 / 41 | 288x128 / 144x64 | 2048x1024 | SPE |
