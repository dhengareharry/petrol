import { useWindowDimensions } from 'react-native';

// Below TABLET the app is a phone: content fills the screen and navigation sits at the bottom.
// From TABLET up it gets a side navigation rail and the content is centred with a sensible maximum width.
export const BREAKPOINTS = { tablet: 768, wide: 1100 };

/** The current window's size class, recomputed on rotation / window resize. */
export default function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.tablet;
  const isWide = width >= BREAKPOINTS.wide;
  return {
    width,
    height,
    isTablet,
    isWide,
    isLandscape: width > height,
    // How wide the screen content may grow before it is centred with empty space either side.
    contentMaxWidth: isWide ? 980 : isTablet ? 860 : undefined,
    // Reward cards per row: 2 on phones, more as the screen widens.
    rewardColumns: width >= 1000 ? 4 : width >= 600 ? 3 : 2,
  };
}
