import { Image } from 'react-native';

const LOGO = require('../../assets/logo.png');

/** The Oasis Fuel logo (a square with rounded, transparent corners). */
export default function Logo({ size = 96, style }) {
  return <Image source={LOGO} style={[{ width: size, height: size }, style]} resizeMode="contain" accessibilityLabel="Oasis Fuel logo" />;
}
