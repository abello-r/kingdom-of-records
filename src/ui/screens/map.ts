import type { AppContext, Screen } from '../../app/context';
import { routeHash } from '../../app/router';
import { ALL_LEVELS, STAGES, levelsOf, type LevelId, type Stage } from '../../state/levels';
import { ICONS, bookIcon, fontsLoaded, h, icon, img } from '../dom';
import { I18n } from '../../i18n';
import { LANGUAGES } from '../../state/settings';
import { MAP_ISLAND, isCompact, mapIsland } from '../scenes';
import { World, drawnBox, swimming, type Sprite, type SpriteName } from '../world';
import type { Level } from '../../engine/types';

/** Standard positions (feet) on an island, relative to the island's top-left corner. */
const NODES: [number, number][] = [[50, 290], [125, 312], [200, 290], [275, 312], [350, 290]];
const PAD = 32;
/** Where the route leaves an island for the next one (right edge) and arrives from the previous one (left). */
const EXIT: [number, number] = [MAP_ISLAND.width, 334];
const ENTRY: [number, number] = [0, 334];
/** Pip waits on the strip of land below the standards, between the next page and its neighbour. */
const PIP_Y = 364;
/** An island with its sea margin (foam), and the gap between islands, at full size. */
const ISLAND_BOX = MAP_ISLAND.width + PAD * 2;
const GAP = 24;
/** Narrowest screen with the three islands in a row (keep in sync with the 999 px breakpoint in CSS). */
const ROW_MIN_WIDTH = 1000;
/** Smallest island scale when fitting the map to a laptop's height: below it the standards get hard to read. */
const MIN_ZOOM = 0.62;
/** Level card width: as wide as an island at full size, or a third of the row when that is less. */
const CARD_WIDTH = MAP_ISLAND.width + PAD * 2;
const RIBBON: Record<Stage, string> = { easy: 'blue', medium: 'purple', hard: 'red' };

type NodeState = 'done' | 'current' | 'open' | 'locked';

