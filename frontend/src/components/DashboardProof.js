import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import Icon from './Icon';
import { useRules } from '../context/RulesContext';
import { checkAtPump, readableDistance } from '../utils/geo';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

// Resized + compressed so each photo is a few hundred KB at most (it travels to the server as base64).
async function toCompressedDataUri(uri) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 900 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  return `data:image/jpeg;base64,${result.base64}`;
}

// "04 Nov 2026, 01:10 pm" in the phone's own format, for the preview band.
function formatTaken(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * The cashier's proof of a fill-up: a photo of the vehicle's dashboard plus the GPS position where it was taken.
 * `value` is { photoDataUri, location } (location is null until it has been read); `onChange` receives the new value.
 * Disabled (with `lockedText` shown) until the details the proof belongs to have been filled in.
 */
const DEFAULT_LABELS = {
  empty: 'Photograph the vehicle dashboard',
  take: 'Take dashboard photo',
  retake: 'Retake dashboard photo',
  cameraDenied: 'Camera permission is required to photograph the dashboard. Please allow it in settings.',
  locationDenied: 'Location permission is required to record where the fill-up happened. Please allow it and try again.',
  note: 'The photo is camera-only and is stamped with the date, time and GPS location when the entry is added. It must be taken at the pump.',
};

export default function DashboardProof({ enabled, lockedText, value, onChange, labels: customLabels }) {
  const labels = { ...DEFAULT_LABELS, ...customLabels };
  const rules = useRules();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function readLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setError(labels.locationDenied);
      return null;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy };
  }

  // Must start from a button press (browsers block the camera otherwise): the camera opens first, then the location is read.
  async function takePhoto() {
    setError('');
    if (!enabled) return;
    setBusy(true);
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        setError(labels.cameraDenied);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled || !result.assets?.length) return;

      const photoDataUri = await toCompressedDataUri(result.assets[0].uri);
      let location = null;
      try {
        location = await readLocation();
      } catch {
        setError('Could not read the location. Check that location services are on, then tap "Retry location".');
      }
      // A photo taken away from the pump is not kept: it has to be taken again at the pump.
      const zone = location ? checkAtPump(rules, location) : null;
      if (zone && !zone.ok) {
        setError(zone.problem);
        onChange(null);
        return;
      }
      onChange({ photoDataUri, location, takenAt: new Date().toISOString(), distanceFromPump: zone?.checked ? zone.distance : null });
    } catch {
      setError('Something went wrong while taking the photo. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function retryLocation() {
    setError('');
    setBusy(true);
    try {
      const location = await readLocation();
      if (location) {
        const zone = checkAtPump(rules, location);
        if (!zone.ok) {
          setError(zone.problem);
          onChange(null); // the photo was taken before the phone was at the pump, so it has to be retaken there
        } else {
          onChange({ ...value, location, distanceFromPump: zone.checked ? zone.distance : null });
        }
      }
    } catch {
      setError('Could not read the location. Check that location services are on and try again.');
    } finally {
      setBusy(false);
    }
  }

  const hasPhoto = Boolean(value?.photoDataUri);

  return (
    <View>
      {hasPhoto ? (
        <View style={styles.preview}>
          <Image source={{ uri: value.photoDataUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {/* What the server will print on the photo when the entry is added (it uses its own clock for the time). */}
          <View style={styles.stampBand} pointerEvents="none">
            <Text style={styles.stampText}>{formatTaken(value.takenAt)}</Text>
            <Text style={styles.stampText}>
              {value.location
                ? `LAT ${value.location.latitude.toFixed(5)}  LON ${value.location.longitude.toFixed(5)}`
                : 'LOCATION MISSING'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.preview, styles.previewEmpty]}>
          <Icon name={enabled ? 'camera' : 'lock'} size={30} color={COLORS.textMuted} />
          <Text style={styles.previewText}>{enabled ? labels.empty : lockedText}</Text>
        </View>
      )}

      <Pressable
        style={[styles.button, (busy || !enabled) && styles.disabled]}
        disabled={busy || !enabled}
        onPress={takePhoto}
      >
        <Text style={styles.buttonText}>{busy ? 'Please wait…' : hasPhoto ? labels.retake : labels.take}</Text>
      </Pressable>

      {hasPhoto &&
        (value.location ? (
          <View style={styles.locationRow}>
            <Icon name="mapPin" size={14} color={COLORS.success} />
            <Text style={styles.locationOk}>
              Location captured ({value.location.latitude.toFixed(5)}, {value.location.longitude.toFixed(5)})
              {value.distanceFromPump != null ? ` · ${readableDistance(value.distanceFromPump)} from the pump` : ''}
            </Text>
          </View>
        ) : (
          <Pressable style={styles.locationRow} onPress={retryLocation} disabled={busy}>
            <Icon name="mapPinOff" size={14} color={COLORS.danger} />
            <Text style={styles.locationRetry}>Location missing — Retry location</Text>
          </Pressable>
        ))}

      <Text style={styles.stampNote}>{labels.note}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stampBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  stampText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  stampNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  preview: {
    width: '100%',
    height: 170,
    overflow: 'hidden',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  previewEmpty: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  previewText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  button: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  disabled: {
    opacity: 0.5,
  },
  locationOk: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  locationRetry: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '700',
  },
  error: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.danger,
  },
});
