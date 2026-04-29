import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
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
import type { CategoryKind } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing } from "@/theme";

const PALETTE = [
  "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981", "#0ea5e9",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#14b8a6", "#64748b",
];

const ICONS: string[] = [
  "restaurant", "cafe", "fast-food", "car", "bus", "bicycle", "airplane",
  "flash", "water", "wifi", "cart", "bag", "gift", "game-controller",
  "musical-notes", "film", "barbell", "medkit", "school", "book", "wallet",
  "card", "briefcase", "laptop", "home", "paw", "person",
];

export default function KategoriPage() {
  const router = useRouter();
  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);

  const [tab, setTab] = useState<CategoryKind>("expense");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [icon, setIcon] = useState(ICONS[0]);

  const filtered = categories.filter((c) => c.kind === tab);

  const handleSave = () => {
    if (!name.trim()) return;
    addCategory({ name: name.trim(), color, icon, kind: tab });
    setOpen(false);
    setName("");
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Kategori"
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => setOpen(true)} hitSlop={10}>
            <Ionicons name="add-circle" size={24} color={colors.brand600} />
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Segmented
          options={[
            { value: "expense", label: "Pengeluaran" },
            { value: "income", label: "Pemasukan" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card padded={false}>
          {filtered.map((c, i) => (
            <Pressable
              key={c.id}
              onLongPress={() => deleteCategory(c.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: spacing.md,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.ink100,
              }}
            >
              <IconTile name={c.icon as any} bg={`${c.color}1A`} color={c.color} />
              <Muted
                style={{ color: colors.ink900, fontWeight: "600", fontSize: 14, flex: 1 }}
              >
                {c.name}
              </Muted>
              <Ionicons name="chevron-forward" size={16} color={colors.ink300} />
            </Pressable>
          ))}
        </Card>
        <Muted style={{ textAlign: "center", marginTop: spacing.md, fontSize: 11 }}>
          Tap & tahan kategori untuk menghapus.
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
            maxHeight: "85%",
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
            Kategori baru
          </Muted>

          <Label>Nama</Label>
          <Input
            style={{ marginTop: 6 }}
            placeholder="Misal: Kopi, Olahraga"
            value={name}
            onChangeText={setName}
          />

          <Label style={{ marginTop: spacing.md }}>Warna</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {PALETTE.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: colors.white,
                  ...(color === c
                    ? {
                        shadowColor: c,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                        elevation: 3,
                      }
                    : {}),
                }}
              />
            ))}
          </View>

          <Label style={{ marginTop: spacing.md }}>Ikon</Label>
          <ScrollView
            style={{ marginTop: 6, maxHeight: 220 }}
            contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
          >
            {ICONS.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: ic === icon ? color : `${color}1A`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={ic as any}
                  size={20}
                  color={ic === icon ? colors.white : color}
                />
              </Pressable>
            ))}
          </ScrollView>

          <Button
            title="Tambah kategori"
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
