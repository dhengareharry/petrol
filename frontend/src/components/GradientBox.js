import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

let nextId = 0;

/**
 * A View with a diagonal gradient background. `colors` are evenly spaced from top-left to bottom-right.
 * Children are laid out as in a normal View, on top of the gradient.
 *
 * The gradient is drawn at the box's measured pixel size and redrawn whenever the box changes size. (Sizing the SVG with
 * "100%" can leave it at a stale, smaller size on Android when the box grows after its first layout, which showed up as a
 * gradient that stopped short of the right and bottom edges.)
 */
export default function GradientBox({ colors, style, children }) {
  const [id] = useState(() => `gradient-${nextId++}`);
  const [size, setSize] = useState(null);

  function handleLayout(event) {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) => (previous && previous.width === width && previous.height === height ? previous : { width, height }));
  }

  return (
    // The middle colour shows for the instant before the first measurement, so the box is never see-through.
    <View style={[styles.box, { backgroundColor: colors[Math.floor(colors.length / 2)] }, style]} onLayout={handleLayout}>
      {size && size.width > 0 && size.height > 0 ? (
        <Svg style={styles.fill} width={size.width} height={size.height} pointerEvents="none">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              {colors.map((color, index) => (
                <Stop key={index} offset={colors.length === 1 ? 0 : index / (colors.length - 1)} stopColor={color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
