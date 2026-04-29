import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Chip, IconTile, Input, Label, Muted, Progress, Row } from "@/components/ui";
import { currentMonthKey, formatRupiah, monthLabel } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, radius, spacing } from "@/theme";

export default function BudgetTab() {
  const month = currentMonthKey();
  const categories = useAppStore((s) => s.categories);
  const allBudgets = useAppStore((s) => s.budgets);
  const transactions = useAppStore((s) => s.transactions);
  const setBudget = useAppStore((s) => s.setBudget);
  const deleteBudget = useAppStore((s) => s.deleteBudget);

  const budgets = allBudgets.filter((b) => b.month === month);

  const [open, setOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<string | undefined>();
  const [limitInput, setLimitInput] = useState("");

  const items = useMemo(() => {
    return budgets.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const used = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.categoryId === b.categoryId &&
            t.date.startsWith(month),
        )
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = b.limit > 0 ? used / b.limit : 0;
      const status =
        pct >= 1 ? "danger" : pct >= 0.7 ? "warning" : "ok";
      return { budget: b, cat, used, pct, status } as const;
    });
  }, [budgets, categories, transactions, month]);

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalUsed = items.reduce((s, i) => s + i.used, 0);

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const availableCategories = expenseCategories.filter(
    (c) => !budgets.some((b) => b.categoryId === c.id),
  );

  const openAdd = () => {
    setEditingCat(availableCategories[0]?.id);
    setLimitInput("");
    setOpen(true);
  };

  const handleSave = () => {
    if (!editingCat) return;
    const value = Number.parseInt(limitInput.replace(/\D/g, ""), 10) || 0;
    if (value <= 0) return;
    setBudget(editingCat, month, value);
    setOpen(false);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          backgroundColor: colors.white,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.lg,
        }}
      >
        <Row>
          <Muted
            style={{ color: colors.ink900, fontSize: fontSize.lg, fontWeight: "700" }}
          >
            Budget Bulanan
          </Muted>
          <Pressable onPress={openAdd}>
            <Muted style={{ color: colors.brand700, fontWeight: "700" }}>
              + Tambah
            </Muted>
          </Pressable>
        </Row>
        <Muted style={{ marginTop: 4, fontSize: 12 }}>{monthLabel(month)}</Muted>

        {budgets.length > 0 ? (
          <LinearGradient
            colors={[colors.brand500, colors.brand700, "#064e3b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: radius.lg,
              padding: 16,
              marginTop: spacing.md,
            }}
          >
            <Muted style={{ color: "rgba(255,255,255,.85)", fontSize: 11 }}>
              Total Budget Terpakai
            </Muted>
            <Muted
              style={{
                color: colors.white,
                fontSize: fontSize.xxl,
                fontWeight: "800",
                marginTop: 2,
              }}
            >
              {formatRupiah(totalUsed)}
              <Muted
                style={{
                  color: "rgba(255,255,255,.7)",
                  fontSize: fontSize.sm,
                  fontWeight: "400",
                }}
              >
                {" "}
                / {formatRupiah(totalLimit, false)}
              </Muted>
            </Muted>
            <View style={{ marginTop: 10 }}>
              <Progress
                value={totalUsed}
                max={totalLimit}
                color={colors.white}
                trackColor="rgba(255,255,255,.2)"
              />
            </View>
            <Muted
              style={{
                color: "rgba(255,255,255,.85)",
                fontSize: 11,
                marginTop: 6,
              }}
            >
              {totalLimit > 0
                ? `${Math.round((totalUsed / totalLimit) * 100)}% terpakai · sisa ${formatRupiah(
                    Math.max(0, totalLimit - totalUsed),
                  )}`
                : "Belum ada budget"}
            </Muted>
          </LinearGradient>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxxl }}>
            <Ionicons name="pie-chart-outline" size={36} color={colors.ink300} />
            <Muted style={{ marginTop: 12 }}>Belum ada budget bulan ini.</Muted>
            <Button
              title="+ Buat budget pertama"
              onPress={openAdd}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          items.map(({ budget, cat, used, status }) => (
            <Pressable
              key={budget.id}
              onLongPress={() => deleteBudget(budget.id)}
            >
              <Card>
                <Row>
                  <Row gap={10}>
                    <IconTile
                      name={(cat?.icon as any) ?? "pricetag"}
                      bg={`${cat?.color ?? colors.ink400}1A`}
                      color={cat?.color ?? colors.ink500}
                    />
                    <View>
                      <Muted
                        style={{
                          color: colors.ink900,
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
                        {cat?.name ?? "—"}
                      </Muted>
                      <Muted style={{ fontSize: 11 }}>Bulanan</Muted>
                    </View>
                  </Row>
                  <View style={{ alignItems: "flex-end" }}>
                    <Muted
                      style={{
                        color:
                          status === "danger"
                            ? colors.danger
                            : colors.ink900,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {formatRupiah(used, false)}
                    </Muted>
                    <Muted style={{ fontSize: 11 }}>
                      / {formatRupiah(budget.limit, false)}
                    </Muted>
                  </View>
                </Row>
                <View style={{ marginTop: 8 }}>
                  <Progress
                    value={used}
                    max={budget.limit}
                    color={
                      status === "danger"
                        ? colors.danger
                        : status === "warning"
                          ? colors.warning
                          : colors.brand600
                    }
                  />
                </View>
                <Row style={{ marginTop: 8 }}>
                  <Muted style={{ fontSize: 11 }}>
                    {status === "danger"
                      ? `Lewat ${formatRupiah(used - budget.limit)}`
                      : `Sisa ${formatRupiah(Math.max(0, budget.limit - used))}`}
                  </Muted>
                  <Chip
                    label={
                      status === "danger"
                        ? "Over budget"
                        : status === "warning"
                          ? "Hati-hati"
                          : "Aman"
                    }
                    bg={
                      status === "danger"
                        ? colors.dangerBg
                        : status === "warning"
                          ? colors.warningBg
                          : colors.successBg
                    }
                    color={
                      status === "danger"
                        ? colors.danger
                        : status === "warning"
                          ? "#92400e"
                          : colors.brand700
                    }
                  />
                </Row>
              </Card>
            </Pressable>
          ))
        )}
        {items.length > 0 ? (
          <Muted style={{ textAlign: "center", marginTop: spacing.md, fontSize: 11 }}>
            Tap & tahan kartu budget untuk menghapus.
          </Muted>
        ) : null}
      </ScrollView>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
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
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.ink200,
              alignSelf: "center",
              marginBottom: spacing.md,
            }}
          />
          <Muted
            style={{
              color: colors.ink900,
              fontSize: 16,
              fontWeight: "700",
              marginBottom: spacing.md,
            }}
          >
            Tambah budget
          </Muted>

          {availableCategories.length === 0 ? (
            <Muted>Semua kategori sudah punya budget.</Muted>
          ) : (
            <>
              <Label>Kategori</Label>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginTop: 6 }}
                style={{ marginBottom: spacing.md }}
              >
                {availableCategories.map((c) => {
                  const active = c.id === editingCat;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setEditingCat(c.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: radius.pill,
                        backgroundColor: active ? c.color : `${c.color}1A`,
                      }}
                    >
                      <Ionicons
                        name={c.icon as any}
                        size={14}
                        color={active ? colors.white : c.color}
                      />
                      <Muted
                        style={{
                          color: active ? colors.white : c.color,
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        {c.name}
                      </Muted>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Label>Limit (Rp)</Label>
              <Input
                style={{ marginTop: 6 }}
                keyboardType="numeric"
                placeholder="500000"
                value={limitInput}
                onChangeText={(v) => setLimitInput(v.replace(/\D/g, ""))}
              />

              <Button
                title="Simpan budget"
                size="lg"
                onPress={handleSave}
                style={{ marginTop: spacing.lg }}
                disabled={!editingCat || !limitInput}
              />
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

