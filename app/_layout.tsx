import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppStore } from "@/store/useAppStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.settings.onboarded);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!onboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (onboarded && inOnboarding) {
      router.replace("/");
    }
  }, [hydrated, onboarded, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen
            name="transaksi/baru"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
