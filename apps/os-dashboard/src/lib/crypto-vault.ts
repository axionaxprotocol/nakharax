import { english, generateMnemonic, mnemonicToAccount, privateKeyToAccount, generatePrivateKey } from "viem/accounts";

export interface KeystoreCrypto {
  cipher: "aes-256-gcm";
  ciphertext: string;
  cipherparams: {
    iv: string;
  };
  kdf: "pbkdf2";
  kdfparams: {
    c: number;
    dklen: number;
    prf: "hmac-sha256";
    salt: string;
  };
  mac: string;
}

export interface KeystoreV3 {
  address: string;
  crypto: KeystoreCrypto;
  id: string;
  version: 3;
  network?: string;
  chainId?: number;
  createdAt: number;
}

/**
 * Convert buffer/Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Derive encryption key from password using PBKDF2 Web Crypto API
 */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Calculate HMAC-SHA256 for MAC validation
 */
async function calculateMac(derivedKeyBytes: Uint8Array, ciphertextBytes: Uint8Array): Promise<string> {
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    derivedKeyBytes.slice(0, 16) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", hmacKey, ciphertextBytes as unknown as BufferSource);
  return bytesToHex(new Uint8Array(signature));
}

/**
 * Encrypt a private key into a secure Keystore V3 JSON structure using Web Crypto API
 */
export async function encryptKeystore(
  privateKey: `0x${string}`,
  password: string
): Promise<KeystoreV3> {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long for cryptographic vault safety.");
  }

  // 1. Derive Ethereum address deterministically from private key
  const account = privateKeyToAccount(privateKey);
  const address = account.address;

  // 2. Generate random cryptographic Salt (32 bytes) and IV (12 bytes for AES-GCM)
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  // 3. Derive AES-GCM 256 key from password
  const derivedKey = await deriveKeyFromPassword(password, salt, iterations);
  const exportedRawKey = await crypto.subtle.exportKey("raw", derivedKey);
  const derivedKeyBytes = new Uint8Array(exportedRawKey);

  // 4. Encrypt private key payload (hex representation without 0x)
  const cleanPrivHex = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(cleanPrivHex);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    derivedKey,
    plaintextBytes as unknown as BufferSource
  );
  const ciphertextBytes = new Uint8Array(encryptedBuffer);

  // 5. Compute MAC verification signature
  const mac = await calculateMac(derivedKeyBytes, ciphertextBytes);

  return {
    address: address,
    crypto: {
      cipher: "aes-256-gcm",
      ciphertext: bytesToHex(ciphertextBytes),
      cipherparams: {
        iv: bytesToHex(iv),
      },
      kdf: "pbkdf2",
      kdfparams: {
        c: iterations,
        dklen: 32,
        prf: "hmac-sha256",
        salt: bytesToHex(salt),
      },
      mac: mac,
    },
    id: crypto.randomUUID(),
    version: 3,
    network: "nakharax-testnet",
    chainId: 86137,
    createdAt: Date.now(),
  };
}

/**
 * Decrypt a Keystore V3 payload with password using Web Crypto API
 */
export async function decryptKeystore(
  keystore: KeystoreV3,
  password: string
): Promise<`0x${string}`> {
  const { crypto: c } = keystore;
  if (!c || c.cipher !== "aes-256-gcm" || c.kdf !== "pbkdf2") {
    throw new Error("Unsupported keystore format: Expected AES-256-GCM with PBKDF2 KDF.");
  }

  const salt = hexToBytes(c.kdfparams.salt);
  const iv = hexToBytes(c.cipherparams.iv);
  const ciphertext = hexToBytes(c.ciphertext);
  const iterations = c.kdfparams.c || 100000;

  // 1. Derive decryption key from password & salt
  const derivedKey = await deriveKeyFromPassword(password, salt, iterations);
  const exportedRawKey = await crypto.subtle.exportKey("raw", derivedKey);
  const derivedKeyBytes = new Uint8Array(exportedRawKey);

  // 2. Validate MAC prior to decryption
  const computedMac = await calculateMac(derivedKeyBytes, ciphertext);
  if (computedMac !== c.mac) {
    throw new Error("Invalid password: MAC signature verification mismatch.");
  }

  // 3. Decrypt ciphertext
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      derivedKey,
      ciphertext as unknown as BufferSource
    );
    const decoder = new TextDecoder();
    const privHex = decoder.decode(decryptedBuffer);
    const formattedKey = (privHex.startsWith("0x") ? privHex : `0x${privHex}`) as `0x${string}`;

    // 4. Verify address matches decrypted key
    const derivedAccount = privateKeyToAccount(formattedKey);
    if (derivedAccount.address.toLowerCase() !== keystore.address.toLowerCase()) {
      throw new Error("Integrity check failed: Decrypted private key does not match keystore address.");
    }

    return formattedKey;
  } catch (err: any) {
    throw new Error("Failed to decrypt keystore. Incorrect master password or corrupted payload.");
  }
}

/**
 * Cryptographically generate a new BIP-39 mnemonic seed phrase and derive its master account
 */
export function generateCryptographicSeed(): { mnemonic: string[]; address: string; privateKey: `0x${string}` } {
  const mnemonicString = generateMnemonic(english);
  const words = mnemonicString.split(" ");
  const account = mnemonicToAccount(mnemonicString);

  const privateKey = generatePrivateKey();
  const derivedAcc = privateKeyToAccount(privateKey);

  return {
    mnemonic: words,
    address: derivedAcc.address,
    privateKey: privateKey,
  };
}

/**
 * Generate a standalone cryptographic keypair
 */
export function generateEphemeralKeypair(): { address: string; privateKey: `0x${string}` } {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return {
    address: account.address,
    privateKey: privateKey,
  };
}