/** Kingdom map: one island per stage with a standard per level, joined by a route over the sea. */
export function mapScreen(ctx: AppContext, select?: LevelId): Screen {
  const { i18n, progress, levels } = ctx;
  const lang = i18n.language;
  const next = progress.nextLevel();
  const selected: LevelId | null = select && progress.isLevelUnlocked(select) ? select : next ?? null;
  let focusTarget: HTMLElement | undefined;
  const compact = isCompact(innerWidth);
  // From 1000 px the three islands are in a row (shrunk to fit when needed) and the route goes from one
  // to the next over the sea; below, they are stacked (at 82%, or less on the narrowest phones).
  const row = innerWidth >= ROW_MIN_WIDTH;
  const zoom = row ? Math.min(1, (innerWidth - 40 - GAP * 2) / (ISLAND_BOX * 3)) : compact ? Math.min(0.82, (innerWidth - 8) / ISLAND_BOX) : 1;

  const stateOf = (id: LevelId): NodeState =>
    progress.isCompleted(id) ? 'done' : id === next ? 'current' : progress.isLevelUnlocked(id) ? 'open' : 'locked';

  const columns = STAGES.map((stage, s) => {
    const locked = !progress.isStageUnlocked(stage);
    const world = new World('world--island');
    world.el.style.width = `${ISLAND_BOX}px`;
    world.el.style.height = `${MAP_ISLAND.height + PAD * 2}px`;
    mapIsland(world, stage, locked);

    // Dotted route between the standards; with the islands in a row it goes on to the next island.
    const points = [...NODES];
    if (row && s > 0) points.unshift(ENTRY);
    if (row && s < STAGES.length - 1) points.push(EXIT);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'route');
    svg.setAttribute('width', String(ISLAND_BOX));
    svg.setAttribute('height', String(MAP_ISLAND.height + PAD * 2));
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', points.map(([x, y], i) => `${i ? 'L' : 'M'}${PAD + x} ${PAD + y}`).join(' '));
    svg.append(path);

    const standards = levelsOf(stage).map((id, i) => {
      const state = stateOf(id);
      const level = levels.get(id);
      const [x, y] = NODES[i]!;
      const label = `${i18n.t('map.nodeLabel', { n: i + 1, title: level?.title[lang] ?? id })} (${i18n.t(`map.${state === 'open' ? 'current' : state}`)})`;
      const btn = h(
        'button',
        {
          type: 'button',
          class: `standard standard--${state}`,
          'aria-label': label,
          'aria-current': id === selected ? 'true' : undefined,
          disabled: state === 'locked',
        },
        img(`ui/standard-${state === 'locked' ? 'black' : 'blue'}.png`, 'standard__flag'),
        state === 'locked' ? icon([ICONS.lock]) : h('span', { class: 'standard__n' }, String(i + 1)),
        state === 'done' ? img('fx/success.png', 'standard__tick') : null,
      );
      btn.style.left = `${PAD + x}px`;
      btn.style.top = `${PAD + y}px`;
      btn.addEventListener('click', () => ctx.navigate({ name: 'map', select: id }, { replace: true }));
      if (id === selected) focusTarget = btn;
      if (state === 'current') {
        // Halfway to the next standard (to the previous one for the last), below the row of standards.
        const side = i < NODES.length - 1 ? 1 : -1;
        world.put('units/pawn-blue', PAD + x + side * 37, PAD + PIP_Y, { above: true, scale: 0.65, flip: side < 0 });
      }
      return btn;
    });
    world.el.append(svg, ...standards);

    const previous = s > 0 ? i18n.t(`stages.${STAGES[s - 1]}.name`) : '';
    const level = selected && selected.startsWith(stage) ? levels.get(selected) : undefined;
    const card = level ? levelCard(i18n, level, progress.isCompleted(level.id), ctx.memory.hintsUsed(level.id)) : null;

    return h(
      'section',
      { class: `stage stage--${stage}`, 'aria-labelledby': `stage-${stage}` },
      h('h2', { id: `stage-${stage}`, class: `ribbon-small ribbon-small--${RIBBON[stage]}` },
        h('small', {}, i18n.t(`stages.${stage}.difficulty`)), ' ', i18n.t(`stages.${stage}.name`)),
      world.el,
      // Below each island, room for the level card (empty, or the locked note, under the others).
      h('div', { class: 'stage__slot' },
        locked ? h('p', { class: 'locked-note' }, icon([ICONS.lock]), i18n.t('map.lockedStage', { previous })) : null,
        card),
    );
  });

  const done = progress.completedCount();
  const sea = new World('world--sea');
  const element = h(
    'div',
    { class: `screen screen--map${row ? ' is-row' : ''}`, style: `--island-zoom:${zoom}` },
    sea.el,
    ctx.chrome({ href: routeHash({ name: 'home' }), labelKey: 'a11y.backToHome' }),
    h('div', { class: 'map__progress' },
      h('span', {}, i18n.t('map.progress', { done, total: ALL_LEVELS.length })),
      h('span', { class: 'bar', role: 'img', 'aria-label': `${done} / ${ALL_LEVELS.length}` },
        h('i', { style: `width:${(done / ALL_LEVELS.length) * 100}%` })),
      // The two buttons always have the same size (equal grid columns).
      h('span', { class: 'map__actions' },
        h('a', { class: 'btn btn--ghost btn--small spellbook-link', href: routeHash({ name: 'spellbook' }), 'data-sound': 'page' },
          bookIcon(), h('span', { class: 'spellbook-link__text' }, i18n.t('spellbook.title'))),
        done > 0 ? resetButton(ctx) : null),
    ),
    h('main', { id: 'main', class: 'map', tabindex: '-1' },
      h('h1', { class: 'visually-hidden' }, i18n.t('map.title')),
      h('div', { class: 'map__stages' }, ...columns),
    ),
  );
  // Once the texts have their final size, the sea between the islands gets its route and its life.
  void fontsLoaded().then(() => requestAnimationFrame(() => {
    if (!element.isConnected) return;
    const tallest = cardHeight(element, [...levels.values()]);
    const fitted = row ? fitHeight(element, zoom, tallest) : (tallest(), zoom);
    // The level card is always in view (on phones the map is a long page; the card is below its island).
    const card = element.querySelector('.map-card');
    const box = card?.getBoundingClientRect();
    if (card && box && (box.top < 0 || box.bottom > innerHeight)) card.scrollIntoView({ block: 'nearest' });
    fillSea(element, sea, { compact, row, zoom: fitted });
  }));
  return { element, focus: focusTarget, destroy: () => sea.destroy() };
}

