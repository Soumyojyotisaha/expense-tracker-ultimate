import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  supabase,
  saveCfg,
  loadCfg,
  loadExpenses,
  addExpenses,
  deleteExpense,
  updateExpense,
  loadDailySheet,
  upsertDailySheet,
  type Expense,
} from "@/lib/supabase";

export const MEMBERS = ["Soumyojyoti", "Harsh", "Anirban"] as const;
export type Member = (typeof MEMBERS)[number];

export const CATEGORIES = [
  "Grocery",
  "Milk",
  "Food",
  "Electricity",
  "Water",
  "WiFi",
  "Gas",
  "Rent",
  "Transport",
  "Other",
  "Utility",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
] as const;

export type UtilityItem = {
  n: string;
  a: number;
};

export type ShareMap = Record<Member, number>;
export type PaidMap = Record<Member, boolean>;
export type UtilPickMap = Record<Member, number[]>;
export type DailyGrid = Record<string, number>;

type MaidData = {
  start: string;
  leaves: string[];
};

type AppContextType = {
  expenses: Expense[];
  grid: DailyGrid;
  rent: number;
  deposit: number;
  share: ShareMap;
  utility: UtilityItem[];
  utilPick: UtilPickMap;
  paid: PaidMap;
  dark: boolean;
  notes: { txt: string; time: string }[];
  activity: { user: string; time: string };
  maid: MaidData;
  dbReady: boolean;
  loading: boolean;

  setRent: (v: number) => void;
  setDeposit: (v: number) => void;
  setShare: (v: ShareMap) => void;
  setUtility: (v: UtilityItem[]) => void;
  setUtilPick: (v: UtilPickMap) => void;
  setPaid: (v: PaidMap) => void;
  setDark: (v: boolean) => void;
  setNotes: (v: { txt: string; time: string }[]) => void;
  setMaid: (v: MaidData) => void;

  addNote: (txt: string) => Promise<void>;
  markActive: (user: string) => Promise<void>;
  addExpenseRows: (rows: { t: string; a: string; p: string }[]) => Promise<string>;
  removeExpense: (id: number) => Promise<void>;
  editExpense: (id: number, field: string, value: unknown) => Promise<void>;
  setCell: (d: number, m: number, v: number) => void;
  saveRentData: (r: number, d: number, s: ShareMap) => Promise<void>;
  saveUtilityData: (items: UtilityItem[], picks: UtilPickMap) => Promise<void>;
  savePaid: (p: PaidMap) => Promise<void>;
  saveDark: (v: boolean) => Promise<void>;
  saveMaid: (v: MaidData) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

const defaultShare: ShareMap = { Soumyojyoti: 0, Harsh: 0, Anirban: 0 };
const defaultPaid: PaidMap = { Soumyojyoti: false, Harsh: false, Anirban: false };
const defaultUtilPick: UtilPickMap = {
  Soumyojyoti: [0, 1, 2, 3],
  Harsh: [0, 1, 2, 3, 4],
  Anirban: [0, 1, 2, 3],
};
const defaultUtility: UtilityItem[] = [
  { n: "Furniture", a: 8535 },
  { n: "Maid", a: 3500 },
  { n: "Electricity", a: 485.5 },
  { n: "WiFi", a: 933.3 },
  { n: "Extra (Harsh Cabinet)", a: 933.32 },
];

function initGrid(): DailyGrid {
  const g: DailyGrid = {};
  for (let m = 0; m < 12; m++)
    for (let d = 1; d <= 31; d++) g[`${m}-${d}`] = 0;
  return g;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [grid, setGridState] = useState<DailyGrid>(initGrid);
  const [rent, setRentState] = useState(0);
  const [deposit, setDepositState] = useState(0);
  const [share, setShareState] = useState<ShareMap>(defaultShare);
  const [utility, setUtilityState] = useState<UtilityItem[]>(defaultUtility);
  const [utilPick, setUtilPickState] = useState<UtilPickMap>(defaultUtilPick);
  const [paid, setPaidState] = useState<PaidMap>(defaultPaid);
  const [dark, setDarkState] = useState(false);
  const [notes, setNotesState] = useState<{ txt: string; time: string }[]>([]);
  const [activity, setActivityState] = useState({ user: "-", time: "-" });
  const [maid, setMaidState] = useState<MaidData>({ start: "", leaves: [] });
  const [dbReady, setDbReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const curMonth = now.getMonth();
  const curDate = now.getDate();

  const refresh = useCallback(async () => {
    try {
      const expData = await loadExpenses();
      if (expData) setExpenses(expData);

      const cfg = await loadCfg();
      const ds = await loadDailySheet();

      if (ds.length) {
        const ng = initGrid();
        ds.forEach((r: { m: number; d: number; a: number }) => {
          ng[`${r.m}-${r.d}`] = Number(r.a) || 0;
        });
        setGridState(ng);
      }

      cfg.forEach((r) => {
        let val: unknown;
        try {
          val = JSON.parse(r.v);
        } catch {
          val = r.v;
        }
        if (r.k === "rent") setRentState(Number(val) || 0);
        if (r.k === "deposit") setDepositState(Number(val) || 0);
        if (r.k === "share") setShareState({ ...defaultShare, ...(val as ShareMap) });
        if (r.k === "utility") setUtilityState(val as UtilityItem[]);
        if (r.k === "utilPick") setUtilPickState(val as UtilPickMap);
        if (r.k === "paid") setPaidState({ ...defaultPaid, ...(val as PaidMap) });
        if (r.k === "dark") setDarkState(Boolean(val));
        if (r.k === "notes") setNotesState(val as { txt: string; time: string }[]);
        if (r.k === "activity") setActivityState(val as { user: string; time: string });
        if (r.k === "maid") setMaidState(val as MaidData);
      });

      setDbReady(true);
    } catch {
      setDbReady(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = async (txt: string) => {
    const ns = [{ txt, time: new Date().toLocaleString("en-IN") }, ...notes].slice(0, 20);
    setNotesState(ns);
    await saveCfg("notes", ns);
  };

  const markActive = async (user: string) => {
    const a = { user, time: new Date().toLocaleString("en-IN") };
    setActivityState(a);
    await saveCfg("activity", a);
  };

  const addExpenseRows = async (rows: { t: string; a: string; p: string }[]) => {
    const validRows = rows.filter((x) => x.a);
    if (!validRows.length) return "No valid rows";
    const sum = validRows.reduce((s, x) => s + Number(x.a), 0);
    const inserts = validRows.map((x) => ({
      t: x.t || "Utility",
      a: Number(x.a),
      p: x.p,
      d: curDate,
      m: curMonth,
      y: now.getFullYear(),
    }));
    const key = `${curMonth}-${curDate}`;
    const next = (Number(grid[key]) || 0) + sum;
    const ng = { ...grid, [key]: next };
    setGridState(ng);
    await saveCfg("grid", ng);
    await upsertDailySheet(curMonth, curDate, next);
    const { data, error } = await addExpenses(inserts);
    if (error) return error.message;
    if (data) setExpenses((p) => [...data, ...p]);
    return "";
  };

  const removeExpense = async (id: number) => {
    const err = await deleteExpense(id);
    if (!err) setExpenses((p) => p.filter((x) => x.id !== id));
  };

  const editExpense = async (id: number, field: string, value: unknown) => {
    const nv = field === "a" ? Number(value) : value;
    const err = await updateExpense(id, field, nv);
    if (!err) setExpenses((p) => p.map((x) => (x.id === id ? { ...x, [field]: nv } : x)));
  };

  const setCell = (d: number, m: number, v: number) => {
    const ng = { ...grid, [`${m}-${d}`]: v };
    setGridState(ng);
    saveCfg("grid", ng);
    upsertDailySheet(m, d, v);
  };

  const saveRentData = async (r: number, d: number, s: ShareMap) => {
    setRentState(r);
    setDepositState(d);
    setShareState(s);
    await saveCfg("rent", r);
    await saveCfg("deposit", d);
    await saveCfg("share", s);
  };

  const saveUtilityData = async (items: UtilityItem[], picks: UtilPickMap) => {
    setUtilityState(items);
    setUtilPickState(picks);
    await saveCfg("utility", items);
    await saveCfg("utilPick", picks);
  };

  const savePaid = async (p: PaidMap) => {
    setPaidState(p);
    await saveCfg("paid", p);
  };

  const saveDark = async (v: boolean) => {
    setDarkState(v);
    await saveCfg("dark", v);
  };

  const saveMaid = async (v: MaidData) => {
    setMaidState(v);
    await saveCfg("maid", v);
  };

  return (
    <AppContext.Provider
      value={{
        expenses,
        grid,
        rent,
        deposit,
        share,
        utility,
        utilPick,
        paid,
        dark,
        notes,
        activity,
        maid,
        dbReady,
        loading,
        setRent: setRentState,
        setDeposit: setDepositState,
        setShare: setShareState,
        setUtility: setUtilityState,
        setUtilPick: setUtilPickState,
        setPaid: setPaidState,
        setDark: setDarkState,
        setNotes: setNotesState,
        setMaid: setMaidState,
        addNote,
        markActive,
        addExpenseRows,
        removeExpense,
        editExpense,
        setCell,
        saveRentData,
        saveUtilityData,
        savePaid,
        saveDark,
        saveMaid,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
