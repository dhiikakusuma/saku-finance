import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Label, ScreenHeader } from "@/components/ui";
import { useAppStore } from "@/store/useAppStore";
import { colors, spacing } from "@/theme";

export default function ProfilDetailPage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [name, setName] = useState(profile.name);
  const [income, setIncome] = useState(String(profile.monthlyIncome));
  const [payday, setPayday] = useState(String(profile.payday));

  const handleSave = () => {
    updateProfile({
      name: name.trim() || "Pengguna",
      monthlyIncome: Number.parseInt(income.replace(/\D/g, ""), 10) || 0,
      payday: Math.max(1, Math.min(31, Number.parseInt(payday, 10) || 1)),
    });
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Profil & penghasilan" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <View>
          <Label>Nama</Label>
          <Input style={{ marginTop: 6 }} value={name} onChangeText={setName} />
        </View>
        <View>
          <Label>Penghasilan bulanan (Rp)</Label>
          <Input
            style={{ marginTop: 6 }}
            keyboardType="numeric"
            value={income}
            onChangeText={(v) => setIncome(v.replace(/\D/g, ""))}
          />
        </View>
        <View>
          <Label>Tanggal gajian (1-31)</Label>
          <Input
            style={{ marginTop: 6 }}
            keyboardType="numeric"
            value={payday}
            onChangeText={(v) => setPayday(v.replace(/\D/g, ""))}
          />
        </View>
        <Button
          title="Simpan perubahan"
          size="lg"
          style={{ marginTop: spacing.lg }}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
