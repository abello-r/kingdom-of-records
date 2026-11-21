import type { AppContext, Screen } from '../../app/context';
import { routeHash } from '../../app/router';
import { SPELLS } from '../../spellbook/spells';
import { ALL_LEVELS, levelsOf, parseLevelId } from '../../state/levels';
import { chipText, linkedinShareUrl, shareImagePath, shareUrl, type Title } from '../../titles/titles';
import { externalLink, h, img } from '../dom';
import { isCompact, levelStrip } from '../scenes';
import { World } from '../world';

/**
 * A title earned at the end of a stage (the last one after the epilogue): a certificate on the left
 * page; the spells mastered and the ways to share it on the right. The scene shows the stage's last
 * level once solved, and its people celebrate.
 */
export function titleScreen(ctx: AppContext, title: Title): Screen {
  const { i18n, levels } = ctx;
  const lang = i18n.language;
  const t = i18n.t.bind(i18n);

  const lastLevel = levels.get(levelsOf(title.stage).at(-1)!)!;
  const width = Math.min(innerWidth, 1920);
  const height = isCompact(width) ? 190 : 262;
  const world = new World('world--strip');
  world.el.style.height = `${height}px`;
  const solve = levelStrip(world, lastLevel, width, height);
  const animated = world.instant;
  world.instant = true;
  solve();
  world.instant = animated;
  const cheer = window.setTimeout(() => world.celebrate(), 500);

  const spellsSoFar = SPELLS.filter((s) => ALL_LEVELS.indexOf(s.level) <= ALL_LEVELS.indexOf(lastLevel.id)).length;
  const certificate = h('section', { class: 'page paper', 'aria-labelledby': 'title-name' },
    h('div', { class: 'certificate' },
      h('p', { class: 'certificate__lead' }, t('title.lead')),
      h('h2', { id: 'title-name', class: `ribbon ribbon--${title.ribbon} certificate__ribbon` }, title.name[lang]),
      h('div', { class: 'certificate__who' }, img('fx/twinkle.png', 'certificate__twinkle'), img('portraits/pip.png', 'certificate__pip')),
      h('p', { class: 'certificate__for' }, t(`title.for.${title.id}`)),
      h('p', { class: 'certificate__stats' }, t('title.stats', { pages: title.pages, spells: spellsSoFar })),
      h('p', { class: 'certificate__brand' }, 'The Kingdom of Records')));

  const text = t(`title.text.${title.id}`, { url: shareUrl(title.id, lang) });
  const status = h('p', { class: 'share__status', role: 'status' });
  const copy = async (message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = message;
      return true;
    } catch {
      status.textContent = t('title.copyFailed');
      return false;
    }
  };
  const linkedin = externalLink(linkedinShareUrl(title.id, lang), t('a11y.newTab'), { class: 'btn share__linkedin' }, t('title.linkedin'));
  // LinkedIn cannot be given the text, so it goes to the clipboard on the way.
  linkedin.addEventListener('click', () => void copy(t('title.copiedLinkedin')));
  const copyBtn = h('button', { type: 'button', class: 'btn btn--ghost' }, t('title.copy'));
  copyBtn.addEventListener('click', () => void copy(t('title.copied')));
  const download = h('a', { class: 'btn btn--ghost', href: `${import.meta.env.BASE_URL}${shareImagePath(title.id, lang)}`, download: `kingdom-of-records-${title.id}-${lang}.png` }, t('title.download'));
  const continueHref = title.stage === 'hard' ? routeHash({ name: 'map' }) : routeHash({ name: 'map', select: ALL_LEVELS[ALL_LEVELS.indexOf(lastLevel.id) + 1] });
  const share = h('section', { class: 'page paper share', 'aria-labelledby': 'share-title' },
    h('h2', {}, t('title.mastered')),
    h('div', { class: 'chips share__chips' }, ...title.chips.map((c) => h('code', { class: 'chip' }, chipText(c, lang)))),
    h('h2', { id: 'share-title' }, t('title.share')),
    h('p', { class: 'share__text' }, text),
    h('div', { class: 'share__actions' }, linkedin, copyBtn, download),
    status,
    h('p', { class: 'share__note' }, t('title.note')),
    h('div', { class: 'next share__next' }, h('a', { class: 'btn btn--primary', href: continueHref, 'data-sound': 'page' }, t('title.continue'))));

  const heading = h('h1', { class: `ribbon-small ribbon-small--${title.ribbon} level-title` }, h('small', {}, t('title.kicker')), ' ', title.name[lang]);
  const dock = h('div', { class: 'dock' }, h('a', { class: 'btn btn--primary', href: continueHref, 'data-sound': 'page' }, t('title.continue')));
  const element = h('div', { class: `screen screen--level screen--title stage-${parseLevelId(lastLevel.id)!.stage} is-solved` },
    h('div', { class: 'scene' }, world.el, ctx.chrome({ href: continueHref, labelKey: 'a11y.backToMap' }), heading),
    h('main', { id: 'main', class: 'book wood', tabindex: '-1' }, h('div', { class: 'pages' }, certificate, share)),
    dock);
  return {
    element,
    destroy: () => {
      window.clearTimeout(cheer);
      world.destroy();
    },
  };
}
