import type { AppContext, Screen } from '../../app/context';
import { routeHash } from '../../app/router';
import { ALL_LEVELS, STAGES, levelsOf, type LevelId, type Stage } from '../../state/levels';
import { ICONS, h, icon, img } from '../dom';
import { MAP_ISLAND, mapIsland } from '../scenes';
import { World } from '../world';

/** Standard positions (feet) on an island, relative to the island's top-left corner. */
const NODES: [number, number][] = [[50, 290], [125, 312], [200, 290], [275, 312], [350, 290]];
const PAD = 32;
const RIBBON: Record<Stage, string> = { easy: 'blue', medium: 'purple', hard: 'red' };

type NodeState = 'done' | 'current' | 'open' | 'locked';

/** Kingdom map: one island per stage with a standard per level. */
export function mapScreen(ctx: AppContext, select?: LevelId): Screen {
  const { i18n, progress, levels } = ctx;
  const lang = i18n.language;
  const next = progress.nextLevel();
  const selected: LevelId | null = select && progress.isLevelUnlocked(select) ? select : next ?? null;
  let focusTarget: HTMLElement | undefined;

  const stateOf = (id: LevelId): NodeState =>
    progress.isCompleted(id) ? 'done' : id === next ? 'current' : progress.isLevelUnlocked(id) ? 'open' : 'locked';

  const columns = STAGES.map((stage, s) => {
    const locked = !progress.isStageUnlocked(stage);
    const world = new World('world--island');
    world.el.style.width = `${MAP_ISLAND.width + PAD * 2}px`;
    world.el.style.height = `${MAP_ISLAND.height + PAD * 2}px`;
    mapIsland(world, stage, locked);

    // Dotted route between the standards.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'route');
    svg.setAttribute('width', String(MAP_ISLAND.width + PAD * 2));
    svg.setAttribute('height', String(MAP_ISLAND.height + PAD * 2));
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', NODES.map(([x, y], i) => `${i ? 'L' : 'M'}${PAD + x} ${PAD + y}`).join(' '));
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
      if (state === 'current') world.put('units/pawn-blue', PAD + x + 38, PAD + y + 58, { above: true, scale: 0.8 });
      return btn;
    });
    world.el.append(svg, ...standards);

    const previous = s > 0 ? i18n.t(`stages.${STAGES[s - 1]}.name`) : '';
    const card = selected && selected.startsWith(stage) ? levelCard(ctx, selected) : null;

    return h(
      'section',
      { class: `stage stage--${stage}`, 'aria-labelledby': `stage-${stage}` },
      h('h2', { id: `stage-${stage}`, class: `ribbon-small ribbon-small--${RIBBON[stage]}` },
        h('small', {}, i18n.t(`stages.${stage}.difficulty`)), ' ', i18n.t(`stages.${stage}.name`)),
      world.el,
      locked ? h('p', { class: 'locked-note' }, icon([ICONS.lock]), i18n.t('map.lockedStage', { previous })) : null,
      card,
    );
  });

  const done = progress.completedCount();
  const element = h(
    'div',
    { class: 'screen screen--map' },
    ctx.chrome({ href: routeHash({ name: 'home' }), labelKey: 'a11y.backToHome' }),
    h('div', { class: 'map__progress' },
      h('span', {}, i18n.t('map.progress', { done, total: ALL_LEVELS.length })),
      h('span', { class: 'bar', role: 'img', 'aria-label': `${done} / ${ALL_LEVELS.length}` },
        h('i', { style: `width:${(done / ALL_LEVELS.length) * 100}%` })),
      done > 0 ? resetButton(ctx) : null,
    ),
    h('main', { id: 'main', class: 'map', tabindex: '-1' },
      h('h1', { class: 'visually-hidden' }, i18n.t('map.title')),
      h('div', { class: 'map__stages' }, ...columns),
    ),
  );
  return { element, title: `${i18n.t('map.title')} — ${i18n.t('app.title')}`, focus: focusTarget };
}

/** "Start over" with a confirmation dialog; the safe choice (keep progress) has the focus. */
function resetButton(ctx: AppContext): HTMLElement {
  const { i18n } = ctx;
  const keep = h('button', { type: 'button', class: 'btn btn--primary', value: 'keep' }, i18n.t('reset.cancel'));
  const erase = h('button', { type: 'button', class: 'btn btn--danger btn--small', value: 'erase' }, i18n.t('reset.confirm'));
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

function levelCard(ctx: AppContext, id: LevelId): HTMLElement | null {
  const { i18n, progress, levels } = ctx;
  const level = levels.get(id);
  if (!level) return null;
  return h(
    'div',
    { class: 'paper map-card' },
    h('h3', {}, level.title[i18n.language]),
    h('p', { class: 'map-card__where' }, i18n.t('map.levelOf', { n: level.order, stage: i18n.t(`stages.${level.stage}.name`) })),
    h('p', { class: 'chips' }, ...level.concepts.map((c) => h('code', { class: 'chip' }, c))),
    h('a', { class: 'btn btn--primary', href: routeHash({ name: 'level', id }) },
      i18n.t(progress.isCompleted(id) ? 'map.again' : 'map.open')),
  );
}
