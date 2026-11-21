"""Builds the share pages of the titles: public/share/<title>/<lang>/index.html and og.png (1200x630).

LinkedIn and other sites build a link preview from the page they are given, so each title has its own
small page per language with its own image and texts; the page then opens the game in that language.
Texts come from src/titles/titles.json and src/i18n/*.json; the art from public/ (run build_assets.py
first) and the fonts from node_modules (run npm install first). The background, scripts/share-background.png,
is a 1200x630 capture of the title screen like public/og-image.png, without its Ko-fi sign (it would show
behind the card). Usage, from the project root
(requires Pillow and fonttools):

    python scripts/build_share.py

The output is committed. Run it again when titles, their texts or the site address change.
"""
import html
import io
import json
import os
import shutil

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC = os.path.join(ROOT, 'public')
OUT = os.path.join(PUBLIC, 'share')
SITE_URL = 'https://kingdom-of-records.netlify.app'  # keep in sync with SITE_URL in src/app/site.ts
LANGS = ['es', 'en', 'fr']
LOCALE = {'es': 'es_ES', 'en': 'en_US', 'fr': 'fr_FR'}
INK = (22, 28, 46)
PARCHMENT = (238, 225, 198)
W, H = 1200, 630


def font(package, file, size):
    """A WOFF font from node_modules, converted in memory for Pillow."""
    ttf = TTFont(os.path.join(ROOT, 'node_modules', '@fontsource', package, 'files', file))
    ttf.flavor = None
    buf = io.BytesIO()
    ttf.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def ui(size):
    return font('jersey-10', 'jersey-10-latin-400-normal.woff', size)


def mono(size):
    return font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff', size)


def nine_slice(src, w, h, cell=64):
    """Stretches a 3x3 panel (cells of `cell` px) to w x h, keeping the corners at their size."""
    out = Image.new('RGBA', (w, h))
    xs = [(0, cell, 0, cell), (cell, 2 * cell, cell, w - cell), (2 * cell, 3 * cell, w - cell, w)]
    ys = [(0, cell, 0, cell), (cell, 2 * cell, cell, h - cell), (2 * cell, 3 * cell, h - cell, h)]
    for sy0, sy1, dy0, dy1 in ys:
        for sx0, sx1, dx0, dx1 in xs:
            part = src.crop((sx0, sy0, sx1, sy1)).resize((dx1 - dx0, dy1 - dy0), Image.NEAREST)
            out.alpha_composite(part, (dx0, dy0))
    return out


def ribbon(colour, width):
    """The big kit ribbon (left end, body, right end; 128 px tall) stretched to `width`."""
    src = Image.open(os.path.join(PUBLIC, 'assets', 'ui', f'ribbon-{colour}.png')).convert('RGBA')
    out = Image.new('RGBA', (width, 128))
    out.alpha_composite(src.crop((0, 0, 128, 128)), (0, 0))
    out.alpha_composite(src.crop((128, 0, 256, 128)).resize((width - 256, 128), Image.NEAREST), (128, 0))
    out.alpha_composite(src.crop((256, 0, 384, 128)), (width - 128, 0))
    return out


def text(draw, xy, s, f, fill, shadow=None, anchor='mt'):
    if shadow:
        draw.text((xy[0] + 3, xy[1] + 3), s, font=f, fill=shadow, anchor=anchor)
    draw.text(xy, s, font=f, fill=fill, anchor=anchor)


