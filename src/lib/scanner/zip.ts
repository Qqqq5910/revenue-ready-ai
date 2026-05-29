import AdmZip from "adm-zip";
import { DEFAULT_LIMITS } from "./constants";
import {
  isLikelyBinary,
  isUnsafeArchivePath,
  looksLikeTextPath,
  normalizeArchivePath,
  normalizePath,
  shouldIgnorePath,
} from "./fileFilters";
import { analyzeFiles } from "./analyzeFiles";
import { ScanError, type ScanLimitConfig, type ScanReport, type ScanStats, type ScannedFile, type SourceInfo } from "./types";

const MB = 1024 * 1024;

export async function analyzeZipArchive(
  archive: Buffer,
  source: SourceInfo,
  limits = DEFAULT_LIMITS,
): Promise<ScanReport> {
  const { files, stats } = extractTextFilesFromZip(archive, limits);

  return analyzeFiles(files, source, stats);
}

export function extractTextFilesFromZip(
  archive: Buffer,
  limits: ScanLimitConfig = DEFAULT_LIMITS,
) {
  if (archive.byteLength > limits.maxArchiveBytes) {
    throw new ScanError(
      `Archive is too large. The v0.1.3 limit is ${formatBytes(limits.maxArchiveBytes)}.`,
      "ARCHIVE_TOO_LARGE",
      413,
    );
  }

  let zip: AdmZip;

  try {
    zip = new AdmZip(archive);
  } catch {
    throw new ScanError("The uploaded file could not be parsed as a zip archive.", "INVALID_ARCHIVE");
  }

  const stats: ScanStats = {
    scannedFiles: 0,
    scannedBytes: 0,
    ignoredFiles: 0,
    skippedLargeFiles: 0,
    skippedBinaryFiles: 0,
  };
  const files: ScannedFile[] = [];
  const entries = zip.getEntries();
  const rootPrefix = findCommonRootPrefix(
    entries.map((entry) => normalizeArchivePath(entry.entryName)),
  );

  for (const entry of entries) {
    if (entry.isDirectory) {
      continue;
    }

    if (isUnsafeArchivePath(entry.entryName)) {
      throw new ScanError(
        "The zip archive contains unsafe file paths. Create a clean archive without ../ or absolute paths and try again.",
        "UNSAFE_ARCHIVE_PATH",
        400,
      );
    }

    const normalizedPath = stripPrefix(normalizeArchivePath(entry.entryName), rootPrefix);

    if (!normalizedPath || shouldIgnorePath(normalizedPath)) {
      stats.ignoredFiles += 1;
      continue;
    }

    if (!looksLikeTextPath(normalizedPath)) {
      stats.skippedBinaryFiles += 1;
      continue;
    }

    if (files.length >= limits.maxFiles) {
      throw new ScanError(
        `Too many text files to scan. The v0.1.3 limit is ${limits.maxFiles} files after ignored directories are removed.`,
        "TOO_MANY_FILES",
        413,
      );
    }

    if (entry.header.size > limits.maxFileBytes) {
      stats.skippedLargeFiles += 1;
      continue;
    }

    const data = entry.getData();

    if (data.byteLength > limits.maxFileBytes) {
      stats.skippedLargeFiles += 1;
      continue;
    }

    if (isLikelyBinary(data)) {
      stats.skippedBinaryFiles += 1;
      continue;
    }

    if (stats.scannedBytes + data.byteLength > limits.maxTotalTextBytes) {
      throw new ScanError(
        `The archive has too much text to scan safely. The v0.1.3 text limit is ${formatBytes(limits.maxTotalTextBytes)}.`,
        "TEXT_BYTES_LIMIT",
        413,
      );
    }

    files.push({
      path: normalizedPath,
      content: data.toString("utf8"),
      size: data.byteLength,
    });
    stats.scannedBytes += data.byteLength;
  }

  stats.scannedFiles = files.length;

  if (files.length === 0) {
    throw new ScanError(
      "No scannable text files were found in the archive.",
      "NO_TEXT_FILES",
    );
  }

  return { files, stats };
}

function findCommonRootPrefix(paths: string[]) {
  const topLevel = new Set<string>();

  for (const path of paths) {
    if (!path || path.startsWith("../")) {
      continue;
    }

    const firstPart = normalizePath(path).split("/")[0];

    if (firstPart) {
      topLevel.add(firstPart);
    }
  }

  return topLevel.size === 1 ? `${Array.from(topLevel)[0]}/` : "";
}

function stripPrefix(path: string, prefix: string) {
  if (!prefix || !path.startsWith(prefix)) {
    return path;
  }

  return path.slice(prefix.length);
}

function formatBytes(bytes: number) {
  return `${Math.round((bytes / MB) * 10) / 10} MB`;
}
