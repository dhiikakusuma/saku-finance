import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as XLSX from "xlsx";
import {
  Button,
  Card,
  Chip,
  IconTile,
  Muted,
  Row,
  ScreenHeader,
  Segmented,
} from "@/components/ui";
import { currentMonthKey, formatRupiah, monthLabel } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, spacing } from "@/theme";

type Range = "month" | "3m" | "6m" | "year" | "all";

export default function ExportScreen() {
  const router = useRouter();
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const wallets = useAppStore((s) => s.wallets);
  const profile = useAppStore((s) => s.profile);

  const [range, setRange] = useState<Range>("month");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    let from: Date | null = null;
    if (range === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === "3m") {
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (range === "6m") {
      from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else if (range === "year") {
      from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }
    return transactions
      .filter((t) => (from ? new Date(t.date) >= from : true))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, range]);

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const rangeLabel =
    range === "month"
      ? monthLabel(currentMonthKey())
      : range === "3m"
        ? "3 bulan terakhir"
        : range === "6m"
          ? "6 bulan terakhir"
          : range === "year"
            ? "12 bulan terakhir"
            : "Semua periode";

  const buildRows = () =>
    filtered.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const w = wallets.find((w) => w.id === t.walletId);
      const wTo = t.toWalletId
        ? wallets.find((w) => w.id === t.toWalletId)
        : null;
      return {
        Tanggal: t.date.slice(0, 10),
        Jenis:
          t.type === "income"
            ? "Pemasukan"
            : t.type === "expense"
              ? "Pengeluaran"
              : "Transfer",
        Kategori: cat?.name ?? "-",
        Dompet: w?.name ?? "-",
        "Dompet Tujuan": wTo?.name ?? "",
        Nominal: t.amount,
        Catatan: t.note ?? "",
      };
    });

  const exportExcel = async () => {
    if (filtered.length === 0) {
      Alert.alert("Kosong", "Tidak ada transaksi pada periode terpilih.");
      return;
    }
    setBusy(true);
    try {
      const rows = buildRows();
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      // column widths
      ws["!cols"] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

      // Summary sheet
      const summary = [
        ["Periode", rangeLabel],
        ["Total Pemasukan", totalIncome],
        ["Total Pengeluaran", totalExpense],
        ["Selisih", totalIncome - totalExpense],
        ["Jumlah Transaksi", filtered.length],
        ["Dibuat", new Date().toLocaleString("id-ID")],
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(summary);
      ws2["!cols"] = [{ wch: 22 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Ringkasan");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const filename = `saku-${range}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const uri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Bagikan laporan Excel",
          UTI: "com.microsoft.excel.xlsx",
        });
      } else {
        Alert.alert("Gagal", "Sharing tidak tersedia di device ini.");
      }
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setBusy(false);
    }
  };

  const exportPDF = async () => {
    if (filtered.length === 0) {
      Alert.alert("Kosong", "Tidak ada transaksi pada periode terpilih.");
      return;
    }
    setBusy(true);
    try {
      const html = buildPdfHtml({
        rows: filtered,
        categories,
        wallets,
        ownerName: profile.name,
        rangeLabel,
        totalIncome,
        totalExpense,
      });
      const { uri } = await Print.printToFileAsync({ html });
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Bagikan laporan PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Gagal", "Sharing tidak tersedia di device ini.");
      }
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Export Data" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.md,
          paddingBottom: 80,
        }}
      >
        <Muted style={{ fontWeight: "700", color: colors.ink700 }}>
          Pilih periode
        </Muted>
        <Segmented
          options={[
            { value: "month", label: "Bulan ini" },
            { value: "3m", label: "3 bln" },
            { value: "6m", label: "6 bln" },
            { value: "year", label: "1 thn" },
            { value: "all", label: "Semua" },
          ]}
          value={range}
          onChange={setRange}
        />

        <Card>
          <Muted style={{ fontSize: 11 }}>Periode</Muted>
          <Muted
            style={{
              color: colors.ink900,
              fontWeight: "700",
              fontSize: fontSize.md,
            }}
          >
            {rangeLabel}
          </Muted>
          <Row gap={8} style={{ marginTop: spacing.md }}>
            <View
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor: colors.successBg,
              }}
            >
              <Muted style={{ fontSize: 10, color: colors.success }}>
                Pemasukan
              </Muted>
              <Muted
                style={{
                  color: colors.success,
                  fontWeight: "700",
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {formatRupiah(totalIncome)}
              </Muted>
            </View>
            <View
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor: "#fee2e2",
              }}
            >
              <Muted style={{ fontSize: 10, color: colors.danger }}>
                Pengeluaran
              </Muted>
              <Muted
                style={{
                  color: colors.danger,
                  fontWeight: "700",
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {formatRupiah(totalExpense)}
              </Muted>
            </View>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Muted style={{ fontSize: 11 }}>
              {filtered.length} transaksi siap di-export
            </Muted>
            <Chip
              label={filtered.length === 0 ? "Kosong" : "Siap"}
              bg={filtered.length === 0 ? colors.ink100 : colors.brand50}
              color={
                filtered.length === 0 ? colors.ink500 : colors.brand700
              }
            />
          </Row>
        </Card>

        <Pressable onPress={exportExcel} disabled={busy}>
          <Card>
            <Row>
              <Row gap={10}>
                <IconTile
                  name="document-text"
                  bg={colors.successBg}
                  color={colors.success}
                />
                <View>
                  <Muted
                    style={{
                      color: colors.ink900,
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Export Excel (.xlsx)
                  </Muted>
                  <Muted style={{ fontSize: 11 }}>
                    2 sheet: Transaksi + Ringkasan
                  </Muted>
                </View>
              </Row>
              <Ionicons
                name="download"
                size={20}
                color={colors.brand700}
              />
            </Row>
          </Card>
        </Pressable>

        <Pressable onPress={exportPDF} disabled={busy}>
          <Card>
            <Row>
              <Row gap={10}>
                <IconTile
                  name="document"
                  bg="#fee2e2"
                  color={colors.danger}
                />
                <View>
                  <Muted
                    style={{
                      color: colors.ink900,
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Export PDF
                  </Muted>
                  <Muted style={{ fontSize: 11 }}>
                    Laporan formal dengan header & ringkasan
                  </Muted>
                </View>
              </Row>
              <Ionicons
                name="download"
                size={20}
                color={colors.brand700}
              />
            </Row>
          </Card>
        </Pressable>

        {busy ? (
          <Muted style={{ textAlign: "center" }}>Memproses…</Muted>
        ) : null}

        <Card>
          <Row gap={10} style={{ alignItems: "flex-start" }}>
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.brand700}
              style={{ marginTop: 2 }}
            />
            <Muted style={{ flex: 1, fontSize: 12, lineHeight: 16 }}>
              File akan di-share lewat sheet bawaan HP — bisa kirim ke WhatsApp,
              Email, Drive, atau simpan ke Files.
            </Muted>
          </Row>
        </Card>
      </ScrollView>

      <Button
        title="Selesai"
        variant="ghost"
        onPress={() => router.back()}
        style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
      />
    </SafeAreaView>
  );
}

function buildPdfHtml({
  rows,
  categories,
  wallets,
  ownerName,
  rangeLabel,
  totalIncome,
  totalExpense,
}: {
  rows: ReturnType<typeof useAppStore.getState>["transactions"];
  categories: ReturnType<typeof useAppStore.getState>["categories"];
  wallets: ReturnType<typeof useAppStore.getState>["wallets"];
  ownerName: string;
  rangeLabel: string;
  totalIncome: number;
  totalExpense: number;
}): string {
  const fmt = (n: number) =>
    "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const tableRows = rows
    .map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const w = wallets.find((x) => x.id === t.walletId);
      const isExp = t.type === "expense";
      const sign = isExp ? "-" : t.type === "income" ? "+" : "";
      const color = isExp
        ? "#ef4444"
        : t.type === "income"
          ? "#16a34a"
          : "#64748b";
      return `<tr>
        <td>${t.date.slice(0, 10)}</td>
        <td>${
          t.type === "income"
            ? "Masuk"
            : t.type === "expense"
              ? "Keluar"
              : "Transfer"
        }</td>
        <td>${cat?.name ?? "-"}</td>
        <td>${w?.name ?? "-"}</td>
        <td>${(t.note ?? "").replace(/</g, "&lt;")}</td>
        <td style="text-align:right;color:${color};font-weight:600">${sign}${fmt(t.amount)}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #0f172a; padding: 28px; }
  h1 { color: #16a34a; margin: 0 0 4px; font-size: 22px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 16px; }
  .summary { display: flex; gap: 12px; margin: 16px 0 24px; }
  .card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
  .card .lbl { font-size: 11px; color: #64748b; }
  .card .val { font-size: 15px; font-weight: 700; margin-top: 2px; }
  .card.in .val { color: #16a34a; }
  .card.out .val { color: #ef4444; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #16a34a; color: white; padding: 8px; text-align: left; font-weight: 600; }
  td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { margin-top: 18px; font-size: 10px; color: #94a3b8; text-align: center; }
</style></head>
<body>
  <h1>Laporan Keuangan — Saku</h1>
  <div class="meta">${ownerName} · ${rangeLabel} · Dibuat ${new Date().toLocaleString("id-ID")}</div>
  <div class="summary">
    <div class="card in"><div class="lbl">Pemasukan</div><div class="val">${fmt(totalIncome)}</div></div>
    <div class="card out"><div class="lbl">Pengeluaran</div><div class="val">${fmt(totalExpense)}</div></div>
    <div class="card"><div class="lbl">Selisih</div><div class="val" style="color:${totalIncome - totalExpense >= 0 ? "#16a34a" : "#ef4444"}">${fmt(totalIncome - totalExpense)}</div></div>
    <div class="card"><div class="lbl">Transaksi</div><div class="val">${rows.length}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Dompet</th><th>Catatan</th><th style="text-align:right">Nominal</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">Dibuat dengan Saku · Aplikasi Manajemen Keuangan Bulanan</div>
</body></html>`;
}
