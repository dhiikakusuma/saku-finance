import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Chip, IconTile, Muted, Row, Segmented } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { ocrFromBase64 } from "@/lib/ocr";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, radius, spacing } from "@/theme";

type TxKind = "expense" | "income" | "transfer";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "del"],
];

export default function NewTransaction() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id;
  const transactions = useAppStore((s) => s.transactions);
  const editing = editingId
    ? transactions.find((t) => t.id === editingId)
    : null;

  const categories = useAppStore((s) => s.categories);
  const wallets = useAppStore((s) => s.wallets);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);

  const [type, setType] = useState<TxKind>(
    (editing?.type as TxKind) ?? "expense",
  );
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "0");
  const [categoryId, setCategoryId] = useState<string | undefined>(
    editing?.categoryId ?? undefined,
  );
  const [walletId, setWalletId] = useState<string>(
    editing?.walletId ?? wallets[0]?.id ?? "",
  );
  const [toWalletId, setToWalletId] = useState<string | undefined>(
    editing?.toWalletId ?? wallets[1]?.id,
  );
  const [note, setNote] = useState(editing?.note ?? "");

  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [pickingTo, setPickingTo] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);

  const ocrApiKey = useAppStore((s) => s.settings.ocrApiKey);

  const handleScanReceipt = async () => {
    Alert.alert("Scan struk", "Pilih sumber gambar:", [
      { text: "Batal", style: "cancel" },
      {
        text: "Kamera",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert("Izin ditolak", "Akses kamera diperlukan untuk scan struk.");
            return;
          }
          const r = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.6,
            base64: true,
          });
          if (!r.canceled && r.assets[0]?.base64) {
            await runOcr(r.assets[0].base64);
          }
        },
      },
      {
        text: "Galeri",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert("Izin ditolak", "Akses galeri diperlukan.");
            return;
          }
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.6,
            base64: true,
          });
          if (!r.canceled && r.assets[0]?.base64) {
            await runOcr(r.assets[0].base64);
          }
        },
      },
    ]);
  };

  const runOcr = async (base64: string) => {
    setOcrBusy(true);
    try {
      const result = await ocrFromBase64(base64, ocrApiKey || "helloworld");
      const lines: string[] = [];
      if (result.amount !== null && result.amount > 0) {
        setAmount(String(result.amount));
        lines.push(`Nominal: Rp ${result.amount.toLocaleString("id-ID")}`);
      }
      if (result.merchant) {
        setNote((prev) =>
          prev.trim().length > 0 ? prev : `Belanja di ${result.merchant}`,
        );
        lines.push(`Toko: ${result.merchant}`);
      }
      if (result.amount === null && !result.merchant) {
        Alert.alert(
          "OCR gagal",
          "Tidak bisa baca struk ini. Coba foto ulang dengan lebih jelas, atau isi manual.",
        );
        return;
      }
      Alert.alert(
        "Struk berhasil dibaca",
        lines.join("\n") +
          "\n\nReview dulu nominalnya sebelum simpan.",
      );
    } catch (e) {
      Alert.alert(
        "OCR error",
        String(e instanceof Error ? e.message : e) +
          "\n\nKey OCR.space mungkin sudah penuh. Coba isi API key sendiri di Profil → Pengaturan OCR.",
      );
    } finally {
      setOcrBusy(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (type === "expense") return categories.filter((c) => c.kind === "expense");
    if (type === "income") return categories.filter((c) => c.kind === "income");
    return [];
  }, [categories, type]);

  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedWallet = wallets.find((w) => w.id === walletId);
  const selectedTo = wallets.find((w) => w.id === toWalletId);

  const handleKey = (k: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (k === "del") {
      setAmount((a) => (a.length <= 1 ? "0" : a.slice(0, -1)));
      return;
    }
    if (k === ".") {
      if (amount.includes(".")) return;
      setAmount(amount + ".");
      return;
    }
    setAmount((a) => (a === "0" ? k : a + k));
  };

  const numericAmount = Number.parseFloat(amount.replace(/[^\d.]/g, "")) || 0;

  const canSubmit =
    numericAmount > 0 &&
    walletId &&
    (type === "transfer"
      ? toWalletId && toWalletId !== walletId
      : !!categoryId);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const payload = {
      type,
      amount: numericAmount,
      categoryId: type === "transfer" ? undefined : categoryId,
      walletId,
      toWalletId: type === "transfer" ? toWalletId : undefined,
      date: editing?.date ?? new Date().toISOString(),
      note: note.trim() || undefined,
    };
    if (editing) updateTransaction(editing.id, payload);
    else addTransaction(payload);
    router.back();
  };

  const handleDelete = () => {
    if (!editing) return;
    deleteTransaction(editing.id);
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        }}
      >
        <Row>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.ink900} />
          </Pressable>
          <Muted
            style={{ color: colors.ink900, fontWeight: "700", fontSize: 15 }}
          >
            {editing ? "Edit Transaksi" : "Transaksi Baru"}
          </Muted>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            hitSlop={10}
            style={{ opacity: canSubmit ? 1 : 0.4 }}
          >
            <Muted
              style={{
                color: colors.brand700,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              Simpan
            </Muted>
          </Pressable>
        </Row>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Segmented
          options={[
            { value: "expense", label: "Pengeluaran" },
            { value: "income", label: "Pemasukan" },
            { value: "transfer", label: "Transfer" },
          ]}
          value={type}
          onChange={(v) => {
            setType(v);
            if (v !== "transfer" && !categoryId) {
              const first =
                v === "expense"
                  ? categories.find((c) => c.kind === "expense")?.id
                  : categories.find((c) => c.kind === "income")?.id;
              setCategoryId(first);
            }
          }}
        />

        {type === "expense" ? (
          <Pressable
            onPress={handleScanReceipt}
            disabled={ocrBusy}
            style={{ marginTop: spacing.md }}
          >
            <Card
              style={{
                borderStyle: "dashed",
                borderColor: colors.brand500,
                paddingVertical: 12,
              }}
            >
              <Row gap={10}>
                {ocrBusy ? (
                  <ActivityIndicator size="small" color={colors.brand700} />
                ) : (
                  <IconTile
                    name="camera"
                    bg={colors.brand50}
                    color={colors.brand700}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Muted
                    style={{
                      color: colors.ink900,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {ocrBusy ? "Membaca struk…" : "Scan struk (auto-isi nominal)"}
                  </Muted>
                  <Muted style={{ fontSize: 11 }}>
                    Foto struk → nominal & toko terisi otomatis
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
        ) : null}

        <View style={{ alignItems: "center", marginTop: spacing.xl }}>
          <Muted style={{ fontSize: 11 }}>Nominal</Muted>
          <Muted
            style={{
              color: colors.ink900,
              fontSize: 32,
              fontWeight: "800",
              marginTop: 2,
            }}
          >
            {formatRupiah(numericAmount)}
          </Muted>
        </View>

        <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
          {type !== "transfer" ? (
            <Pressable onPress={() => setShowCatPicker(true)}>
              <Card padded={false} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
                <Row>
                  <Row gap={10}>
                    <IconTile
                      name={(selectedCat?.icon as any) ?? "pricetag"}
                      bg={`${selectedCat?.color ?? colors.ink400}1A`}
                      color={selectedCat?.color ?? colors.ink500}
                    />
                    <View>
                      <Muted style={{ fontSize: 11 }}>Kategori</Muted>
                      <Muted
                        style={{
                          color: colors.ink900,
                          fontWeight: "600",
                          fontSize: 13,
                        }}
                      >
                        {selectedCat?.name ?? "Pilih kategori"}
                      </Muted>
                    </View>
                  </Row>
                  <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
                </Row>
              </Card>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              setPickingTo(false);
              setShowWalletPicker(true);
            }}
          >
            <Card padded={false} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
              <Row>
                <Row gap={10}>
                  <IconTile
                    name={(selectedWallet?.icon as any) ?? "wallet"}
                    bg={`${selectedWallet?.color ?? colors.ink400}1A`}
                    color={selectedWallet?.color ?? colors.ink500}
                  />
                  <View>
                    <Muted style={{ fontSize: 11 }}>
                      {type === "transfer" ? "Dari dompet" : "Dompet"}
                    </Muted>
                    <Muted
                      style={{
                        color: colors.ink900,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {selectedWallet?.name ?? "Pilih dompet"}
                    </Muted>
                  </View>
                </Row>
                <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
              </Row>
            </Card>
          </Pressable>

          {type === "transfer" ? (
            <Pressable
              onPress={() => {
                setPickingTo(true);
                setShowWalletPicker(true);
              }}
            >
              <Card padded={false} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
                <Row>
                  <Row gap={10}>
                    <IconTile
                      name={(selectedTo?.icon as any) ?? "wallet"}
                      bg={`${selectedTo?.color ?? colors.ink400}1A`}
                      color={selectedTo?.color ?? colors.ink500}
                    />
                    <View>
                      <Muted style={{ fontSize: 11 }}>Ke dompet</Muted>
                      <Muted
                        style={{
                          color: colors.ink900,
                          fontWeight: "600",
                          fontSize: 13,
                        }}
                      >
                        {selectedTo?.name ?? "Pilih dompet"}
                      </Muted>
                    </View>
                  </Row>
                  <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
                </Row>
              </Card>
            </Pressable>
          ) : null}

          <Card padded={false} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Muted style={{ fontSize: 11 }}>Catatan</Muted>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Tulis catatan…"
              placeholderTextColor={colors.ink400}
              style={{
                fontSize: 14,
                color: colors.ink900,
                paddingVertical: 4,
              }}
            />
          </Card>

          {editing ? (
            <Pressable onPress={handleDelete}>
              <Chip
                label="🗑 Hapus transaksi"
                bg={colors.dangerBg}
                color={colors.danger}
              />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {/* Numpad */}
      <View
        style={{
          padding: spacing.md,
          gap: 8,
          backgroundColor: colors.bg,
        }}
      >
        {KEYS.map((row, ri) => (
          <Row gap={8} key={ri}>
            {row.map((k) => (
              <Pressable
                key={k}
                onPress={() => handleKey(k)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderRadius: radius.md,
                  backgroundColor: colors.ink100,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {k === "del" ? (
                  <Ionicons name="backspace-outline" size={20} color={colors.ink900} />
                ) : (
                  <Muted
                    style={{
                      color: colors.ink900,
                      fontSize: fontSize.lg,
                      fontWeight: "700",
                    }}
                  >
                    {k}
                  </Muted>
                )}
              </Pressable>
            ))}
          </Row>
        ))}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => ({
            height: 50,
            borderRadius: radius.md,
            backgroundColor: colors.brand600,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 4,
            opacity: !canSubmit ? 0.4 : pressed ? 0.85 : 1,
          })}
        >
          <Muted style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>
            Simpan
          </Muted>
        </Pressable>
      </View>

      <PickerSheet
        visible={showCatPicker}
        title="Pilih kategori"
        items={filteredCategories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
        }))}
        onPick={(id) => {
          setCategoryId(id);
          setShowCatPicker(false);
        }}
        onClose={() => setShowCatPicker(false)}
      />
      <PickerSheet
        visible={showWalletPicker}
        title={pickingTo ? "Pilih dompet tujuan" : "Pilih dompet"}
        items={wallets
          .filter((w) => (pickingTo ? w.id !== walletId : true))
          .map((w) => ({
            id: w.id,
            name: w.name,
            icon: w.icon,
            color: w.color,
            sub: formatRupiah(w.balance),
          }))}
        onPick={(id) => {
          if (pickingTo) setToWalletId(id);
          else setWalletId(id);
          setShowWalletPicker(false);
        }}
        onClose={() => setShowWalletPicker(false)}
      />
    </SafeAreaView>
  );
}

function PickerSheet({
  visible,
  title,
  items,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: { id: string; name: string; icon: string; color: string; sub?: string }[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(15,23,42,.4)" }}
      />
      <View
        style={{
          backgroundColor: colors.white,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
          maxHeight: "70%",
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
            fontSize: 15,
            fontWeight: "700",
            marginBottom: spacing.md,
          }}
        >
          {title}
        </Muted>
        <ScrollView>
          {items.map((it) => (
            <Pressable
              key={it.id}
              onPress={() => onPick(it.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 10,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <IconTile name={it.icon as any} bg={`${it.color}1A`} color={it.color} />
              <View style={{ flex: 1 }}>
                <Muted
                  style={{
                    color: colors.ink900,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {it.name}
                </Muted>
                {it.sub ? <Muted style={{ fontSize: 11 }}>{it.sub}</Muted> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.ink300} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
