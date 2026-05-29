const secretValuePatterns = [
  /\bsk_(?:live|test)_[A-Za-z0-9]{10,}\b/g,
  /\bwhsec_[A-Za-z0-9]{10,}\b/g,
  /\brk_live_[A-Za-z0-9]{10,}\b/g,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{18,}\b/g,
  /\bre_[A-Za-z0-9_-]{18,}\b/g,
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
];

const sensitiveAssignmentPattern =
  /\b((?:OPENAI_API_KEY|RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY|FIREBASE_PRIVATE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|PRIVATE|OPENAI|SERVICE_ROLE)|VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|OPENAI|SERVICE_ROLE))\s*[:=]\s*["'`]?)([^"'`\s]{8,})(["'`]?)\b/g;

export function maskSecrets(value: string) {
  const assignmentMasked = value.replace(
    sensitiveAssignmentPattern,
    (_match, prefix: string, secret: string, suffix: string) =>
      `${prefix}${maskSecret(secret)}${suffix}`,
  );

  return secretValuePatterns.reduce((masked, pattern) => {
    pattern.lastIndex = 0;
    return masked.replace(pattern, (match) => maskSecret(match));
  }, assignmentMasked);
}

export function maskSecret(secret: string) {
  if (secret.includes("PRIVATE KEY")) {
    return "[private key block redacted]";
  }

  if (secret.length <= 12) {
    return "[secret redacted]";
  }

  const head = secret.slice(0, Math.min(12, secret.length - 4));
  const tail = secret.slice(-3);

  return `${head}...${tail}`;
}

export function safeEvidenceSnippet(content: string, pattern: RegExp) {
  pattern.lastIndex = 0;
  const match = pattern.exec(content);

  if (!match) {
    return undefined;
  }

  const lines = content.split(/\r?\n/);
  const prefix = content.slice(0, match.index);
  const lineIndex = prefix.split(/\r?\n/).length - 1;
  const rawLine = lines[lineIndex]?.trim();

  if (!rawLine) {
    return undefined;
  }

  const snippet =
    rawLine.length > 220 ? `${rawLine.slice(0, 217).trimEnd()}...` : rawLine;

  return maskSecrets(snippet);
}
