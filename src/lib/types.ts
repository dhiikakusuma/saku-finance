export type WalletType = "cash" | "bank" | "ewallet" | "card";

export type Wallet = {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  icon: string;
  color: string;
  archived?: boolean;
};

export type CategoryKind = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
};

export type TxType = "income" | "expense" | "transfer";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  /** category id (untuk income/expense). Untuk transfer kosong. */
  categoryId?: string;
  /** dompet sumber (untuk income/expense/transfer) */
  walletId: string;
  /** dompet tujuan (transfer only) */
  toWalletId?: string;
  /** ISO date */
  date: string;
  note?: string;
  createdAt: string;
};

/** Budget per kategori per bulan. month format: YYYY-MM */
export type Budget = {
  id: string;
  categoryId: string;
  month: string;
  limit: number;
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  categoryId?: string;
  walletId?: string;
  icon: string;
  active: boolean;
  /** YYYY-MM dimana sudah dibayar */
  paidMonths: string[];
};

export type Goal = {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  saved: number;
  deadline?: string;
};

export type Profile = {
  name: string;
  email?: string;
  monthlyIncome: number;
  payday: number;
  currency: string;
};

export type Settings = {
  pinEnabled: boolean;
  premium: boolean;
  onboarded: boolean;
  theme: "light" | "dark";
  ocrApiKey?: string;
};
