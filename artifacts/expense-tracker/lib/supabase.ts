import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fempvquonorjcxpzbmaz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbXB2cXVvbm9yamN4cHpibWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTc0OTgsImV4cCI6MjA5MjA5MzQ5OH0.ZLllAFMcPOome-q6xKmoGGil6xIlcRS_GX1W0KyWnuM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Expense = {
  id?: number;
  t: string;
  a: number;
  p: string;
  d: number;
  m: number;
  y: number;
};

export type AppConfig = {
  k: string;
  v: string;
};

export const saveCfg = async (k: string, v: unknown) => {
  const { error } = await supabase
    .from("app_config")
    .upsert({ k, v: JSON.stringify(v) })
    .select();
  return error;
};

export const loadCfg = async () => {
  const { data } = await supabase.from("app_config").select("*");
  return (data as AppConfig[]) || [];
};

export const loadExpenses = async () => {
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .order("id", { ascending: false });
  return (data as Expense[]) || [];
};

export const addExpenses = async (rows: Omit<Expense, "id">[]) => {
  const { data, error } = await supabase
    .from("expenses")
    .insert(rows)
    .select();
  return { data, error };
};

export const deleteExpense = async (id: number) => {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .select();
  return error;
};

export const updateExpense = async (id: number, field: string, value: unknown) => {
  const { error } = await supabase
    .from("expenses")
    .update({ [field]: value })
    .eq("id", id)
    .select();
  return error;
};

export const loadDailySheet = async () => {
  const { data } = await supabase.from("daily_sheet").select("*");
  return data || [];
};

export const upsertDailySheet = async (m: number, d: number, a: number) => {
  await supabase
    .from("daily_sheet")
    .upsert({ m, d, a }, { onConflict: "m,d" });
};
