import { EXPLORE_PICKS } from '../../data/explorePicks';
import { filterExplorePicks } from '../exploreFilter';

describe('filterExplorePicks', () => {
  it('filters by search', () => {
    const firstTitle = EXPLORE_PICKS[0].title;
    const q = firstTitle.slice(0, 8);
    const out = filterExplorePicks({
      allPicks: EXPLORE_PICKS,
      query: q,
      tab: 'all',
      savedOrder: [],
      savedSet: new Set(),
      categoryFilter: null,
    });
    expect(out.length).toBeGreaterThan(0);
    const ql = q.toLowerCase();
    expect(
      out.every(
        (p) => p.title.toLowerCase().includes(ql) || p.subtitle.toLowerCase().includes(ql)
      )
    ).toBe(true);
  });

  it('filters saved tab', () => {
    const id = EXPLORE_PICKS[0].id;
    const out = filterExplorePicks({
      allPicks: EXPLORE_PICKS,
      query: '',
      tab: 'saved',
      savedOrder: [id],
      savedSet: new Set([id]),
      categoryFilter: null,
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(id);
  });
});
