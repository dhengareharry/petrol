import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import IconTile from './IconTile';
import { rewardIcon } from '../data/rewards';
import { rewardImage } from '../data/rewardImages';
import { COLORS } from '../theme';

/**
 * The picture of a reward. `size` is a square side in px; leave it out to fill the parent's width as a square.
 * A reward without a bundled photo shows its icon instead, so nothing ever renders blank.
 */
export default function RewardImage({ id, size, radius, style }) {
  const [failed, setFailed] = useState(false);
  const source = rewardImage(id);
  const box = size ? { width: size, height: size } : { width: '100%', aspectRatio: 1 };
  const corner = radius ?? (size ? Math.round(size * 0.22) : 14);

  // No photo for this reward, or the photo could not be loaded (a stale or interrupted dev server, a damaged file): the
  // reward's icon is shown instead of an empty square.
  if (!source || failed) return <IconTile name={rewardIcon(id)} size={size ?? 72} style={style} />;

  return (
    <View style={[styles.frame, box, { borderRadius: corner }, style]}>
      <Image
        source={source}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: COLORS.primarySoft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
