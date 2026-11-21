import type { AppContext, Screen } from '../../app/context';
import { routeHash } from '../../app/router';
import { SPELLS, type Spell } from '../../spellbook/spells';
import { STAGES, parseLevelId, type LevelId, type Stage } from '../../state/levels';
import { bookIcon, h, icon, ICONS } from '../dom';
import { levelStrip, stripHeight } from '../scenes';
import { layoutSql } from '../sql-layout';
import { World } from '../world';

const RIBBON: Record<Stage, string> = { easy: 'blue', medium: 'purple', hard: 'red' };

/**
 * The spell book: every SQL idea of the game, filled in as levels are completed. Learned spells show
 * what they do, their formula and an example on the kingdom's data; the others are sealed and say
 * where they are learned. Opened from a level (`from`, the back button returns there) or from the map.
 */
export function spellbookScreen(ctx: AppContext, from?: LevelId): Screen {
  const { i18n, progress, levels } = ctx;
  const lang = i18n.language;
  const t = i18n.t.bind(i18n);

  // The scene of the level the player came from, or of the next page to read.
  const sceneLevel = levels.get(from ?? progress.nextLevel() ?? 'hard-5') ?? [...levels.values()][0]!;
  const width = Math.min(innerWidth, 1920);
  const height = stripHeight(width);
  const world = new World('world--strip');
  world.el.style.height = `${height}px`;
  levelStrip(world, sceneLevel, width, height);

  const levelLabel = (id: LevelId) => {
    const parsed = parseLevelId(id)!;
    return `${t(`stages.${parsed.stage}.difficulty`)} ${parsed.n}`;
  };
  const learned = SPELLS.filter((s) => progress.isCompleted(s.level));

  const code = (spell: Spell) => {
    const block = h('pre', { class: 'chip chip--block spell-card__code' });
    const add = (text: string, cls = '') => {
      for (const line of text.split('\n')) {
        const depth = (line.length - line.trimStart().length) / 2;
        const el = h('span', { class: `ln ${cls}`.trim() }, line.trimStart());
        if (depth) el.style.setProperty('--depth', String(depth));
        block.append(el);
      }
    };
    add(`-- ${t('spellbook.formula')}`, 'cm');
    add(layoutSql(spell.formula[lang]));
    add(`-- ${t('spellbook.example')}`, 'cm');
    add(layoutSql(spell.example));
    return block;
  };

  const card = (spell: Spell) => {
    if (!progress.isCompleted(spell.level)) {
      return h('article', { class: 'spell-card is-locked' },
        icon([ICONS.lock]),
        h('div', {},
          h('h3', {}, h('code', {}, spell.name[lang])),
          h('p', { class: 'spell-card__where' }, t('spellbook.locked', { level: levelLabel(spell.level) }))));
    }
    const level = levels.get(spell.level);
    return h('article', { class: 'spell-card' },
      h('header', {},
        h('h3', {}, h('code', {}, spell.name[lang])),
        h('a', { class: 'spell-card__where', href: routeHash({ name: 'level', id: spell.level }) },
          `${levelLabel(spell.level)} · ${level?.title[lang] ?? ''}`)),
      h('p', {}, spell.what[lang]),
      code(spell));
  };

  const chapter = (stage: Stage) => [
    h('h2', { class: `ribbon-small ribbon-small--${RIBBON[stage]} spell-chapter` },
      h('small', {}, t(`stages.${stage}.difficulty`)), ' ', t(`stages.${stage}.name`)),
    ...SPELLS.filter((s) => parseLevelId(s.level)!.stage === stage).map(card),
  ];

  const share = learned.length / SPELLS.length;
  const left = h('section', { class: 'page paper spellbook', 'aria-labelledby': 'spellbook-title' },
    h('h2', { id: 'spellbook-title', class: 'spellbook__title' }, bookIcon(), ' ', t('spellbook.title')),
    h('p', { class: 'spellbook__count' }, t('spellbook.count', { n: learned.length, total: SPELLS.length }), ' ', t('spellbook.intro')),
    h('div', { class: 'spellbook__bar', role: 'presentation' }, h('i', { style: `width: ${Math.round(share * 100)}%` })),
    ...chapter(STAGES[0]!));
  const right = h('section', { class: 'page paper spellbook', 'aria-label': t('spellbook.title') }, ...STAGES.slice(1).flatMap(chapter));

  const back = from
    ? { href: routeHash({ name: 'level', id: from }), labelKey: 'a11y.backToLevel' }
    : { href: routeHash({ name: 'map' }), labelKey: 'a11y.backToMap' };
  const title = h('h1', { class: 'ribbon-small ribbon-small--blue level-title' }, h('small', {}, t('spellbook.kicker')), ' ', t('spellbook.title'));
  const element = h('div', { class: 'screen screen--level screen--spellbook' },
    h('div', { class: 'scene' }, world.el, ctx.chrome(back), title),
    h('main', { id: 'main', class: 'book wood', tabindex: '-1' }, h('div', { class: 'pages' }, left, right)));
  return { element, destroy: () => world.destroy() };
}
