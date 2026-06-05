import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "crypto";

const ALGORITHM = "aes-256-gcm";

function deriveKey(purpose: "encrypt" | "hmac"): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET must be set and at least 32 characters");
  }
  // HKDF to derive separate keys for encryption and HMAC from the same master secret
  return Buffer.from(
    hkdfSync("sha256", secret, "demandvibes-v1", purpose, 32)
  );
}

export function encrypt(text: string): string {
  const key = deriveKey("encrypt");
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(encryptedText: string): string {
  const key = deriveKey("encrypt");
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Invalid ciphertext format");

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// ── OAuth state token: signed with HMAC so it can't be forged ──────────────

interface OAuthState {
  workspaceId: string;
  userId: string;
  nonce: string; // random, prevents replay
  issuedAt: number; // unix ms
}

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createOAuthState(workspaceId: string, userId: string): string {
  const payload: OAuthState = {
    workspaceId,
    userId,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", deriveKey("hmac")).update(data).digest("hex");
  return `${data}.${sig}`;
}

export function verifyOAuthState(token: string): OAuthState {
  const dot = token.lastIndexOf(".");
  if (dot === -1) throw new Error("Malformed state token");

  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expectedSig = createHmac("sha256", deriveKey("hmac")).update(data).digest("hex");
  // Constant-time comparison prevents timing attacks
  if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
    throw new Error("Invalid state signature");
  }

  const payload: OAuthState = JSON.parse(Buffer.from(data, "base64url").toString());

  if (Date.now() - payload.issuedAt > STATE_TTL_MS) {
    throw new Error("State token expired");
  }

  return payload;
}
