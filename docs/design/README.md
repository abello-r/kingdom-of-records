# Design of The Kingdom of Records

Status: **implemented** (Phases 4–6). Screenshots of the real game are in `screens/` and recordings of
the level reactions in `reactions/`.

## Adjustments made while implementing (requested at validation)

| Request | Implementation |
|---|---|
| Clear hint counter | "Pista · quedan 2" / "Hint · 2 left" / "Indice · il en reste 2"; disabled with "No quedan pistas" at 0. |
| Success sparkle from the tick, not over the table | The burst is anchored to the ✓ of the success note. |
| Compact phone header, no cut sprites | On phones the controls are a solid bar above the scene (smaller buttons); the level title sits below the scene. |
| Phone dialogue bubbles | Portraits (40 px) sit above the bubble, so the text keeps the full width. |
| Map progress bar | Empty part in dark wood (`#2e1b15`), filled part kit blue. |
| Sound and music buttons | Square kit buttons (see Phase 6 below). |
| "What the Registry holds" | One ledger card per table: "Table: villagers", then "Columns:" with each column and its type in plain words (number / text), joined by dotted leaders. |

## Idea

The level screen **is the Great Registry, open on a wooden lectern**. Left page: the story, the task
and any hint the player asked for. Right page: the player's spell (the SQL editor) and the Registry's
answer. Above the book, a diorama of the current region, built tile by tile from Tiny Swords, reacts
to the answers. That is the one bold element; everything else stays quiet.

No pop-ups. When an answer is right:
- the story continues on the left page (the new line is outlined in kit blue);
- a single success note appears on the right page, with any extra advice (e.g. double quotes) as a
  small aside inside it;
- a short effect plays on the book (≈ 600 ms sparkle burst around the success note, from SPE
  `round_sparkle_burst_001` + `status_sparkling_001`), never over the controls;
- the diorama characters celebrate (pawns hop with a dust puff, Aldric raises his sword, sheep jump,
  archers appear on the towers when the level is about them);
- "Turn the page" becomes the primary action.

All motion respects `prefers-reduced-motion` (the effect is replaced by the static note).

## Colour rules

All colours are sampled from the Tiny Swords art.

| Token | Hex | Use |
|---|---|---|
| Sea | `#47aba9` | World background (TS-2 water) |
| Parchment | `#eee1c6` | Pages, light surfaces (TS-2 paper) |
| Ink | `#161c2e` | Text and outlines (TS-2 outline) |
| Kit blue | `#41919d` (light `#4ea39c`, shade `#4a6982`) | Secondary buttons, progress fill, the line that just appeared, hint card |
| **Kit yellow** | `#bbb552` (shade `#a38250`) | **Only the primary action of each screen** |
| Wood | `#9b6253`, light `#d7b888`, dark `#4d2d22` | Lectern, poles, progress track, language plank |
| Ember | `#b9483f` (tint `#f3d6cf`) | Errors |

Primary action per screen: Home "Seguir leyendo"; Map "Abrir esta página"; Level "Lanzar conjuro"
until solved, then "Pasar página" (and "Lanzar conjuro" turns kit blue). Nothing else is yellow.
Text on kit blue is ink (4.4:1; parchment would be 2.8:1). Ink on kit yellow is 7.3:1.
Keyboard focus: parchment ring on ink (no yellow).

Stage terrain: Easy `Tilemap_color1/2`, Medium `Tilemap_color4`, Hard `Tilemap_color5`. Stage name
ribbons: blue, purple, red. Locked regions are desaturated and covered by clouds.

## Type

- **Jersey 10** for everything, logo included (decided). No faux bold or italic.
- **JetBrains Mono** only for SQL: editor, results, table/column chips, identifiers inside messages
  (e.g. "no column called `archer`" shows `archer` as a code chip, not in quotes).
- Jersey 10 draws « » as two separate chevrons that read like "<<". The two guillemet glyphs are taken
  from JetBrains Mono via `unicode-range` (needed for ES and FR).

## Code ink

