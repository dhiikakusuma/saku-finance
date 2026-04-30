import { Platform } from "react-native";
import * as Device from "expo-device";
import { useAppStore } from "@/store/useAppStore";
import { getSupabase } from "@/lib/supabase";

export type SnapshotPayload = {
  schemaVersion: 1;
  exportedAt: string;
  device: string;
  data: {
    profile: ReturnType<typeof useAppStore.getState>["profile"];
    settings: Omit<
      ReturnType<typeof useAppStore.getState>["settings"],
      // exclude device-local stuff
      "supabaseUrl" | "supabaseAnonKey" | "ocrApiKey" | "pinEnabled"
    >;
    wallets: ReturnType<typeof useAppStore.getState>["wallets"];
    categories: ReturnType<typeof useAppStore.getState>["categories"];
    transactions: ReturnType<typeof useAppStore.getState>["transactions"];
    budgets: ReturnType<typeof useAppStore.getState>["budgets"];
    bills: ReturnType<typeof useAppStore.getState>["bills"];
    goals: ReturnType<typeof useAppStore.getState>["goals"];
  };
};

function deviceLabel(): string {
  const brand = Device.brand ?? "Unknown";
  const name = Device.modelName ?? Platform.OS;
  return `${brand} ${name}`.trim();
}

function buildSnapshot(): SnapshotPayload {
  const s = useAppStore.getState();
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    device: deviceLabel(),
    data: {
      profile: s.profile,
      settings: {
        premium: s.settings.premium,
        onboarded: s.settings.onboarded,
        theme: s.settings.theme,
        autoBackup: s.settings.autoBackup,
        lastBackupAt: s.settings.lastBackupAt,
        lastRestoreAt: s.settings.lastRestoreAt,
      },
      wallets: s.wallets,
      categories: s.categories,
      transactions: s.transactions,
      budgets: s.budgets,
      bills: s.bills,
      goals: s.goals,
    },
  };
}

function getClient() {
  const s = useAppStore.getState();
  return getSupabase(s.settings.supabaseUrl, s.settings.supabaseAnonKey);
}

export async function backupToCloud(): Promise<{
  ok: true;
  size: number;
  updatedAt: string;
} | { ok: false; error: string }> {
  const client = getClient();
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) {
    return { ok: false, error: "Belum login. Silakan masuk dulu." };
  }
  const snapshot = buildSnapshot();
  const { error } = await client.from("saku_backups").upsert(
    {
      user_id: userData.user.id,
      data: snapshot,
      device_label: snapshot.device,
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: error.message };

  const updatedAt = new Date().toISOString();
  useAppStore.setState((s) => ({
    settings: { ...s.settings, lastBackupAt: updatedAt },
  }));

  const size = JSON.stringify(snapshot).length;
  return { ok: true, size, updatedAt };
}

export async function restoreFromCloud(): Promise<
  | { ok: true; updatedAt: string; device: string; counts: Record<string, number> }
  | { ok: false; error: string }
> {
  const client = getClient();
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) {
    return { ok: false, error: "Belum login. Silakan masuk dulu." };
  }
  const { data, error } = await client
    .from("saku_backups")
    .select("data, updated_at, device_label")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Belum ada backup di cloud." };

  const snap = data.data as SnapshotPayload;
  if (!snap || snap.schemaVersion !== 1) {
    return { ok: false, error: "Format backup tidak dikenali." };
  }
  const d = snap.data;

  useAppStore.setState((s) => ({
    profile: { ...s.profile, ...d.profile },
    settings: {
      ...s.settings,
      premium: d.settings?.premium ?? s.settings.premium,
      onboarded: d.settings?.onboarded ?? s.settings.onboarded,
      theme: d.settings?.theme ?? s.settings.theme,
      lastRestoreAt: new Date().toISOString(),
    },
    wallets: d.wallets ?? s.wallets,
    categories: d.categories ?? s.categories,
    transactions: d.transactions ?? s.transactions,
    budgets: d.budgets ?? s.budgets,
    bills: d.bills ?? s.bills,
    goals: d.goals ?? s.goals,
  }));

  return {
    ok: true,
    updatedAt: data.updated_at as string,
    device: (data.device_label as string) ?? snap.device ?? "—",
    counts: {
      transaksi: d.transactions?.length ?? 0,
      kategori: d.categories?.length ?? 0,
      dompet: d.wallets?.length ?? 0,
      tagihan: d.bills?.length ?? 0,
      goal: d.goals?.length ?? 0,
    },
  };
}

export async function fetchCloudMeta(): Promise<{
  exists: boolean;
  updatedAt?: string;
  device?: string;
  size?: number;
  error?: string;
}> {
  const client = getClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return { exists: false, error: "Belum login." };
  const { data, error } = await client
    .from("saku_backups")
    .select("updated_at, device_label, size_bytes")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) return { exists: false, error: error.message };
  if (!data) return { exists: false };
  return {
    exists: true,
    updatedAt: data.updated_at as string,
    device: data.device_label as string,
    size: data.size_bytes as number,
  };
}

export async function deleteCloudBackup(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const client = getClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return { ok: false, error: "Belum login." };
  const { error } = await client
    .from("saku_backups")
    .delete()
    .eq("user_id", userData.user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