/**
 * The level card always has the same size, whatever the level and the language, so nothing moves when
 * another standard is selected: the height of the tallest card (every level, every language, solved
 * with every hint used) at the card's current width, measured off screen and set as --card-height.
 * Returns a function that measures it again (after the width changes).
 */
function cardHeight(screen: HTMLElement, all: Level[]): () => void {
  const translators = LANGUAGES.map((lang) => new I18n(lang));
  return () => {
    const probe = h('div', { class: 'map-card-probe', 'aria-hidden': 'true' },
      ...translators.flatMap((t) => all.map((level) => levelCard(t, level, true, level.hints.length))));
    screen.append(probe);
    const tallest = Math.max(...[...probe.children].map((c) => (c as HTMLElement).offsetHeight));
    probe.remove();
    screen.style.setProperty('--card-height', `${tallest}px`);
  };
}

/**
 * With the islands in a row the whole map fits the window, so a laptop shows it without scrolling. Every
 * island keeps room for the level card below it, so the layout does not depend on the selected page;
 * while the page is taller than the window, the islands first stop being staggered, then shrink a little
 * more (down to MIN_ZOOM). The card keeps its width (CARD_WIDTH, or a third of the row), so it does not
 * get taller as the islands shrink. Returns the scale used.
 */
function fitHeight(screen: HTMLElement, zoom: number, measureCard: () => void): number {
  let z = zoom;
  let stagger = 1;
  const apply = () => {
    const third = (innerWidth - 40 - GAP * 2) / 3;
    screen.style.setProperty('--island-zoom', String(z));
    screen.style.setProperty('--stagger', String(stagger));
    screen.style.setProperty('--card-width', `${Math.floor(Math.max(ISLAND_BOX * z, Math.min(CARD_WIDTH, third)))}px`);
    measureCard();
  };
  apply();
  const over = () => document.documentElement.scrollHeight - innerHeight;
  if (over() > 0) {
    stagger = Math.max(0, 1 - over() / (140 * z));
    apply();
  }
  // Each step removes about the overflow from the tallest column.
  for (let i = 0; i < 12 && over() > 0 && z > MIN_ZOOM; i++) {
    z = Math.max(MIN_ZOOM, z - Math.max(0.01, over() / (MAP_ISLAND.height + PAD * 2)));
    apply();
  }
  return z;
}

interface Box { left: number; right: number; top: number; bottom: number }

const grow = (b: Box, by: number): Box => ({ left: b.left - by, right: b.right + by, top: b.top - by, bottom: b.bottom + by });
const hits = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const distance = (x: number, y: number, b: Box) => Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));

/**
 * The open sea of the map: the route over the water from one island to the next (islands in a row),
 * then small islets, rocks and ducks in the largest empty stretches of water. Each piece goes to the
 * free spot farthest from the islands and from the pieces already placed, and never covers an island,
 * a ribbon, a level card, a note or a control; a piece with no free spot is left out.
 */
