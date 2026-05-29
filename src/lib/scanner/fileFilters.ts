import { posix } from "node:path";
import {
  IGNORED_DIRECTORY_PARTS,
  IGNORED_FILE_NAMES,
  TEXT_EXTENSIONS,
  TEXT_FILE_NAMES,
} from "./constants";
import type { ScannedFile } from "./types";

const CLIENT_PATH_PARTS = [
  "/app/page.",
  "/app/layout.",
  "/components/",
  "/client/",
  "/frontend/",
  "/hooks/",
  "/pages/",
  "/public/",
  "/views/",
  "/widgets/",
];

const SERVER_ONLY_PATH_PARTS = [
  "/app/api/",
  "/api/",
  "/server/",
  "/lib/server/",
  "/route.",
  "/middleware.",
];

export function normalizePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\/+/, "");
}

export function normalizeArchivePath(rawPath: string) {
  const normalized = posix.normalize(normalizePath(rawPath));

  if (normalized === ".") {
    return "";
  }

  return normalized;
}

export function isUnsafeArchivePath(path: string) {
  const normalizedInput = path.replaceAll("\\", "/");
  const rawParts = normalizedInput.split("/");

  if (normalizedInput.startsWith("/") || rawParts.includes("..")) {
    return true;
  }

  const normalized = normalizeArchivePath(path);

  return normalized === ".." || normalized.startsWith("../");
}

export function lowerPath(file: ScannedFile) {
  return normalizePath(file.path).toLowerCase();
}

export function isEnvFile(file: ScannedFile) {
  const fileName = lowerPath(file).split("/").pop() ?? "";
  return fileName.startsWith(".env") && !fileName.includes("example");
}

export function isBrowserFacingFile(file: ScannedFile) {
  const path = `/${lowerPath(file)}`;

  if (SERVER_ONLY_PATH_PARTS.some((part) => path.includes(part))) {
    return false;
  }

  if (/^\s*["']use server["'];?/m.test(file.content)) {
    return false;
  }

  if (/^\s*["']use client["'];?/m.test(file.content)) {
    return true;
  }

  if (CLIENT_PATH_PARTS.some((part) => path.includes(part))) {
    return true;
  }

  return /\.(tsx|jsx|vue|svelte)$/.test(path);
}

export function shouldIgnorePath(path: string) {
  const parts = path.split("/");
  const fileName = parts.at(-1) ?? "";

  return (
    parts.some((part) => IGNORED_DIRECTORY_PARTS.includes(part as never)) ||
    IGNORED_FILE_NAMES.has(fileName) ||
    path.endsWith(".map") ||
    path.endsWith(".min.js") ||
    path.endsWith(".generated.ts") ||
    path.endsWith(".generated.tsx")
  );
}

export function looksLikeTextPath(path: string) {
  const fileName = path.split("/").at(-1) ?? "";

  if (TEXT_FILE_NAMES.has(fileName) || fileName.startsWith(".env")) {
    return true;
  }

  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex === -1) {
    return false;
  }

  return TEXT_EXTENSIONS.has(fileName.slice(dotIndex));
}

export function isLikelyBinary(buffer: Buffer) {
  if (buffer.includes(0)) {
    return true;
  }

  const sampleSize = Math.min(buffer.byteLength, 512);
  let suspicious = 0;

  for (let index = 0; index < sampleSize; index += 1) {
    const byte = buffer[index];
    const isCommonControl = byte === 9 || byte === 10 || byte === 13;

    if (!isCommonControl && byte < 32) {
      suspicious += 1;
    }
  }

  return sampleSize > 0 && suspicious / sampleSize > 0.08;
}

export function testRegex(pattern: RegExp, value: string) {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

export function fileMatches(
  files: ScannedFile[],
  regex: RegExp,
  filter?: (file: ScannedFile) => boolean,
) {
  return files.filter((file) => (!filter || filter(file)) && testRegex(regex, file.content));
}

export function pathOrContentMatches(files: ScannedFile[], regex: RegExp) {
  return files.some(
    (file) => testRegex(regex, lowerPath(file)) || testRegex(regex, file.content),
  );
}

export function hasAny(files: ScannedFile[], patterns: RegExp[]) {
  return files.some((file) =>
    patterns.some(
      (pattern) =>
        testRegex(pattern, lowerPath(file)) || testRegex(pattern, file.content),
    ),
  );
}

export function uniquePaths(files: ScannedFile[], limit = 8) {
  return Array.from(new Set(files.map((file) => normalizePath(file.path)))).slice(
    0,
    limit,
  );
}
