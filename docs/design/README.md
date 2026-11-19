# Design — The Kingdom of Records

Status: **Phase 4 mock-ups, pending validation.** Screenshots in [`mockups/`](mockups/). They are
static compositions built with the real Tiny Swords / SPE art; no game code yet.

## Idea

The level screen **is the Great Registry, open on a wooden lectern**. Left page: the story and the
task. Right page: the player's spell (the SQL editor) and the Registry's answer. Above the book, a
live diorama of the current region, built tile by tile from Tiny Swords, reacts to the answers
(e.g. archers appear on the towers when the player finds them). That is the one bold element;
everything else stays quiet.

No pop-ups: when an answer is right, the story continues on the left page (the new line is outlined
in gold) and a "Turn the page" button appears. Errors are written on the spell page, in the
Registry's voice, with a tip when one applies.

## Tokens

| Name | Hex | Use |
|---|---|---|
| Sea | `#47aba9` | World background (taken from TS-2 `Water Background color`) |
| Parchment | `#eee1c6` | Pages, light surfaces (TS-2 paper) |
| Ink | `#1d2334` | Text, outlines, focus ring backing |
| Royal blue | `#2e5f8a` | Primary action ("Cast spell"), Blue Kingdom |
| Gold | `#f2c14e` | Rewards, completed levels, focus ring, "next" action |
| Ember | `#b9483f` | Errors (light tint `#f3d6cf` for the error note) |
| Wood dark | `#4d2d22` | Language plank, mobile dock |

Code ink (editor and results only): keywords `#2e5f8a`, text values `#9b3b2e`, numbers `#4f7a28`.

Stage terrain: Easy `Tilemap_color1/2` (spring green), Medium `Tilemap_color4` (autumn olive),
Hard `Tilemap_color5` (dusk teal). Locked regions are desaturated and covered by clouds.

## Type

- **Jersey 10** for everything (logo included). Sizes: 22 / 24 (body) / 28 / 34 (page heads) /
  140 (logo). No faux bold or italic.
- **JetBrains Mono** only for SQL: editor, results tables, table/column chips, inline code.
- Press Start 2P was tried for the logo (`mockups/home-press.png`): it reads as 8-bit arcade and
  clashes with the soft, chunky Tiny Swords line. Recommendation: Jersey 10 (`mockups/home-jersey.png`).

## Components

- Panels: TS-2 parchment and wood table as 9-slice `border-image` at 1× (slices rebuilt into
  contiguous images, since the originals have gaps between cells).
- Titles: TS-2 ribbons (big on the home screen, small in the level header and on the map).
- Buttons: CSS pixel buttons in the palette (ink outline, top highlight, bottom shade, pressed state
  by moving down). The TS-2 button images only stay crisp at large sizes.
- Map: one island per stage; levels are numbered tokens on a dotted route (numbering is meaningful:
  the levels are a sequence). States: done (gold + tick), current (blue + gold ring), locked (grey +
  padlock).
- Always visible: back button (top left), `ES · EN · FR` plank and mute button (top right).

## Responsive and accessibility

- Desktop: two pages side by side. Phone (≤ 760 px): one column, no wood frame, the level title
  moves to the bottom of the diorama, and a fixed dock at the bottom holds "Cast spell" and "Hint".
- Text contrast ≥ 4.5:1 on parchment; focus ring gold on ink; all actions are real buttons;
  diorama is decorative (`aria-hidden`); motion limited to the reacting diorama and respects
  `prefers-reduced-motion`.

## Screens

| File | Shows |
|---|---|
| `home-jersey.png` / `home-press.png` | Title screen, returning player, logo comparison |
| `map.png` | Kingdom map: Easy done, Medium in progress (level 3 selected), Hard locked |
| `level-error.png` | Level, SQL error with tip (`role = archer` without quotes) |
| `level-success.png` | Same level solved with `"archer"`: result, soft double-quote notice, story continues, archers on the towers |
| `level-mobile.png` / `level-mobile-full.png` | Phone, first screen and full page (the dock is fixed at the bottom on a real phone) |
