import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, H1, Input, Label, Muted, Progress, Row, Segmented } from "@/components/ui";
import { useAppStore } from "@/store/useAppStore";
import { colors, spacing } from "@/theme";

const PAYDAY_OPTIONS = [
  { value: "25", label: "Tgl 25" },
  { value: "1", label: "Tgl 1" },
  { value: "custom", label: "Lainnya" },
];

export default function OnboardingSetup() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const updateWallet = useAppStore((s) => s.updateWallet);
  const wallets = useAppStore((s) => s.wallets);

  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [payday, setPayday] = useState<"25" | "1" | "custom">("25");
  const [customPayday, setCustomPayday] = useState("25");
  const [cashBalance, setCashBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  const handleSubmit = () => {
    const monthlyIncome = Number.parseInt(salary.replace(/\D/g, ""), 10) || 0;
    const paydayNum =
      payday === "custom"
        ? Math.max(1, Math.min(31, Number.parseInt(customPayday, 10) || 1))
        : Number.parseInt(payday, 10);
    completeOnboarding({
      name: name.trim() || "Pengguna",
      monthlyIncome,
      payday: paydayNum,
    });
    const cashWallet = wallets.find((w) => w.id === "wallet-cash");
    const bankWallet = wallets.find((w) => w.id === "wallet-bank");
    if (cashWallet)
      updateWallet(cashWallet.id, {
        balance: Number.parseInt(cashBalance.replace(/\D/g, ""), 10) || 0,
      });
    if (bankWallet)
      updateWallet(bankWallet.id, {
        balance: Number.parseInt(bankBalance.replace(/\D/g, ""), 10) || 0,
      });
    router.replace("/");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Row>
          <Muted>Setup awal</Muted>
          <Muted style={{ fontSize: 11 }}>2 / 2</Muted>
        </Row>
        <View style={{ marginTop: 6 }}>
          <Progress value={2} max={2} color={colors.brand600} />
        </View>

        <H1 style={{ marginTop: spacing.lg }}>Kenalin yuk</H1>
        <Muted style={{ marginTop: 4 }}>
          Data ini bisa diubah kapan saja di menu Profil.
        </Muted>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <View>
            <Label>Nama</Label>
            <Input
              style={{ marginTop: 6 }}
              placeholder="Sayo"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View>
            <Label>Penghasilan bulanan (Rp)</Label>
            <Input
              style={{ marginTop: 6 }}
              keyboardType="numeric"
              placeholder="8500000"
              value={salary}
              onChangeText={(v) => setSalary(v.replace(/\D/g, ""))}
            />
          </View>

          <View>
            <Label>Tanggal gajian</Label>
            <View style={{ marginTop: 6 }}>
              <Segmented
                options={PAYDAY_OPTIONS}
                value={payday}
                onChange={(v) => setPayday(v as typeof payday)}
              />
            </View>
            {payday === "custom" ? (
              <Input
                style={{ marginTop: 8 }}
                keyboardType="numeric"
                placeholder="Tanggal (1-31)"
                value={customPayday}
                onChangeText={setCustomPayday}
              />
            ) : null}
          </View>

          <View>
            <Label>Saldo Cash saat ini (opsional)</Label>
            <Input
              style={{ marginTop: 6 }}
              keyboardType="numeric"
              placeholder="0"
              value={cashBalance}
              onChangeText={(v) => setCashBalance(v.replace(/\D/g, ""))}
            />
          </View>

          <View>
            <Label>Saldo Rekening Utama (opsional)</Label>
            <Input
              style={{ marginTop: 6 }}
              keyboardType="numeric"
              placeholder="0"
              value={bankBalance}
              onChangeText={(v) => setBankBalance(v.replace(/\D/g, ""))}
            />
          </View>
        </View>

        <View style={{ marginTop: spacing.xxxl }}>
          <Button
            title="Mulai pakai Saku"
            size="lg"
            onPress={handleSubmit}
            disabled={!name.trim() || !salary}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
