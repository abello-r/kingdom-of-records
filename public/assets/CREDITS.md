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

None yet.
