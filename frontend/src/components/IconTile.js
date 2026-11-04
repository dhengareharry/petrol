import { StyleSheet, View } from 'react-native';
import Icon from './Icon';
import { COLORS } from '../theme';

/** An icon on a soft rounded square, used wherever the app shows an item (reward, vehicle, stat…). */
export default function IconTile({ name, size = 52, color = COLORS.primary, background = COLORS.primarySoft, style }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: background }, style]}>
      <Icon name={name} size={Math.round(size * 0.52)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
