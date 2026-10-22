import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import ClaimPhoto from '../components/ClaimPhoto';
import VehicleNumberInput from '../components/VehicleNumberInput';
import { FUEL_RATE_PER_LITRE, MIN_FUEL_AMOUNT_RUPEES } from '../storage/customerStore';
import { VEHICLE_FORMAT_ERROR, vehicleLabel } from '../utils/vehicles';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

const STATUS_LABEL = { pending: 'Awaiting cashier approval', approved: 'Approved', rejected: 'Rejected' };

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Resized + compressed so each photo is ~100-200KB; AsyncStorage handles big values poorly.
async function toCompressedDataUri(uri) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 900 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  return `data:image/jpeg;base64,${result.base64}`;
}

export default function UploadFuelScreen({ customer, claims, onSubmit, onAddVehicle }) {
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [addVehicleError, setAddVehicleError] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [location, setLocation] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const myClaims = claims.filter((c) => c.customerPhone === customer.phone);
  const hasPending = myClaims.some((c) => c.status === 'pending');
  const amountNumber = Number(amount);
  const amountValid = amountNumber >= MIN_FUEL_AMOUNT_RUPEES;
  const estimatedPoints = amountValid ? Math.round(amountNumber / FUEL_RATE_PER_LITRE) : 0;
  const selectedVehicle = customer.vehicles.find((v) => v.id === vehicleId);
  const canCapture = Boolean(selectedVehicle) && amountValid;

  function cancelAddVehicle() {
    setAddingVehicle(false);
    setNewVehicleNumber('');
    setNewVehicleModel('');
    setAddVehicleError('');
  }

  async function saveNewVehicle() {
    setAddVehicleError('');
    try {
      const updated = await onAddVehicle(customer.phone, { number: newVehicleNumber, model: newVehicleModel });
      const added = updated.vehicles[updated.vehicles.length - 1];
      setVehicleId(added.id);
      cancelAddVehicle();
    } catch (err) {
      setAddVehicleError(err.message);
    }
  }

  async function fetchLocation() {
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocation(null);
        setError('Location permission is required so the cashier can verify where you fuelled. Please allow it and try again.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    } catch {
      setLocation(null);
      setError('Could not get your location. Check that location services are on and try again.');
    }
  }

  // Must start from the button press (browsers block the camera otherwise), so
  // the camera opens first and location is requested once the photo is taken.
  async function takePhoto() {
    setError('');
    setSuccess('');
    if (!canCapture) {
      setError('Select your vehicle and enter the fuel amount before taking the photo.');
      return;
    }
    setBusy(true);
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        setError('Camera permission is required to photograph your dashboard. Please allow it in settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled || !result.assets?.length) return;

      setPhotoUri(await toCompressedDataUri(result.assets[0].uri));
      await fetchLocation();
    } catch {
      setError('Something went wrong while taking the photo. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setError('');
    setSuccess('');
    if (!selectedVehicle) {
      setError('Select the vehicle you fuelled.');
      return;
    }
    if (!amountValid) {
      setError(`Enter the fuel amount you paid (minimum ₹${MIN_FUEL_AMOUNT_RUPEES}).`);
      return;
    }
    if (!photoUri) {
      setError('Take a photo of your vehicle dashboard first.');
      return;
    }
    if (!location) {
      setError('Location is missing. Tap "Retry location" before submitting.');
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        customerPhone: customer.phone,
        vehicleId: selectedVehicle.id,
        amountRupees: amountNumber,
        photoDataUri: photoUri,
        location,
      });
      setPhotoUri(null);
      setLocation(null);
      setVehicleId(null);
      setAmount('');
      setSuccess('Sent to the cashier for approval. You will get your points once it is approved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Fuel Proof</Text>
        <Text style={styles.headerSubtitle}>Just filled up? Photograph your dashboard for the cashier to approve.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.stepLabel}>1. Select your vehicle *</Text>
          {customer.vehicles.length === 0 && !addingVehicle ? (
            <Text style={styles.hint}>You haven't added a vehicle yet — add one to continue.</Text>
          ) : null}
          <View style={styles.chipRow}>
            {customer.vehicles.map((v) => (
              <Pressable
                key={v.id}
                style={[styles.chip, vehicleId === v.id && styles.chipActive]}
                onPress={() => setVehicleId(v.id)}
              >
                <Text style={[styles.chipText, vehicleId === v.id && styles.chipTextActive]}>{vehicleLabel(v)}</Text>
              </Pressable>
            ))}
            {!addingVehicle && (
              <Pressable style={[styles.chip, styles.chipAdd]} onPress={() => setAddingVehicle(true)}>
                <Text style={styles.chipAddText}>+ Add vehicle</Text>
              </Pressable>
            )}
          </View>

          {addingVehicle && (
            <View style={styles.addVehicleForm}>
              <VehicleNumberInput
                style={styles.input}
                value={newVehicleNumber}
                onChangeText={setNewVehicleNumber}
                placeholder="Vehicle number"
                required
              />
              <TextInput
                style={[styles.input, styles.inputGap]}
                value={newVehicleModel}
                onChangeText={setNewVehicleModel}
                placeholder="Vehicle model (optional)"
                placeholderTextColor={COLORS.textMuted}
              />
              {addVehicleError && addVehicleError !== VEHICLE_FORMAT_ERROR ? (
                <Text style={styles.error}>{addVehicleError}</Text>
              ) : null}
              <View style={styles.addVehicleActions}>
                <Pressable style={[styles.addVehicleButton, styles.addVehicleCancel]} onPress={cancelAddVehicle}>
                  <Text style={styles.addVehicleCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.addVehicleButton, styles.addVehicleSave]} onPress={saveNewVehicle}>
                  <Text style={styles.addVehicleSaveText}>Save vehicle</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Text style={styles.stepLabel}>2. Fuel amount paid (₹) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 600"
            placeholderTextColor={COLORS.textMuted}
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.hint}>
            Minimum ₹{MIN_FUEL_AMOUNT_RUPEES}. Rate ₹{FUEL_RATE_PER_LITRE}/ltr
            {estimatedPoints > 0 ? ` · about ${estimatedPoints} points once approved` : ''}.
          </Text>

          <Text style={styles.stepLabel}>3. Dashboard photo *</Text>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={[styles.preview, styles.previewEmpty]}>
              <Text style={styles.previewEmptyIcon}>{canCapture ? '📸' : '🔒'}</Text>
              <Text style={styles.previewEmptyText}>
                {canCapture ? 'No photo yet' : 'Select a vehicle and enter the amount to unlock the camera'}
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.secondaryButton, (busy || !canCapture) && styles.disabled]}
            disabled={busy || !canCapture}
            onPress={takePhoto}
          >
            <Text style={styles.secondaryButtonText}>
              {photoUri ? 'Retake photo' : Platform.OS === 'web' ? 'Add dashboard photo' : 'Take dashboard photo'}
            </Text>
          </Pressable>

          {photoUri ? (
            <View style={styles.locationRow}>
              {location ? (
                <Text style={styles.locationOk}>
                  📍 Location captured ({location.latitude.toFixed(5)}, {location.longitude.toFixed(5)})
                </Text>
              ) : (
                <Pressable onPress={fetchLocation} disabled={busy}>
                  <Text style={styles.locationRetry}>📍 Location missing — Retry location</Text>
                </Pressable>
              )}
            </View>
          ) : null}
          <View style={styles.spacer} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          {hasPending && !success ? (
            <Text style={styles.pendingNote}>You have an upload awaiting approval. You can send another once it is reviewed.</Text>
          ) : null}

          <Pressable
            style={[styles.primaryButton, (busy || hasPending) && styles.disabled]}
            disabled={busy || hasPending}
            onPress={submit}
          >
            <Text style={styles.primaryButtonText}>{busy ? 'Please wait…' : 'Send to Cashier'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>My uploads</Text>
        {myClaims.length === 0 ? (
          <Text style={styles.emptyText}>No uploads yet.</Text>
        ) : (
          myClaims.map((claim) => (
            <View key={claim.id} style={styles.claimRow}>
              <ClaimPhoto claimId={claim.id} style={styles.thumb} />
              <View style={styles.claimText}>
                <Text style={styles.claimAmount}>₹{claim.claimedAmountRupees.toLocaleString()}</Text>
                <Text style={styles.claimDate}>{formatDate(claim.submittedDate)}</Text>
                <Text style={[styles.claimStatus, styles[`status_${claim.status}`]]}>
                  {STATUS_LABEL[claim.status]}
                  {claim.status === 'approved' ? ` · +${claim.pointsAwarded} pts` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  previewEmpty: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmptyIcon: {
    fontSize: 36,
  },
  previewEmptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  secondaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  locationRow: {
    marginTop: SPACING.md,
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
  stepLabel: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chipTextActive: {
    color: COLORS.textOnPrimary,
  },
  chipAdd: {
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  chipAddText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addVehicleForm: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
  },
  inputGap: {
    marginTop: SPACING.sm,
  },
  addVehicleActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  addVehicleButton: {
    flex: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  addVehicleCancel: {
    backgroundColor: COLORS.surface,
  },
  addVehicleCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  addVehicleSave: {
    backgroundColor: COLORS.success,
  },
  addVehicleSaveText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  spacer: {
    height: SPACING.md,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.label,
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  error: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  success: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  pendingNote: {
    color: '#B45309',
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
  sectionLabel: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT.body,
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  thumb: {
    width: 64,
    height: 64,
  },
  claimText: {
    flex: 1,
  },
  claimAmount: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  claimDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  claimStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  status_pending: {
    color: '#B45309',
  },
  status_approved: {
    color: COLORS.success,
  },
  status_rejected: {
    color: COLORS.danger,
  },
});
