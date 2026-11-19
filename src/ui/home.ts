import type { I18n } from '../i18n';
import { ALL_LEVELS, LEVELS_PER_STAGE, STAGES, levelsOf } from '../state/levels';
import type { Progress } from '../state/progress';
import { ICONS, h, icon } from './dom';

/**
 * Home screen placeholder for Phase 1: intro text and the three stages with their lock state.
 * The real map and level screens arrive in Phase 4.
 */
export function renderHome(i18n: I18n, progress: Progress): HTMLElement {
  const stageCards = STAGES.map((stage, i) => {
    const unlocked = progress.isStageUnlocked(stage);
    const done = levelsOf(stage).filter((id) => progress.isCompleted(id)).length;
    const previous = i > 0 ? i18n.t(`stages.${STAGES[i - 1]}.name`) : '';

    return h(
      'li',
      { class: `stage-card stage-card--${stage}`, 'data-locked': String(!unlocked) },
      h('span', { class: 'stage-card__difficulty' }, i18n.t(`stages.${stage}.difficulty`)),
      h('h3', { class: 'stage-card__name' }, i18n.t(`stages.${stage}.name`)),
      unlocked
        ? h('p', { class: 'stage-card__meta' }, `${done} / ${LEVELS_PER_STAGE}`)
        : h(
            'p',
            { class: 'stage-card__meta stage-card__meta--locked' },
            icon([ICONS.lock]),
            h('span', { class: 'visually-hidden' }, `${i18n.t('a11y.locked')}. `),
            i18n.t('home.lockedHint', { previous }),
          ),
    );
  });

  return h(
    'section',
    { class: 'home', 'aria-labelledby': 'home-title' },
    h('h1', { id: 'home-title', class: 'home__title' }, i18n.t('app.title')),
    h('p', { class: 'home__subtitle' }, i18n.t('app.subtitle')),
    h('p', { class: 'home__intro paper' }, i18n.t('home.intro')),
    h('h2', { class: 'home__heading' }, i18n.t('home.stagesHeading')),
    h(
      'p',
      { class: 'home__progress' },
      i18n.t('home.progress', { done: progress.completedCount(), total: ALL_LEVELS.length }),
    ),
    h('ol', { class: 'stage-list' }, ...stageCards),
  );
}
