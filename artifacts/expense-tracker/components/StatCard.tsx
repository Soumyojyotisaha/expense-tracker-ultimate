import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  onPress?: () => void;
  accent?: boolean;
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  onPress,
  accent = false,
}: StatCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary : colors.card,
          borderColor: accent ? colors.primary : colors.border,
          shadowColor: colors.primary,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: accent
              ? "rgba(255,255,255,0.2)"
              : colors.secondary,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={18}
          color={accent ? "#fff" : (iconColor || colors.primary)}
        />
      </View>
      <Text
        style={[
          styles.title,
          { color: accent ? "rgba(255,255,255,0.8)" : colors.mutedForeground },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.value,
          { color: accent ? "#fff" : colors.foreground },
        ]}
      >
        {value}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            { color: accent ? "rgba(255,255,255,0.7)" : colors.mutedForeground },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 140,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
