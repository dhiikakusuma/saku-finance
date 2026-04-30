import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Chip, IconTile, Muted, Row } from "@/components/ui";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, radius, spacing } from "@/theme";

type ItemProps = {
  icon: keyof typeof import("@expo/vector-icons/Ionicons").default.glyphMap;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
};

function MenuItem({ icon, label, right, onPress, danger }: ItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Row gap={10}>
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? colors.danger : colors.ink700}
        />
        <Muted
          style={{
            color: danger ? colors.danger : colors.ink900,
            fontWeight: "500",
            fontSize: 14,
          }}
        >
          {label}
        </Muted>
      </Row>
      {right ?? <Ionicons name="chevron-forward" size={16} color={colors.ink400} />}
    </Pressable>
  );
}

export default function ProfilTab() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const settings = useAppStore((s) => s.settings);
  const togglePin = useAppStore((s) => s.togglePin);
  const setTheme = useAppStore((s) => s.setTheme);
  const resetAll = useAppStore((s) => s.resetAll);

  const handleReset = () => {
    Alert.alert(
      "Reset semua data?",
      "Transaksi, dompet, budget, dan profile akan dihapus. Tindakan ini tidak bisa dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetAll(),
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
            backgroundColor: colors.white,
          }}
        >
          <Row>
            <Row gap={12}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.brand600,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Muted
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  {(profile.name || "S").charAt(0).toUpperCase()}
                </Muted>
              </View>
              <View>
                <Muted
                  style={{
                    color: colors.ink900,
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  {profile.name || "Pengguna"}
                </Muted>
                <Muted style={{ fontSize: 11 }}>
                  {profile.email ?? "Belum login"}
                </Muted>
              </View>
            </Row>
          </Row>

          {!settings.premium ? (
            <LinearGradient
              colors={["#fbbf24", "#f59e0b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginTop: spacing.lg,
                borderRadius: radius.lg,
                padding: 14,
              }}
            >
              <Row>
                <View style={{ flex: 1 }}>
                  <Row gap={6}>
                    <Muted
                      style={{
                        color: "#451a03",
                        fontWeight: "800",
                        fontSize: 14,
                      }}
                    >
                      Saku Premium
                    </Muted>
                    <Chip
                      label="PRO"
                      bg="rgba(255,255,255,.5)"
                      color="#451a03"
                    />
                  </Row>
                  <Muted style={{ color: "#451a03cc", fontSize: 11, marginTop: 4 }}>
                    Sync cloud, OCR struk unlimited, laporan tahunan, & tanpa
                    iklan.
                  </Muted>
                </View>
              </Row>
              <View
                style={{
                  marginTop: 10,
                  backgroundColor: "#451a03",
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  alignItems: "center",
                }}
              >
                <Muted style={{ color: colors.white, fontWeight: "700" }}>
                  Upgrade Rp 25rb / bulan
                </Muted>
              </View>
            </LinearGradient>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Muted
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 6,
              fontWeight: "700",
            }}
          >
            Akun
          </Muted>
          <Card padded={false}>
            <MenuItem
              icon="person"
              label="Profil & penghasilan"
              right={
                <Muted style={{ fontSize: 12 }}>
                  Tgl gajian: {profile.payday}
                </Muted>
              }
              onPress={() => router.push("/profil/profil-detail")}
            />
            <View style={{ height: 1, backgroundColor: colors.ink100 }} />
            <MenuItem
              icon="wallet"
              label="Dompet & rekening"
              onPress={() => router.push("/profil/dompet")}
            />
            <View style={{ height: 1, backgroundColor: colors.ink100 }} />
            <MenuItem
              icon="pricetags"
              label="Kategori"
              onPress={() => router.push("/profil/kategori")}
            />
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Muted
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 6,
              fontWeight: "700",
            }}
          >
            Data
          </Muted>
          <Card padded={false}>
            <MenuItem
              icon="bar-chart"
              label="Laporan & analitik"
              onPress={() => router.push("/laporan" as any)}
            />
            <View style={{ height: 1, backgroundColor: colors.ink100 }} />
            <MenuItem
              icon="cloud-upload"
              label="Sync cloud"
              right={
                <Chip
                  label={settings.premium ? "Aktif" : "PRO"}
                  bg={settings.premium ? colors.brand50 : "#fef3c7"}
                  color={settings.premium ? colors.brand700 : "#92400e"}
                />
              }
              onPress={() => {
                if (!settings.premium) {
                  Alert.alert("Saku Premium", "Fitur ini butuh upgrade Premium.");
                }
              }}
            />
            <View style={{ height: 1, backgroundColor: colors.ink100 }} />
            <MenuItem
              icon="cloud-download"
              label="Export PDF / Excel"
              onPress={() => router.push("/export" as any)}
            />
            <View style={{ height: 1, backgroundColor: colors.ink100 }} />
            <MenuItem
              icon="trash"
              label="Reset semua data"
              danger
              onPress={handleReset}
            />
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Muted
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 6,
              fontWeight: "700",
            }}
          >
            Keamanan
          </Muted>
          <Card padded={false}>
            <MenuItem
              icon="lock-closed"
              label="PIN aplikasi"
              right={
                <Pressable onPress={() => togglePin(!settings.pinEnabled)}>
                  <Chip
                    label={settings.pinEnabled ? "Aktif" : "Off"}
                    bg={settings.pinEnabled ? colors.brand50 : colors.ink100}
                    color={settings.pinEnabled ? colors.brand700 : colors.ink500}
                  />
                </Pressable>
              }
            />
            <View style={{ height: 1, backgroundColor: colors.ink100 }} />
            <MenuItem
              icon={settings.theme === "dark" ? "moon" : "sunny"}
              label="Tema gelap"
              right={
                <Pressable
                  onPress={() =>
                    setTheme(settings.theme === "dark" ? "light" : "dark")
                  }
                >
                  <Chip
                    label={settings.theme === "dark" ? "Aktif" : "Off"}
                    bg={
                      settings.theme === "dark"
                        ? colors.brand50
                        : colors.ink100
                    }
                    color={
                      settings.theme === "dark"
                        ? colors.brand700
                        : colors.ink500
                    }
                  />
                </Pressable>
              }
            />
          </Card>
        </View>

        <View
          style={{
            alignItems: "center",
            paddingTop: spacing.xxxl,
            paddingHorizontal: spacing.lg,
          }}
        >
          <Muted style={{ fontSize: 11 }}>Saku v0.1 · Build 1</Muted>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