Editor: keywords `#2e5f8a`, text values `#9b3b2e`, numbers `#4f7a28`, the level's own tables and columns
`#7a3d78` (tables also dotted-underlined). Keywords come from the real SQLite list, never from a generic SQL
list (CodeMirror's default marked `role` as a keyword).

## Components

- Panels: TS-2 parchment and wood table as 9-slice `border-image` at 1×.
- Map nodes: **standards** made from TS-2 small ribbons (body + forked tail, rotated) on a wooden pole.
  Done: kit blue + tick. Current: kit blue, raised, parchment outline, Pip standing at its foot.
  Locked: slate (black ribbon) + padlock.
- Buttons: CSS pixel buttons (ink outline, top highlight, bottom shade). The TS-2 button images only
  stay crisp at large sizes.
- Hint button: always visible next to "Lanzar conjuro", with a counter of the hints **left**
  (`2/3`; disabled at `0/3`). Revealed hints appear on the story page, below the task.
- "Borrar" (clear) sits on the spell heading row, so it never covers the code.
- Always visible: back button (top left), `ES · EN · FR` plank, music and sound buttons (top right).

## Responsive

Desktop: two pages side by side. Phone (≤ 760 px): one column, no wood frame, level title at the bottom
of the diorama, and a sticky bar with the primary action and the hint button.
On touch devices (`pointer: coarse` or no hover) the editor never takes the focus by itself, so the
on-screen keyboard only opens when the player taps it: a level opens on the story, and "Turn the
page", "Clear" and replaying a level leave the keyboard closed. On desktop the editor is focused.

## Screenshots

| Folder | Shows |
|---|---|
| `screens/` | Title screen, map, level (error, success, French), epilogue and reset dialog, on desktop and phone |
| `reactions/` | Recordings of eight level reactions (GIF) |

## Phase 5: living dioramas

Every level has its own scene in the strip above the Registry, and the world **reacts when the spell is
right** (`src/ui/reactions.ts`, tested in `src/ui/reactions.test.ts`). Recordings: `reactions/*.gif`.

| Level | Reaction |
|---|---|
| Easy 1 | The villagers gather in the square. |
| Easy 2 | The four archers climb the four towers. |
| Easy 3 | Woodcutters walk to the trees and miners to the rock, and start working. |
| Easy 4 | The lost sheep are spotted by Riverwatch, at the water's edge. |
| Easy 5 | The burnt houses are rebuilt (the looted royal storehouse stays a ruin). |
| Medium 1 | Gold, wood and meat are piled in front of the castle. |
| Medium 2 | Each village shows what it holds. |
| Medium 3 | Soldiers march to the three villages that can feed them. |
| Medium 4 | The fake merchants vanish; the guards move to the storehouse. |
| Medium 5 | Sir Garrick is found at the foot of the unguarded tower. |
| Hard 1 | Every goblin's loot comes to light. |
| Hard 2 | The recovered goods are carried home; the royal gold is not among them. |
| Hard 3 | Kragg and Gorb are caught; Grubnak runs for it. |
| Hard 4 | Skull Rock's TNT goes off and Grubnak is caught. |
| Hard 5 | Corvin is arrested; the royal gold appears beside him. |

Sprites are animated strips (idles, work, runs, celebrations, fire, foam, trees). After a reaction,
characters celebrate with their action animation. With *reduce motion*, the end state is shown without
animation. On phones, scenes skip items marked `wide` and the edge trees, and the strip is 190 px tall.

The **epilogue** (`#/epilogue`, after the last level) shows the castle court and closes the story:
the gold in Corvin's coffers, the sheep in his garden, Lady Maud cleared, the Registry restored; then
the credits. Screens: `screens/epilogue-*.png`, `screens/reset-dialog-desktop.png`.

## Phase 6: controls bar and sound

- **Controls bar:** back, music and sound use the square Tiny Swords button (`TinySquareBlueButton`),
  shown at its native size (64 px; 52 px on phones). Icons: the kit's orange arrow and music note, and
  the TS-1 speaker recoloured with the note's cream (the TS-2 kit has no speaker). A red X marks what is
  switched off.
- **Sound:** the speaker silences everything; the note turns the music off or on (it is dimmed while
  everything is silenced). Sources and how the files were made: `public/assets/CREDITS.md`.
- **Hints:** whole queries are shown one clause per line (see `src/ui/sql-layout.ts`).
- **Star it on GitHub:** a pixel star (drawn like the padlock, as the kit has none) with a short link,
  in three quiet places: the title-screen footer ("GitHub" only on phones, to keep the footer below
  the island), a one-time line above "Turn the page" about 2 s after solving Easy 3 (after the
  diorama's reaction; no pop-up; shown once ever, stored in `kor.star.v1`) and the epilogue credits.
- **Start-over dialog:** centred over a darker backdrop. "Keep my progress" (kit wood, focused by
  default) and "Erase my progress" (kit red) have the same size, side by side on desktop and stacked
  at full width on phones.
- **Music level:** 0.11 (55% of the first level, 0.2); effects unchanged.
