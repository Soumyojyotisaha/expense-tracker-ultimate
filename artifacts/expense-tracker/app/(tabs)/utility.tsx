import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  useApp,
  MEMBERS,
  type Member,
  type UtilityItem,
  type UtilPickMap,
  type PaidMap,
} from "@/context/AppContext";
import { Header } from "@/components/Header";
import { SectionCard } from "@/components/SectionCard";

export default function UtilityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { utility, utilPick, paid, saveUtilityData, savePaid } = useApp();

  const [items, setItems] = useState<UtilityItem[]>(utility);
  const [picks, setPicks] = useState<UtilPickMap>({ ...utilPick });
  const [paidState, setPaidState] = useState<PaidMap>({ ...paid });
  const [saved, setSaved] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [deletedItems, setDeletedItems] = useState<{ item: UtilityItem; index: number }[]>([]);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const utilShare = (name: Member) => {
    const arr = picks[name] || [];
    
    // Calculate base items: indices 0-3 and any items beyond 4
    let baseAmount = 0;
    arr.forEach((i) => {
      if ((i >= 0 && i <= 3) || i > 4) {
        baseAmount += items[i]?.a || 0;
      }
    });
    const base = baseAmount / 3;
    
    // Calculate extra: item at index 4 (Harsh only)
    const extra = arr.includes(4) && items[4] ? items[4].a : 0;
    
    return base + extra;
  };

  const totalUtil = useMemo(() => 
    MEMBERS.reduce((sum, m) => sum + utilShare(m), 0), 
    [picks, items]
  );

  const handleSave = async () => {
    await saveUtilityData(items, picks);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePaySave = async () => {
    await savePaid(paidState);
    setShowPayModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const togglePick = (member: Member, idx: number) => {
    const cur = picks[member] || [];
    const next = cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx];
    setPicks((p) => ({ ...p, [member]: next }));
  };

  const updateItem = (idx: number, key: keyof UtilityItem, val: string) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, [key]: key === "a" ? Number(val) || 0 : val } : it
      )
    );
  };

  const addItem = () => setItems((p) => [...p, { n: "", a: 0 }]);
  
  const confirmDelete = (idx: number) => {
    const itemName = items[idx].n || `Item ${idx + 1}`;
    Alert.alert(
      "Delete Item?",
      `Do you really want to delete "${itemName}"?`,
      [
        {
          text: "No",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => removeItem(idx),
          style: "destructive",
        },
      ]
    );
  };

  const removeItem = (idx: number) => {
    setDeletedItems((prev) => [...prev, { item: items[idx], index: idx }]);
    setItems((p) => p.filter((_, i) => i !== idx));
  };

  const undoDelete = () => {
    if (deletedItems.length === 0) return;
    const last = deletedItems[deletedItems.length - 1];
    const newItems = [...items];
    newItems.splice(last.index, 0, last.item);
    setItems(newItems);
    setDeletedItems((prev) => prev.slice(0, -1));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Utility"
        subtitle="Track shared bills"
        profileImageUri={profile?.imageUri}
        onProfilePress={() => router.push("/profile")}

        right={
          <TouchableOpacity
            onPress={() => setShowPayModal(true)}
            style={[styles.payBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="check-circle" size={14} color="#fff" />
            <Text style={styles.payBtnText}>Mark Paid</Text>
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
        {/* Summary */}
        <SectionCard title="Total Utility">
          <Text style={[styles.totalAmt, { color: colors.primary }]}>
            ₹{totalUtil.toFixed(2)}
          </Text>
          <View style={styles.memberShares}>
            {MEMBERS.map((m) => (
              <View
                key={m}
                style={[styles.shareRow, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.avatarTxt, { color: colors.primary }]}>{m[0]}</Text>
                </View>
                <Text style={[styles.shareName, { color: colors.foreground }]}>{m}</Text>
                <Text style={[styles.shareAmt, { color: colors.primary }]}>
                  ₹{utilShare(m).toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.paidBadge,
                    {
                      backgroundColor: paid[m]
                        ? colors.success + "22"
                        : colors.warning + "22",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: paid[m] ? colors.success : colors.warning,
                      fontSize: 11,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    {paid[m] ? "Paid" : "Due"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Utility items */}
        <SectionCard title="Utility Items">
          {items.map((item, idx) => (
            <View
              key={idx}
              style={[styles.itemRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.itemInputs}>
                <TextInput
                  style={[
                    styles.itemNameInput,
                    { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
                  ]}
                  value={item.n}
                  onChangeText={(v) => updateItem(idx, "n", v)}
                  placeholder="Item name"
                  placeholderTextColor={colors.mutedForeground}
                />
                <TextInput
                  style={[
                    styles.itemAmtInput,
                    { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
                  ]}
                  value={String(item.a)}
                  onChangeText={(v) => updateItem(idx, "a", v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <TouchableOpacity onPress={() => confirmDelete(idx)} style={styles.delBtn}>
                <Feather name="trash-2" size={14} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={addItem}
            style={[styles.addBtn, { borderColor: colors.primary }]}
          >
            <Feather name="plus" size={14} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Item</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Member picks */}
        <SectionCard title="Who Shares What">
          {MEMBERS.map((m) => (
            <View key={m} style={styles.memberPickRow}>
              <View style={styles.memberPickHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.avatarTxt, { color: colors.primary }]}>{m[0]}</Text>
                </View>
                <View style={styles.nameAndAmount}>
                  <Text style={[styles.memberPickName, { color: colors.foreground }]}>{m}</Text>
                  <Text style={[styles.memberAmount, { color: colors.primary }]}>
                    ₹{utilShare(m).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.pickChips}>
                {items.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => togglePick(m, idx)}
                    style={[
                      styles.pickChip,
                      {
                        backgroundColor: (picks[m] || []).includes(idx)
                          ? colors.primary
                          : colors.secondary,
                        borderColor: (picks[m] || []).includes(idx)
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickChipText,
                        {
                          color: (picks[m] || []).includes(idx) ? "#fff" : colors.foreground,
                        },
                      ]}
                    >
                      {item.n || `Item ${idx + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </SectionCard>

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: saved ? colors.success : colors.primary }]}
        >
          <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{saved ? "Saved!" : "Save Utility"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Pay Modal */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Utility Payment Status
            </Text>
            {MEMBERS.map((m) => (
              <View
                key={m}
                style={[styles.switchRow, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.avatarTxt, { color: colors.primary }]}>{m[0]}</Text>
                </View>
                <Text style={[styles.switchName, { color: colors.foreground }]}>{m}</Text>
                <Switch
                  value={paidState[m] || false}
                  onValueChange={(v) => setPaidState((p) => ({ ...p, [m]: v }))}
                  trackColor={{ false: colors.border, true: colors.success }}
                  thumbColor={paidState[m] ? "#fff" : colors.mutedForeground}
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={handlePaySave}
              style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPayModal(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  payBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  totalAmt: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  memberShares: {},
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
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
  shareName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  shareAmt: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginRight: 8,
  },
  paidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  itemInputs: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  itemNameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  itemAmtInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  delBtn: { padding: 4 },
  undoNotification: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  undoText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  memberPickRow: { marginBottom: 14 },
  memberPickHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  memberPickName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  nameAndAmount: {
    flex: 1,
  },
  memberAmount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  pickChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pickChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
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
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  switchName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  modalSaveBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalSaveText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cancelText: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    paddingVertical: 4,
  },
});
