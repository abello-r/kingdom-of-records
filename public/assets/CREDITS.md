# Credits and licences

All third-party assets used by **The Kingdom of Records**, where they come from and under which terms.
Original packs are kept unmodified outside this folder; only cleaned copies are placed in `public/assets/`.

## How the files here are made

`scripts/build_assets.py` copies the images the game uses from the original packs, with clean names.
Some are recomposed so the browser can use them directly: 9-slice panels joined into contiguous images,
single animation frames, portraits cropped to their content, and map standards built from the small
ribbons. The original packs are never modified.

## Pixel art

### Tiny Swords — Pixel Frog

- Source: https://pixelfrog-assets.itch.io/tiny-swords
- Versions used: *Tiny Swords (Free Pack)* (main art) and *Tiny Swords (Update 010)* (goblins,
  destroyed / construction buildings, gold mine, decorations).
- Terms (confirmed by the project owner; the packs ship without a licence file):
  - Personal and commercial use allowed.
  - Modification allowed.
  - Credit optional — given here anyway.
  - The author confirms older versions of the pack may also be used.
  - Use of the assets to train AI is not allowed.

### Super Pixel Effects Gigapack (Free Version) — Will Tice / unTied Games

- Source: https://untiedgames.itch.io/super-pixel-effects-gigapack
- Licence: http://untiedgames.com/files/license.txt — summary shipped with the pack in
  [`licenses/SuperPixelEffects-license.txt`](licenses/SuperPixelEffects-license.txt).
- Key terms: use in games (commercial or not) allowed; attribution required
  (**"Super Pixel Effects Gigapack — Will Tice / unTied Games"**); the files must not be redistributed
  on their own (only bundled with the game); use as AI training material is forbidden.

## Fonts

Both fonts are bundled locally with the game (no CDN), from the `@fontsource` npm packages.

| Font | Use | Authors | Licence |
|---|---|---|---|
| Jersey 10 | Interface and story text | The Soft Type Project Authors (https://github.com/scfried/soft-type-jersey) | SIL Open Font License 1.1 — [`licenses/Jersey10-OFL.txt`](licenses/Jersey10-OFL.txt) |
| JetBrains Mono | SQL editor and results | The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL Open Font License 1.1 — [`licenses/JetBrainsMono-OFL.txt`](licenses/JetBrainsMono-OFL.txt) |

## Audio

Every sound and the music are **CC0 1.0 (public domain)**: credit is not required, but it is given here
and in the game's credits. Kenney's licence file:
[`licenses/Kenney-CC0-license.txt`](licenses/Kenney-CC0-license.txt); for the OpenGameArt works the licence
is stated on each page linked below (checked on 2026-11-20).

How the files were made from the originals: silence at the start and end trimmed, effects levelled to
the same peak (−3 dBFS) and the music to a quiet, even loudness, then exported as Ogg Vorbis and as MP3
(the backup for browsers that cannot play Ogg). The music loop is not trimmed, so it loops seamlessly.

### Music

| File | Used for | Work | Author | Source |
|---|---|---|---|---|
| `music/old-tower-inn.ogg` / `.mp3` | Background music, whole game (loop) | *Medieval: The Old Tower Inn* (loop version, `Loop_The_Old_Tower_Inn.wav`) | RandomMind | https://opengameart.org/content/medieval-the-old-tower-inn |

### Sound effects

| File (`.ogg` / `.mp3`) | Used for | Original file | Author — work | Source |
|---|---|---|---|---|
| `sounds/click` | Buttons and links | `impactWood_light_002.ogg` | Kenney — Impact Sounds | https://kenney.nl/assets/impact-sounds |
| `sounds/page` | "Turn the page" (next level) | `book_flip.6.ogg` | StarNinjas — 10 Book Page Flips | https://opengameart.org/content/10-book-page-flips |
| `sounds/success` | Correct answer | `health_restore.wav` (faded out) | Spring Spring — Magic Words + Healing Sound Effect | https://opengameart.org/content/magic-words-healing-sound-effect |
| `sounds/error` | Wrong answer or SQL error | `impactSoft_medium_001.ogg` | Kenney — Impact Sounds | https://kenney.nl/assets/impact-sounds |
| `sounds/hint` | A hint is revealed | `bell_ding3.wav` (faded out) | PWL — Bell dings/chimes | https://opengameart.org/content/bell-dingschimes |
| `sounds/react` | The diorama reacts | `impactBell_heavy_004.ogg` | Kenney — Impact Sounds | https://kenney.nl/assets/impact-sounds |
| `sounds/explosion` | TNT explosion (Hard 4) | `explosion.wav` | TinyWorlds — Explosion | https://opengameart.org/content/explosion-0 |
