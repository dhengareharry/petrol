import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getClaimPhoto } from '../storage/fuelClaimStore';
import { COLORS, RADIUS } from '../theme';

export default function ClaimPhoto({ claimId, style, resizeMode = 'cover' }) {
  const [uri, setUri] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getClaimPhoto(claimId).then((value) => {
      if (cancelled) return;
      if (value) setUri(value);
      else setMissing(true);
    });
    return () => {
      cancelled = true;
    };
  }, [claimId]);

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, style]} resizeMode={resizeMode} />;
  }

  return (
    <View style={[styles.image, styles.placeholder, style]}>
      <Text style={styles.placeholderText}>{missing ? 'No photo' : '…'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
