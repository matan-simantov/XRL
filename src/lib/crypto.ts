const textEncoder = new TextEncoder();

function toBase64(bytes: ArrayBuffer): string {
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
  return btoa(binary);
}

function fromBase64(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export type PasswordHashRecord = {
  algorithm: "pbkdf2";
  iterations: number;
  saltB64: string;
  hashB64: string;
};

function simpleDerive(password: string, saltBytes: Uint8Array, iterations: number): string {
  // Lightweight deterministic fallback (NOT for production security)
  let h1 = 2166136261 >>> 0;
  let h2 = 0x9e3779b1 >>> 0;
  const pwd = textEncoder.encode(password);
  for (let i = 0; i < iterations; i++) {
    for (let j = 0; j < pwd.length; j++) {
      h1 ^= pwd[j];
      h1 = (h1 * 16777619) >>> 0;
      h2 = (h2 ^ ((h1 << 5) | (h1 >>> 27)) ^ saltBytes[j % saltBytes.length]) >>> 0;
    }
  }
  const out = new Uint8Array(32);
  for (let k = 0; k < 32; k++) {
    const v = (h1 ^ ((h2 << (k % 13)) | (h2 >>> (32 - (k % 13))))) >>> 0;
    out[k] = (v >> (k % 24)) & 0xff;
  }
  return toBase64(out.buffer);
}

export async function hashPassword(rawPassword: string, iterations = 150000): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  if (crypto?.subtle) {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(rawPassword),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"],
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        iterations,
        salt,
      },
      keyMaterial,
      256,
    );
    const record: PasswordHashRecord = {
      algorithm: "pbkdf2",
      iterations,
      saltB64: toBase64(salt.buffer),
      hashB64: toBase64(derivedBits),
    };
    return `pbkdf2$${record.iterations}$${record.saltB64}$${record.hashB64}`;
  }
  // Fallback when SubtleCrypto not available (e.g., non-HTTPS hosting)
  const fallbackIterations = 50000;
  const hashB64 = simpleDerive(rawPassword, salt, fallbackIterations);
  return `simple$${fallbackIterations}$${toBase64(salt.buffer)}$${hashB64}`;
}

export async function verifyPassword(rawPassword: string, stored: string): Promise<boolean> {
  try {
    const [alg, iterStr, saltB64, hashB64] = stored.split("$");
    const iterations = parseInt(iterStr, 10);
    const salt = new Uint8Array(fromBase64(saltB64));
    if (alg === "pbkdf2" && crypto?.subtle) {
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        textEncoder.encode(rawPassword),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"],
      );
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          hash: "SHA-256",
          iterations,
          salt,
        },
        keyMaterial,
        256,
      );
      const actual = toBase64(derivedBits);
      return actual === hashB64;
    }
    if (alg === "simple" || !crypto?.subtle) {
      const actual = simpleDerive(rawPassword, salt, isFinite(iterations) ? iterations : 50000);
      return actual === hashB64;
    }
    return false;
  } catch {
    return false;
  }
}

export function isEmailLike(username: string): boolean {
  return /.+@.+\..+/.test(username);
}


