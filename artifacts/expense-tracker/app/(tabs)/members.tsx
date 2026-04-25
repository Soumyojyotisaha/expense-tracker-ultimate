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
import { useApp, MEMBERS, MONTHS } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { SectionCard } from "@/components/SectionCard";

export default function MembersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { member, logout, profile } = useAuth();
  const { expenses, grid, utility, utilPick, share, notes, maid, addNote, editNote, deleteNote, toggleCompleted, saveMaid } = useApp();
  const [noteTxt, setNoteTxt] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "maid">("overview");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const now = new Date();
  const curMonth = now.getMonth();

  const monthTotal = Array.from({ length: 31 }, (_, i) => grid[`${curMonth}-${i + 1}`] || 0).reduce(
    (a, b) => a + b,
    0
  );

  const utilShare = (name: string) => {
    const arr = utilPick[name as keyof typeof utilPick] || [];
    const base = arr.filter((i) => i < 4).reduce((s, i) => s + utility[i].a, 0) / 3;
    return name === "Harsh" ? base + utility[4].a : base;
  };

  const handleAddNote = async () => {
    if (!noteTxt.trim()) return;
    await addNote(noteTxt.trim());
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteTxt("");
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 1500);
  };

  const handleAddLeave = async () => {
    if (!leaveDate) return;
    const updated = { ...maid, leaves: [...maid.leaves, leaveDate] };
    await saveMaid(updated);
    setLeaveDate("");
  };

  const handleEditNote = (id: number, txt: string) => {
    setEditingNoteId(id);
    setEditingText(txt);
  };

  const handleSaveEdit = async () => {
    if (editingNoteId !== null && editingText.trim()) {
      await editNote(editingNoteId, editingText.trim());
      setEditingNoteId(null);
      setEditingText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  const handleDeleteNote = async (id: number) => {
    await deleteNote(id);
  };

  const handleToggleCompleted = async (id: number) => {
    await toggleCompleted(id);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Members"
        subtitle={member ? `${member} • 3 flatmates` : "3 flatmates"}
        profileImageUri={profile?.imageUri}
        onProfilePress={() => router.push("/profile")}
        right={
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.secondary }]}> 
            <Text style={[styles.logoutText, { color: colors.primary }]}>Logout</Text>
          </TouchableOpacity>
        }
      />
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        {(["overview", "notes", "maid"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[
              styles.tabItem,
              activeTab === t && { borderBottomColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === t ? colors.primary : colors.mutedForeground },
              ]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: bottomPad,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "overview" && (
          <>
            {MEMBERS.map((m) => {
              const personalExp = expenses
                .filter(
                  (e) =>
                    e.p === m &&
                    Number(e.m) === curMonth &&
                    Number(e.y) === now.getFullYear()
                )
                .reduce((s, e) => s + Number(e.a), 0);
              const totalOwed = (monthTotal / 3) + utilShare(m) + (share[m] || 0);

              return (
                <SectionCard key={m}>
                  <View style={styles.memberHeader}>
                    <View style={[styles.bigAvatar, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.bigAvatarTxt, { color: colors.primary }]}>{m[0]}</Text>
                    </View>
                    <View>
                      <Text style={[styles.memberName, { color: colors.foreground }]}>{m}</Text>
                      <Text style={[styles.memberRole, { color: colors.mutedForeground }]}>
                        Flatmate
                      </Text>
                    </View>
                  </View>
                  <View style={styles.memberStats}>
                    <View style={[styles.statItem, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.statVal, { color: colors.primary }]}>
                        ₹{personalExp.toFixed(0)}
                      </Text>
                      <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                        Paid this month
                      </Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.statVal, { color: colors.foreground }]}>
                        ₹{totalOwed.toFixed(0)}
                      </Text>
                      <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                        Rent+Utility Share
                      </Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.statVal, { color: colors.accent }]}>
                        ₹{utilShare(m).toFixed(0)}
                      </Text>
                      <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                        Utility share
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              );
            })}
          </>
        )}

        {activeTab === "notes" && (
          <>
            <SectionCard title="Add Note">
              <TextInput
                style={[
                  styles.noteInput,
                  { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
                ]}
                value={noteTxt}
                onChangeText={setNoteTxt}
                placeholder="Write a note for all flatmates..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                onPress={handleAddNote}
                style={[styles.noteBtn, { backgroundColor: savedNote ? colors.success : colors.primary }]}
              >
                <Feather name={savedNote ? "check" : "send"} size={16} color="#fff" />
                <Text style={styles.noteBtnText}>{savedNote ? "Saved!" : "Add Note"}</Text>
              </TouchableOpacity>
            </SectionCard>

            {notes.length === 0 ? (
              <View style={styles.emptyNotes}>
                <Feather name="file-text" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notes yet</Text>
              </View>
            ) : (
              notes.filter(n => !n.completed).map((n, i) => (
                <SectionCard key={n.id}>
                  {editingNoteId === n.id ? (
                    <>
                      <TextInput
                        style={[
                          styles.noteInput,
                          { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
                        ]}
                        value={editingText}
                        onChangeText={setEditingText}
                        multiline
                        numberOfLines={3}
                      />
                      <View style={styles.editActions}>
                        <TouchableOpacity
                          onPress={handleSaveEdit}
                          style={[styles.editBtn, { backgroundColor: colors.success }]}
                        >
                          <Feather name="check" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleCancelEdit}
                          style={[styles.editBtn, { backgroundColor: colors.mutedForeground }]}
                        >
                          <Feather name="x" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.noteTxt,
                          { color: colors.foreground, textDecorationLine: n.completed ? 'line-through' : 'none' },
                        ]}
                      >
                        {n.txt}
                      </Text>
                      <Text style={[styles.noteTime, { color: colors.mutedForeground }]}>{n.time}</Text>
                      <View style={styles.noteActions}>
                        <TouchableOpacity
                          onPress={() => handleToggleCompleted(n.id)}
                          style={[styles.actionBtn, { backgroundColor: n.completed ? colors.success : colors.warning }]}
                        >
                          <Feather name={n.completed ? "check-circle" : "circle"} size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleEditNote(n.id, n.txt)}
                          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                        >
                          <Feather name="edit" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteNote(n.id)}
                          style={[styles.actionBtn, { backgroundColor: colors.destructive }]}
                        >
                          <Feather name="trash" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </SectionCard>
              ))
            )}
          </>
        )}

        {activeTab === "maid" && (
          <>
            <SectionCard title="Maid Tracking">
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Start Date</Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
                ]}
                value={maid.start}
                onChangeText={(v) => saveMaid({ ...maid, start: v })}
                placeholder="e.g., 2025-01-01"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Add Leave Date</Text>
              <View style={styles.leaveRow}>
                <TextInput
                  style={[
                    styles.leaveInput,
                    { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground },
                  ]}
                  value={leaveDate}
                  onChangeText={setLeaveDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                />
                <TouchableOpacity
                  onPress={handleAddLeave}
                  style={[styles.addLeaveBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="plus" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </SectionCard>

            {maid.leaves.length > 0 && (
              <SectionCard title={`Leave Days (${maid.leaves.length})`}>
                {maid.leaves.map((d, i) => (
                  <View
                    key={i}
                    style={[styles.leaveItem, { borderBottomColor: colors.border }]}
                  >
                    <Feather name="calendar" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.leaveDate, { color: colors.foreground }]}>{d}</Text>
                  </View>
                ))}
              </SectionCard>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  bigAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  bigAvatarTxt: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  memberName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  memberRole: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  memberStats: {
    flexDirection: "row",
    gap: 8,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  statItem: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  statVal: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  statLbl: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  monthName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  monthStatus: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    textAlignVertical: "top",
    minHeight: 80,
  },
  noteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  noteBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyNotes: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  noteTxt: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
    lineHeight: 20,
  },
  noteTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  leaveRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  leaveInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addLeaveBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  leaveDate: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
