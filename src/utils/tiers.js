export const TIERS = [
  { key: 'bronze', label: 'Bronze', icon: '🥉', min: 0, color: '#B45309' },
  { key: 'silver', label: 'Silver', icon: '🥈', min: 5000, color: '#64748B' },
  { key: 'gold', label: 'Gold', icon: '🥇', min: 20000, color: '#CA8A04' },
  { key: 'platinum', label: 'Platinum', icon: '💎', min: 50000, color: '#0E7490' },
];

export function getTierInfo(lifetimePoints) {
  let current = TIERS[0];
  let next = null;
  for (let i = 0; i < TIERS.length; i += 1) {
    if (lifetimePoints >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] || null;
    }
  }
  const pointsToNext = next ? next.min - lifetimePoints : 0;
  return { current, next, pointsToNext };
}