def image(title, lang, t):
    bg = Image.open(os.path.join(ROOT, 'scripts', 'share-background.png')).convert('RGBA').resize((W, H))
    img = Image.alpha_composite(bg, Image.new('RGBA', (W, H), INK + (115,)))
    paper = Image.open(os.path.join(PUBLIC, 'assets', 'ui', 'special-paper.png')).convert('RGBA')
    card = (140, 46, W - 140, H - 70)
    img.alpha_composite(nine_slice(paper, card[2] - card[0], card[3] - card[1]), card[:2])
    d = ImageDraw.Draw(img)
    cx = W // 2
    lead, brand, sub, title_font, chip_font = ui(34), ui(46), ui(30), ui(56), mono(22)

    # Chips laid out in centred rows.
    chips = [c if isinstance(c, str) else c[lang] for c in title['chips']]
    rows, row, width = [], [], 0
    for c in chips:
        cw = int(d.textlength(c, font=chip_font)) + 28
        if row and width + 10 + cw > 820:
            rows.append(row)
            row, width = [], 0
        row.append((c, cw))
        width += cw + (10 if len(row) > 1 else 0)
    rows.append(row)

    block = 38 + 56 + 128 + 40 + len(rows) * 46
    y = card[1] + (card[3] - card[1] - block) // 2 - 6
    text(d, (cx, y), t['imageLead'], lead, PARCHMENT)
    text(d, (cx, y + 38), 'The Kingdom of Records', brand, (255, 243, 207), INK)
    name = title['name'][lang]
    rw = max(520, int(d.textlength(name, font=title_font)) + 220)
    img.alpha_composite(ribbon(title['ribbon'], rw), (cx - rw // 2, y + 96))
    text(d, (cx, y + 96 + 50), name, title_font, PARCHMENT, (22, 28, 46, 140), anchor='mm')
    text(d, (cx, y + 96 + 128 - 6), t['imageSub'][title['id']], sub, (233, 217, 168))
    cy = y + 96 + 128 + 40
    for row in rows:
        total = sum(cw for _, cw in row) + 10 * (len(row) - 1)
        x = cx - total // 2
        for c, cw in row:
            d.rounded_rectangle((x, cy, x + cw, cy + 36), radius=4, fill=(247, 238, 219), outline=INK, width=3)
            d.text((x + cw // 2, cy + 18), c, font=chip_font, fill=INK, anchor='mm')
            x += cw + 10
        cy += 46
    foot = f"{t['imageFoot']} · "
    fw = d.textlength(foot, font=ui(28)) + d.textlength('kingdom-of-records.netlify.app', font=ui(28))
    fx = cx - fw / 2
    text(d, (fx, H - 44), foot, ui(28), (255, 255, 255), INK, anchor='lt')
    text(d, (fx + d.textlength(foot, font=ui(28)), H - 44), 'kingdom-of-records.netlify.app', ui(28), (242, 226, 138), INK, anchor='lt')
    return img.convert('RGB')


def page(title, lang, t):
    url = f'{SITE_URL}/share/{title["id"]}/{lang}/'
    name = title['name'][lang]
    heading = f'The Kingdom of Records: {name}'
    desc = t['ogDescription']
    game = f'../../../?lang={lang}'
    e = html.escape
    return f'''<!doctype html>
<html lang="{lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{e(heading)}</title>
    <meta name="description" content="{e(desc)}" />
    <link rel="canonical" href="{url}" />
    <link rel="icon" type="image/png" href="../../../assets/icons/favicon-32.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="The Kingdom of Records" />
    <meta property="og:url" content="{url}" />
    <meta property="og:title" content="{e(heading)}" />
    <meta property="og:description" content="{e(desc)}" />
    <meta property="og:image" content="{url}og.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="{e(name)}" />
    <meta property="og:locale" content="{LOCALE[lang]}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{e(heading)}" />
    <meta name="twitter:description" content="{e(desc)}" />
    <meta name="twitter:image" content="{url}og.png" />
    <meta http-equiv="refresh" content="0; url={game}" />
    <style>body {{ margin: 0; display: grid; place-items: center; min-height: 100vh; background: #47aba9; font: 20px system-ui, sans-serif; }} a {{ color: #161c2e; }}</style>
  </head>
  <body>
    <p><a href="{game}">{e(t['play'])}</a></p>
    <script>location.replace({json.dumps(game)});</script>
  </body>
</html>
'''


def main():
    titles = json.load(open(os.path.join(ROOT, 'src', 'titles', 'titles.json'), encoding='utf-8'))
    texts = {lang: json.load(open(os.path.join(ROOT, 'src', 'i18n', f'{lang}.json'), encoding='utf-8'))['title'] for lang in LANGS}
    shutil.rmtree(OUT, ignore_errors=True)
    for title in titles:
        for lang in LANGS:
            folder = os.path.join(OUT, title['id'], lang)
            os.makedirs(folder)
            image(title, lang, texts[lang]).save(os.path.join(folder, 'og.png'), optimize=True)
            with open(os.path.join(folder, 'index.html'), 'w', encoding='utf-8', newline='\n') as f:
                f.write(page(title, lang, texts[lang]))
    print(f'{len(titles) * len(LANGS)} share pages in public/share')


if __name__ == '__main__':
    main()
