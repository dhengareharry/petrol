// `icon` is the name of an SVG icon in components/icons.js.
export const REWARDS = [
  { id: 'thermos-cup-set', name: 'Thermos and Cup set', points: 500, icon: 'coffee' },
  { id: 'bluetooth-speaker', name: 'Blue tooth speaker', points: 750, icon: 'speaker' },
  { id: 'mini-press', name: 'Mini Press', points: 1000, icon: 'iron' },
  { id: 'water-can', name: 'Water Can', points: 1250, icon: 'bucket' },
  { id: 'cooling-fan', name: 'Cooling Fan', points: 1500, icon: 'fan' },
  { id: 'smart-watch', name: 'Smart Watch', points: 1750, icon: 'watch' },
  { id: 'speaker-with-mic', name: 'Speaker with Mic', points: 2000, icon: 'mic' },
  { id: 'sound-bar', name: 'Sound Bar', points: 2500, icon: 'soundbar' },
  { id: 'sony-home-theater', name: 'Sony Home Theater', points: 3000, icon: 'headphones' },
  { id: 'designer-ceiling-fan', name: 'Designer Ceiling Fan (Remote)', points: 4000, icon: 'fan' },
  { id: 'trolley-bag', name: 'Trolley Bag', points: 5000, icon: 'luggage' },
  { id: 'mixture-juicer', name: 'Mixture & Juicer', points: 6000, icon: 'blender' },
  { id: '3-stove-gas-burner', name: '3 Stove Gas Burner', points: 7000, icon: 'flame' },
  { id: 'digital-wall-clock', name: 'Digital Wall Clock', points: 8000, icon: 'clock' },
  { id: 'electric-water-heater', name: 'Electric Water Heater (Geyser)', points: 9000, icon: 'geyser' },
  { id: 'ro-water-purifier', name: 'RO Water Purifier', points: 10000, icon: 'droplet' },
  { id: 'trolley-speaker', name: 'Trolley Speacker', points: 12500, icon: 'megaphone' },
  { id: 'android-mobile-phone', name: 'Android Mobile Phone', points: 15000, icon: 'phone' },
  { id: 'tablet', name: 'Tablet', points: 20000, icon: 'tablet' },
  { id: '40-led-tv', name: '40" LED TV', points: 25000, icon: 'tv' },
  { id: 'washing-machine', name: 'Washing Machine', points: 30000, icon: 'washing' },
  { id: '55-led-tv', name: '55" LED TV', points: 40000, icon: 'tv' },
  { id: 'refrigerator', name: 'Refrigerator', points: 50000, icon: 'fridge' },
  { id: 'laptop', name: 'LapTop', points: 75000, icon: 'laptop' },
  { id: 'electric-scooter', name: 'Electric Scooter', points: 100000, icon: 'scooter' },
];

/** The SVG icon for a reward, given its id or a reward-like object (the server's own emoji icons are ignored). */
export const rewardIcon = (idOrReward) => {
  const id = typeof idOrReward === 'string' ? idOrReward : idOrReward?.id;
  return REWARDS.find((r) => r.id === id)?.icon ?? 'gift';
};
