import { NextResponse } from "next/server";
import { DEFAULT_LIMITS, SCANNER_VERSION } from "@/lib/scanner/constants";

export const runtime = "nodejs";
export const maxDuration = 5;

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "RevenueReady AI",
    scannerVersion: SCANNER_VERSION,
    limits: {
      maxZipBytes: DEFAULT_LIMITS.maxArchiveBytes,
      maxFiles: DEFAULT_LIMITS.maxFiles,
      maxFileBytes: DEFAULT_LIMITS.maxFileBytes,
      maxTotalTextBytes: DEFAULT_LIMITS.maxTotalTextBytes,
    },
  });
}
