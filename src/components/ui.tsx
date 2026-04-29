import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from "react-native";
import { colors, fontSize, radius, shadow, spacing } from "@/theme";

export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type TxProps = Omit<TextProps, "children"> & { children?: React.ReactNode };

export function H1({ children, style, ...rest }: TxProps) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: fontSize.xxl,
          fontWeight: "700",
          color: colors.ink900,
          letterSpacing: -0.3,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function H2({ children, style, ...rest }: TxProps) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: fontSize.lg,
          fontWeight: "700",
          color: colors.ink900,
          letterSpacing: -0.2,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function H3({ children, style, ...rest }: TxProps) {
  return (
    <Text
      {...rest}
      style={[
        { fontSize: fontSize.md, fontWeight: "600", color: colors.ink900 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style, ...rest }: TxProps) {
  return (
    <Text
      {...rest}
      style={[{ fontSize: fontSize.sm, color: colors.ink500 }, style]}
    >
      {children}
    </Text>
  );
}

export function Label({ children, style, ...rest }: TxProps) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: fontSize.xs,
          color: colors.ink500,
          fontWeight: "600",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "md" | "lg" | "sm";
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  haptic?: boolean;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  icon,
  style,
  haptic = true,
}: ButtonProps) {
  const sizing = {
    sm: { paddingV: 8, paddingH: 12, font: fontSize.sm, radius: radius.sm },
    md: { paddingV: 12, paddingH: 16, font: fontSize.base, radius: radius.md },
    lg: { paddingV: 14, paddingH: 18, font: fontSize.md, radius: radius.lg },
  }[size];

  const palette =
    variant === "primary"
      ? { bg: colors.brand600, fg: colors.white, border: "transparent" }
      : variant === "outline"
        ? { bg: "transparent", fg: colors.ink900, border: colors.ink200 }
        : variant === "danger"
          ? { bg: colors.danger, fg: colors.white, border: "transparent" }
          : { bg: "transparent", fg: colors.brand700, border: "transparent" };

  return (
    <Pressable
      onPress={() => {
        if (haptic && Platform.OS !== "web") {
          Haptics.selectionAsync();
        }
        onPress?.();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1,
          paddingVertical: sizing.paddingV,
          paddingHorizontal: sizing.paddingH,
          borderRadius: sizing.radius,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={sizing.font + 2} color={palette.fg} />
      ) : null}
      <Text
        style={{
          color: palette.fg,
          fontSize: sizing.font,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.ink400}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.ink200,
          backgroundColor: colors.white,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 11,
          fontSize: fontSize.base,
          color: colors.ink900,
        },
        props.style,
      ]}
    />
  );
}

export function Row({
  children,
  style,
  gap,
  align = "center",
  justify = "space-between",
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  gap?: number;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: align,
          justifyContent: justify,
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconTile({
  name,
  bg,
  color = colors.ink900,
  size = 38,
}: {
  name: keyof typeof Ionicons.glyphMap;
  bg: string;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function Progress({
  value,
  max,
  color,
  trackColor = colors.ink200,
  height = 6,
}: {
  value: number;
  max: number;
  color: string;
  trackColor?: string;
  height?: number;
}) {
  const pct = max <= 0 ? 0 : Math.min(1, value / max);
  return (
    <View
      style={{
        height,
        backgroundColor: trackColor,
        borderRadius: radius.pill,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function Chip({
  label,
  bg = colors.ink100,
  color = colors.ink700,
  style,
}: {
  label: string;
  bg?: string;
  color?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: bg,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 11, fontWeight: "600", color }}>{label}</Text>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.ink100,
        padding: 4,
        borderRadius: radius.md,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              onChange(opt.value);
            }}
            style={{
              flex: 1,
              paddingVertical: 6,
              alignItems: "center",
              borderRadius: radius.sm,
              backgroundColor: active ? colors.white : "transparent",
              ...(active ? shadow.sm : null),
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: active ? colors.ink900 : colors.ink500,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Divider() {
  return (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.ink200 }} />
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
      }}
    >
      <Row>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={{ paddingVertical: 4, paddingRight: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink900} />
          </Pressable>
        ) : (
          <View />
        )}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: "700",
              color: colors.ink900,
            }}
          >
            {title}
          </Text>
          {subtitle ? <Muted style={{ fontSize: 11 }}>{subtitle}</Muted> : null}
        </View>
        <View style={{ minWidth: 32, alignItems: "flex-end" }}>{right}</View>
      </Row>
    </View>
  );
}
