"""Copies the art the game uses from the original packs into public/assets, with clean names.

The original packs are read-only and never modified. Some images are recomposed so the browser can use
them directly (9-slice panels whose cells are separated by gaps in the packs, single animation frames,
portraits cropped to their content). Usage, from the project root (requires Pillow):

    python scripts/build_assets.py

Run it again whenever this list changes; the output is committed.
"""
import json
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

GENERATED_DIRS = ['ui', 'terrain', 'buildings', 'props', 'units', 'portraits', 'fx', 'icons']


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



# Controls bar (back, music, sound): the TS-2 tiny square button with TS-2 icons. The kit has no speaker
# in the TS-2 style, so the TS-1 carved speaker is recoloured with the cream of the TS-2 music note.
INK = (22, 28, 46, 255)
CREAM, CREAM_SHADE = (239, 225, 171, 255), (200, 168, 118, 255)


def carved_to_cream(img):
    """TS-1 carved icon (ink outline + two translucent greys) -> opaque ink + two creams."""
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    src, dst = img.load(), out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = src[x, y]
            if a == 0:
                continue
            dst[x, y] = INK if a == 255 else CREAM if (r, g, b) == (0x76, 0x7a, 0x85) else CREAM_SHADE
    return out


def scaled(img, k, smooth=False):
    return img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS if smooth else Image.NEAREST)


