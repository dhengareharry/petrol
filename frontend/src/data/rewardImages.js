// A photo of each reward, bundled with the app (assets/rewards, credits in CREDITS.md there).
// React Native needs every require() to be a literal, so the files are listed out rather than built from the id.
const REWARD_IMAGES = {
  'thermos-cup-set': require('../../assets/rewards/thermos-cup-set.jpg'),
  'bluetooth-speaker': require('../../assets/rewards/bluetooth-speaker.jpg'),
  'mini-press': require('../../assets/rewards/mini-press.jpg'),
  'water-can': require('../../assets/rewards/water-can.jpg'),
  'cooling-fan': require('../../assets/rewards/cooling-fan.jpg'),
  'smart-watch': require('../../assets/rewards/smart-watch.jpg'),
  'speaker-with-mic': require('../../assets/rewards/speaker-with-mic.jpg'),
  'sound-bar': require('../../assets/rewards/sound-bar.jpg'),
  'sony-home-theater': require('../../assets/rewards/sony-home-theater.jpg'),
  'designer-ceiling-fan': require('../../assets/rewards/designer-ceiling-fan.jpg'),
  'trolley-bag': require('../../assets/rewards/trolley-bag.jpg'),
  'mixture-juicer': require('../../assets/rewards/mixture-juicer.jpg'),
  '3-stove-gas-burner': require('../../assets/rewards/3-stove-gas-burner.jpg'),
  'digital-wall-clock': require('../../assets/rewards/digital-wall-clock.jpg'),
  'electric-water-heater': require('../../assets/rewards/electric-water-heater.jpg'),
  'ro-water-purifier': require('../../assets/rewards/ro-water-purifier.jpg'),
  'trolley-speaker': require('../../assets/rewards/trolley-speaker.jpg'),
  'android-mobile-phone': require('../../assets/rewards/android-mobile-phone.jpg'),
  tablet: require('../../assets/rewards/tablet.jpg'),
  '40-led-tv': require('../../assets/rewards/40-led-tv.jpg'),
  'washing-machine': require('../../assets/rewards/washing-machine.jpg'),
  '55-led-tv': require('../../assets/rewards/55-led-tv.jpg'),
  refrigerator: require('../../assets/rewards/refrigerator.jpg'),
  laptop: require('../../assets/rewards/laptop.jpg'),
  'electric-scooter': require('../../assets/rewards/electric-scooter.jpg'),
};

/** The bundled photo for a reward id, or undefined for a reward that has none. */
export const rewardImage = (id) => REWARD_IMAGES[id];
