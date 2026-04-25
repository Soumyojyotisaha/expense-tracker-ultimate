import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
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

export type UtilityItem = { n: string; a: number };
export type ShareMap = Record<Member, number>;
export type PaidMap = Record<Member, boolean>;
export type UtilPickMap = Record<Member, number[]>;
export type DailyGrid = Record<string, number>;

export type BillScreenshotEntry = {
  rentUri?: string;
  electricityUri?: string;
};
export type BillScreenshotMap = Record<string, BillScreenshotEntry>;

type MaidData = { start: string; leaves: string[] };

type AppContextType = {
  expenses: Expense[];
  grid: DailyGrid;
  rent: number;
  deposit: number;
  share: ShareMap;
  utility: UtilityItem[];
  utilPick: UtilPickMap;
  paid: PaidMap;
  rentMonthPaid: Record<number, boolean>;
  billScreenshots: BillScreenshotMap;
  notes: { id: number; txt: string; time: string; completed: boolean }[];
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
  setNotes: (v: { id: number; txt: string; time: string; completed: boolean }[]) => void;
  setMaid: (v: MaidData) => void;

  addNote: (txt: string) => Promise<void>;
  editNote: (id: number, txt: string) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  toggleCompleted: (id: number) => Promise<void>;
  markActive: (user: string) => Promise<void>;
  addExpenseRows: (rows: { t: string; a: string; p: string }[]) => Promise<string>;
  removeExpense: (id: number) => Promise<void>;
  editExpense: (id: number, field: string, value: unknown) => Promise<void>;
  setCell: (d: number, m: number, v: number) => void;
  saveRentData: (r: number, d: number, s: ShareMap) => Promise<void>;
  saveUtilityData: (items: UtilityItem[], picks: UtilPickMap) => Promise<void>;
  savePaid: (p: PaidMap) => Promise<void>;
  saveRentMonthPaid: (v: Record<number, boolean>) => Promise<void>;
  saveBillScreenshots: (v: BillScreenshotMap) => Promise<void>;
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
  const [rentMonthPaid, setRentMonthPaidState] = useState<Record<number, boolean>>({});
  const [billScreenshots, setBillScreenshots] = useState<BillScreenshotMap>({});
  const [notes, setNotesState] = useState<{ id: number; txt: string; time: string; completed: boolean }[]>([]);
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
        if (r.k === "rentMonthPaid") setRentMonthPaidState(val as Record<number, boolean>);
        if (r.k === "billScreenshots") setBillScreenshots(val as BillScreenshotMap);
        if (r.k === "notes") {
          const loadedNotes = val as any[];
          const migratedNotes = loadedNotes.map((n, index) => ({
            id: n.id || Date.now() + index, // assign id if missing
            txt: n.txt,
            time: n.time,
            completed: n.completed || false,
          }));
          setNotesState(migratedNotes);
        }
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
    const id = Date.now(); // simple id
    const ns = [{ id, txt, time: new Date().toLocaleString("en-IN"), completed: false }, ...notes].slice(0, 20);
    setNotesState(ns);
    await saveCfg("notes", ns);
  };

  const editNote = async (id: number, txt: string) => {
    const ns = notes.map(n => n.id === id ? { ...n, txt } : n);
    setNotesState(ns);
    await saveCfg("notes", ns);
  };

  const deleteNote = async (id: number) => {
    const ns = notes.filter(n => n.id !== id);
    setNotesState(ns);
    await saveCfg("notes", ns);
  };

  const toggleCompleted = async (id: number) => {
    const ns = notes.map(n => n.id === id ? { ...n, completed: !n.completed } : n);
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
    // Find the expense to get its date info
    const expenseToDelete = expenses.find((x) => x.id === id);
    if (!expenseToDelete) return;

    const err = await deleteExpense(id);
    if (!err) {
      // Remove from expenses state
      setExpenses((p) => p.filter((x) => x.id !== id));

      // Recalculate total for that day
      const remainingExpensesForDay = expenses
        .filter((x) => x.id !== id && Number(x.m) === expenseToDelete.m && Number(x.d) === expenseToDelete.d)
        .reduce((sum, x) => sum + Number(x.a), 0);

      // Update grid
      const key = `${expenseToDelete.m}-${expenseToDelete.d}`;
      const ng = { ...grid, [key]: remainingExpensesForDay };
      setGridState(ng);
      await saveCfg("grid", ng);
      await upsertDailySheet(expenseToDelete.m, expenseToDelete.d, remainingExpensesForDay);
    }
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

  const saveRentMonthPaid = async (v: Record<number, boolean>) => {
    setRentMonthPaidState(v);
    await saveCfg("rentMonthPaid", v);
  };

  const saveBillScreenshots = async (v: BillScreenshotMap) => {
    setBillScreenshots(v);
    await saveCfg("billScreenshots", v);
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
        rentMonthPaid,
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
        setNotes: setNotesState,
        setMaid: setMaidState,
        addNote,
        editNote,
        deleteNote,
        toggleCompleted,
        markActive,
        addExpenseRows,
        removeExpense,
        editExpense,
        setCell,
        saveRentData,
        saveUtilityData,
        savePaid,
        saveRentMonthPaid,
        saveBillScreenshots,
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
