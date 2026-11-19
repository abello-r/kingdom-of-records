"""Copies the art the game uses from the original packs into public/assets, with clean names.

The original packs are read-only and never modified. Some images are recomposed so the browser can use
them directly (9-slice panels whose cells are separated by gaps in the packs, single animation frames,
portraits cropped to their content). Usage, from the project root (requires Pillow):

    python scripts/build_assets.py

Run it again whenever this list changes; the output is committed.
"""
import os
import shutil
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'public', 'assets')
TS2 = os.path.join(ROOT, 'Tiny Swords (Free Pack)')
TS1 = os.path.join(ROOT, 'Tiny Swords (Update 010)')
SPE = os.path.join(ROOT, 'Super Pixel Effects Gigapack (Free Version)', 'spritesheet')
UI = os.path.join(TS2, 'UI Elements', 'UI Elements')
UNITS = os.path.join(TS2, 'Units')
RES = os.path.join(TS2, 'Terrain', 'Resources')
DECO = os.path.join(TS2, 'Terrain', 'Decorations')

GENERATED_DIRS = ['ui', 'terrain', 'buildings', 'props', 'units', 'portraits', 'fx']


def load(*parts):
    return Image.open(os.path.join(*parts)).convert('RGBA')


def save(img, rel):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)


def frame(img, w, h, i=0):
    return img.crop((i * w, 0, i * w + w, h))


def joined(src, xs, ys):
    """Joins the separated slice cells of a Tiny Swords panel into one contiguous image."""
    dst = Image.new('RGBA', (sum(b - a for a, b in xs), sum(b - a for a, b in ys)))
    y0 = 0
    for ya, yb in ys:
        x0 = 0
        for xa, xb in xs:
            dst.paste(src.crop((xa, ya, xb, yb)), (x0, y0))
            x0 += xb - xa
        y0 += yb - ya
    return dst


def cropped(img):
    return img.crop(img.getbbox())


def square_crop(img):
    bb = img.getbbox()
    side = max(bb[2] - bb[0], bb[3] - bb[1])
    cx, cy = (bb[0] + bb[2]) // 2, (bb[1] + bb[3]) // 2
    return img.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2))


def spe(category, name, idx):
    base = os.path.join(SPE, category, name)
    sheet = load(base, 'spritesheet.png')
    rects = [line.split('=')[1].split() for line in open(os.path.join(base, 'spritesheet.txt')) if '=' in line]
    x, y, w, h = map(int, rects[idx])
    return sheet.crop((x, y, x + w, y + h))


