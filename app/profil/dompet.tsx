import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  IconTile,
  Input,
  Label,
  Muted,
  Row,
  ScreenHeader,
  Segmented,
} from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { WalletType } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing } from "@/theme";

const TYPE_OPTS: { value: WalletType; label: string; icon: string; color: string }[] =
  [
    { value: "cash", label: "Cash", icon: "cash", color: "#16a34a" },
    { value: "bank", label: "Bank", icon: "card", color: "#3b82f6" },
    { value: "ewallet", label: "E-Wallet", icon: "phone-portrait", color: "#10b981" },
    { value: "card", label: "Kartu", icon: "card-outline", color: "#a855f7" },
  ];

export default function DompetPage() {
  const router = useRouter();
  const wallets = useAppStore((s) => s.wallets);
  const addWallet = useAppStore((s) => s.addWallet);
  const deleteWallet = useAppStore((s) => s.deleteWallet);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("bank");
  const [balance, setBalance] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    const opt = TYPE_OPTS.find((t) => t.value === type)!;
    addWallet({
      name: name.trim(),
      type,
      icon: opt.icon,
      color: opt.color,
      balance: Number.parseInt(balance.replace(/\D/g, ""), 10) || 0,
    });
    setOpen(false);
    setName("");
    setBalance("");
    setType("bank");
  };

  const handleDelete = (id: string) => {
    Alert.alert("Hapus dompet?", "Saldo & history dompet ini akan hilang dari ringkasan.", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => deleteWallet(id) },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Dompet & rekening"
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => setOpen(true)} hitSlop={10}>
            <Ionicons name="add-circle" size={24} color={colors.brand600} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
        {wallets.map((w) => (
          <Pressable key={w.id} onLongPress={() => handleDelete(w.id)}>
            <Card>
              <Row>
                <Row gap={12}>
                  <IconTile name={w.icon as any} bg={`${w.color}1A`} color={w.color} />
                  <View>
                    <Muted
                      style={{
                        color: colors.ink900,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {w.name}
                    </Muted>
                    <Muted style={{ fontSize: 11, textTransform: "capitalize" }}>
                      {w.type}
                    </Muted>
                  </View>
                </Row>
                <Muted
                  style={{ color: colors.ink900, fontWeight: "700", fontSize: 14 }}
                >
                  {formatRupiah(w.balance)}
                </Muted>
              </Row>
            </Card>
          </Pressable>
        ))}
        <Muted style={{ textAlign: "center", marginTop: spacing.md, fontSize: 11 }}>
          Tap & tahan untuk menghapus dompet.
        </Muted>
      </ScrollView>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(15,23,42,.4)" }}
        />
        <View
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
          }}
        >
          <Muted
            style={{
              color: colors.ink900,
              fontSize: 16,
              fontWeight: "700",
              marginBottom: spacing.md,
            }}
          >
            Dompet baru
          </Muted>

          <Label>Nama</Label>
          <Input
            style={{ marginTop: 6 }}
            placeholder="BCA, GoPay, Cash, dll"
            value={name}
            onChangeText={setName}
          />

          <Label style={{ marginTop: spacing.md }}>Jenis</Label>
          <View style={{ marginTop: 6 }}>
            <Segmented
              options={TYPE_OPTS.map((t) => ({ value: t.value, label: t.label }))}
              value={type}
              onChange={(v) => setType(v)}
            />
          </View>

          <Label style={{ marginTop: spacing.md }}>Saldo awal (Rp)</Label>
          <Input
            style={{ marginTop: 6 }}
            keyboardType="numeric"
            placeholder="0"
            value={balance}
            onChangeText={(v) => setBalance(v.replace(/\D/g, ""))}
          />

          <Button
            title="Tambah dompet"
            size="lg"
            style={{ marginTop: spacing.lg }}
            onPress={handleSave}
            disabled={!name.trim()}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

