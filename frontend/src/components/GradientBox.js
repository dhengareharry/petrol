import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

let nextId = 0;

/**
 * A View with a diagonal gradient background. `colors` are evenly spaced from top-left to bottom-right.
 * Children are laid out as in a normal View, on top of the gradient.
 */
export default function GradientBox({ colors, style, children }) {
  const id = `gradient-${nextId++}`;
  return (
    <View style={[styles.box, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {colors.map((color, index) => (
              <Stop key={index} offset={colors.length === 1 ? 0 : index / (colors.length - 1)} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
});
