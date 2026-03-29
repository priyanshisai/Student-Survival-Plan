import { type PropsWithChildren, type ReactNode } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";

type AppScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  stickyHeaderIndices?: number[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollViewStyle?: StyleProp<ViewStyle>;
}>;

export function AppScreen({
  title,
  subtitle,
  rightSlot,
  stickyHeaderIndices,
  contentContainerStyle,
  scrollViewStyle,
  children,
}: AppScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
        <View style={styles.meshOne} />
        <View style={styles.meshTwo} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        stickyHeaderIndices={stickyHeaderIndices}
        style={scrollViewStyle}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightSlot ? <View>{rightSlot}</View> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  glow: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.9,
  },
  glowTop: {
    width: 300,
    height: 300,
    top: -60,
    right: -30,
    backgroundColor: "rgba(34, 211, 238, 0.18)",
  },
  glowBottom: {
    width: 260,
    height: 260,
    bottom: 70,
    left: -80,
    backgroundColor: "rgba(59, 130, 246, 0.18)",
  },
  meshOne: {
    position: "absolute",
    top: 120,
    left: -20,
    right: 80,
    height: 260,
    borderRadius: 36,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    transform: [{ rotate: "-8deg" }],
  },
  meshTwo: {
    position: "absolute",
    bottom: 120,
    left: 90,
    right: -10,
    height: 220,
    borderRadius: 36,
    backgroundColor: "rgba(45, 212, 191, 0.08)",
    transform: [{ rotate: "10deg" }],
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