def with_badge(icon, badge):
    """Icon with a red X on its lower right (switched off)."""
    out = Image.new('RGBA', (icon.width + badge.width // 3, icon.height + badge.height // 3))
    out.alpha_composite(icon, (0, 0))
    out.alpha_composite(badge, (out.width - badge.width, out.height - badge.height))
    return out


def site_icons():
    """Favicons and the home-screen icon: the TS-2 shield icon (heraldic, in the game's blue and cream)."""
    shield = cropped(load(UI, 'Icons', 'Icon_06.png'))
    side = max(shield.size) + 4
    square = Image.new('RGBA', (side, side))
    square.alpha_composite(shield, ((side - shield.width) // 2, (side - shield.height) // 2))
    for size in (16, 32):
        save(square.resize((size, size), Image.LANCZOS), f'icons/favicon-{size}.png')
    # Home-screen icon (iOS/Android): opaque, the shield at 2x on the sea colour, with room for rounded corners.
    touch = Image.new('RGBA', (180, 180), (0x47, 0xab, 0xa9, 255))
    big = scaled(square, 2)
    touch.alpha_composite(big, ((180 - big.width) // 2, (180 - big.height) // 2))
    save(touch, 'icons/apple-touch-icon.png')


def control_buttons():
    """128x128 images shown at 64 px (the button itself at its native size), regular and pressed."""
    button = scaled(load(UI, 'Buttons', 'TinySquareBlueButton.png'), 2)
    # The tiny button has no pressed image in the kit: a slightly darker copy stands in.
    pressed = Image.eval(button.convert('RGB'), lambda v: int(v * .85)).convert('RGBA')
    pressed.putalpha(button.getchannel('A'))
    speaker = carved_to_cream(load(TS1, 'UI', 'Icons', 'Regular_03.png').crop((14, 8, 50, 42)))
    badge = scaled(load(UI, 'Icons', 'Icon_09.png'), 0.5, smooth=True)
    note = load(UI, 'Icons', 'Icon_12.png')
    icons = {
        'back': scaled(load(UI, 'Icons', 'Icon_08.png'), 0.95),
        'music': scaled(note, 0.9),
        'music-off': with_badge(scaled(note, 0.8), badge),
        'sound': scaled(speaker, 2),
        'sound-off': with_badge(scaled(speaker.crop((0, 0, 24, speaker.height)), 2), badge),
        # No icon: the Ko-fi button draws its cup on top (the kit has no cup).
        'blank': Image.new('RGBA', (1, 1)),
    }
    for name, icon in icons.items():
        for state, base, dy in (('', button, 0), ('-pressed', pressed, 4)):
            img = base.copy()
            img.alpha_composite(icon, (round(64 - icon.width / 2), round(62 + dy - icon.height / 2)))
            save(img, f'ui/btn-{name}{state}.png')


def main():
    for d in GENERATED_DIRS:
        shutil.rmtree(os.path.join(OUT, d), ignore_errors=True)

    # --- UI (TS-2) ---
    s64 = [(0, 64), (128, 192), (256, 320)]
    s128 = [(0, 128), (192, 256), (320, 448)]
    save(joined(load(UI, 'Papers', 'RegularPaper.png'), s64, s64), 'ui/paper.png')
    # Ko-fi sign on the title screen: the TS-2 scroll banner and the TS-1 wooden signpost.
    save(joined(load(UI, 'Banners', 'Banner.png'), s128, s128), 'ui/scroll.png')
    save(cropped(load(TS1, 'Deco', '17.png')), 'ui/signpost.png')
    save(joined(load(UI, 'Wood Table', 'WoodTable.png'), s128, s128), 'ui/wood.png')
    big, small = load(UI, 'Ribbons', 'BigRibbons.png'), load(UI, 'Ribbons', 'SmallRibbons.png')
    for i, colour in enumerate(['blue', 'red', 'yellow', 'purple', 'black']):
        # Used: the big blue ribbon (title screen), small ribbons for the stages, standards for the map.
        if colour == 'blue':
            save(joined(big, s128, [(i * 128, i * 128 + 128)]), f'ui/ribbon-{colour}.png')
        rib = joined(small, s64, [(i * 128, i * 128 + 64)])
        if colour in ('blue', 'red', 'purple'):
            save(rib, f'ui/ribbon-small-{colour}.png')
        if colour in ('blue', 'black'):
            # Map node: the small ribbon's body and forked tail, rotated into a hanging standard.
            body = rib.crop((64, 0, 128, 64)).rotate(-90, expand=True)
            tail = rib.crop((128, 0, 192, 64)).rotate(-90, expand=True)
            flag = Image.new('RGBA', (64, 128))
            flag.paste(body, (0, 0))
            flag.paste(tail, (0, 64), tail)
            save(cropped(flag), f'ui/standard-{colour}.png')
    control_buttons()
    site_icons()
    for n, name in [(5, 'task'), (9, 'error')]:
        save(load(UI, 'Icons', f'Icon_{n:02d}.png'), f'ui/icon-{name}.png')

    # --- Portraits (TS-2 avatars; the goblin chief is cropped from the TS-1 torch goblin) ---
    for n, who in [(1, 'aldric'), (4, 'pip'), (6, 'garrick'), (10, 'corvin')]:
        save(square_crop(load(UI, 'Human Avatars', f'Avatars_{n:02d}.png')), f'portraits/{who}.png')
    torch = load(TS1, 'Factions', 'Goblins', 'Troops', 'Torch', 'Red', 'Torch_Red.png')
    save(cropped(torch.crop((40, 40, 140, 140))), 'portraits/grubnak.png')

    # --- World sprites: every image placed in a diorama is registered in the sprite manifest ---
    manifest = {}

    def sprite(img, name, w, h, frames=1, row=0, fps=10):
        """Saves a horizontal strip of `frames` cells of w x h (from `row` of a grid) and records it."""
        strip = Image.new('RGBA', (w * frames, h))
        for i in range(frames):
            strip.paste(img.crop((i * w, row * h, i * w + w, row * h + h)), (i * w, 0))
        save(strip, f'{name}.png')
        manifest[name] = {'w': w, 'h': h, 'frames': frames, 'fps': fps}

    def still(img, name):
        sprite(img, name, img.width, img.height)

    # --- Terrain (tiles are used by CSS, the foam is an animated strip) ---
    for pal, name in [(1, 'spring'), (2, 'meadow'), (4, 'autumn'), (5, 'dusk')]:
        save(load(TS2, 'Terrain', 'Tileset', f'Tilemap_color{pal}.png').crop((0, 0, 192, 192)), f'terrain/island-{name}.png')
    save(load(TS2, 'Terrain', 'Tileset', 'Water Foam.png'), 'terrain/foam.png')

    # --- Buildings ---
    for b in ['House1', 'House2', 'House3', 'Tower', 'Castle', 'Barracks', 'Archery']:
        still(load(TS2, 'Buildings', 'Blue Buildings', f'{b}.png'), f'buildings/{b.lower().replace("house", "house-")}')
    still(load(TS1, 'Factions', 'Knights', 'Buildings', 'House', 'House_Destroyed.png'), 'buildings/house-ruin')
    still(load(TS1, 'Factions', 'Goblins', 'Buildings', 'Wood_House', 'Goblin_House.png'), 'buildings/goblin-house')
    sprite(load(TS1, 'Factions', 'Goblins', 'Buildings', 'Wood_Tower', 'Wood_Tower_Red.png'), 'buildings/goblin-tower', 256, 192, 4, fps=6)

    # --- Props ---
    for i in (1, 2):
        sprite(load(RES, 'Wood', 'Trees', f'Tree{i}.png'), f'props/tree-{i}', 192, 256, 8, fps=6)
    for i in (3, 4):
        sprite(load(RES, 'Wood', 'Trees', f'Tree{i}.png'), f'props/tree-{i}', 192, 192, 8, fps=6)
    for i in (1, 2):
        sprite(load(DECO, 'Bushes', f'Bushe{i}.png'), f'props/bush-{i}', 128, 128, 8, fps=6)
    still(load(DECO, 'Rocks', 'Rock2.png'), 'props/rock-2')
    for i in (1, 2, 3, 5):
        save(load(DECO, 'Clouds', f'Clouds_{i:02d}.png'), f'props/cloud-{i}.png')
    still(load(RES, 'Gold', 'Gold Stones', 'Gold Stone 4.png'), 'props/gold-stone')
    still(load(RES, 'Gold', 'Gold Resource', 'Gold_Resource.png'), 'props/gold-pile')
    still(load(RES, 'Wood', 'Wood Resource', 'Wood Resource.png'), 'props/wood-pile')
    still(load(RES, 'Meat', 'Meat Resource', 'Meat Resource.png'), 'props/meat')
    sprite(load(DECO, 'Rocks in the Water', 'Water Rocks_01.png'), 'props/water-rock', 64, 64, 16, fps=8)
    sprite(load(DECO, 'Rubber Duck', 'Rubber duck.png'), 'props/duck', 32, 32, 3, fps=4)

    # --- Units: idle strips plus the actions used by reactions and celebrations ---
    pawn = os.path.join(UNITS, 'Blue Units', 'Pawn')
    for file, name, frames in [('Pawn_Idle.png', 'pawn-blue', 8), ('Pawn_Run.png', 'pawn-blue-run', 6),
                               ('Pawn_Interact Axe.png', 'pawn-blue-axe', 6), ('Pawn_Interact Pickaxe.png', 'pawn-blue-pickaxe', 6),
                               ('Pawn_Interact Hammer.png', 'pawn-blue-hammer', 3), ('Pawn_Idle Wood.png', 'pawn-blue-wood', 8),
                               ('Pawn_Idle Gold.png', 'pawn-blue-gold', 8), ('Pawn_Idle Meat.png', 'pawn-blue-meat', 8),
                               ('Pawn_Run Wood.png', 'pawn-blue-run-wood', 6), ('Pawn_Run Meat.png', 'pawn-blue-run-meat', 6)]:
        sprite(load(pawn, file), f'units/{name}', 192, 192, frames)
    for colour in ['Blue', 'Red']:
        c = colour.lower()
        sprite(load(UNITS, f'{colour} Units', 'Warrior', 'Warrior_Idle.png'), f'units/warrior-{c}', 192, 192, 8)
        sprite(load(UNITS, f'{colour} Units', 'Monk', 'Idle.png'), f'units/monk-{c}', 192, 192, 6)
    sprite(load(UNITS, 'Blue Units', 'Warrior', 'Warrior_Run.png'), 'units/warrior-blue-run', 192, 192, 6)
    sprite(load(UNITS, 'Blue Units', 'Warrior', 'Warrior_Attack1.png'), 'units/warrior-blue-attack', 192, 192, 4)
    sprite(load(UNITS, 'Blue Units', 'Archer', 'Archer_Idle.png'), 'units/archer-blue', 192, 192, 6)
    sprite(load(UNITS, 'Blue Units', 'Archer', 'Archer_Shoot.png'), 'units/archer-blue-shoot', 192, 192, 8, fps=12)
    sprite(load(UNITS, 'Blue Units', 'Monk', 'Heal.png'), 'units/monk-blue-heal', 192, 192, 11)
    # Lady Maud wears purple so she stands apart from the Blue monks (epilogue, Hard 5).
    sprite(load(UNITS, 'Purple Units', 'Monk', 'Idle.png'), 'units/monk-purple', 192, 192, 6)
    sprite(load(UNITS, 'Purple Units', 'Monk', 'Heal.png'), 'units/monk-purple-heal', 192, 192, 11)
    sheep = os.path.join(RES, 'Meat', 'Sheep')
    sprite(load(sheep, 'Sheep_Idle.png'), 'units/sheep', 128, 128, 6, fps=8)
    sprite(load(sheep, 'Sheep_Grass.png'), 'units/sheep-grazing', 128, 128, 12, fps=8)
    sprite(load(sheep, 'Sheep_Move.png'), 'units/sheep-move', 128, 128, 4)
    tnt = load(TS1, 'Factions', 'Goblins', 'Troops', 'TNT', 'Red', 'TNT_Red.png')
    sprite(torch, 'units/goblin-torch', 192, 192, 7)
    sprite(torch, 'units/goblin-torch-run', 192, 192, 6, row=1)
    sprite(tnt, 'units/goblin-tnt', 192, 192, 6)

    # --- Effects (TS fire, dust and explosion in the world; SPE only for short UI feedback) ---
    sprite(load(TS1, 'Effects', 'Fire', 'Fire.png'), 'fx/fire', 128, 128, 7)
    sprite(load(TS2, 'Particle FX', 'Dust_01.png'), 'fx/dust', 64, 64, 8, fps=14)
    sprite(load(TS2, 'Particle FX', 'Explosion_01.png'), 'fx/explosion', 192, 192, 8, fps=12)
    save(spe('Symbols', 'symbol_success_001/symbol_success_001_large_green', 40), 'fx/success.png')
    save(spe('Symbols', 'symbol_lightbulb_001/symbol_lightbulb_001_large_yellow', 6), 'fx/hint.png')
    save(spe('Magic Bursts', 'round_sparkle_burst_001/round_sparkle_burst_001_large_blue', 5), 'fx/sparkle.png')
    save(spe('Fantasy Spells', 'status_sparkling_001/status_sparkling_001_large_yellow', 8), 'fx/twinkle.png')

    with open(os.path.join(ROOT, 'src', 'ui', 'sprite-manifest.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(dict(sorted(manifest.items())), f, indent=2)
        f.write('\n')

    count = sum(len(files) for d in GENERATED_DIRS for _, _, files in os.walk(os.path.join(OUT, d)))
    size = sum(os.path.getsize(os.path.join(p, f)) for d in GENERATED_DIRS for p, _, fs in os.walk(os.path.join(OUT, d)) for f in fs)
    print(f'{count} files, {size // 1024} KB in public/assets')


if __name__ == '__main__':
    sys.exit(main())
