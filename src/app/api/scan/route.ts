import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LIMITS } from "@/lib/scanner/constants";
import { fetchGitHubArchive } from "@/lib/scanner/github";
import { ScanError, type SourceInfo } from "@/lib/scanner/types";
import { analyzeZipArchive } from "@/lib/scanner/zip";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const repoUrl = String(formData.get("repoUrl") ?? "").trim();
    const archive = formData.get("archive");

    if (archive instanceof File && archive.size > 0) {
      if (!archive.name.toLowerCase().endsWith(".zip")) {
        throw new ScanError("Upload a .zip archive for v0.1.3 scans.", "INVALID_ARCHIVE");
      }

      if (!isReasonableZipContentType(archive.type)) {
        throw new ScanError("Upload a valid .zip archive.", "INVALID_ARCHIVE");
      }

      if (archive.size > DEFAULT_LIMITS.maxArchiveBytes) {
        throw new ScanError(
          `Zip upload is too large. The v0.1.3 limit is ${Math.round(DEFAULT_LIMITS.maxArchiveBytes / 1024 / 1024)} MB.`,
          "ARCHIVE_TOO_LARGE",
          413,
        );
      }

      const buffer = Buffer.from(await archive.arrayBuffer());
      const source: SourceInfo = { type: "zip", label: archive.name };
      const report = await analyzeZipArchive(buffer, source);

      return NextResponse.json({ report });
    }

    if (repoUrl) {
      const { buffer, source } = await fetchGitHubArchive(repoUrl);
      const report = await analyzeZipArchive(buffer, source);

      return NextResponse.json({ report });
    }

    throw new ScanError("Provide a public GitHub repo URL or upload a .zip file.", "INVALID_ARCHIVE");
  } catch (error) {
    if (error instanceof ScanError) {
      return NextResponse.json(
        { error: { message: error.message, code: error.code } },
        { status: error.status },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        error: {
          message: "Scan failed unexpectedly. Try a smaller archive or a public GitHub repo.",
          code: "FETCH_FAILED",
        },
      },
      { status: 500 },
    );
  }
}

function isReasonableZipContentType(contentType: string) {
  return (
    !contentType ||
    contentType === "application/zip" ||
    contentType === "application/x-zip-compressed" ||
    contentType === "application/octet-stream" ||
    contentType === "multipart/x-zip"
  );
}
