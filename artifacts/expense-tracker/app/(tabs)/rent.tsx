import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, MEMBERS, MONTHS, type ShareMap } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";

export default function RentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rent, deposit, share, saveRentData } = useApp();

  const [rentVal, setRentVal] = useState(String(rent));
  const [depVal, setDepVal] = useState(String(deposit));
  const [shareVals, setShareVals] = useState<Record<string, string>>(
    Object.fromEntries(MEMBERS.map((m) => [m, String(share[m] || 0)]))
  );
  const [saved, setSaved] = useState(false);

  const now = new Date();
  const curMonth = now.getMonth();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const handleSave = async () => {
    const r = Number(rentVal) || 0;
    const d = Number(depVal) || 0;
    const s = Object.fromEntries(
      MEMBERS.map((m) => [m, Number(shareVals[m]) || 0])
    ) as ShareMap;
    await saveRentData(r, d, s);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const monthLabel = MONTHS[curMonth];
  const perHead = Math.round((Number(rentVal) || 0) / 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Rent" subtitle={`${monthLabel} ${now.getFullYear()}`} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: bottomPad,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.statsRow}>
          <StatCard
            title="Total Rent"
            value={`₹${rent}`}
            icon="home"
            accent
          />
          <StatCard
            title="Per Head"
            value={`₹${Math.round(rent / 3)}`}
            icon="user"
          />
        </View>

        <SectionCard title="Rent Details">
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Total Monthly Rent (₹)
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
            ]}
            value={rentVal}
            onChangeText={setRentVal}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Security Deposit (₹)
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
            ]}
            value={depVal}
            onChangeText={setDepVal}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
          />
        </SectionCard>

        <SectionCard title="Extra Charges per Person">
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Add any extra charges specific to each member (cab, food, etc.)
          </Text>
          {MEMBERS.map((m) => (
            <View key={m} style={styles.memberRow}>
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.avatarTxt, { color: colors.primary }]}>{m[0]}</Text>
              </View>
              <Text style={[styles.memberName, { color: colors.foreground }]}>{m}</Text>
              <TextInput
                style={[
                  styles.amtInput,
                  { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
                ]}
                value={shareVals[m]}
                onChangeText={(v) => setShareVals((p) => ({ ...p, [m]: v }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          ))}
        </SectionCard>

        {/* Monthly breakdown */}
        <SectionCard title="Monthly Breakdown">
          {MONTHS.map((mn, i) => (
            <View
              key={mn}
              style={[styles.monthRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.monthLeft}>
                <Text style={[styles.monthName, { color: colors.foreground }]}>
                  {mn}
                </Text>
              </View>
              <Text
                style={[
                  styles.monthStatus,
                  {
                    color:
                      i < curMonth
                        ? colors.success
                        : i === curMonth
                        ? colors.warning
                        : colors.mutedForeground,
                  },
                ]}
              >
                {i < curMonth ? "Paid" : i === curMonth ? "Current" : "Upcoming"}
              </Text>
              <Text style={[styles.monthAmt, { color: colors.primary }]}>
                ₹{rent}
              </Text>
            </View>
          ))}
        </SectionCard>

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: saved ? colors.success : colors.primary }]}
        >
          <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
          <Text style={styles.saveText}>{saved ? "Saved!" : "Save Rent Details"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  amtInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 90,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  monthLeft: { width: 40 },
  monthName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  monthStatus: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  monthAmt: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
