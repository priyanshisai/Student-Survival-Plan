import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "solid" | "soft";
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "solid",
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, variant === "soft" ? styles.soft : styles.solid, disabled && styles.disabled]}
    >
      <Text style={[styles.label, variant === "soft" ? styles.softLabel : styles.solidLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  solid: {
    backgroundColor: colors.accent,
    borderColor: "rgba(255,255,255,0.12)",
  },
  soft: {
    backgroundColor: colors.accentSoft,
    borderColor: "rgba(118, 206, 255, 0.22)",
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  solidLabel: {
    color: colors.text,
  },
  softLabel: {
    color: colors.accent,
  },
});
