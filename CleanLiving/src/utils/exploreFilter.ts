import type { ExplorePick } from '../data/explorePicks';
import type { SwapCategory } from '../types';

export type ExploreFilterTab = 'all' | 'saved';

export type ExploreFilterInput = {
  allPicks: ExplorePick[];
  query: string;
  tab: ExploreFilterTab;
  savedOrder: string[];
  savedSet: Set<string>;
  categoryFilter: SwapCategory | null;
};

export function filterExplorePicks(input: ExploreFilterInput): ExplorePick[] {
  const q = input.query.trim().toLowerCase();
  let list = input.allPicks;
  if (input.tab === 'saved') {
    const rank = new Map(input.savedOrder.map((id, i) => [id, i]));
    list = input.allPicks
      .filter((p) => input.savedSet.has(p.id))
      .sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
  }
  if (input.categoryFilter !== null) {
    list = list.filter((p) => p.category === input.categoryFilter);
  }
  if (!q) return list;
  return list.filter(
    (p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
  );
}
