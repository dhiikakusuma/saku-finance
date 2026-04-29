import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Dimensions, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarChart,
  DonutChart,
  LineChart,
  type DonutSlice,
} from "@/components/charts";
import {
  Card,
  Chip,
  IconTile,
  Muted,
  Row,
  ScreenHeader,
  Segmented,
} from "@/components/ui";
import {
  currentMonthKey,
  formatRupiah,
  formatRupiahCompact,
  monthLabel,
} from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, spacing } from "@/theme";

type Period = "month" | "6m" | "year";

export default function LaporanScreen() {
  const router = useRouter();
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const [period, setPeriod] = useState<Period>("month");
  const [kind, setKind] = useState<"expense" | "income">("expense");

  const screenW = Dimensions.get("window").width;
  const chartW = screenW - spacing.lg * 2 - 24;

  const months = useMemo(() => {
    const arr: string[] = [];
    const now = new Date();
    const len = period === "month" ? 1 : period === "6m" ? 6 : 12;
    for (let i = len - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr;
  }, [period]);

  const monthSummaries = useMemo(() => {
    return months.map((m) => {
      let income = 0;
      let expense = 0;
      for (const t of transactions) {
        if (!t.date.startsWith(m)) continue;
        if (t.type === "income") income += t.amount;
        else if (t.type === "expense") expense += t.amount;
      }
      return { month: m, income, expense, net: income - expense };
    });
  }, [transactions, months]);

  const totalIncome = monthSummaries.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthSummaries.reduce((s, m) => s + m.expense, 0);
  const totalNet = totalIncome - totalExpense;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== kind) continue;
      const inRange = months.some((m) => t.date.startsWith(m));
      if (!inRange) continue;
      if (!t.categoryId) continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    const arr: DonutSlice[] = Array.from(map.entries())
      .map(([catId, value]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          label: cat?.name ?? "Lainnya",
          value,
          color: cat?.color ?? colors.ink400,
          icon: cat?.icon ?? "pricetag",
        };
      })
      .sort((a, b) => b.value - a.value);
    return arr as (DonutSlice & { icon: string })[];
  }, [transactions, categories, kind, months]);

  const totalKind = byCategory.reduce((s, c) => s + c.value, 0);

  const linePoints = useMemo(
    () =>
      monthSummaries.map((m) => ({
        label: m.month.slice(5) + "/" + m.month.slice(2, 4),
        value: kind === "income" ? m.income : m.expense,
      })),
    [monthSummaries, kind],
  );

  const monthLabelShort = (m: string) => {
    const [, mm] = m.split("-");
    const names = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ags",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return names[Number.parseInt(mm, 10) - 1] ?? m;
  };

  const insights = useMemo(() => {
    const out: { tone: "good" | "warn" | "info"; text: string }[] = [];
    if (monthSummaries.length >= 2) {
      const last = monthSummaries[monthSummaries.length - 1];
      const prev = monthSummaries[monthSummaries.length - 2];
      if (prev.expense > 0) {
        const diff = ((last.expense - prev.expense) / prev.expense) * 100;
        if (Math.abs(diff) > 5) {
          out.push({
            tone: diff > 0 ? "warn" : "good",
            text: `Pengeluaran bulan ini ${diff > 0 ? "naik" : "turun"} ${Math.abs(
              diff,
            ).toFixed(0)}% dibanding ${monthLabel(prev.month)}.`,
          });
        }
      }
    }
    if (byCategory.length > 0 && kind === "expense") {
      const top = byCategory[0];
      const pct = totalKind > 0 ? (top.value / totalKind) * 100 : 0;
      if (pct >= 25) {
        out.push({
          tone: "info",
          text: `Kategori "${top.label}" menyerap ${pct.toFixed(0)}% pengeluaranmu.`,
        });
      }
    }
    if (totalNet > 0 && period !== "month") {
      out.push({
        tone: "good",
        text: `Surplus ${formatRupiah(totalNet)} dalam ${monthSummaries.length} bulan terakhir 🎉`,
      });
    } else if (totalNet < 0) {
      out.push({
        tone: "warn",
        text: `Defisit ${formatRupiah(Math.abs(totalNet))} dalam periode ini — coba review kategori terbesar.`,
      });
    }
    if (out.length === 0) {
      out.push({
        tone: "info",
        text: "Belum cukup data untuk insight. Catat transaksi minimal 2 bulan untuk perbandingan.",
      });
    }
    return out;
  }, [monthSummaries, byCategory, totalKind, totalNet, period, kind]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Laporan & Analitik" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80, gap: spacing.md }}
      >
        <Segmented
          options={[
            { value: "month", label: "Bulan ini" },
            { value: "6m", label: "6 bulan" },
            { value: "year", label: "12 bulan" },
          ]}
          value={period}
          onChange={setPeriod}
        />

        {/* Summary cards */}
        <Row gap={8}>
          <Card style={{ flex: 1 }}>
            <Muted style={{ fontSize: 11 }}>Pemasukan</Muted>
            <Muted
              style={{
                color: colors.success,
                fontWeight: "700",
                fontSize: fontSize.md,
                marginTop: 2,
              }}
            >
              {formatRupiahCompact(totalIncome)}
            </Muted>
          </Card>
          <Card style={{ flex: 1 }}>
            <Muted style={{ fontSize: 11 }}>Pengeluaran</Muted>
            <Muted
              style={{
                color: colors.danger,
                fontWeight: "700",
                fontSize: fontSize.md,
                marginTop: 2,
              }}
            >
              {formatRupiahCompact(totalExpense)}
            </Muted>
          </Card>
          <Card style={{ flex: 1 }}>
            <Muted style={{ fontSize: 11 }}>Selisih</Muted>
            <Muted
              style={{
                color: totalNet >= 0 ? colors.brand700 : colors.danger,
                fontWeight: "700",
                fontSize: fontSize.md,
                marginTop: 2,
              }}
            >
              {totalNet >= 0 ? "+" : ""}
              {formatRupiahCompact(totalNet)}
            </Muted>
          </Card>
        </Row>

        {/* Trend line */}
        {monthSummaries.length > 1 ? (
          <Card>
            <Row>
              <View>
                <Muted
                  style={{ color: colors.ink900, fontWeight: "700", fontSize: 14 }}
                >
                  Tren {kind === "expense" ? "Pengeluaran" : "Pemasukan"}
                </Muted>
                <Muted style={{ fontSize: 11 }}>
                  {monthSummaries.length} bulan terakhir
                </Muted>
              </View>
              <Segmented
                options={[
                  { value: "expense", label: "Keluar" },
                  { value: "income", label: "Masuk" },
                ]}
                value={kind}
                onChange={setKind}
              />
            </Row>
            <View style={{ marginTop: spacing.md, alignItems: "center" }}>
              <LineChart
                data={linePoints.map((p) => ({
                  ...p,
                  label: monthLabelShort(months[linePoints.indexOf(p)] ?? ""),
                }))}
                width={chartW}
                height={180}
                color={kind === "income" ? colors.success : colors.danger}
                fill={
                  kind === "income"
                    ? `${colors.success}1A`
                    : `${colors.danger}1A`
                }
                yLabelFormatter={(v) => formatRupiahCompact(v).replace("Rp ", "")}
              />
            </View>
          </Card>
        ) : null}

        {/* Donut per kategori */}
        <Card>
          <Row>
            <View>
              <Muted
                style={{ color: colors.ink900, fontWeight: "700", fontSize: 14 }}
              >
                {kind === "expense" ? "Pengeluaran" : "Pemasukan"} per Kategori
              </Muted>
              <Muted style={{ fontSize: 11 }}>
                {period === "month"
                  ? monthLabel(currentMonthKey())
                  : `${monthSummaries.length} bulan terakhir`}
              </Muted>
            </View>
          </Row>

          {byCategory.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: spacing.xl,
              }}
            >
              <Ionicons name="pie-chart-outline" size={32} color={colors.ink300} />
              <Muted style={{ marginTop: 8 }}>
                Belum ada data {kind === "expense" ? "pengeluaran" : "pemasukan"}{" "}
                pada periode ini.
              </Muted>
            </View>
          ) : (
            <>
              <View style={{ marginTop: spacing.md, alignItems: "center" }}>
                <DonutChart
                  data={byCategory}
                  size={200}
                  strokeWidth={28}
                  centerValue={formatRupiahCompact(totalKind)}
                  centerLabel={kind === "expense" ? "Total keluar" : "Total masuk"}
                />
              </View>

              <View style={{ marginTop: spacing.md, gap: 10 }}>
                {byCategory.map((c) => {
                  const pct =
                    totalKind > 0 ? (c.value / totalKind) * 100 : 0;
                  return (
                    <Row key={c.label}>
                      <Row gap={10} style={{ flex: 1 }}>
                        <IconTile
                          name={c.icon as any}
                          bg={`${c.color}1A`}
                          color={c.color}
                        />
                        <View style={{ flex: 1 }}>
                          <Muted
                            style={{
                              color: colors.ink900,
                              fontWeight: "600",
                              fontSize: 13,
                            }}
                          >
                            {c.label}
                          </Muted>
                          <Muted style={{ fontSize: 11 }}>
                            {pct.toFixed(0)}% · {formatRupiah(c.value)}
                          </Muted>
                        </View>
                      </Row>
                      <View
                        style={{
                          width: 56,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colors.ink100,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${Math.max(2, pct)}%`,
                            height: "100%",
                            backgroundColor: c.color,
                          }}
                        />
                      </View>
                    </Row>
                  );
                })}
              </View>
            </>
          )}
        </Card>

        {/* Bar masuk vs keluar per bulan */}
        {monthSummaries.length > 1 ? (
          <Card>
            <Muted
              style={{ color: colors.ink900, fontWeight: "700", fontSize: 14 }}
            >
              Masuk vs Keluar per Bulan
            </Muted>
            <View style={{ marginTop: spacing.md, alignItems: "center" }}>
              <BarChart
                data={monthSummaries.flatMap((m) => [
                  {
                    label: monthLabelShort(m.month),
                    value: m.income,
                    color: colors.success,
                  },
                  {
                    label: "",
                    value: m.expense,
                    color: colors.danger,
                  },
                ])}
                width={chartW}
                height={160}
                yLabelFormatter={(v) =>
                  formatRupiahCompact(v).replace("Rp ", "")
                }
              />
            </View>
            <Row gap={12} style={{ justifyContent: "center", marginTop: spacing.sm }}>
              <Row gap={6}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.success,
                  }}
                />
                <Muted style={{ fontSize: 11 }}>Pemasukan</Muted>
              </Row>
              <Row gap={6}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.danger,
                  }}
                />
                <Muted style={{ fontSize: 11 }}>Pengeluaran</Muted>
              </Row>
            </Row>
          </Card>
        ) : null}

        {/* Insights */}
        <Card>
          <Muted
            style={{ color: colors.ink900, fontWeight: "700", fontSize: 14 }}
          >
            Insight Otomatis
          </Muted>
          <View style={{ marginTop: spacing.md, gap: 10 }}>
            {insights.map((ins, i) => {
              const tone =
                ins.tone === "good"
                  ? { bg: colors.successBg, color: colors.brand700, icon: "trending-up" as const }
                  : ins.tone === "warn"
                    ? { bg: colors.warningBg, color: "#92400e", icon: "warning" as const }
                    : { bg: colors.brand50, color: colors.brand700, icon: "bulb" as const };
              return (
                <Row
                  key={i}
                  gap={10}
                  style={{
                    backgroundColor: tone.bg,
                    padding: 10,
                    borderRadius: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <Ionicons
                    name={tone.icon}
                    size={16}
                    color={tone.color}
                    style={{ marginTop: 1 }}
                  />
                  <Muted
                    style={{
                      color: tone.color,
                      fontSize: 12,
                      flex: 1,
                      lineHeight: 16,
                    }}
                  >
                    {ins.text}
                  </Muted>
                </Row>
              );
            })}
          </View>
        </Card>

        <Pressable onPress={() => router.push("/transaksi")}>
          <Chip
            label="Lihat semua transaksi →"
            bg={colors.brand50}
            color={colors.brand700}
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
