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

export async function hashPassword(rawPassword: string, iterations = 150000): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
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

export async function verifyPassword(rawPassword: string, stored: string): Promise<boolean> {
  try {
    const [alg, iterStr, saltB64, hashB64] = stored.split("$");
    if (alg !== "pbkdf2") return false;
    const iterations = parseInt(iterStr, 10);
    const salt = fromBase64(saltB64);
    const expected = hashB64;

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
        salt: salt,
      } as any,
      keyMaterial,
      256,
    );
    const actual = toBase64(derivedBits);
    return actual === expected;
  } catch {
    return false;
  }
}

export function isEmailLike(username: string): boolean {
  return /.+@.+\..+/.test(username);
}


