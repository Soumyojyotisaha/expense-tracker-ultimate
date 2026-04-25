import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Member, MEMBERS } from "@/context/AppContext";
import { loadCfg, saveCfg } from "@/lib/supabase";

const AUTH_STORAGE_KEY = "@expense-tracker/auth-member";
const INVITE_CODES = ["Soumyo@Flat", "Harsh@Flat", "Anirban@Flat"];

export type Profile = {
  displayName: string;
  inviteCode: string;
  age?: number;
  dob?: string;
  phone?: string;
  imageUri?: string;
};

type AuthContextType = {
  member: Member | null;
  profile: Profile | null;
  loading: boolean;
  login: (member: Member, inviteCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (profile: Profile) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const getProfileKey = (member: Member) => `profile-${member}`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (memberId: Member) => {
    const cfg = await loadCfg();
    const record = cfg.find((item) => item.k === getProfileKey(memberId));
    if (record?.v) {
      try {
        const parsed = JSON.parse(record.v) as Profile;
        setProfile(parsed);
        return parsed;
      } catch {
        setProfile(null);
        return null;
      }
    }
    setProfile(null);
    return null;
  };

  useEffect(() => {
    async function loadAuth() {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored && MEMBERS.includes(stored as Member)) {
          const memberId = stored as Member;
          setMember(memberId);
          await loadProfile(memberId);
        }
      } finally {
        setLoading(false);
      }
    }
    loadAuth();
  }, []);

  const createDefaultProfile = async (memberId: Member, inviteCode: string) => {
    const defaultProfile: Profile = {
      displayName: memberId,
      inviteCode,
      age: undefined,
      dob: "",
      phone: "",
      imageUri: "",
    };
    await saveCfg(getProfileKey(memberId), defaultProfile);
    setProfile(defaultProfile);
    return defaultProfile;
  };

  const login = async (selectedMember: Member, inviteCode: string) => {
    if (!MEMBERS.includes(selectedMember)) {
      return { success: false, error: "Select a valid flat member." };
    }

    const normalizedCode = inviteCode.trim();
    if (!normalizedCode || !INVITE_CODES.includes(normalizedCode)) {
      return { success: false, error: "Invalid invite code." };
    }

    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, selectedMember);
      setMember(selectedMember);
      const existing = await loadProfile(selectedMember);
      if (!existing) {
        await createDefaultProfile(selectedMember, normalizedCode);
      } else if (existing.inviteCode !== normalizedCode) {
        const updatedProfile = { ...existing, inviteCode: normalizedCode };
        await saveCfg(getProfileKey(selectedMember), updatedProfile);
        setProfile(updatedProfile);
      }
      return { success: true };
    } catch {
      return { success: false, error: "Could not save login state." };
    }
  };

  const updateProfile = async (updated: Profile) => {
    if (!member) {
      return { success: false, error: "No authenticated member." };
    }
    try {
      await saveCfg(getProfileKey(member), updated);
      setProfile(updated);
      return { success: true };
    } catch {
      return { success: false, error: "Unable to save profile." };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setMember(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ member, profile, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
