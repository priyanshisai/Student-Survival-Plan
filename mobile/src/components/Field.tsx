import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/theme/colors";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
};

export function Field({ label, value, onChangeText, placeholder, multiline = false }: FieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    color: colors.text,
  },
  multiline: {
    minHeight: 110,
    paddingTop: 14,
    textAlignVertical: "top",
  },
});
