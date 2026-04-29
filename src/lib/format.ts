import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function formatRupiah(amount: number, withSymbol = true): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(Math.round(amount));
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${withSymbol ? "Rp " : ""}${grouped}`;
}

export function formatRupiahCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} M`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} jt`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)} rb`;
  return formatRupiah(amount);
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy", { locale: idLocale });
}

export function formatDateLong(iso: string): string {
  return format(parseISO(iso), "EEEE, d MMMM yyyy", { locale: idLocale });
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

export function formatRelativeDay(iso: string): string {
  const today = new Date();
  const target = parseISO(iso);
  const diff = Math.floor(
    (today.setHours(0, 0, 0, 0) - new Date(target).setHours(0, 0, 0, 0)) /
      86400000,
  );
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  if (diff > 1 && diff < 7)
    return format(parseISO(iso), "EEEE", { locale: idLocale });
  return format(parseISO(iso), "EEE, d MMM", { locale: idLocale });
}

export function currentMonthKey(d: Date = new Date()): string {
  return format(d, "yyyy-MM");
}

export function monthLabel(monthKey: string): string {
  const d = parseISO(`${monthKey}-01`);
  return format(d, "MMMM yyyy", { locale: idLocale });
}
