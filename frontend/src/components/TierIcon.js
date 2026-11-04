import { StyleSheet, View } from 'react-native';
import Icon from './Icon';

/** A membership tier's medal / crown / gem, coloured in the tier's own colour on a soft round background. */
export default function TierIcon({ tier, size = 44 }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${tier.color}1F` }]}>
      <Icon name={tier.icon} size={Math.round(size * 0.55)} color={tier.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
