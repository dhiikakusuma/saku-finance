# Saku — Manajemen Keuangan Bulanan

Aplikasi Android (cross-platform) untuk mencatat keuangan bulanan: pemasukan,
pengeluaran, transfer antar dompet, budgeting per kategori, dan laporan.

Dibangun dengan **Expo + React Native + TypeScript**, lokal-first (data tersimpan
di HP, tidak butuh server).

> Status: **MVP v0.1** — onboarding, dashboard, tambah/edit transaksi, daftar
> transaksi dengan filter, budget per kategori, profil & settings dasar.
> V1.1 (next): tagihan berulang, target tabungan, export PDF/Excel, sync cloud,
> OCR struk, dark mode, premium.

## Wireframe

Mockup interaktif (12 screen): https://finance-mockup-smvnylgc.devinapps.com

## Cara menjalankan (development)

Butuh:
- [Bun](https://bun.sh/) (atau Node 18+ + npm/yarn)
- HP Android dengan aplikasi **Expo Go** ([Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))

```bash
bun install
bun run android      # buka Expo dev server, scan QR via Expo Go
# atau
bun run start
```

Setelah server berjalan, scan QR yang muncul di terminal pakai aplikasi Expo Go
di HP. App akan langsung load — edit kode → auto-reload.

> **Catatan:** mode `bun run web` saat ini ada konflik antara zustand v5 +
> hermes-stable transform (script tag butuh `type=module`). Native (Android/iOS)
> tidak terpengaruh — pakai Expo Go untuk testing.

## Struktur folder

```
app/
  _layout.tsx          # root navigator + onboarding redirect
  (tabs)/              # bottom tab: home / transaksi / add / budget / profil
  onboarding/          # 3 slide intro + setup gaji/dompet
  transaksi/baru.tsx   # modal tambah/edit transaksi (dengan keypad)
  profil/              # sub-pages: profil-detail, dompet, kategori
src/
  theme/               # tokens warna, spacing, fontSize, radius, shadow
  lib/
    types.ts           # domain models (Wallet, Category, Transaction, Budget…)
    seed.ts            # default kategori & dompet untuk user baru
    format.ts          # formatRupiah, formatDate, formatRelativeDay…
  store/
    useAppStore.ts     # zustand store + persist (AsyncStorage)
  components/
    ui.tsx             # primitives: Card, Button, Input, Progress, Chip,
                       # Segmented, IconTile, ScreenHeader, …
```

## Stack

- Expo SDK 54 + React 19 + React Native 0.81
- expo-router (file-based routing)
- zustand 5 (+ persist middleware via AsyncStorage)
- date-fns (locale `id`)
- expo-haptics, expo-linear-gradient, @expo/vector-icons
- expo-sqlite (disiapkan untuk migrasi V1.1)
- expo-secure-store (disiapkan untuk PIN/biometrik V1.1)

## Build APK

Pakai EAS Build (gratis untuk testing build):

```bash
bun add -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # APK testing
# atau
eas build --platform android --profile production # AAB untuk Play Store
```

Hasil build bisa diunduh dari https://expo.dev/accounts/<your-acc>/projects/saku-finance/builds.

## Lisensi

Private. © 2026.
