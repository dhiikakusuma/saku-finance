import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { currentMonthKey } from "@/lib/format";
import { defaultCategories, defaultWallets } from "@/lib/seed";
import type {
  Bill,
  Budget,
  Category,
  Goal,
  Profile,
  Settings,
  Transaction,
} from "@/lib/types";

const uid = () =>
  Math.random().toString(36).slice(2, 10) +
  Date.now().toString(36).slice(-4);

type State = {
  profile: Profile;
  settings: Settings;
  wallets: ReturnType<typeof initWallets>;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  goals: Goal[];
  hydrated: boolean;
};

function initWallets() {
  return defaultWallets;
}

type Actions = {
  setHydrated: () => void;

  // onboarding
  completeOnboarding: (
    p: Pick<Profile, "name" | "monthlyIncome" | "payday">,
  ) => void;
  updateProfile: (p: Partial<Profile>) => void;
  togglePin: (enabled: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setOcrApiKey: (key: string | undefined) => void;

  // wallets
  addWallet: (w: Omit<State["wallets"][number], "id" | "balance"> & { balance?: number }) => void;
  updateWallet: (id: string, patch: Partial<State["wallets"][number]>) => void;
  deleteWallet: (id: string) => void;

  // categories
  addCategory: (c: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;

  // transactions
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // budgets
  setBudget: (categoryId: string, month: string, limit: number) => void;
  deleteBudget: (id: string) => void;

  // bills
  addBill: (b: Omit<Bill, "id" | "paidMonths" | "active"> & { active?: boolean }) => void;
  updateBill: (id: string, patch: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (id: string, monthKey: string) => void;

  // goals
  addGoal: (g: Omit<Goal, "id" | "saved"> & { saved?: number }) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  depositGoal: (id: string, amount: number, fromWalletId: string) => void;
  deleteGoal: (id: string) => void;

  // dev
  resetAll: () => void;
};

const initialState: State = {
  profile: {
    name: "",
    monthlyIncome: 0,
    payday: 25,
    currency: "IDR",
  },
  settings: {
    pinEnabled: false,
    premium: false,
    onboarded: false,
    theme: "light",
  },
  wallets: initWallets(),
  categories: defaultCategories,
  transactions: [],
  budgets: [],
  bills: [],
  goals: [],
  hydrated: false,
};

function applyTxToWallets(
  wallets: State["wallets"],
  tx: Transaction,
  direction: 1 | -1,
): State["wallets"] {
  return wallets.map((w) => {
    if (tx.type === "income" && w.id === tx.walletId) {
      return { ...w, balance: w.balance + direction * tx.amount };
    }
    if (tx.type === "expense" && w.id === tx.walletId) {
      return { ...w, balance: w.balance - direction * tx.amount };
    }
    if (tx.type === "transfer") {
      if (w.id === tx.walletId)
        return { ...w, balance: w.balance - direction * tx.amount };
      if (w.id === tx.toWalletId)
        return { ...w, balance: w.balance + direction * tx.amount };
    }
    return w;
  });
}

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHydrated: () => set({ hydrated: true }),

      completeOnboarding: ({ name, monthlyIncome, payday }) =>
        set((s) => ({
          profile: { ...s.profile, name, monthlyIncome, payday },
          settings: { ...s.settings, onboarded: true },
        })),

      updateProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),

      togglePin: (enabled) =>
        set((s) => ({ settings: { ...s.settings, pinEnabled: enabled } })),

      setTheme: (theme) =>
        set((s) => ({ settings: { ...s.settings, theme } })),

      setOcrApiKey: (key) =>
        set((s) => ({ settings: { ...s.settings, ocrApiKey: key } })),

      addWallet: (w) =>
        set((s) => ({
          wallets: [
            ...s.wallets,
            { id: `wallet-${uid()}`, balance: w.balance ?? 0, ...w },
          ],
        })),

      updateWallet: (id, patch) =>
        set((s) => ({
          wallets: s.wallets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),

      deleteWallet: (id) =>
        set((s) => ({ wallets: s.wallets.filter((w) => w.id !== id) })),

      addCategory: (c) =>
        set((s) => ({
          categories: [...s.categories, { id: `cat-${uid()}`, ...c }],
        })),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
        })),

      addTransaction: (input) =>
        set((s) => {
          const tx: Transaction = {
            id: `tx-${uid()}`,
            createdAt: new Date().toISOString(),
            ...input,
          };
          return {
            transactions: [tx, ...s.transactions],
            wallets: applyTxToWallets(s.wallets, tx, 1),
          };
        }),

      updateTransaction: (id, patch) =>
        set((s) => {
          const old = s.transactions.find((t) => t.id === id);
          if (!old) return s;
          const reverted = applyTxToWallets(s.wallets, old, -1);
          const updated: Transaction = { ...old, ...patch };
          const reapplied = applyTxToWallets(reverted, updated, 1);
          return {
            transactions: s.transactions.map((t) =>
              t.id === id ? updated : t,
            ),
            wallets: reapplied,
          };
        }),

      deleteTransaction: (id) =>
        set((s) => {
          const old = s.transactions.find((t) => t.id === id);
          if (!old) return s;
          return {
            transactions: s.transactions.filter((t) => t.id !== id),
            wallets: applyTxToWallets(s.wallets, old, -1),
          };
        }),

      setBudget: (categoryId, month, limit) =>
        set((s) => {
          const existing = s.budgets.find(
            (b) => b.categoryId === categoryId && b.month === month,
          );
          if (existing) {
            return {
              budgets: s.budgets.map((b) =>
                b.id === existing.id ? { ...b, limit } : b,
              ),
            };
          }
          return {
            budgets: [
              ...s.budgets,
              { id: `bud-${uid()}`, categoryId, month, limit },
            ],
          };
        }),

      deleteBudget: (id) =>
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      addBill: (b) =>
        set((s) => ({
          bills: [
            ...s.bills,
            {
              id: `bill-${uid()}`,
              paidMonths: [],
              active: b.active ?? true,
              ...b,
            },
          ],
        })),

      updateBill: (id, patch) =>
        set((s) => ({
          bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      deleteBill: (id) =>
        set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),

      markBillPaid: (id, monthKey) => {
        const bill = get().bills.find((b) => b.id === id);
        if (!bill) return;
        if (bill.paidMonths.includes(monthKey)) return;
        // tambahkan transaksi pengeluaran
        if (bill.walletId) {
          get().addTransaction({
            type: "expense",
            amount: bill.amount,
            categoryId: bill.categoryId ?? "cat-bill",
            walletId: bill.walletId,
            date: new Date().toISOString(),
            note: `Bayar tagihan: ${bill.name}`,
          });
        }
        set((s) => ({
          bills: s.bills.map((b) =>
            b.id === id
              ? { ...b, paidMonths: [...b.paidMonths, monthKey] }
              : b,
          ),
        }));
      },

      addGoal: (g) =>
        set((s) => ({
          goals: [
            ...s.goals,
            { id: `goal-${uid()}`, saved: g.saved ?? 0, ...g },
          ],
        })),

      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      depositGoal: (id, amount, fromWalletId) => {
        get().addTransaction({
          type: "expense",
          amount,
          categoryId: "cat-saving",
          walletId: fromWalletId,
          date: new Date().toISOString(),
          note: `Setor goal: ${get().goals.find((g) => g.id === id)?.name ?? ""}`,
        });
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, saved: g.saved + amount } : g,
          ),
        }));
      },

      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      resetAll: () => set({ ...initialState, hydrated: true }),
    }),
    {
      name: "saku-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useTotalBalance(): number {
  const wallets = useAppStore((s) => s.wallets);
  return useMemo(
    () => wallets.reduce((acc, w) => acc + (w.archived ? 0 : w.balance), 0),
    [wallets],
  );
}

export function useMonthSummary(monthKey = currentMonthKey()) {
  const transactions = useAppStore((s) => s.transactions);
  return useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (!tx.date.startsWith(monthKey)) continue;
      if (tx.type === "income") income += tx.amount;
      if (tx.type === "expense") expense += tx.amount;
    }
    return { income, expense, net: income - expense };
  }, [transactions, monthKey]);
}
