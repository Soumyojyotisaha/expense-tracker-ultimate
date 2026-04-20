import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, MEMBERS, MONTHS } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { SectionCard } from "@/components/SectionCard";
import { ExpenseRow } from "@/components/ExpenseRow";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses, grid, utility, utilPick, share, paid, activity, loading, refresh } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const topFade = useRef(new Animated.Value(0)).current;
  const bottomFade = useRef(new Animated.Value(1)).current;
  const [viewH, setViewH] = useState(0);
  const contentH = useRef(0);

  const now = new Date();
  const curMonth = now.getMonth();
  const curDate = now.getDate();

  const today = grid[`${curMonth}-${curDate}`] || 0;
  const monthTotal = Array.from({ length: 31 }, (_, i) => grid[`${curMonth}-${i + 1}`] || 0).reduce(
    (a, b) => a + b,
    0
  );

  const utilShare = (name: string) => {
    const arr = utilPick[name as keyof typeof utilPick] || [];
    const base = arr.filter((i) => i < 4).reduce((s, i) => s + utility[i].a, 0) / 3;
    return name === "Harsh" ? base + utility[4].a : base;
  };

  const memberTotals = MEMBERS.map((n) => ({
    name: n,
    total: (monthTotal / 3) + utilShare(n) + (share[n] || 0),
  }));

  const allPaid = MEMBERS.every((m) => paid[m]);
  const recentExpenses = expenses.slice(0, 5);

  const catSpend: Record<string, number> = {};
  expenses
    .filter((e) => Number(e.m) === curMonth && Number(e.y) === now.getFullYear())
    .forEach((e) => {
      const cat = (e.t || "Utility").trim();
      catSpend[cat] = (catSpend[cat] || 0) + Number(e.a);
    });
  const topCats = Object.entries(catSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 100;

  const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const atBottom = y >= contentH.current - viewH - 16;

    Animated.parallel([
      Animated.timing(topFade, {
        toValue: y > 12 ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(bottomFade, {
        toValue: atBottom ? 0 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Expense Tracker"
        subtitle={`Today: ${curDate} ${MONTHS[curMonth]} ${now.getFullYear()}`}
      />

      {/* Scroll area with edge fades */}
      <View
        style={styles.scrollWrapper}
        onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={(_, h) => { contentH.current = h; }}
        >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            title="Today"
            value={`₹${today}`}
            icon="calendar"
            accent
          />
          <StatCard
            title="This Month"
            value={`₹${monthTotal}`}
            subtitle={monthTotal <= 6000 ? "Within budget" : "Over budget"}
            icon="trending-up"
            iconColor={monthTotal <= 6000 ? colors.success : colors.destructive}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Members"
            value="3"
            icon="users"
          />
          <StatCard
            title="Utility Status"
            value={allPaid ? "All Paid" : "Pending"}
            icon="check-circle"
            iconColor={allPaid ? colors.success : colors.warning}
          />
        </View>

        {/* Member splits */}
        <SectionCard title="This Month's Split">
          {memberTotals.map((m) => (
            <View
              key={m.name}
              style={[styles.memberRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.avatarTxt, { color: colors.primary }]}>
                  {m.name[0]}
                </Text>
              </View>
              <Text style={[styles.memberName, { color: colors.foreground }]}>
                {m.name}
              </Text>
              <Text style={[styles.memberAmt, { color: colors.primary }]}>
                ₹{m.total.toFixed(0)}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Top categories */}
        {topCats.length > 0 && (
          <SectionCard title="Top Categories (This Month)">
            {topCats.map(([cat, amt], i) => {
              const pct = (amt / (monthTotal || 1)) * 100;
              return (
                <View key={cat} style={styles.catItem}>
                  <View style={styles.catLeft}>
                    <View
                      style={[
                        styles.catDot,
                        { backgroundColor: colors.chartColors[i % colors.chartColors.length] },
                      ]}
                    />
                    <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                  </View>
                  <View style={styles.catRight}>
                    <View style={[styles.barBg, { backgroundColor: colors.secondary }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: colors.chartColors[i % colors.chartColors.length],
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.catAmt, { color: colors.mutedForeground }]}>
                      ₹{amt.toFixed(0)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </SectionCard>
        )}

        {/* Activity */}
        <SectionCard title="Last Activity">
          <View style={styles.activityRow}>
            <Feather name="clock" size={16} color={colors.mutedForeground} />
            <Text style={[styles.activityText, { color: colors.foreground }]}>
              {activity.user}
            </Text>
            <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
              {activity.time}
            </Text>
          </View>
        </SectionCard>

        {/* Recent expenses */}
        <SectionCard title="Recent Expenses">
          {recentExpenses.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No expenses yet
              </Text>
            </View>
          ) : (
            recentExpenses.map((e) => (
              <ExpenseRow key={e.id} expense={e} />
            ))
          )}
        </SectionCard>
      </ScrollView>

        {/* Top fade — appears after scrolling down */}
        <Animated.View
          style={[styles.fadeTop, { opacity: topFade }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[colors.background, colors.background + "00"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Bottom fade — disappears when reaching the end */}
        <Animated.View
          style={[styles.fadeBottom, { opacity: bottomFade }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[colors.background + "00", colors.background]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollWrapper: {
    flex: 1,
    position: "relative",
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 10,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  memberRow: {
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
  memberName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  memberAmt: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  catItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
    gap: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  catRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  catAmt: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    width: 50,
    textAlign: "right",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
