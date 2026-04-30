/**
 * Saku design system tokens.
 * Brand: hijau (uang & growth).
 *
 * Theme: light + dark. The exported `colors` object is mutable — when theme
 * switches we Object.assign the new palette in place. Components must be
 * remounted (e.g. via a `key` on a top-level wrapper) for the change to
 * propagate, since RN doesn't observe mutations to imported objects.
 */

export type ThemeMode = "light" | "dark";

const lightPalette = {
  // Brand
  brand50: "#f0fdf4",
  brand100: "#dcfce7",
  brand200: "#bbf7d0",
  brand300: "#86efac",
  brand400: "#4ade80",
  brand500: "#22c55e",
  brand600: "#16a34a",
  brand700: "#15803d",
  brand800: "#166534",
  brand900: "#14532d",

  // Neutrals (ink = text/border, bg = page background, surface = cards)
  ink900: "#0f172a",
  ink800: "#1e293b",
  ink700: "#334155",
  ink500: "#64748b",
  ink400: "#94a3b8",
  ink300: "#cbd5e1",
  ink200: "#e2e8f0",
  ink100: "#f1f5f9",
  ink50: "#f8fafc",

  white: "#ffffff",
  bg: "#f8fafc",
  surface: "#ffffff",

  // Semantic
  success: "#16a34a",
  successBg: "#dcfce7",
  warning: "#f59e0b",
  warningBg: "#fef3c7",
  danger: "#ef4444",
  dangerBg: "#fee2e2",
  info: "#3b82f6",
  infoBg: "#dbeafe",

  // Category palette (untuk chart & icon tiles)
  cat: {
    food: "#ef4444",
    transport: "#f59e0b",
    bill: "#3b82f6",
    fun: "#a855f7",
    shopping: "#ec4899",
    health: "#14b8a6",
    education: "#6366f1",
    saving: "#16a34a",
    income: "#16a34a",
    other: "#64748b",
  },
};

const darkPalette: typeof lightPalette = {
  // Brand — keep brand vibrant on dark
  brand50: "#0b2918",
  brand100: "#0f3a22",
  brand200: "#15512f",
  brand300: "#196b3e",
  brand400: "#22c55e",
  brand500: "#22c55e",
  brand600: "#16a34a",
  brand700: "#86efac",
  brand800: "#bbf7d0",
  brand900: "#dcfce7",

  // Neutrals: invert — ink900 = primary text (light), surfaces dark
  ink900: "#f8fafc",
  ink800: "#e2e8f0",
  ink700: "#cbd5e1",
  ink500: "#94a3b8",
  ink400: "#64748b",
  ink300: "#475569",
  ink200: "#334155",
  ink100: "#2a3a52",
  ink50: "#0f172a",

  // `white` is used for card backgrounds → make it the elevated surface
  white: "#1e293b",
  bg: "#0b1220",
  surface: "#1e293b",

  success: "#22c55e",
  successBg: "#0f3a22",
  warning: "#fbbf24",
  warningBg: "#3b2f0b",
  danger: "#f87171",
  dangerBg: "#3b1115",
  info: "#60a5fa",
  infoBg: "#0c2440",

  cat: {
    food: "#f87171",
    transport: "#fbbf24",
    bill: "#60a5fa",
    fun: "#c084fc",
    shopping: "#f472b6",
    health: "#2dd4bf",
    education: "#818cf8",
    saving: "#22c55e",
    income: "#22c55e",
    other: "#94a3b8",
  },
};

/**
 * Active palette. Mutated in place by `applyTheme()`. All components import
 * this and read its values at render time.
 */
export const colors: typeof lightPalette = { ...lightPalette };

let activeMode: ThemeMode = "light";
const subscribers = new Set<(m: ThemeMode) => void>();

export function applyTheme(mode: ThemeMode) {
  if (mode === activeMode) return;
  activeMode = mode;
  const palette = mode === "dark" ? darkPalette : lightPalette;
  // shallow-copy primitives
  Object.assign(colors, palette);
  // deep-copy nested cat
  Object.assign(colors.cat, palette.cat);
  subscribers.forEach((cb) => cb(mode));
}

export function getThemeMode(): ThemeMode {
  return activeMode;
}

export function subscribeTheme(cb: (m: ThemeMode) => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const shadow = {
  sm: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
};
