export type RankInput = {
  rating: number;
  reviewCount: number;
  viewCount: number;
  featured?: boolean;
};

/** Higher score = listed higher. Mix of rating, reviews, views, and featured boost. */
export function rankScore(s: RankInput): number {
  return (s.featured ? 40 : 0) + s.rating * 22 + s.reviewCount * 0.18 + s.viewCount * 0.06;
}

export function sortByRank<T extends RankInput>(items: T[]): T[] {
  return [...items].sort((a, b) => rankScore(b) - rankScore(a) || b.rating - a.rating);
}
