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
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useApp, MEMBERS, MONTHS, type ShareMap } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";

export default function RentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { rent, deposit, share, rentMonthPaid, saveRentData, saveRentMonthPaid } = useApp();

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

  const totalShare = MEMBERS.reduce((sum, m) => sum + (Number(shareVals[m]) || 0), 0);
  const rentNum = Number(rentVal) || 0;
  const isShareValid = totalShare === rentNum;

  const handleAutoDistribute = () => {
    const perMember = rentNum / MEMBERS.length;
    setShareVals(
      Object.fromEntries(MEMBERS.map((m) => [m, perMember.toFixed(2)]))
    );
  };

  const toggleRentMonth = async (i: number) => {
    if (i < curMonth) return; // past months are locked
    const next = { ...rentMonthPaid, [i]: !rentMonthPaid[i] };
    await saveRentMonthPaid(next);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Rent"
        subtitle={`${monthLabel} ${now.getFullYear()}`}
        profileImageUri={profile?.imageUri}
        onProfilePress={() => router.push("/profile")}
        right={
          <TouchableOpacity
            onPress={() => router.push("/bills")}
            style={[styles.headerAction, { backgroundColor: colors.secondary }]}
          >
            <Feather name="file-text" size={18} color={colors.primary} />
          </TouchableOpacity>
        }
      />
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

        <SectionCard title="Rent Share per Member">
          <View style={[styles.shareValidation, { borderColor: isShareValid ? colors.success : colors.warning, backgroundColor: isShareValid ? colors.success + "12" : colors.warning + "12" }]}>
            <View>
              <Text style={[styles.validationLabel, { color: colors.mutedForeground }]}>Shares Total</Text>
              <Text style={[styles.validationAmount, { color: isShareValid ? colors.success : colors.warning }]}>₹{totalShare.toFixed(2)}</Text>
            </View>
            <Text style={[styles.validationSlash, { color: colors.border }]}>/</Text>
            <View>
              <Text style={[styles.validationLabel, { color: colors.mutedForeground }]}>Total Rent</Text>
              <Text style={[styles.validationAmount, { color: colors.primary }]}>₹{rentNum.toFixed(2)}</Text>
            </View>
          </View>
          {!isShareValid && rentNum > 0 && (
            <TouchableOpacity
              onPress={handleAutoDistribute}
              style={[styles.autoDistributeBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="shuffle" size={14} color="#fff" />
              <Text style={styles.autoDistributeText}>Auto Distribute Equally</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Set each member's individual rent share for this month.
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

        <SectionCard title="Bill Uploads">
          <TouchableOpacity
            onPress={() => router.push("/bills")}
            style={[styles.billPageBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="file-text" size={16} color="#fff" />
            <Text style={styles.billPageText}>Open Rent / Electricity Bill Uploads</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Monthly breakdown — last 3, current, next 3 */}
        <SectionCard title="Monthly Breakdown">
          {MONTHS.map((mn, i) => {
            const start = Math.max(0, curMonth - 3);
            const end = Math.min(11, curMonth + 3);
            if (i < start || i > end) return null;

            const isPast = i < curMonth;
            const isCurrent = i === curMonth;
            const isLast = i === end;
            // past months are always considered paid and locked
            const isPaid = isPast ? true : !!rentMonthPaid[i];
            const isLocked = isPast;

            const statusColor = isPast
              ? colors.success
              : isCurrent
              ? colors.warning
              : colors.mutedForeground;

            const checkColor = isPaid ? colors.success : colors.border;

            return (
              <View
                key={mn}
                style={[
                  styles.monthRow,
                  { borderBottomColor: isLast ? "transparent" : colors.border },
                ]}
              >
                {/* Checkbox */}
                <TouchableOpacity
                  onPress={() => toggleRentMonth(i)}
                  disabled={isLocked}
                  style={styles.checkbox}
                  activeOpacity={isLocked ? 1 : 0.6}
                >
                  <Feather
                    name={isPaid ? "check-square" : "square"}
                    size={20}
                    color={checkColor}
                  />
                </TouchableOpacity>

                {/* Month name */}
                <Text style={[styles.monthName, { color: colors.foreground }]}>
                  {mn}
                </Text>

                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                  <Text style={[styles.monthStatus, { color: statusColor }]}>
                    {isPast ? "Paid" : isCurrent ? "Current" : "Upcoming"}
                  </Text>
                </View>

                {/* Amount */}
                <Text style={[styles.monthAmt, { color: colors.primary }]}>
                  ₹{rent}
                </Text>
              </View>
            );
          })}
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
  shareValidation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16,
  },
  validationLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  validationAmount: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  validationSlash: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
  },
  autoDistributeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  autoDistributeText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  billPageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 14,
    gap: 8,
  },
  billPageText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  billLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  billLinkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
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
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: 10,
  },
  checkbox: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  monthName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  monthStatus: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  monthAmt: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    minWidth: 54,
    textAlign: "right",
  },
  headerAction: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
