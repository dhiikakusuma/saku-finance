import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, H1, H2, Muted } from "@/components/ui";
import { colors, fontSize, radius, spacing } from "@/theme";

const slides = [
  {
    icon: "wallet" as const,
    title: "Catat keuangan tanpa ribet",
    body: "Pemasukan, pengeluaran, transfer antar dompet — semua dalam 3 detik per transaksi.",
  },
  {
    icon: "pie-chart" as const,
    title: "Budget bulanan tetap aman",
    body: "Set limit per kategori, dapat alert sebelum kebablasan, dan lihat sisa bujet harianmu.",
  },
  {
    icon: "trending-up" as const,
    title: "Capai target tabunganmu",
    body: "Liburan, DP rumah, motor baru — Saku bantu hitung berapa harus nabung tiap bulan.",
  },
];

export default function OnboardingSlides() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slide = slides[step];

  const next = () => {
    if (step === slides.length - 1) {
      router.push("/onboarding/setup");
    } else {
      setStep(step + 1);
    }
  };

  return (
    <LinearGradient
      colors={[colors.brand500, colors.brand700, "#064e3b"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <Pressable onPress={() => router.push("/onboarding/setup")}>
            <Muted style={{ color: "rgba(255,255,255,.8)" }}>Lewati</Muted>
          </Pressable>
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: spacing.xl,
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 30,
              backgroundColor: "rgba(255,255,255,.18)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.xl,
            }}
          >
            <Ionicons name={slide.icon} size={56} color={colors.white} />
          </View>
          <H1 style={{ color: colors.white, textAlign: "center" }}>
            {slide.title}
          </H1>
          <Muted
            style={{
              color: "rgba(255,255,255,.85)",
              textAlign: "center",
              marginTop: spacing.md,
              fontSize: fontSize.base,
              lineHeight: 20,
            }}
          >
            {slide.body}
          </Muted>

          <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.xxxl }}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 6,
                  width: i === step ? 24 : 8,
                  borderRadius: 3,
                  backgroundColor:
                    i === step ? colors.white : "rgba(255,255,255,.4)",
                }}
              />
            ))}
          </View>
        </View>

        <View
          style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl }}
        >
          <Button
            title={step === slides.length - 1 ? "Mulai setup" : "Lanjut"}
            onPress={next}
            size="lg"
            variant="light"
          />
          <View style={{ alignItems: "center", marginTop: spacing.md }}>
            <Pressable onPress={() => setStep((step + 1) % slides.length)}>
              <Muted style={{ color: "rgba(255,255,255,.7)" }}>—</Muted>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