function fillSea(screen: HTMLElement, sea: World, { compact, row, zoom }: { compact: boolean; row: boolean; zoom: number }): void {
  if (!screen.isConnected) return;
  const origin = screen.getBoundingClientRect();
  const local = (r: DOMRect): Box => ({ left: r.left - origin.left, right: r.right - origin.left, top: r.top - origin.top, bottom: r.bottom - origin.top });
  const width = screen.clientWidth;
  const height = Math.max(screen.scrollHeight, innerHeight);
  sea.el.style.width = `${width}px`;
  sea.el.style.height = `${height}px`;

  const islands = [...screen.querySelectorAll<HTMLElement>('.world--island')].map((el) => local(el.getBoundingClientRect()));
  // With the islands in a row the sea is laid out without the level card, so it is the same whatever the
  // selected page (nothing moves when another one is selected); the pieces under the card are taken out
  // at the end. Stacked, the card is a blocker like the rest.
  const blockers: Box[] = [
    ...islands.map((b) => grow(b, -PAD * zoom + 24)),
    ...[...screen.querySelectorAll(`.stage > h2, .locked-note, .map__progress, .chrome a, .chrome button, .chrome .lang${row ? '' : ', .map-card'}`)]
      .map((el) => grow(local(el.getBoundingClientRect()), 14)),
  ];
  const pieces: { box: Box; els: Element[] }[] = [];
  /** Runs `draw` and records what it added to the sea, as one piece occupying `box`. */
  const piece = (box: Box, draw: () => void) => {
    const before = new Set(sea.el.children);
    draw();
    pieces.push({ box, els: [...sea.el.children].filter((c) => !before.has(c)) });
  };

  // Route over the water between the islands, from the exit of one to the entry of the next.
  if (row && islands.length > 1) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'route route--sea');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    for (let i = 0; i + 1 < islands.length; i++) {
      const [a, b] = [islands[i]!, islands[i + 1]!];
      const [x1, y1] = [a.left + (PAD + EXIT[0]) * zoom, a.top + (PAD + EXIT[1]) * zoom];
      const [x2, y2] = [b.left + (PAD + ENTRY[0]) * zoom, b.top + (PAD + ENTRY[1]) * zoom];
      const bend = (x2 - x1) * 0.6;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1} ${y1} C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`);
      svg.append(path);
    }
    sea.el.append(svg);
  }

  // Candidate spots on a grid over the sea, below the top bar.
  const top = Math.max(0, ...[...screen.querySelectorAll('.map__progress, .chrome')].map((el) => local(el.getBoundingClientRect()).bottom)) + 16;
  const spots: [number, number][] = [];
  for (let y = top; y < height - 20; y += 16) for (let x = 20; x < width - 20; x += 16) spots.push([x, y]);
  const placed: Box[] = [];
  const k = compact ? 0.75 : 1;

  /**
   * A free spot for a piece of `w` x `h`: the centre of the largest stretch of open water, i.e. the spot
   * farthest from the islands, texts, controls, screen edges and pieces already placed.
   */
  const boxAt = (x: number, y: number, w: number, h: number): Box => ({ left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 });
  const free = (box: Box) =>
    box.left >= 8 && box.right <= width - 8 && box.top >= top && box.bottom <= height - 8 &&
    !blockers.some((b) => hits(box, b)) && !placed.some((b) => hits(box, grow(b, 28)));
  // The same screen always gets the same sea (a small seeded generator, not Math.random).
  let seed = (width * 31 + height) % 2147483647 || 1;
  const random = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  const findSpot = (w: number, h: number): Box | null => {
    let best: [number, number] | null = null;
    let bestScore = -1;
    for (const [x, y] of spots) {
      if (!free(boxAt(x, y, w, h))) continue;
      // Distance to the pieces already placed counts double, so they spread over the whole sea.
      const score = Math.min(x, width - x, (height - y) * 1.5, ...blockers.map((b) => distance(x, y, b)), ...placed.map((b) => distance(x, y, b) / 2));
      if (score > bestScore) [best, bestScore] = [[x, y], score];
    }
    if (!best) return null;
    // Off the exact centre of the gap, so pieces do not line up.
    let box = boxAt(best[0], best[1], w, h);
    for (let i = 0; i < 8; i++) {
      const reach = bestScore * 0.6;
      const moved = boxAt(best[0] + (random() * 2 - 1) * reach, best[1] + (random() * 2 - 1) * reach, w, h);
      if (free(moved)) {
        box = moved;
        break;
      }
    }
    placed.push(box);
    return box;
  };
  // More water on very wide screens, a little more life in it; in a row a few more pieces, as those
  // under the level card are taken out.
  const wide = width >= 1600;
  const extra = row ? 1 : 0;

  /** Puts a sprite with its drawing centred in `box`. */
  const putIn = (box: Box, name: SpriteName, scale: number, opts: { flip?: boolean } = {}): Sprite => {
    const d = drawnBox(name, opts.flip);
    const x = (box.left + box.right) / 2 - ((d.left + d.right) / 2) * scale;
    const y = box.bottom - 2 - d.bottom * scale;
    return sea.put(name, x, y, { scale, flip: opts.flip });
  };

  // Islets (2 x 2 tiles with their foam) in the largest gaps, on wide screens only.
  if (!compact) {
    const islets = [['props/bush-1', 'units/sheep'], ['props/rock-2', 'props/bush-2'], ['props/bush-2', 'props/rock-2'], ['props/bush-1', 'props/rock-2']] as const;
    for (const [prop, second] of islets.slice(0, (wide ? 3 : 2) + extra)) {
      const box = findSpot(128 + 40, 128 + 40);
      if (!box) continue;
      const [x, y] = [box.left + 20, box.top + 20];
      piece(box, () => {
        sea.island(x, y, 2, 2, 'spring');
        sea.put(prop, x + 46, y + 92, { scale: 0.8 });
        sea.put(second, x + 88, y + 108, { scale: 0.7, flip: true });
      });
    }
  }
  for (let i = 0; i < (compact ? 1 : wide ? 3 : 2) + extra; i++) {
    const box = findSpot(48 * k, 40 * k);
    if (box) piece(box, () => putIn(box, 'props/water-rock', k));
  }
  for (let i = 0; i < (compact ? 2 : wide ? 4 : 3) + extra; i++) {
    const swim = Math.round(44 * k);
    const box = findSpot(28 * k + swim, 26 * k);
    if (!box) continue;
    // Every other duck faces right; each swims from one end of its course to the other and back.
    const flip = i % 2 === 1;
    const end = flip ? { ...box, right: box.left + 28 * k } : { ...box, left: box.right - 28 * k };
    piece(box, () => swimming(putIn(end, 'props/duck', k, { flip }), swim, flip));
  }
  const card = row ? screen.querySelector('.map-card') : null;
  if (card) {
    const under = grow(local(card.getBoundingClientRect()), 14);
    pieces.filter((p) => hits(p.box, under)).forEach((p) => p.els.forEach((el) => el.remove()));
  }
}

/** "Start over" with a confirmation dialog; the safe choice (keep progress) has the focus. */
function resetButton(ctx: AppContext): HTMLElement {
  const { i18n } = ctx;
  const keep = h('button', { type: 'button', class: 'btn btn--wood', value: 'keep', autofocus: true }, i18n.t('reset.cancel'));
  const erase = h('button', { type: 'button', class: 'btn btn--danger', value: 'erase' }, i18n.t('reset.confirm'));
  const dialog = h('dialog', { class: 'paper confirm', 'aria-labelledby': 'reset-title', 'aria-describedby': 'reset-body' },
    h('h2', { id: 'reset-title' }, i18n.t('reset.title')),
    h('p', { id: 'reset-body' }, i18n.t('reset.body')),
    h('div', { class: 'confirm__actions' }, keep, erase));
  keep.addEventListener('click', () => dialog.close());
  erase.addEventListener('click', () => {
    dialog.close();
    ctx.progress.reset();
    ctx.memory.reset();
    ctx.sessions.clear();
    ctx.navigate({ name: 'home' });
  });
  const open = h('button', { type: 'button', class: 'btn btn--ghost btn--small' }, i18n.t('map.reset'));
  open.addEventListener('click', () => {
    dialog.showModal();
    keep.focus();
  });
  return h('span', { class: 'map__reset' }, open, dialog);
}

/** The selected page: its title, where it is, its ideas, the way in and whether it is solved (and hints used). */
function levelCard(i18n: I18n, level: Level, solved: boolean, hints: number): HTMLElement {
  const status = h('p', { class: `map-card__status${solved ? ' is-solved' : ''}` },
    solved ? img('fx/success.png', 'map-card__tick') : null,
    i18n.t(solved ? 'map.solved' : 'map.unsolved'),
    hints > 0 ? h('span', { class: 'map-card__hints' }, i18n.t('map.hintsUsed', { n: hints, total: level.hints.length })) : null);
  return h(
    'div',
    { class: 'paper map-card' },
    h('h3', {}, level.title[i18n.language]),
    h('p', { class: 'map-card__where' }, i18n.t('map.levelOf', { n: level.order, stage: i18n.t(`stages.${level.stage}.name`) })),
    h('p', { class: 'chips' }, ...level.concepts.map((c) => h('code', { class: 'chip' }, c))),
    h('div', { class: 'map-card__foot' },
      h('a', { class: 'btn btn--primary', href: routeHash({ name: 'level', id: level.id }) }, i18n.t(solved ? 'map.again' : 'map.open')),
      status),
  );
}
