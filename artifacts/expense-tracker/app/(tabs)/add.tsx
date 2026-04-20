import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, MEMBERS, CATEGORIES, type Member, type Category } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { SectionCard } from "@/components/SectionCard";

type FormRow = { t: string; a: string; p: Member };

export default function AddExpenseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addExpenseRows, markActive, expenses } = useApp();
  const [rows, setRows] = useState<FormRow[]>([{ t: CATEGORIES[0], a: "", p: MEMBERS[0] }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const updateRow = (idx: number, key: keyof FormRow, val: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { t: CATEGORIES[0], a: "", p: MEMBERS[0] }]);
  };

  const removeRow = (idx: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const hasData = rows.some((r) => r.a.trim());
    if (!hasData) {
      Alert.alert("No amount", "Please enter at least one amount");
      return;
    }
    setSubmitting(true);
    setMessage("");
    const err = await addExpenseRows(rows);
    await Haptics.notificationAsync(
      err ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success
    );
    if (err) {
      setMessage(`Error: ${err}`);
    } else {
      await markActive(rows[0].p);
      setMessage("Saved!");
      setRows([{ t: CATEGORIES[0], a: "", p: MEMBERS[0] }]);
      setTimeout(() => setMessage(""), 2000);
    }
    setSubmitting(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Add Expense" subtitle="Log today's spending" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: bottomPad,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {message !== "" && (
          <View
            style={[
              styles.msgBanner,
              {
                backgroundColor: message.startsWith("Error")
                  ? colors.destructive + "22"
                  : colors.success + "22",
                borderColor: message.startsWith("Error")
                  ? colors.destructive
                  : colors.success,
              },
            ]}
          >
            <Text
              style={{
                color: message.startsWith("Error") ? colors.destructive : colors.success,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              {message}
            </Text>
          </View>
        )}

        {rows.map((row, idx) => (
          <SectionCard key={idx}>
            <View style={styles.rowHeader}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Entry {idx + 1}
              </Text>
              {rows.length > 1 && (
                <TouchableOpacity onPress={() => removeRow(idx)}>
                  <Feather name="x-circle" size={18} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.chipRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => updateRow(idx, "t", cat)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          row.t === cat ? colors.primary : colors.secondary,
                        borderColor:
                          row.t === cat ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: row.t === cat ? "#fff" : colors.foreground },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Amount */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Amount (₹)</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
              ]}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              value={row.a}
              onChangeText={(v) => updateRow(idx, "a", v)}
              keyboardType="numeric"
            />

            {/* Paid by */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Paid by</Text>
            <View style={styles.chipRow}>
              {MEMBERS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => updateRow(idx, "p", m)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: row.p === m ? colors.accent : colors.secondary,
                      borderColor: row.p === m ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: row.p === m ? "#fff" : colors.foreground },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>
        ))}

        {/* Add row button */}
        <TouchableOpacity
          onPress={addRow}
          style={[styles.addRowBtn, { borderColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color={colors.primary} />
          <Text style={[styles.addRowText, { color: colors.primary }]}>Add Another Entry</Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[
            styles.submitBtn,
            { backgroundColor: submitting ? colors.mutedForeground : colors.primary },
          ]}
        >
          <Feather name="save" size={18} color="#fff" />
          <Text style={styles.submitText}>
            {submitting ? "Saving..." : "Save Expenses"}
          </Text>
        </TouchableOpacity>

        {/* Recent expenses */}
        {expenses.length > 0 && (
          <SectionCard title="All Expenses">
            {expenses.slice(0, 20).map((e) => (
              <View
                key={e.id}
                style={[styles.expRow, { borderBottomColor: colors.border }]}
              >
                <View>
                  <Text style={[styles.expCat, { color: colors.foreground }]}>
                    {e.t || "Utility"}
                  </Text>
                  <Text style={[styles.expMeta, { color: colors.mutedForeground }]}>
                    {e.d}/{(e.m ?? 0) + 1} • {e.p}
                  </Text>
                </View>
                <Text style={[styles.expAmt, { color: colors.primary }]}>₹{e.a}</Text>
              </View>
            ))}
          </SectionCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  msgBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 12,
  },
  addRowText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  expRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  expCat: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  expMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  expAmt: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
