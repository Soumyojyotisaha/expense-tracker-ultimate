import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { MEMBERS, type Member } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const { member, loading, login } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const [selectedMember, setSelectedMember] = useState<Member>(MEMBERS[0]);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && member) {
      router.replace("(tabs)");
    }
  }, [loading, member, router]);

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);
    const result = await login(selectedMember, inviteCode);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Login failed.");
      return;
    }
    router.replace("(tabs)");
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.card}>
        <Text style={[styles.title, { color: colors.primary }]}>Flat Login</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Invite-only access for flat members.</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Flat member</Text>
          <View style={[styles.row, { borderColor: colors.border }]}> 
            {MEMBERS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setSelectedMember(item)}
                style={({ pressed }) => [
                  styles.memberButton,
                  {
                    backgroundColor:
                      selectedMember === item ? colors.primary : colors.secondary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.memberButtonText,
                    {
                      color: selectedMember === item ? colors.onPrimary : colors.foreground,
                    },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Invite code</Text>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="Enter invite code"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!submitting}
          />
        </View>

        {error ? <Text style={[styles.errorText, { color: colors.destructiveForeground }]}>{error}</Text> : null}

        <Pressable
          onPress={handleLogin}
          disabled={submitting}
          style={({ pressed }) => [
            styles.loginButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed || submitting ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.loginText, { color: colors.primaryForeground }]}>Log in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  card: {
    borderRadius: 22,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    fontFamily: "Inter_400Regular",
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  memberButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  memberButtonText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  errorText: {
    marginBottom: 10,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
