import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, IconTile, Muted, Row, Segmented } from "@/components/ui";
import {
  currentMonthKey,
  formatRelativeDay,
  formatRupiah,
  formatTime,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, radius, spacing } from "@/theme";

type Filter = "today" | "month" | "all";

export default function TransaksiTab() {
  const router = useRouter();
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const wallets = useAppStore((s) => s.wallets);
  const [filter, setFilter] = useState<Filter>("month");

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = currentMonthKey();
    return transactions.filter((t) => {
      if (filter === "today") return t.date.startsWith(today);
      if (filter === "month") return t.date.startsWith(month);
      return true;
    });
  }, [transactions, filter]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") expense += t.amount;
    }
    return { income, expense };
  }, [filtered]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = t.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0] > b[0] ? -1 : 1,
    );
  }, [filtered]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.white, paddingBottom: spacing.md }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Row>
            <Muted
              style={{ color: colors.ink900, fontSize: fontSize.lg, fontWeight: "700" }}
            >
              Transaksi
            </Muted>
            <Pressable onPress={() => router.push("/transaksi/baru")} hitSlop={10}>
              <Ionicons name="add-circle" size={26} color={colors.brand600} />
            </Pressable>
          </Row>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <Segmented
            options={[
              { value: "today", label: "Hari ini" },
              { value: "month", label: "Bulan ini" },
              { value: "all", label: "Semua" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </View>
        <Row
          style={{
            paddingHorizontal: spacing.lg,
            marginTop: spacing.md,
          }}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            <Muted style={{ fontSize: 11 }}>Pemasukan</Muted>
            <Muted
              style={{ color: colors.success, fontSize: 14, fontWeight: "700" }}
            >
              + {formatRupiah(summary.income, false)}
            </Muted>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Muted style={{ fontSize: 11 }}>Pengeluaran</Muted>
            <Muted
              style={{ color: colors.danger, fontSize: 14, fontWeight: "700" }}
            >
              - {formatRupiah(summary.expense, false)}
            </Muted>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Muted style={{ fontSize: 11 }}>Selisih</Muted>
            <Muted
              style={{ color: colors.ink900, fontSize: 14, fontWeight: "700" }}
            >
              {summary.income - summary.expense >= 0 ? "+" : ""}
              {formatRupiah(summary.income - summary.expense, false)}
            </Muted>
          </View>
        </Row>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        {grouped.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxxl }}>
            <Ionicons
              name="document-text-outline"
              size={36}
              color={colors.ink300}
            />
            <Muted style={{ marginTop: 12 }}>
              Belum ada transaksi pada periode ini.
            </Muted>
            <Pressable
              onPress={() => router.push("/transaksi/baru")}
              style={{ marginTop: 12 }}
            >
              <View
                style={{
                  backgroundColor: colors.brand600,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: radius.md,
                }}
              >
                <Muted style={{ color: colors.white, fontWeight: "700" }}>
                  Tambah transaksi
                </Muted>
              </View>
            </Pressable>
          </View>
        ) : (
          grouped.map(([date, txs]) => (
            <View key={date} style={{ marginBottom: spacing.lg }}>
              <Muted
                style={{
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  fontSize: 11,
                  fontWeight: "700",
                  marginBottom: 6,
                  color: colors.ink500,
                }}
              >
                {formatRelativeDay(`${date}T00:00:00`)}
              </Muted>
              <Card padded={false}>
                {txs.map((tx, i) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const w = wallets.find((x) => x.id === tx.walletId);
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
                            {tx.note ||
                              cat?.name ||
                              (tx.type === "transfer" ? "Transfer" : "—")}
                          </Muted>
                          <Muted style={{ fontSize: 11 }}>
                            {cat?.name ?? "Transfer"} · {w?.name ?? "—"} ·{" "}
                            {formatTime(tx.date)}
                          </Muted>
                        </View>
                      </Row>
                      <Muted
                        style={{ color, fontWeight: "700", fontSize: 13 }}
                      >
                        {sign} {formatRupiah(tx.amount, false)}
                      </Muted>
                    </Pressable>
                  );
                })}
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
