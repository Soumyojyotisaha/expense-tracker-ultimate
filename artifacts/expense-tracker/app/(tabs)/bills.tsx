import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useApp, MONTHS, type BillScreenshotMap } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";

const daysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const formatDayKey = (year: number, month: number, day: number) => `${year}-${month}-${day}`;

export default function BillsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { billScreenshots, saveBillScreenshots } = useApp();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [saving, setSaving] = useState(false);

  const monthName = MONTHS[selectedMonth];
  const totalDays = daysInMonth(selectedMonth, selectedYear);
  const monthKeys = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [selectedMonth, selectedYear, totalDays]
  );

  const currentMonthData = useMemo(() => {
    const data: Record<number, BillScreenshotMap[string]> = {};
    monthKeys.forEach((day) => {
      data[day] = billScreenshots[formatDayKey(selectedYear, selectedMonth, day)] || {};
    });
    return data;
  }, [billScreenshots, monthKeys, selectedMonth, selectedYear]);

  const handleImagePick = async (day: number, type: "rent" | "electricity") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow gallery access to upload a bill screenshot.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    const uri = result.assets[0].uri;
    const key = formatDayKey(selectedYear, selectedMonth, day);
    const existing = billScreenshots[key] || {};
    const updated = {
      ...billScreenshots,
      [key]: {
        ...existing,
        ...(type === "rent" ? { rentUri: uri } : { electricityUri: uri }),
      },
    };

    setSaving(true);
    await saveBillScreenshots(updated);
    setSaving(false);
  };

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Header
        title="Bill Uploads"
        subtitle={`${monthName} ${selectedYear}`}
        profileImageUri={profile?.imageUri}
        onProfilePress={() => router.push("/profile")}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthPickerRow}>
          <TouchableOpacity onPress={handlePrevMonth} style={[styles.monthButton, { borderColor: colors.border }]}> 
            <Feather name="chevron-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {monthName} {selectedYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={[styles.monthButton, { borderColor: colors.border }]}> 
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.instructions, { backgroundColor: colors.muted + "22", borderColor: colors.border }]}> 
          <Text style={[styles.instructionsText, { color: colors.foreground }]}>Save one screenshot per day for rent and electricity bills.</Text>
          <Text style={[styles.instructionsText, { color: colors.mutedForeground }]}>Upload each bill once per day and review thumbnails below.</Text>
        </View>

        {monthKeys.map((day) => {
          const entry = currentMonthData[day] || {};
          return (
            <View key={day} style={[styles.dayRow, { borderColor: colors.border }]}> 
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabel, { color: colors.foreground }]}>Day {day}</Text>
                <Text style={[styles.dayInfo, { color: colors.mutedForeground }]}>Rent + Electricity</Text>
              </View>

              <View style={styles.uploadRow}>
                <TouchableOpacity
                  style={[styles.uploadCard, { backgroundColor: colors.muted }]}
                  onPress={() => handleImagePick(day, "rent")}
                >
                  {entry.rentUri ? (
                    <Image source={{ uri: entry.rentUri }} style={styles.thumbnail} />
                  ) : (
                    <Text style={[styles.uploadLabel, { color: colors.foreground }]}>Upload Rent</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadCard, { backgroundColor: colors.muted }]}
                  onPress={() => handleImagePick(day, "electricity")}
                >
                  {entry.electricityUri ? (
                    <Image source={{ uri: entry.electricityUri }} style={styles.thumbnail} />
                  ) : (
                    <Text style={[styles.uploadLabel, { color: colors.foreground }]}>Upload Electricity</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {saving && (
          <View style={[styles.savingBanner, { backgroundColor: colors.primary + "22" }]}> 
            <Text style={[styles.savingText, { color: colors.primary }]}>Saving bill screenshot…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 12,
  },
  monthButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  instructions: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  instructionsText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_500Medium",
  },
  dayRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  dayInfo: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  uploadRow: {
    flexDirection: "row",
    gap: 12,
  },
  uploadCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  uploadLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  thumbnail: {
    width: "100%",
    height: 88,
    borderRadius: 14,
  },
  savingBanner: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  savingText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
