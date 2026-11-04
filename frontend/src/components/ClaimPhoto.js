import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS, RADIUS } from '../theme';

export default function ClaimPhoto({ claimId, style, resizeMode = 'cover' }) {
  const [uri, setUri] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/fuel-claims/${claimId}/photo?as=dataUri`, { timeoutMs: 30000 })
      .then((result) => {
        if (cancelled) return;
        if (result?.dataUri) setUri(result.dataUri);
        else setMissing(true);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
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
