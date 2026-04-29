import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";

/** Tab perantara — tab "+" mendorong user ke modal transaksi baru. */
export default function AddTab() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/transaksi/baru");
  }, [router]);
  return <View />;
}
