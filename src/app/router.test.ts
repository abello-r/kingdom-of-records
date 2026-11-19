import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash, type Route } from './router';

describe('router', () => {
  it('parses known routes', () => {
    expect(parseRoute('')).toEqual({ name: 'home' });
    expect(parseRoute('#/')).toEqual({ name: 'home' });
    expect(parseRoute('#/map')).toEqual({ name: 'map' });
    expect(parseRoute('#/map/medium-3')).toEqual({ name: 'map', select: 'medium-3' });
    expect(parseRoute('#/level/easy-2')).toEqual({ name: 'level', id: 'easy-2' });
  });

  it('falls back safely on unknown or invalid routes', () => {
    expect(parseRoute('#/level/boss-9')).toEqual({ name: 'home' });
    expect(parseRoute('#/map/nope')).toEqual({ name: 'map' });
    expect(parseRoute('#/whatever')).toEqual({ name: 'home' });
  });

  it('round-trips', () => {
    const routes: Route[] = [{ name: 'home' }, { name: 'map' }, { name: 'map', select: 'hard-1' }, { name: 'level', id: 'medium-4' }];
    for (const r of routes) expect(parseRoute(routeHash(r))).toEqual(r);
  });
});
