import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Chip,
  H1,
  H2,
  IconTile,
  Input,
  Label,
  Muted,
  Row,
  ScreenHeader,
} from "@/components/ui";
import { currentMonthKey, formatRupiah } from "@/lib/format";
import {
  ensureNotificationPermission,
  rescheduleBillReminders,
} from "@/lib/notifications";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, radius, spacing } from "@/theme";

const BILL_ICONS: { icon: string; label: string }[] = [
  { icon: "flash", label: "Listrik" },
  { icon: "water", label: "PDAM" },
  { icon: "wifi", label: "Internet" },
  { icon: "tv", label: "TV/Streaming" },
  { icon: "phone-portrait", label: "Pulsa/HP" },
  { icon: "car", label: "Cicilan Mobil" },
  { icon: "bicycle", label: "Cicilan Motor" },
  { icon: "home", label: "KPR/Sewa" },
  { icon: "card", label: "Kartu Kredit" },
  { icon: "school", label: "Sekolah" },
  { icon: "fitness", label: "Gym" },
  { icon: "ellipsis-horizontal", label: "Lainnya" },
];

export default function TagihanScreen() {
  const router = useRouter();
  const bills = useAppStore((s) => s.bills);
  const wallets = useAppStore((s) => s.wallets);
  const addBill = useAppStore((s) => s.addBill);
  const updateBill = useAppStore((s) => s.updateBill);
  const deleteBill = useAppStore((s) => s.deleteBill);
  const markBillPaid = useAppStore((s) => s.markBillPaid);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const monthKey = currentMonthKey();

  // Reschedule notifications whenever bills change
  useEffect(() => {
    rescheduleBillReminders(bills).catch(() => {});
  }, [bills]);

  // Ask for permission on first mount
  useEffect(() => {
    ensureNotificationPermission().catch(() => {});
  }, []);

  const total = bills
    .filter((b) => b.active)
    .reduce((s, b) => s + b.amount, 0);
  const paidThisMonth = bills.filter((b) => b.paidMonths.includes(monthKey));
  const unpaid = bills.filter(
    (b) => b.active && !b.paidMonths.includes(monthKey),
  );
  const today = new Date();
  const dayOfMonth = today.getDate();

  const sortedUnpaid = useMemo(
    () =>
      [...unpaid].sort((a, b) => {
        const da = a.dueDay - dayOfMonth;
        const db = b.dueDay - dayOfMonth;
        // bills already past due-day this month appear first (urgent)
        const va = da < 0 ? 100 + a.dueDay : da;
        const vb = db < 0 ? 100 + b.dueDay : db;
        return va - vb;
      }),
    [unpaid, dayOfMonth],
  );

  const editingBill = bills.find((b) => b.id === editingId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.brand600 }}>
        <LinearGradient
          colors={[colors.brand600, colors.brand700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xl,
            paddingTop: spacing.sm,
          }}
        >
          <Row>
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={26} color={colors.white} />
            </Pressable>
            <H2 style={{ color: colors.white }}>Tagihan Berulang</H2>
            <View style={{ width: 26 }} />
          </Row>

          <View style={{ marginTop: spacing.lg }}>
            <Muted style={{ color: "rgba(255,255,255,.8)", fontSize: 12 }}>
              Total tagihan aktif bulan ini
            </Muted>
            <H1 style={{ color: colors.white, marginTop: 4 }}>
              {formatRupiah(total)}
            </H1>
            <Row gap={8} style={{ marginTop: spacing.sm }}>
              <Chip
                label={`${unpaid.length} belum bayar`}
                bg="rgba(255,255,255,.18)"
                color={colors.white}
              />
              <Chip
                label={`${paidThisMonth.length} sudah bayar`}
                bg="rgba(255,255,255,.18)"
                color={colors.white}
              />
            </Row>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: 80,
          gap: spacing.md,
        }}
      >
        <Pressable
          onPress={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Card style={{ borderStyle: "dashed", borderColor: colors.brand500 }}>
            <Row gap={10}>
              <IconTile name="add" bg={colors.brand50} color={colors.brand700} />
              <View style={{ flex: 1 }}>
                <Muted
                  style={{ color: colors.ink900, fontWeight: "600", fontSize: 14 }}
                >
                  Tambah tagihan
                </Muted>
                <Muted style={{ fontSize: 11 }}>
                  Listrik, internet, cicilan, dll. Reminder otomatis H-1.
                </Muted>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.ink400}
              />
            </Row>
          </Card>
        </Pressable>

        {sortedUnpaid.length > 0 ? (
          <>
            <Muted style={{ fontWeight: "700", color: colors.ink700 }}>
              Belum dibayar ({sortedUnpaid.length})
            </Muted>
            {sortedUnpaid.map((b) => {
              const daysLeft = b.dueDay - dayOfMonth;
              const overdue = daysLeft < 0;
              const urgent = !overdue && daysLeft <= 1;
              const accentColor = overdue
                ? colors.danger
                : urgent
                  ? colors.warning
                  : colors.ink400;
              const accentBg = overdue
                ? "#fee2e2"
                : urgent
                  ? "#fef3c7"
                  : colors.ink100;

              return (
                <Pressable
                  key={b.id}
                  onLongPress={() => {
                    Alert.alert("Tagihan", b.name, [
                      { text: "Batal", style: "cancel" },
                      {
                        text: b.active ? "Nonaktifkan" : "Aktifkan",
                        onPress: () =>
                          updateBill(b.id, { active: !b.active }),
                      },
                      {
                        text: "Edit",
                        onPress: () => {
                          setEditingId(b.id);
                          setShowForm(true);
                        },
                      },
                      {
                        text: "Hapus",
                        style: "destructive",
                        onPress: () =>
                          Alert.alert("Hapus tagihan?", b.name, [
                            { text: "Batal", style: "cancel" },
                            {
                              text: "Hapus",
                              style: "destructive",
                              onPress: () => deleteBill(b.id),
                            },
                          ]),
                      },
                    ]);
                  }}
                >
                  <Card>
                    <Row>
                      <Row gap={10} style={{ flex: 1 }}>
                        <IconTile
                          name={b.icon as any}
                          bg={`${colors.brand500}1A`}
                          color={colors.brand700}
                        />
                        <View style={{ flex: 1 }}>
                          <Muted
                            style={{
                              color: colors.ink900,
                              fontWeight: "700",
                              fontSize: 14,
                            }}
                          >
                            {b.name}
                          </Muted>
                          <Muted style={{ fontSize: 11 }}>
                            Jatuh tempo tgl {b.dueDay} ·{" "}
                            {formatRupiah(b.amount)}
                          </Muted>
                        </View>
                      </Row>
                      <Chip
                        label={
                          overdue
                            ? `Telat ${Math.abs(daysLeft)}h`
                            : daysLeft === 0
                              ? "Hari ini"
                              : daysLeft === 1
                                ? "Besok"
                                : `${daysLeft} hari`
                        }
                        bg={accentBg}
                        color={accentColor}
                      />
                    </Row>
                    <Row gap={8} style={{ marginTop: spacing.sm }}>
                      <Button
                        title="Tandai dibayar"
                        size="sm"
                        onPress={() => {
                          if (!b.walletId) {
                            Alert.alert(
                              "Pilih dompet dulu",
                              "Edit tagihan ini & pilih dompet pembayaran.",
                            );
                            return;
                          }
                          Alert.alert(
                            "Bayar tagihan?",
                            `${b.name} — ${formatRupiah(b.amount)}`,
                            [
                              { text: "Batal", style: "cancel" },
                              {
                                text: "Ya, bayar",
                                onPress: () => markBillPaid(b.id, monthKey),
                              },
                            ],
                          );
                        }}
                      />
                      <Button
                        title="Edit"
                        size="sm"
                        variant="outline"
                        onPress={() => {
                          setEditingId(b.id);
                          setShowForm(true);
                        }}
                      />
                    </Row>
                  </Card>
                </Pressable>
              );
            })}
          </>
        ) : null}

        {paidThisMonth.length > 0 ? (
          <>
            <Muted
              style={{
                fontWeight: "700",
                color: colors.ink700,
                marginTop: spacing.md,
              }}
            >
              Sudah dibayar bulan ini ({paidThisMonth.length})
            </Muted>
            {paidThisMonth.map((b) => (
              <Card key={b.id}>
                <Row>
                  <Row gap={10} style={{ flex: 1, opacity: 0.6 }}>
                    <IconTile
                      name="checkmark-circle"
                      bg={colors.successBg}
                      color={colors.success}
                    />
                    <View style={{ flex: 1 }}>
                      <Muted
                        style={{
                          color: colors.ink900,
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        {b.name}
                      </Muted>
                      <Muted style={{ fontSize: 11 }}>
                        {formatRupiah(b.amount)}
                      </Muted>
                    </View>
                  </Row>
                  <Chip label="Lunas" bg={colors.successBg} color={colors.success} />
                </Row>
              </Card>
            ))}
          </>
        ) : null}

        {bills.length === 0 ? (
          <Card>
            <View style={{ alignItems: "center", padding: spacing.lg }}>
              <Ionicons
                name="receipt-outline"
                size={42}
                color={colors.ink300}
              />
              <Muted style={{ marginTop: 8, textAlign: "center" }}>
                Belum ada tagihan. Tambahkan listrik, internet, cicilan, dll
                untuk dapat reminder otomatis H-1 jatuh tempo.
              </Muted>
            </View>
          </Card>
        ) : null}
      </ScrollView>

      <BillForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        bill={editingBill}
        wallets={wallets}
        onSubmit={(data) => {
          if (editingBill) {
            updateBill(editingBill.id, data);
          } else {
            addBill(data);
          }
          setShowForm(false);
          setEditingId(null);
        }}
      />
    </View>
  );
}

