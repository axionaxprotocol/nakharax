import { generateCryptographicSeed, deriveAccountFromMnemonic, generateEphemeralKeypair, encryptKeystore, decryptKeystore } from "../src/lib/crypto-vault.ts";
import assert from "assert";

console.log("🔒 Running Web Crypto Vault Unit Test Suite...");

async function runTests() {
  // Test 1: Generate Ephemeral Keypair
  const pair = generateEphemeralKeypair();
  console.log("  [1] Ephemeral Keypair Generated:", pair.address);
  assert.ok(pair.address.startsWith("0x"), "Address must start with 0x");
  assert.equal(pair.address.length, 42, "Address must be 42 characters");
  assert.ok(pair.privateKey.startsWith("0x"), "Private key must start with 0x");

  // Test 2: Encrypt Keystore with Password
  const password = "CitadelSuperSecretPassword2026!";
  const keystore = await encryptKeystore(pair.privateKey, password);
  console.log("  [2] Keystore Encrypted (PBKDF2 + AES-256-GCM)");
  assert.equal(keystore.crypto.cipher, "aes-256-gcm");
  assert.equal(keystore.crypto.kdf, "pbkdf2");
  assert.equal(keystore.address.toLowerCase(), pair.address.toLowerCase());
  // Verify no plaintext leak in ciphertext
  assert.ok(!keystore.crypto.ciphertext.includes(pair.privateKey.slice(2)), "Ciphertext must NOT be plaintext private key");

  // Test 3: Decrypt Keystore with Correct Password
  const decryptedKey = await decryptKeystore(keystore, password);
  console.log("  [3] Keystore Decrypted Successfully");
  assert.equal(decryptedKey.toLowerCase(), pair.privateKey.toLowerCase(), "Decrypted private key must match original");

  // Test 4: Decrypt Keystore with WRONG Password (Must Fail)
  let failed = false;
  try {
    await decryptKeystore(keystore, "WrongPassword123!");
  } catch (err) {
    failed = true;
    console.log("  [4] Wrong Password Rejection Verified:", err.message);
  }
  assert.ok(failed, "Decryption with wrong password MUST throw an error");

  // Test 5: BIP-39 Seed Generation
  const seed = generateCryptographicSeed();
  console.log("  [5] BIP-39 12-Word Seed Generated:", seed.mnemonic.slice(0, 3).join(" "), "...");
  assert.equal(seed.mnemonic.length, 12, "Must generate exactly 12 mnemonic words");
  assert.ok(seed.address.startsWith("0x"), "Seed address must be valid 0x");

  // Test 6: Mnemonic Recovery Roundtrip (Verify 12 words restore the exact same address and key)
  const restored = deriveAccountFromMnemonic(seed.mnemonic.join(" "));
  console.log("  [6] Mnemonic Recovery Roundtrip Verified:", restored.address);
  assert.equal(restored.address.toLowerCase(), seed.address.toLowerCase(), "Restored address MUST match generated seed address");
  assert.equal(restored.privateKey.toLowerCase(), seed.privateKey.toLowerCase(), "Restored private key MUST match generated seed private key");

  console.log("\n✅ ALL 6 CRYPTO VAULT TESTS PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