def main():
    for d in GENERATED_DIRS:
        shutil.rmtree(os.path.join(OUT, d), ignore_errors=True)

    # --- UI (TS-2) ---
    s64 = [(0, 64), (128, 192), (256, 320)]
    s128 = [(0, 128), (192, 256), (320, 448)]
    save(joined(load(UI, 'Papers', 'RegularPaper.png'), s64, s64), 'ui/paper.png')
    save(joined(load(UI, 'Wood Table', 'WoodTable.png'), s128, s128), 'ui/wood.png')
    big, small = load(UI, 'Ribbons', 'BigRibbons.png'), load(UI, 'Ribbons', 'SmallRibbons.png')
    for i, colour in enumerate(['blue', 'red', 'yellow', 'purple', 'black']):
        save(joined(big, s128, [(i * 128, i * 128 + 128)]), f'ui/ribbon-{colour}.png')
        rib = joined(small, s64, [(i * 128, i * 128 + 64)])
        save(rib, f'ui/ribbon-small-{colour}.png')
        if colour in ('blue', 'black'):
            # Map node: the small ribbon's body and forked tail, rotated into a hanging standard.
            body = rib.crop((64, 0, 128, 64)).rotate(-90, expand=True)
            tail = rib.crop((128, 0, 192, 64)).rotate(-90, expand=True)
            flag = Image.new('RGBA', (64, 128))
            flag.paste(body, (0, 0))
            flag.paste(tail, (0, 64), tail)
            save(cropped(flag), f'ui/standard-{colour}.png')
    save(load(UI, 'Buttons', 'SmallBlueRoundButton_Regular.png'), 'ui/button-round.png')
    save(load(UI, 'Buttons', 'SmallBlueRoundButton_Pressed.png'), 'ui/button-round-pressed.png')
    for n, name in [(5, 'task'), (8, 'back'), (9, 'error')]:
        save(load(UI, 'Icons', f'Icon_{n:02d}.png'), f'ui/icon-{name}.png')

    # --- Portraits (TS-2 avatars; the goblin chief is cropped from the TS-1 torch goblin) ---
    for n, who in [(1, 'aldric'), (4, 'pip'), (6, 'garrick'), (10, 'corvin')]:
        save(square_crop(load(UI, 'Human Avatars', f'Avatars_{n:02d}.png')), f'portraits/{who}.png')
    torch = load(TS1, 'Factions', 'Goblins', 'Troops', 'Torch', 'Red', 'Torch_Red.png')
    save(cropped(torch.crop((40, 40, 140, 140))), 'portraits/grubnak.png')

    # --- Terrain ---
    for pal, name in [(1, 'spring'), (2, 'meadow'), (4, 'autumn'), (5, 'dusk')]:
        save(load(TS2, 'Terrain', 'Tileset', f'Tilemap_color{pal}.png').crop((0, 0, 192, 192)), f'terrain/island-{name}.png')
    save(load(TS2, 'Terrain', 'Tileset', 'Water Foam.png').crop((0, 0, 192, 192)), 'terrain/foam.png')

    # --- Buildings ---
    for b in ['House1', 'House2', 'House3', 'Tower', 'Castle', 'Barracks', 'Archery', 'Monastery']:
        save(load(TS2, 'Buildings', 'Blue Buildings', f'{b}.png'), f'buildings/{b.lower().replace("house", "house-")}.png')
    save(load(TS2, 'Buildings', 'Red Buildings', 'Castle.png'), 'buildings/castle-red.png')
    save(load(TS1, 'Factions', 'Knights', 'Buildings', 'House', 'House_Destroyed.png'), 'buildings/house-ruin.png')
    save(load(TS1, 'Factions', 'Goblins', 'Buildings', 'Wood_House', 'Goblin_House.png'), 'buildings/goblin-house.png')
    save(frame(load(TS1, 'Factions', 'Goblins', 'Buildings', 'Wood_Tower', 'Wood_Tower_Red.png'), 256, 192), 'buildings/goblin-tower.png')

    # --- Props ---
    for i in (1, 2):
        save(frame(load(RES, 'Wood', 'Trees', f'Tree{i}.png'), 192, 256), f'props/tree-{i}.png')
    for i in (3, 4):
        save(frame(load(RES, 'Wood', 'Trees', f'Tree{i}.png'), 192, 192), f'props/tree-{i}.png')
    for i in (1, 2, 3, 4):
        save(frame(load(DECO, 'Bushes', f'Bushe{i}.png'), 128, 128), f'props/bush-{i}.png')
        save(load(DECO, 'Rocks', f'Rock{i}.png'), f'props/rock-{i}.png')
    for i in (1, 2, 3, 5):
        save(load(DECO, 'Clouds', f'Clouds_{i:02d}.png'), f'props/cloud-{i}.png')
    save(load(RES, 'Gold', 'Gold Stones', 'Gold Stone 4.png'), 'props/gold-stone.png')
    save(frame(load(DECO, 'Rocks in the Water', 'Water Rocks_01.png'), 64, 64), 'props/water-rock.png')
    save(frame(load(DECO, 'Rubber Duck', 'Rubber duck.png'), 32, 32), 'props/duck.png')

    # --- Units (single frames; animations arrive in Phase 5) ---
    for colour in ['Blue', 'Red', 'Black']:
        c = colour.lower()
        save(frame(load(UNITS, f'{colour} Units', 'Pawn', 'Pawn_Idle.png'), 192, 192), f'units/pawn-{c}.png')
        save(frame(load(UNITS, f'{colour} Units', 'Warrior', 'Warrior_Idle.png'), 192, 192), f'units/warrior-{c}.png')
        save(frame(load(UNITS, f'{colour} Units', 'Archer', 'Archer_Idle.png'), 192, 192), f'units/archer-{c}.png')
    save(frame(load(UNITS, 'Blue Units', 'Monk', 'Idle.png'), 192, 192), 'units/monk-blue.png')
    save(frame(load(UNITS, 'Blue Units', 'Pawn', 'Pawn_Run.png'), 192, 192, 2), 'units/pawn-blue-cheer.png')
    save(frame(load(UNITS, 'Blue Units', 'Warrior', 'Warrior_Attack1.png'), 192, 192, 1), 'units/warrior-blue-cheer.png')
    save(frame(load(UNITS, 'Blue Units', 'Archer', 'Archer_Shoot.png'), 192, 192, 1), 'units/archer-blue-cheer.png')
    save(frame(load(RES, 'Meat', 'Sheep', 'Sheep_Idle.png'), 128, 128), 'units/sheep.png')
    save(frame(load(RES, 'Meat', 'Sheep', 'Sheep_Grass.png'), 128, 128, 3), 'units/sheep-grazing.png')
    save(frame(load(RES, 'Meat', 'Sheep', 'Sheep_Move.png'), 128, 128, 1), 'units/sheep-cheer.png')
    save(torch.crop((0, 0, 192, 192)), 'units/goblin-torch.png')
    save(load(TS1, 'Factions', 'Goblins', 'Troops', 'TNT', 'Red', 'TNT_Red.png').crop((0, 0, 192, 192)), 'units/goblin-tnt.png')

    # --- Effects (TS fire and dust in the world; SPE only for short UI feedback) ---
    save(frame(load(TS1, 'Effects', 'Fire', 'Fire.png'), 128, 128, 2), 'fx/fire.png')
    save(frame(load(TS2, 'Particle FX', 'Dust_01.png'), 64, 64, 2), 'fx/dust.png')
    save(spe('Symbols', 'symbol_success_001/symbol_success_001_large_green', 40), 'fx/success.png')
    save(spe('Symbols', 'symbol_lightbulb_001/symbol_lightbulb_001_large_yellow', 6), 'fx/hint.png')
    save(spe('Magic Bursts', 'round_sparkle_burst_001/round_sparkle_burst_001_large_blue', 5), 'fx/sparkle.png')
    save(spe('Fantasy Spells', 'status_sparkling_001/status_sparkling_001_large_yellow', 8), 'fx/twinkle.png')

    count = sum(len(files) for d in GENERATED_DIRS for _, _, files in os.walk(os.path.join(OUT, d)))
    size = sum(os.path.getsize(os.path.join(p, f)) for d in GENERATED_DIRS for p, _, fs in os.walk(os.path.join(OUT, d)) for f in fs)
    print(f'{count} files, {size // 1024} KB in public/assets')


if __name__ == '__main__':
    sys.exit(main())
