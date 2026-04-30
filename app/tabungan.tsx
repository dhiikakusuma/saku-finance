import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Chip,
  H1,
  H2,
  Input,
  Label,
  Muted,
  Progress,
  Row,
  ScreenHeader,
} from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, radius, spacing } from "@/theme";

const GOAL_PRESETS: { icon: string; label: string; color: string }[] = [
  { icon: "airplane", label: "Liburan", color: "#0ea5e9" },
  { icon: "home", label: "DP Rumah", color: "#16a34a" },
  { icon: "car", label: "Mobil", color: "#a855f7" },
  { icon: "bicycle", label: "Motor", color: "#f59e0b" },
  { icon: "phone-portrait", label: "Gadget", color: "#ec4899" },
  { icon: "school", label: "Pendidikan", color: "#6366f1" },
  { icon: "heart", label: "Nikah", color: "#ef4444" },
  { icon: "medkit", label: "Kesehatan", color: "#14b8a6" },
  { icon: "gift", label: "Hadiah", color: "#fb923c" },
  { icon: "wallet", label: "Dana Darurat", color: "#64748b" },
];

export default function TabunganScreen() {
  const router = useRouter();
  const goals = useAppStore((s) => s.goals);
  const wallets = useAppStore((s) => s.wallets);
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const depositGoal = useAppStore((s) => s.depositGoal);
  const deleteGoal = useAppStore((s) => s.deleteGoal);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [depositId, setDepositId] = useState<string | null>(null);

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const overallPct =
    totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  const editingGoal = goals.find((g) => g.id === editingId);
  const depositGoalObj = goals.find((g) => g.id === depositId);

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
            <H2 style={{ color: colors.white }}>Target Tabungan</H2>
            <View style={{ width: 26 }} />
          </Row>

          <View style={{ marginTop: spacing.lg }}>
            <Muted style={{ color: "rgba(255,255,255,.8)", fontSize: 12 }}>
              Total terkumpul
            </Muted>
            <H1 style={{ color: colors.white, marginTop: 4 }}>
              {formatRupiah(totalSaved)}
            </H1>
            <Muted
              style={{ color: "rgba(255,255,255,.8)", fontSize: 12, marginTop: 4 }}
            >
              dari {formatRupiah(totalTarget)} target
            </Muted>
            <View
              style={{
                marginTop: spacing.md,
                height: 8,
                backgroundColor: "rgba(255,255,255,.18)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${overallPct}%`,
                  height: "100%",
                  backgroundColor: colors.white,
                }}
              />
            </View>
            <Muted
              style={{ color: "rgba(255,255,255,.8)", fontSize: 11, marginTop: 6 }}
            >
              {overallPct.toFixed(0)}% tercapai
            </Muted>
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
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.brand50,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={22} color={colors.brand700} />
              </View>
              <View style={{ flex: 1 }}>
                <Muted
                  style={{
                    color: colors.ink900,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  Buat target tabungan
                </Muted>
                <Muted style={{ fontSize: 11 }}>
                  Liburan, DP rumah, motor, dll.
                </Muted>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
            </Row>
          </Card>
        </Pressable>

        {goals.length === 0 ? (
          <Card>
            <View style={{ alignItems: "center", padding: spacing.lg }}>
              <Ionicons name="trophy-outline" size={42} color={colors.ink300} />
              <Muted style={{ marginTop: 8, textAlign: "center" }}>
                Belum ada target. Tetapkan tujuan tabungan + nominal + deadline,
                Saku akan hitung berapa harus nabung tiap bulan.
              </Muted>
            </View>
          </Card>
        ) : null}

        {goals.map((g) => {
          const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
          const remaining = Math.max(0, g.target - g.saved);
          const monthsLeft = g.deadline
            ? Math.max(
                1,
                Math.ceil(
                  (new Date(g.deadline).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24 * 30),
                ),
              )
            : null;
          const monthlyNeed = monthsLeft
            ? Math.ceil(remaining / monthsLeft)
            : null;

          return (
            <Pressable
              key={g.id}
              onLongPress={() => {
                Alert.alert("Target tabungan", g.name, [
                  { text: "Batal", style: "cancel" },
                  {
                    text: "Edit",
                    onPress: () => {
                      setEditingId(g.id);
                      setShowForm(true);
                    },
                  },
                  {
                    text: "Hapus",
                    style: "destructive",
                    onPress: () =>
                      Alert.alert("Hapus target?", g.name, [
                        { text: "Batal", style: "cancel" },
                        {
                          text: "Hapus",
                          style: "destructive",
                          onPress: () => deleteGoal(g.id),
                        },
                      ]),
                  },
                ]);
              }}
            >
              <Card>
                <Row>
                  <Row gap={10} style={{ flex: 1 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: `${g.color}1A`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={g.icon as any}
                        size={22}
                        color={g.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Muted
                        style={{
                          color: colors.ink900,
                          fontWeight: "700",
                          fontSize: 15,
                        }}
                      >
                        {g.name}
                      </Muted>
                      <Muted style={{ fontSize: 11 }}>
                        {formatRupiah(g.saved)} / {formatRupiah(g.target)}
                      </Muted>
                    </View>
                  </Row>
                  <Chip
                    label={`${pct.toFixed(0)}%`}
                    bg={pct >= 100 ? colors.successBg : `${g.color}1A`}
                    color={pct >= 100 ? colors.success : g.color}
                  />
                </Row>

                <View style={{ marginTop: spacing.md }}>
                  <Progress value={g.saved} max={g.target} color={g.color} />
                </View>

                {monthlyNeed && pct < 100 ? (
                  <Row
                    gap={8}
                    style={{
                      marginTop: spacing.md,
                      backgroundColor: colors.brand50,
                      padding: 10,
                      borderRadius: radius.md,
                      alignItems: "flex-start",
                    }}
                  >
                    <Ionicons
                      name="bulb"
                      size={14}
                      color={colors.brand700}
                      style={{ marginTop: 2 }}
                    />
                    <Muted
                      style={{
                        fontSize: 12,
                        color: colors.brand700,
                        flex: 1,
                        lineHeight: 16,
                      }}
                    >
                      Butuh nabung{" "}
                      <Muted style={{ fontWeight: "700", color: colors.brand700 }}>
                        {formatRupiah(monthlyNeed)}/bulan
                      </Muted>{" "}
                      selama {monthsLeft} bulan untuk mencapai target.
                    </Muted>
                  </Row>
                ) : null}

                <Row gap={8} style={{ marginTop: spacing.md }}>
                  {pct < 100 ? (
                    <Button
                      title="Setor"
                      icon="add"
                      size="sm"
                      onPress={() => setDepositId(g.id)}
                    />
                  ) : (
                    <Chip
                      label="Tercapai 🎉"
                      bg={colors.successBg}
                      color={colors.success}
                    />
                  )}
                  <Button
                    title="Edit"
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      setEditingId(g.id);
                      setShowForm(true);
                    }}
                  />
                </Row>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      <GoalForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        goal={editingGoal}
        onSubmit={(data) => {
          if (editingGoal) {
            updateGoal(editingGoal.id, data);
          } else {
            addGoal(data);
          }
          setShowForm(false);
          setEditingId(null);
        }}
      />

      <DepositSheet
        visible={!!depositGoalObj}
        goal={depositGoalObj}
        wallets={wallets}
        onClose={() => setDepositId(null)}
        onSubmit={(amount, walletId) => {
          if (!depositGoalObj) return;
          depositGoal(depositGoalObj.id, amount, walletId);
          setDepositId(null);
        }}
      />
    </View>
  );
}

type GoalData = {
  name: string;
  icon: string;
  color: string;
  target: number;
  deadline?: string;
};

function GoalForm({
  visible,
  onClose,
  goal,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  goal?: ReturnType<typeof useAppStore.getState>["goals"][number];
  onSubmit: (data: GoalData) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState(GOAL_PRESETS[0].icon);
  const [color, setColor] = useState(GOAL_PRESETS[0].color);
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTarget(String(goal.target));
      setIcon(goal.icon);
      setColor(goal.color);
      setDeadline(goal.deadline?.slice(0, 10) ?? "");
    } else {
      setName("");
      setTarget("");
      setIcon(GOAL_PRESETS[0].icon);
      setColor(GOAL_PRESETS[0].color);
      setDeadline("");
    }
  }, [goal, visible]);

  const submit = () => {
    const tgt = Number(target.replace(/[^0-9]/g, ""));
    if (!name.trim() || tgt <= 0) {
      Alert.alert("Lengkapi form", "Isi nama target & nominal dulu.");
      return;
    }
    let isoDeadline: string | undefined;
    if (deadline) {
      const m = deadline.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) {
        Alert.alert("Format tanggal", "Gunakan format YYYY-MM-DD (mis. 2026-12-31).");
        return;
      }
      isoDeadline = new Date(deadline).toISOString();
    }
    onSubmit({
      name: name.trim(),
      icon,
      color,
      target: tgt,
      deadline: isoDeadline,
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
        <ScreenHeader title={goal ? "Edit Target" : "Target Baru"} onBack={onClose} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <View>
            <Label>Pilih ikon & warna</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 8 }}
            >
              {GOAL_PRESETS.map((p) => {
                const active = icon === p.icon;
                return (
                  <Pressable
                    key={p.icon}
                    onPress={() => {
                      setIcon(p.icon);
                      setColor(p.color);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: radius.md,
                      backgroundColor: active ? `${p.color}1A` : colors.white,
                      borderWidth: 1,
                      borderColor: active ? p.color : colors.ink200,
                      alignItems: "center",
                      minWidth: 78,
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name={p.icon as any}
                      size={20}
                      color={active ? p.color : colors.ink700}
                    />
                    <Muted
                      style={{
                        fontSize: 10,
                        color: active ? p.color : colors.ink700,
                        fontWeight: "600",
                      }}
                    >
                      {p.label}
                    </Muted>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View>
            <Label>Nama target</Label>
            <Input
              placeholder="Liburan ke Bali"
              value={name}
              onChangeText={setName}
              style={{ marginTop: 6 }}
            />
          </View>

          <View>
            <Label>Nominal target (Rp)</Label>
            <Input
              keyboardType="number-pad"
              placeholder="5000000"
              value={target}
              onChangeText={setTarget}
              style={{ marginTop: 6 }}
            />
          </View>

          <View>
            <Label>Deadline (opsional)</Label>
            <Input
              placeholder="2026-12-31"
              value={deadline}
              onChangeText={setDeadline}
              style={{ marginTop: 6 }}
            />
            <Muted style={{ fontSize: 11, marginTop: 4 }}>
              Format YYYY-MM-DD. Saku akan hitung kebutuhan nabung per bulan.
            </Muted>
          </View>

          <View style={{ height: spacing.md }} />
          <Button
            title={goal ? "Simpan perubahan" : "Buat target"}
            onPress={submit}
            size="lg"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DepositSheet({
  visible,
  goal,
  wallets,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  goal?: ReturnType<typeof useAppStore.getState>["goals"][number];
  wallets: ReturnType<typeof useAppStore.getState>["wallets"];
  onClose: () => void;
  onSubmit: (amount: number, walletId: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      setAmount("");
      setWalletId(wallets[0]?.id);
    }
  }, [visible, wallets]);

  if (!goal) return null;

  const submit = () => {
    const n = Number(amount.replace(/[^0-9]/g, ""));
    if (!walletId) {
      Alert.alert("Pilih dompet", "Pilih dompet sumber dana dulu.");
      return;
    }
    if (n <= 0) {
      Alert.alert("Nominal tidak valid");
      return;
    }
    onSubmit(n, walletId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title={`Setor: ${goal.name}`} onBack={onClose} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Card>
            <Muted style={{ fontSize: 12 }}>Progress saat ini</Muted>
            <Muted
              style={{
                fontSize: fontSize.lg,
                color: colors.ink900,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {formatRupiah(goal.saved)} / {formatRupiah(goal.target)}
            </Muted>
            <View style={{ marginTop: spacing.md }}>
              <Progress value={goal.saved} max={goal.target} color={goal.color} />
            </View>
          </Card>

          <View>
            <Label>Jumlah setoran (Rp)</Label>
            <Input
              keyboardType="number-pad"
              placeholder="500000"
              value={amount}
              onChangeText={setAmount}
              style={{ marginTop: 6, fontSize: fontSize.lg }}
            />
          </View>

          <View>
            <Label>Dari dompet</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 6 }}
            >
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
                    {w.name} · {formatRupiah(w.balance)}
                  </Muted>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={{ height: spacing.md }} />
          <Button title="Setor sekarang" onPress={submit} size="lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
