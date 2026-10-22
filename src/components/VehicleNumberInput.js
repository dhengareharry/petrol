import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  VEHICLE_FORMAT_ERROR,
  VEHICLE_FORMAT_HINT,
  formatVehicleNumber,
  sanitizeVehicleInput,
} from '../utils/vehicles';
import { COLORS } from '../theme';

export default function VehicleNumberInput({ value, onChangeText, style, placeholder = 'Vehicle number', required }) {
  const [touched, setTouched] = useState(false);
  const formatted = formatVehicleNumber(value);
  const showError = touched && value.trim() !== '' && !formatted;

  return (
    <View>
      <TextInput
        style={[style, showError && styles.inputError, formatted && styles.inputValid]}
        value={value}
        onChangeText={(text) => onChangeText(sanitizeVehicleInput(text))}
        onBlur={() => setTouched(true)}
        placeholder={required ? `${placeholder} *` : placeholder}
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={14}
      />
      {showError ? (
        <Text style={styles.error}>{VEHICLE_FORMAT_ERROR}</Text>
      ) : formatted ? (
        <Text style={styles.valid}>✓ Valid format</Text>
      ) : (
        <Text style={styles.hint}>Format: {VEHICLE_FORMAT_HINT}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputError: {
    borderColor: COLORS.danger,
  },
  inputValid: {
    borderColor: COLORS.success,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  error: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 4,
  },
  valid: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 4,
  },
});
