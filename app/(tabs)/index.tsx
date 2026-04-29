import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Chip, H2, IconTile, Muted, Progress, Row } from "@/components/ui";
import {
  currentMonthKey,
  formatRelativeDay,
  formatRupiah,
  formatTime,
  monthLabel,
} from "@/lib/format";
import { useAppStore, useMonthSummary, useTotalBalance } from "@/store/useAppStore";
import { colors, fontSize, radius, spacing } from "@/theme";

export default function Dashboard() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const totalBalance = useTotalBalance();
  const month = currentMonthKey();
  const { income, expense } = useMonthSummary(month);
  const transactions = useAppStore((s) => s.transactions).slice(0, 5);
  const categories = useAppStore((s) => s.categories);
  const wallets = useAppStore((s) => s.wallets);
  const budgets = useAppStore((s) => s.budgets).filter((b) => b.month === month);
  const allTx = useAppStore((s) => s.transactions);

  const dailyLeft = useMemo(() => {
    const today = new Date();
    const daysLeft = Math.max(
      1,
      Math.ceil((profile.payday - today.getDate() + 30) % 30) || 30,
    );
    return Math.round((totalBalance > 0 ? totalBalance : 0) / daysLeft);
  }, [profile.payday, totalBalance]);

  const budgetItems = useMemo(() => {
    return budgets.slice(0, 3).map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const used = allTx
        .filter(
          (t) =>
            t.type === "expense" &&
            t.categoryId === b.categoryId &&
            t.date.startsWith(month),
        )
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = b.limit > 0 ? used / b.limit : 0;
      const color =
        pct >= 1 ? colors.danger : pct >= 0.7 ? colors.warning : colors.brand600;
      return { budget: b, cat, used, pct, color };
    });
  }, [budgets, categories, allTx, month]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero */}
        <LinearGradient
          colors={[colors.brand500, colors.brand700, "#064e3b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: 36,
            borderBottomLeftRadius: radius.xl,
            borderBottomRightRadius: radius.xl,
          }}
        >
          <Row>
            <View>
              <Muted style={{ color: "rgba(255,255,255,.85)", fontSize: 11 }}>
                Halo, {profile.name || "Pengguna"} 👋
              </Muted>
              <Muted style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>
                {monthLabel(month)}
              </Muted>
            </View>
            <Pressable
              onPress={() => router.push("/profil")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications" size={18} color={colors.white} />
            </Pressable>
          </Row>

          <Muted style={{ color: "rgba(255,255,255,.8)", marginTop: spacing.lg }}>
            Total Saldo
          </Muted>
          <H2
            style={{
              color: colors.white,
              fontSize: fontSize.xxl + 4,
              marginTop: 4,
            }}
          >
            {formatRupiah(totalBalance)}
          </H2>

          <Row gap={8} style={{ marginTop: spacing.md }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,.15)",
                borderRadius: radius.md,
                padding: 10,
              }}
            >
              <Muted style={{ color: "rgba(255,255,255,.85)", fontSize: 10 }}>
                Pemasukan
              </Muted>
              <H2 style={{ color: colors.white, fontSize: fontSize.base }}>
                + {formatRupiah(income, false)}
              </H2>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,.15)",
                borderRadius: radius.md,
                padding: 10,
              }}
            >
              <Muted style={{ color: "rgba(255,255,255,.85)", fontSize: 10 }}>
                Pengeluaran
              </Muted>
              <H2 style={{ color: colors.white, fontSize: fontSize.base }}>
                - {formatRupiah(expense, false)}
              </H2>
            </View>
          </Row>
        </LinearGradient>

        {/* Sisa harian */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: -22 }}>
          <Card>
            <Row>
              <View>
                <Muted style={{ fontSize: 11 }}>Sisa harian sampai gajian</Muted>
                <H2 style={{ marginTop: 2 }}>
                  {formatRupiah(dailyLeft)}
                  <Muted style={{ fontSize: 12 }}> / hari</Muted>
                </H2>
              </View>
              <Chip
                label={`Tgl ${profile.payday}`}
                bg={colors.brand50}
                color={colors.brand700}
              />
            </Row>
          </Card>
        </View>

        {/* Quick action: Laporan */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <Pressable onPress={() => router.push("/laporan" as any)}>
            <Card>
              <Row>
                <Row gap={10}>
                  <IconTile
                    name="bar-chart"
                    bg={colors.brand50}
                    color={colors.brand700}
                  />
                  <View>
                    <Muted
                      style={{
                        color: colors.ink900,
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      Laporan & Analitik
                    </Muted>
                    <Muted style={{ fontSize: 11 }}>
                      Tren bulanan, kategori, & insight otomatis
                    </Muted>
                  </View>
                </Row>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.ink400}
                />
              </Row>
            </Card>
          </Pressable>
        </View>

        {/* Dompet */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Row>
            <H2>Dompet</H2>
            <Pressable onPress={() => router.push("/profil/dompet")}>
              <Muted style={{ color: colors.brand700, fontWeight: "700" }}>
                Kelola
              </Muted>
            </Pressable>
          </Row>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: spacing.sm }}
          >
            {wallets.map((w) => (
              <View
                key={w.id}
                style={{
                  width: 160,
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.ink200,
                  padding: 12,
                }}
              >
                <IconTile
                  name={w.icon as any}
                  bg={`${w.color}1A`}
                  color={w.color}
                />
                <Muted style={{ marginTop: 8, fontSize: 11 }}>{w.name}</Muted>
                <H2 style={{ fontSize: fontSize.md }}>
                  {formatRupiah(w.balance)}
                </H2>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Budget */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Row>
            <H2>Budget bulan ini</H2>
            <Pressable onPress={() => router.push("/budget" as any)}>
              <Muted style={{ color: colors.brand700, fontWeight: "700" }}>
                Lihat semua
              </Muted>
            </Pressable>
          </Row>
          <Card style={{ marginTop: spacing.sm }}>
            {budgetItems.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
                <Muted>Belum ada budget bulan ini.</Muted>
                <Pressable
                  onPress={() => router.push("/budget" as any)}
                  style={{ marginTop: 6 }}
                >
                  <Muted style={{ color: colors.brand700, fontWeight: "700" }}>
                    + Buat budget pertama
                  </Muted>
                </Pressable>
              </View>
            ) : (
              budgetItems.map(({ budget, cat, used, color }, i) => (
                <View
                  key={budget.id}
                  style={{ marginTop: i === 0 ? 0 : spacing.md }}
                >
                  <Row>
                    <Row gap={8}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: cat?.color ?? color,
                        }}
                      />
                      <Muted
                        style={{
                          color: colors.ink900,
                          fontWeight: "600",
                          fontSize: 13,
                        }}
                      >
                        {cat?.name ?? "—"}
                      </Muted>
                    </Row>
                    <Muted style={{ fontSize: 12 }}>
                      <Muted
                        style={{
                          color: colors.ink900,
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        {formatRupiah(used, false)}
                      </Muted>{" "}
                      / {formatRupiah(budget.limit, false)}
                    </Muted>
                  </Row>
                  <View style={{ marginTop: 6 }}>
                    <Progress value={used} max={budget.limit} color={color} />
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        {/* Transaksi terbaru */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Row>
            <H2>Transaksi terbaru</H2>
            <Pressable onPress={() => router.push("/transaksi")}>
              <Muted style={{ color: colors.brand700, fontWeight: "700" }}>
                Lihat semua
              </Muted>
            </Pressable>
          </Row>
          <Card padded={false} style={{ marginTop: spacing.sm }}>
            {transactions.length === 0 ? (
              <View style={{ padding: spacing.lg, alignItems: "center" }}>
                <Ionicons
                  name="document-text-outline"
                  size={28}
                  color={colors.ink400}
                />
                <Muted style={{ marginTop: 8 }}>Belum ada transaksi.</Muted>
                <Pressable
                  onPress={() => router.push("/transaksi/baru")}
                  style={{ marginTop: 6 }}
                >
                  <Muted style={{ color: colors.brand700, fontWeight: "700" }}>
                    + Tambah transaksi pertama
                  </Muted>
                </Pressable>
              </View>
            ) : (
              transactions.map((tx, i) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const wallet = wallets.find((w) => w.id === tx.walletId);
                const sign =
                  tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "";
                const color =
                  tx.type === "income"
                    ? colors.success
                    : tx.type === "expense"
                      ? colors.danger
                      : colors.ink700;
                return (
                  <Pressable
                    key={tx.id}
                    onPress={() =>
                      router.push({
                        pathname: "/transaksi/baru",
                        params: { id: tx.id },
                      })
                    }
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: 10,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.ink100,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Row gap={10} style={{ flex: 1 }}>
                      <IconTile
                        name={(cat?.icon as any) ?? "swap-horizontal"}
                        bg={`${cat?.color ?? colors.ink400}1A`}
                        color={cat?.color ?? colors.ink500}
                      />
                      <View style={{ flex: 1 }}>
                        <Muted
                          style={{
                            color: colors.ink900,
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                          numberOfLines={1}
                        >
                          {tx.note || cat?.name || "Transfer"}
                        </Muted>
                        <Muted style={{ fontSize: 11 }}>
                          {formatRelativeDay(tx.date)} ·{" "}
                          {formatTime(tx.date)} · {wallet?.name ?? "—"}
                        </Muted>
                      </View>
                    </Row>
                    <Muted style={{ color, fontWeight: "700", fontSize: 13 }}>
                      {sign} {formatRupiah(tx.amount, false)}
                    </Muted>
                  </Pressable>
                );
              })
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
