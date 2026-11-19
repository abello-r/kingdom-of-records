import { parseLevelId, type LevelId } from '../state/levels';

/** Screens of the game. Routes live in the URL hash so the static build works on any host. */
export type Route =
  | { name: 'home' }
  | { name: 'map'; select?: LevelId }
  | { name: 'level'; id: LevelId }
  | { name: 'epilogue' };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (path[0] === 'map') {
    const select = path[1] && parseLevelId(path[1]) ? (path[1] as LevelId) : undefined;
    return select ? { name: 'map', select } : { name: 'map' };
  }
  if (path[0] === 'level' && path[1] && parseLevelId(path[1])) return { name: 'level', id: path[1] as LevelId };
  if (path[0] === 'epilogue') return { name: 'epilogue' };
  return { name: 'home' };
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'map':
      return route.select ? `#/map/${route.select}` : '#/map';
    case 'level':
      return `#/level/${route.id}`;
    case 'epilogue':
      return '#/epilogue';
  }
}
