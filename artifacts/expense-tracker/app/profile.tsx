import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth, type Profile } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { SectionCard } from "@/components/SectionCard";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { member, profile, loading, updateProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? member ?? "");
  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [dob, setDob] = useState(profile?.dob ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [imageUri, setImageUri] = useState(profile?.imageUri ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !member) {
      router.replace("/login");
    }
  }, [loading, member, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || member || "");
      setAge(profile.age?.toString() ?? "");
      setDob(profile.dob ?? "");
      setPhone(profile.phone ?? "");
      setImageUri(profile.imageUri ?? "");
    }
  }, [profile, member]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow gallery access to upload a profile image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    const updatedProfile: Profile = {
      displayName: displayName.trim() || member,
      inviteCode: profile?.inviteCode ?? "",
      age: age ? Number(age) : undefined,
      dob: dob.trim(),
      phone: phone.trim(),
      imageUri: imageUri,
    };

    const result = await updateProfile(updatedProfile);
    setSaving(false);
    if (result.success) {
      setMessage("Profile saved successfully.");
      setTimeout(() => setMessage(null), 2600);
      return;
    }
    Alert.alert("Unable to save profile", result.error || "Please try again.");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Header
        title="Profile"
        subtitle={member ? `Logged in as ${member}` : ""}
        profileImageUri={imageUri}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionCard>
          <View style={styles.avatarRow}>
            <TouchableOpacity onPress={pickImage} style={[styles.avatarContainer, { backgroundColor: colors.secondary }]}
              activeOpacity={0.8}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <Feather name="user" size={40} color={colors.primary} />
              )}
            </TouchableOpacity>
            <View style={styles.avatarTextArea}>
              <Text style={[styles.label, { color: colors.foreground }]}>Tap to upload</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Profile image saved in app and database.</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Profile details">
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Name"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Flat invite code</Text>
          <TextInput
            value={profile?.inviteCode ?? ""}
            editable={false}
            placeholder="Invite code"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.secondary, color: colors.foreground }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Age</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholder="Age"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Date of birth</Text>
          <TextInput
            value={dob}
            onChangeText={setDob}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Phone number"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          >
            <Text style={[styles.saveText, { color: colors.primaryForeground }]}>Save profile</Text>
          </TouchableOpacity>
          {message ? <Text style={[styles.successText, { color: colors.success }]}>{message}</Text> : null}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            style={[styles.backButton, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.backText, { color: colors.foreground }]}>Back to dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: colors.destructive }]}
          >
            <Text style={[styles.logoutText, { color: colors.destructiveForeground }]}>Logout</Text>
          </TouchableOpacity>
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarTextArea: {
    flex: 1,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  backButton: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  backText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  successText: {
    marginTop: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
});
