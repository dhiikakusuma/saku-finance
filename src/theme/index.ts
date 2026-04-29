/**
 * Saku design system tokens.
 * Brand: hijau (uang & growth). Light mode only di V1.
 */
export const colors = {
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

  // Neutrals
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
