import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppStore } from "@/store/useAppStore";
import { applyTheme, colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.settings.onboarded);
  const theme = useAppStore((s) => s.settings.theme);

  // Apply theme synchronously *during render* before children render so
  // they read fresh palette values. The `key` on the inner View forces
  // remount when theme actually flips.
  applyTheme(theme);

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View key={theme} style={{ flex: 1, backgroundColor: colors.bg }}>
          <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Protected guard={onboarded}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="laporan" />
              <Stack.Screen name="tagihan" />
              <Stack.Screen name="tabungan" />
              <Stack.Screen name="export" />
              <Stack.Screen name="profil/profil-detail" />
              <Stack.Screen name="profil/dompet" />
              <Stack.Screen name="profil/kategori" />
              <Stack.Screen
                name="transaksi/baru"
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
            </Stack.Protected>
            <Stack.Protected guard={!onboarded}>
              <Stack.Screen name="onboarding" />
            </Stack.Protected>
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
