import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type Item = {
  key: string;
  label: string;
};

type TabSwitchProps = {
  items: Item[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function TabSwitch({ items, activeKey, onChange }: TabSwitchProps) {
  return (
    <View style={styles.row}>
      {items.map((item) => {
        const active = item.key === activeKey;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={() => onChange(item.key)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 6,
    borderRadius: 22,
    backgroundColor: "rgba(7, 12, 20, 0.82)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(130, 151, 180, 0.12)",
  },
  activeTab: {
    backgroundColor: colors.accentSoft,
  },
  label: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  activeLabel: {
    color: colors.text,
  },
});
