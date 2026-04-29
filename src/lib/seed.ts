import type { Category, Wallet } from "./types";

export const defaultCategories: Category[] = [
  // Pengeluaran
  { id: "cat-food", name: "Makan & Minum", icon: "restaurant", color: "#ef4444", kind: "expense" },
  { id: "cat-transport", name: "Transport & Bensin", icon: "car", color: "#f59e0b", kind: "expense" },
  { id: "cat-bill", name: "Tagihan", icon: "flash", color: "#3b82f6", kind: "expense" },
  { id: "cat-shopping", name: "Belanja", icon: "cart", color: "#ec4899", kind: "expense" },
  { id: "cat-fun", name: "Hiburan", icon: "game-controller", color: "#a855f7", kind: "expense" },
  { id: "cat-health", name: "Kesehatan", icon: "medkit", color: "#14b8a6", kind: "expense" },
  { id: "cat-edu", name: "Pendidikan", icon: "school", color: "#6366f1", kind: "expense" },
  { id: "cat-saving", name: "Tabungan", icon: "wallet", color: "#16a34a", kind: "expense" },
  { id: "cat-other-exp", name: "Lainnya", icon: "ellipsis-horizontal", color: "#64748b", kind: "expense" },
  // Pemasukan
  { id: "cat-salary", name: "Gaji", icon: "briefcase", color: "#16a34a", kind: "income" },
  { id: "cat-bonus", name: "Bonus", icon: "gift", color: "#22c55e", kind: "income" },
  { id: "cat-freelance", name: "Freelance", icon: "laptop", color: "#0ea5e9", kind: "income" },
  { id: "cat-other-inc", name: "Lainnya", icon: "ellipsis-horizontal", color: "#64748b", kind: "income" },
];

export const defaultWallets: Wallet[] = [
  { id: "wallet-cash", name: "Cash", type: "cash", balance: 0, icon: "cash", color: "#16a34a" },
  { id: "wallet-bank", name: "Rekening Utama", type: "bank", balance: 0, icon: "card", color: "#3b82f6" },
];
