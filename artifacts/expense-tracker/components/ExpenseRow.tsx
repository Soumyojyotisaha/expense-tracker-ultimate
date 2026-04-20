import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { MONTHS, type Expense } from "@/context/AppContext";

type Props = {
  expense: Expense;
};

export function ExpenseRow({ expense }: Props) {
  const colors = useColors();
  const { removeExpense, editExpense } = useApp();
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(expense.a));

  const handleDelete = () => {
    Alert.alert("Delete expense?", `₹${expense.a} - ${expense.t}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (expense.id) await removeExpense(expense.id);
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (expense.id) {
      await editExpense(expense.id, "a", editVal);
    }
    setEditing(false);
  };

  const monthName =
    expense.m !== undefined
      ? MONTHS[expense.m as number]
      : "";

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.catDot, { backgroundColor: colors.primary + "33" }]}
      >
        <Feather name="shopping-bag" size={12} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.category, { color: colors.foreground }]}>
          {expense.t || "Utility"}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {expense.d} {monthName} • {expense.p}
        </Text>
      </View>
      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            style={[
              styles.editInput,
              { borderColor: colors.primary, color: colors.foreground },
            ]}
            value={editVal}
            onChangeText={setEditVal}
            keyboardType="numeric"
            autoFocus
          />
          <TouchableOpacity onPress={handleSaveEdit}>
            <Feather name="check" size={18} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.amtRow}>
          <Text style={[styles.amount, { color: colors.primary }]}>
            ₹{expense.a}
          </Text>
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={styles.actionBtn}
          >
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Feather name="trash-2" size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  catDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  amtRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  amount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  actionBtn: {
    padding: 4,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 70,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
