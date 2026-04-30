import { Ionicons } from "@expo/vector-icons";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Chip,
  H2,
  H3,
  IconTile,
  Input,
  Label,
  Muted,
  Row,
  ScreenHeader,
} from "@/components/ui";
import { getSupabase } from "@/lib/supabase";
import {
  backupToCloud,
  deleteCloudBackup,
  fetchCloudMeta,
  restoreFromCloud,
} from "@/lib/sync";
import { useAppStore } from "@/store/useAppStore";
import { colors, fontSize, spacing } from "@/theme";

type Mode = "signin" | "signup";

export default function SyncScreen() {
  const router = useRouter();
  const settings = useAppStore((s) => s.settings);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [authBusy, setAuthBusy] = useState(false);

  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState<{
    exists: boolean;
    updatedAt?: string;
    device?: string;
    size?: number;
  } | null>(null);

  const client = getSupabase(settings.supabaseUrl, settings.supabaseAnonKey);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await client.auth.getUser();
      if (cancelled) return;
      setUser(
        data.user
          ? { id: data.user.id, email: data.user.email ?? undefined }
          : null,
      );
      setAuthChecked(true);
    })();
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!user) {
      setMeta(null);
      return;
    }
    fetchCloudMeta().then((m) => setMeta(m));
  }, [user]);

  const handleAuth = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert(
        "Lengkapi data",
        "Email dan password (min 6 karakter) wajib diisi.",
      );
      return;
    }
    setAuthBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          Alert.alert("Gagal masuk", error.message);
          return;
        }
      } else {
        const { error } = await client.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          Alert.alert("Gagal daftar", error.message);
          return;
        }
        Alert.alert(
          "Cek email",
          "Akun dibuat. Cek inbox untuk verifikasi (kalau diaktifkan).",
        );
      }
      setPassword("");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await client.auth.signOut();
    setMeta(null);
  };

  const handleBackup = async () => {
    setBusy(true);
    const res = await backupToCloud();
    setBusy(false);
    if (!res.ok) {
      Alert.alert("Backup gagal", res.error);
      return;
    }
    Alert.alert(
      "Backup berhasil",
      `Data terkirim ke cloud (${(res.size / 1024).toFixed(1)} KB).`,
    );
    fetchCloudMeta().then((m) => setMeta(m));
  };

  const handleRestore = async () => {
    Alert.alert(
      "Restore dari cloud?",
      "Semua data lokal akan ditimpa dengan data dari cloud. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Lanjutkan",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            const res = await restoreFromCloud();
            setBusy(false);
            if (!res.ok) {
              Alert.alert("Restore gagal", res.error);
              return;
            }
            const c = res.counts;
            Alert.alert(
              "Restore berhasil",
              `${c.transaksi} transaksi · ${c.dompet} dompet · ${c.kategori} kategori · ${c.tagihan} tagihan · ${c.goal} goal.`,
            );
          },
        },
      ],
    );
  };

  const handleDeleteCloud = async () => {
    Alert.alert(
      "Hapus backup di cloud?",
      "Backup di cloud akan dihapus permanen. Data lokal di HP tidak terpengaruh.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            const res = await deleteCloudBackup();
            setBusy(false);
            if (!res.ok) {
              Alert.alert("Gagal", res.error);
              return;
            }
            Alert.alert("Terhapus", "Backup di cloud sudah dihapus.");
            setMeta({ exists: false });
          },
        },
      ],
    );
  };

  if (!authChecked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader
          title="Sync Cloud"
          onBack={() => router.back()}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brand600} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScreenHeader
        title="Sync Cloud"
        subtitle={user?.email ?? "Backup & restore antar HP"}
        onBack={() => router.back()}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
      >
        {!user ? (
          <>
            <Card>
              <Row gap={10} style={{ marginBottom: spacing.sm }}>
                <IconTile name="cloud-upload" bg={colors.brand50} color={colors.brand700} />
                <View style={{ flex: 1 }}>
                  <H3>Login untuk sync</H3>
                  <Muted style={{ fontSize: 12 }}>
                    Backup data ke cloud, restore di HP lain.
                  </Muted>
                </View>
              </Row>

              <View style={{ flexDirection: "row", gap: 4, marginBottom: spacing.md, marginTop: spacing.sm }}>
                <Pressable
                  onPress={() => setMode("signin")}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: "center",
                    borderRadius: 6,
                    backgroundColor: mode === "signin" ? colors.brand600 : colors.ink100,
                  }}
                >
                  <Muted
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: mode === "signin" ? colors.white : colors.ink700,
                    }}
                  >
                    Masuk
                  </Muted>
                </Pressable>
                <Pressable
                  onPress={() => setMode("signup")}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: "center",
                    borderRadius: 6,
                    backgroundColor: mode === "signup" ? colors.brand600 : colors.ink100,
                  }}
                >
                  <Muted
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: mode === "signup" ? colors.white : colors.ink700,
                    }}
                  >
                    Daftar
                  </Muted>
                </Pressable>
              </View>

              <Label style={{ marginBottom: 6 }}>Email</Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="kamu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={{ height: spacing.sm }} />
              <Label style={{ marginBottom: 6 }}>Password</Label>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 karakter"
                secureTextEntry
              />
              <View style={{ height: spacing.md }} />
              <Button
                title={
                  authBusy
                    ? "Memproses…"
                    : mode === "signin"
                      ? "Masuk"
                      : "Daftar akun baru"
                }
                onPress={handleAuth}
                disabled={authBusy}
                size="lg"
                icon={mode === "signin" ? "log-in" : "person-add"}
              />
            </Card>

            <Card>
              <H3>Tentang sync</H3>
              <View style={{ height: 6 }} />
              <Muted style={{ fontSize: 12, lineHeight: 18 }}>
                Data kamu disimpan di Supabase project pribadi dengan Row-Level
                Security — hanya kamu yang bisa baca. Pakai email + password
                yang sama untuk login di HP lain → tap Restore → semua data
                kembali.
              </Muted>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <Row gap={10}>
                <IconTile name="cloud-done" bg={colors.brand50} color={colors.brand700} />
                <View style={{ flex: 1 }}>
                  <H3>Tersambung</H3>
                  <Muted style={{ fontSize: 12 }}>{user.email}</Muted>
                </View>
                <Pressable onPress={handleSignOut} hitSlop={8}>
                  <Chip label="Keluar" bg={colors.ink100} color={colors.ink700} />
                </Pressable>
              </Row>
            </Card>

            <Card>
              <Label style={{ marginBottom: 4 }}>Backup di cloud</Label>
              {meta?.exists ? (
                <>
                  <H2 style={{ fontSize: fontSize.md, marginBottom: 4 }}>
                    {meta.updatedAt
                      ? formatDistanceToNow(new Date(meta.updatedAt), {
                          addSuffix: true,
                          locale: idLocale,
                        })
                      : "—"}
                  </H2>
                  <Muted style={{ fontSize: 12 }}>
                    {meta.device ?? "—"} ·{" "}
                    {meta.size ? `${(meta.size / 1024).toFixed(1)} KB` : "—"}
                  </Muted>
                  <Muted style={{ fontSize: 11, marginTop: 2 }}>
                    {meta.updatedAt
                      ? format(new Date(meta.updatedAt), "d MMM yyyy HH:mm", {
                          locale: idLocale,
                        })
                      : ""}
                  </Muted>
                </>
              ) : (
                <Muted style={{ fontSize: 13 }}>
                  Belum ada backup di cloud. Tap "Backup ke cloud" untuk yang
                  pertama.
                </Muted>
              )}
            </Card>

            <Button
              title={busy ? "Memproses…" : "Backup ke cloud"}
              icon="cloud-upload"
              onPress={handleBackup}
              disabled={busy}
              size="lg"
            />

            <Button
              title="Restore dari cloud"
              icon="cloud-download"
              variant="outline"
              onPress={handleRestore}
              disabled={busy || !meta?.exists}
              size="lg"
            />

            {settings.lastBackupAt ? (
              <Card>
                <Row gap={8}>
                  <Ionicons name="time" size={14} color={colors.ink500} />
                  <Muted style={{ fontSize: 12 }}>
                    Backup terakhir dari HP ini:{" "}
                    {format(new Date(settings.lastBackupAt), "d MMM HH:mm", {
                      locale: idLocale,
                    })}
                  </Muted>
                </Row>
                {settings.lastRestoreAt ? (
                  <Row gap={8} style={{ marginTop: 4 }}>
                    <Ionicons
                      name="cloud-download"
                      size={14}
                      color={colors.ink500}
                    />
                    <Muted style={{ fontSize: 12 }}>
                      Restore terakhir:{" "}
                      {format(new Date(settings.lastRestoreAt), "d MMM HH:mm", {
                        locale: idLocale,
                      })}
                    </Muted>
                  </Row>
                ) : null}
              </Card>
            ) : null}

            {meta?.exists ? (
              <Pressable onPress={handleDeleteCloud} disabled={busy}>
                <Card style={{ borderColor: colors.danger + "33" }}>
                  <Row gap={10}>
                    <IconTile
                      name="trash"
                      bg={colors.danger + "11"}
                      color={colors.danger}
                    />
                    <View style={{ flex: 1 }}>
                      <H3 style={{ color: colors.danger }}>
                        Hapus backup di cloud
                      </H3>
                      <Muted style={{ fontSize: 12 }}>
                        Hapus permanen. Data lokal tetap aman.
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
