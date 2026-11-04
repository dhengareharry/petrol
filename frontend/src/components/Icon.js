import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import ICONS from './icons';
import { COLORS } from '../theme';

/** A crisp line icon from icons.js. Colour follows `color`; unknown names render nothing rather than crash. */
export default function Icon({ name, size = 24, color = COLORS.textPrimary, strokeWidth = 1.8, style }) {
  const shapes = ICONS[name];
  if (!shapes) return null;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {shapes.map((shape, index) => {
        if (typeof shape === 'string') return <Path key={index} d={shape} />;
        const [kind, ...v] = shape;
        if (kind === 'c') return <Circle key={index} cx={v[0]} cy={v[1]} r={v[2]} />;
        if (kind === 'r') return <Rect key={index} x={v[0]} y={v[1]} width={v[2]} height={v[3]} rx={v[4]} />;
        if (kind === 'l') return <Line key={index} x1={v[0]} y1={v[1]} x2={v[2]} y2={v[3]} />;
        return <Polygon key={index} points={v[0]} />;
      })}
    </Svg>
  );
}