type FormData = {
  name: string;
  amount: number;
  dueDay: number;
  walletId?: string;
  icon: string;
  active: boolean;
};

function BillForm({
  visible,
  onClose,
  bill,
  wallets,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  bill?: ReturnType<typeof useAppStore.getState>["bills"][number];
  wallets: ReturnType<typeof useAppStore.getState>["wallets"];
  onSubmit: (data: FormData) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("25");
  const [icon, setIcon] = useState("flash");
  const [walletId, setWalletId] = useState<string | undefined>();
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (bill) {
      setName(bill.name);
      setAmount(String(bill.amount));
      setDueDay(String(bill.dueDay));
      setIcon(bill.icon);
      setWalletId(bill.walletId);
      setActive(bill.active);
    } else {
      setName("");
      setAmount("");
      setDueDay("25");
      setIcon("flash");
      setWalletId(undefined);
      setActive(true);
    }
  }, [bill, visible]);

  const submit = () => {
    const amt = Number(amount.replace(/[^0-9]/g, ""));
    const day = Math.min(28, Math.max(1, Number(dueDay) || 1));
    if (!name.trim() || amt <= 0) {
      Alert.alert("Lengkapi form", "Isi nama tagihan & nominal dulu.");
      return;
    }
    onSubmit({
      name: name.trim(),
      amount: amt,
      dueDay: day,
      icon,
      walletId,
      active,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader
          title={bill ? "Edit Tagihan" : "Tagihan Baru"}
          onBack={onClose}
        />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <View>
            <Label>Pilih ikon</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 8 }}
            >
              {BILL_ICONS.map((it) => (
                <Pressable
                  key={it.icon}
                  onPress={() => setIcon(it.icon)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: radius.md,
                    backgroundColor:
                      icon === it.icon ? colors.brand50 : colors.white,
                    borderWidth: 1,
                    borderColor:
                      icon === it.icon ? colors.brand500 : colors.ink200,
                    alignItems: "center",
                    minWidth: 78,
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name={it.icon as any}
                    size={20}
                    color={icon === it.icon ? colors.brand700 : colors.ink700}
                  />
                  <Muted
                    style={{
                      fontSize: 10,
                      color: icon === it.icon ? colors.brand700 : colors.ink700,
                      fontWeight: "600",
                    }}
                  >
                    {it.label}
                  </Muted>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View>
            <Label>Nama tagihan</Label>
            <Input
              placeholder="Listrik PLN"
              value={name}
              onChangeText={setName}
              style={{ marginTop: 6 }}
            />
          </View>

          <View>
            <Label>Nominal (Rp)</Label>
            <Input
              keyboardType="number-pad"
              placeholder="350000"
              value={amount}
              onChangeText={setAmount}
              style={{ marginTop: 6 }}
            />
          </View>

          <View>
            <Label>Tanggal jatuh tempo (1–28)</Label>
            <Input
              keyboardType="number-pad"
              placeholder="25"
              value={dueDay}
              onChangeText={setDueDay}
              style={{ marginTop: 6 }}
            />
          </View>

          <View>
            <Label>Dompet pembayaran (opsional)</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 6 }}
            >
              <Pressable
                onPress={() => setWalletId(undefined)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  backgroundColor:
                    walletId === undefined ? colors.brand50 : colors.white,
                  borderWidth: 1,
                  borderColor:
                    walletId === undefined ? colors.brand500 : colors.ink200,
                }}
              >
                <Muted style={{ fontSize: 12 }}>— pilih saat bayar</Muted>
              </Pressable>
              {wallets.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => setWalletId(w.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: radius.md,
                    backgroundColor:
                      walletId === w.id ? colors.brand50 : colors.white,
                    borderWidth: 1,
                    borderColor:
                      walletId === w.id ? colors.brand500 : colors.ink200,
                  }}
                >
                  <Muted style={{ fontSize: 12, fontWeight: "600" }}>
                    {w.name}
                  </Muted>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Card>
            <Row>
              <View style={{ flex: 1 }}>
                <Muted
                  style={{
                    color: colors.ink900,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Aktifkan reminder
                </Muted>
                <Muted style={{ fontSize: 11 }}>
                  Push notif H-1 & hari-H jam 09:00
                </Muted>
              </View>
              <Switch
                value={active}
                onValueChange={setActive}
                trackColor={{ false: colors.ink200, true: colors.brand500 }}
                thumbColor={colors.white}
              />
            </Row>
          </Card>

          <View style={{ height: spacing.lg }} />
          <Button
            title={bill ? "Simpan perubahan" : "Tambah tagihan"}
            onPress={submit}
            size="lg"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
