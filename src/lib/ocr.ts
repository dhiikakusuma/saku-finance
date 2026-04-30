/**
 * OCR struk via OCR.space REST API.
 *
 * Free tier (key `helloworld`): rate-limited, ~500 req/day shared.
 * For production, user must paste a real API key in Profil → OCR API key.
 * Get free key (25k/month): https://ocr.space/ocrapi
 */

export type OcrParsedResult = {
  rawText: string;
  amount: number | null;
  merchant: string | null;
  date: string | null;
};

type OcrSpaceResponse = {
  ParsedResults?: { ParsedText: string }[];
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string | string[];
};

export async function ocrFromBase64(
  base64: string,
  apiKey = "helloworld",
): Promise<OcrParsedResult> {
  const body = new FormData();
  body.append("base64Image", `data:image/jpeg;base64,${base64}`);
  body.append("language", "eng");
  body.append("isOverlayRequired", "false");
  body.append("scale", "true");
  body.append("OCREngine", "2");

  const res = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: apiKey },
    body: body as unknown as BodyInit,
  });
  const json = (await res.json()) as OcrSpaceResponse;

  if (json.IsErroredOnProcessing) {
    const msg = Array.isArray(json.ErrorMessage)
      ? json.ErrorMessage.join("; ")
      : (json.ErrorMessage ?? "OCR error");
    throw new Error(msg);
  }
  const text = json.ParsedResults?.[0]?.ParsedText ?? "";
  return parseReceipt(text);
}

/**
 * Heuristic parser for typical Indonesian receipts.
 * - Amount: pick the largest plausible number found near keywords
 *   (Total, Bayar, Tunai). Fallback: max number on page.
 * - Merchant: first non-empty line of meaningful length (>3 chars).
 * - Date: first DD/MM/YYYY or DD-MM-YYYY pattern.
 */
export function parseReceipt(text: string): OcrParsedResult {
  const cleaned = text.replace(/\r/g, "").trim();
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Merchant = first line with letters + length >= 3 (skip "STRUK", "RECEIPT")
  let merchant: string | null = null;
  for (const l of lines.slice(0, 4)) {
    const upper = l.toUpperCase();
    if (
      l.length >= 3 &&
      /[A-Za-z]/.test(l) &&
      !/^(STRUK|RECEIPT|INVOICE|TANDA|TERIMA|KASIR)/.test(upper)
    ) {
      merchant = l;
      break;
    }
  }

  // Date: dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd
  let date: string | null = null;
  const dateMatch =
    cleaned.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/) ??
    cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    if (dateMatch[1].length === 4) {
      date = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;
    } else {
      const yy = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
      const mm = dateMatch[2].padStart(2, "0");
      const dd = dateMatch[1].padStart(2, "0");
      date = `${yy}-${mm}-${dd}`;
    }
  }

  // Amount: scan for keywords
  const amountKeywords = [
    "TOTAL",
    "GRAND TOTAL",
    "JUMLAH",
    "BAYAR",
    "TUNAI",
    "DEBIT",
    "KREDIT",
    "PEMBAYARAN",
  ];
  const numbers: { value: number; lineIdx: number; nearKeyword: boolean }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();
    const nearKeyword = amountKeywords.some((k) => upper.includes(k));
    // match numbers: 12.500, 12,500, 1.234.567, 1234567
    const matches = line.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,})/g);
    if (matches) {
      for (const m of matches) {
        const v = Number(m.replace(/[.,]/g, ""));
        if (!Number.isNaN(v) && v >= 1000 && v < 1_000_000_000) {
          numbers.push({ value: v, lineIdx: i, nearKeyword });
        }
      }
    }
  }

  let amount: number | null = null;
  if (numbers.length > 0) {
    // prefer largest number with keyword on the same line; fallback: max overall
    const withKw = numbers.filter((n) => n.nearKeyword);
    const pool = withKw.length > 0 ? withKw : numbers;
    amount = pool.reduce(
      (best, cur) => (cur.value > best.value ? cur : best),
      pool[0],
    ).value;
  }

  return { rawText: cleaned, amount, merchant, date };
}
