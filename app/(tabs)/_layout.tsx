import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, View } from "react-native";
import { colors } from "@/theme";

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.ink400,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopColor: colors.ink200,
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transaksi"
        options={{
          title: "Transaksi",
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: () => (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: colors.brand600,
                alignItems: "center",
                justifyContent: "center",
                marginTop: -22,
                shadowColor: colors.brand600,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Ionicons name="add" size={28} color={colors.white} />
            </View>
          ),
          tabBarButton: (props) => (
            <Pressable
              accessibilityRole={props.accessibilityRole}
              accessibilityState={props.accessibilityState}
              accessibilityLabel={props.accessibilityLabel}
              testID={props.testID}
              style={props.style as any}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                router.push("/transaksi/baru");
              }}
            >
              {props.children}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color }) => (
            <Ionicons name="pie-chart" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
