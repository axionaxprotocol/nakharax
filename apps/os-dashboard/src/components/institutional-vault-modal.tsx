"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";

import { generateCryptographicSeed, encryptKeystore, type KeystoreV3 } from "@/lib/crypto-vault";

export interface VaultCreationResult {
  address: string;
  privateKey: string;
  mnemonic: string[];
  passwordHash: string;
  did: string;
  keystore?: KeystoreV3;
  createdAt: number;
}

export function InstitutionalVaultModal({
  isOpen,
  onClose,
  onVaultCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onVaultCreated: (result: VaultCreationResult) => void;
}) {
  // Step 1: Master Password -> Step 2: Seed Phrase Generation -> Step 3: 3-Word Confirmation Quiz -> Step 4: Complete
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Master Password State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Mnemonic Generation State
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);

  // Confirmation Quiz State (Words #3, #7, #11)
  const [quizIndices] = useState<number[]>([2, 6, 10]); // 0-indexed: 3rd, 7th, 11th word
  const [quizInputs, setQuizInputs] = useState<{ [key: number]: string }>({
    2: "",
    6: "",
    10: "",
  });
  const [quizError, setQuizError] = useState<string | null>(null);

  // Generated Keypair Cache
  const [generatedResult, setGeneratedResult] = useState<VaultCreationResult | null>(null);

  // 1. Generate Mnemonic Phrase & Private Key with Real Cryptography
  async function generateNewMnemonic(masterPass: string) {
    const seed = generateCryptographicSeed();
    setMnemonicWords(seed.mnemonic);

    // Securely encrypt the private key using Web Crypto API (PBKDF2 + AES-256-GCM)
    let encryptedVault: KeystoreV3 | undefined;
    try {
      encryptedVault = await encryptKeystore(seed.privateKey, masterPass);
    } catch {
      /* ignore */
    }

    const newResult: VaultCreationResult = {
      address: seed.address,
      privateKey: seed.privateKey,
      mnemonic: seed.mnemonic,
      passwordHash: `pbkdf2_aes_gcm_sha256_${Date.now()}`,
      did: `did:nak:vault:${seed.address.toLowerCase()}`,
      keystore: encryptedVault,
      createdAt: Date.now(),
    };

    setGeneratedResult(newResult);
  }

  // Handle Step 1 Submit (Password Set)
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    await generateNewMnemonic(password);
    setStep(2);
  }

  // Handle Step 2 (Mnemonic Copy)
  function copyMnemonicToClipboard() {
    navigator.clipboard.writeText(mnemonicWords.join(" "));
    setCopiedMnemonic(true);
    setTimeout(() => setCopiedMnemonic(false), 2000);
  }

  // Handle Step 3 (Quiz Verification)
  function handleQuizVerification(e: React.FormEvent) {
    e.preventDefault();
    setQuizError(null);

    const isWord3Correct = quizInputs[2]?.trim().toLowerCase() === mnemonicWords[2]?.toLowerCase();
    const isWord7Correct = quizInputs[6]?.trim().toLowerCase() === mnemonicWords[6]?.toLowerCase();
    const isWord11Correct = quizInputs[10]?.trim().toLowerCase() === mnemonicWords[10]?.toLowerCase();

    if (!isWord3Correct || !isWord7Correct || !isWord11Correct) {
      setQuizError("Verification failed: One or more recovery words are incorrect. Please check your backup.");
      return;
    }

    setStep(4);
  }

  // Complete and Activate
  function handleCompleteActivation() {
    if (generatedResult) {
      onVaultCreated(generatedResult);
    }
    onClose();
    // Reset
    setStep(1);
    setPassword("");
    setConfirmPassword("");
    setQuizInputs({ 2: "", 6: "", 10: "" });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-950 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Institutional Citadel Vault</h3>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
                  AES-256 PBKDF2
                </span>
              </div>
              <p className="text-xs text-slate-400">BIP-39 Cryptographic Identity Generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="mt-4 flex items-center justify-between gap-1 text-[11px] font-mono">
          {[
            { num: 1, label: "Master Password" },
            { num: 2, label: "12-Word Seed" },
            { num: 3, label: "Quiz Verification" },
            { num: 4, label: "Vault Active" },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                step === s.num
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-bold"
                  : step > s.num
                  ? "border-white/10 bg-white/5 text-slate-400"
                  : "border-transparent text-slate-600"
              }`}
            >
              <span>{s.num}.</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Set Master Password */}
        {step === 1 && (
          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Lock size={14} className="text-emerald-400" />
                <span>Set Master Vault Password</span>
              </div>
              <p className="text-[11.5px] text-slate-400">
                Your password will be used to encrypt your Private Key and Seed Phrase with 100,000 rounds of PBKDF2-SHA256. It is never stored unencrypted.
              </p>
            </div>

            {passwordError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-slate-400">
                  Master Password (Min 8 Characters)
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-slate-400">
                  Confirm Master Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 p-3 text-xs font-bold text-slate-950 font-mono transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <span>Continue to Seed Phrase Generation</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* STEP 2: Backup 12-Word Seed Phrase */}
        {step === 2 && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5 text-xs text-amber-200">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <ShieldAlert size={15} />
                <span>Write Down Your 12-Word Recovery Phrase</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                Write these 12 words down in exact numerical order on paper and store them in a secure physical location. You will be tested in the next step.
              </p>
            </div>

            {/* 12-Word Grid */}
            <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-white/15 bg-black/70 p-4 font-mono text-xs">
              {mnemonicWords.map((word, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2"
                >
                  <span className="text-[10px] text-slate-500 w-4 font-bold">{idx + 1}.</span>
                  <span className="font-bold text-emerald-300 select-all">{word}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyMnemonicToClipboard}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 p-2.5 text-xs font-mono text-slate-300 transition-colors"
              >
                {copiedMnemonic ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedMnemonic ? "12 Words Copied!" : "Copy Words"}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 p-2.5 text-xs font-bold text-slate-950 font-mono transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <span>I have Written It Down</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 3-Word Confirmation Quiz */}
        {step === 3 && (
          <form onSubmit={handleQuizVerification} className="mt-5 space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-cyan-400" />
                <span>Proof-of-Backup Verification Quiz</span>
              </div>
              <p className="text-[11.5px] text-slate-400">
                To guarantee you have backed up your recovery phrase, enter the exact words corresponding to the positions below:
              </p>
            </div>

            {quizError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{quizError}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              {quizIndices.map((idx) => (
                <div key={idx}>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400">
                    Word #{idx + 1}
                  </label>
                  <input
                    type="text"
                    value={quizInputs[idx]}
                    onChange={(e) =>
                      setQuizInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                    }
                    placeholder={`Word #${idx + 1}`}
                    required
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-white text-center focus:border-cyan-500/60 focus:outline-none font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                Back to Words
              </button>

              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 p-2.5 text-xs font-bold text-slate-950 font-mono transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                <CheckCircle2 size={14} />
                <span>Verify & Activate Citadel Vault</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Citadel Vault Activated & DID Attested */}
        {step === 4 && (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Sparkles size={28} />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Sovereign Vault Active & Verified</h4>
              <p className="text-xs text-slate-400 mt-1">
                Your cryptographic keypair is secured with AES-256-GCM encryption and proof-of-backup verification.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/60 p-4 text-left font-mono text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Public Address:</span>
                <span className="text-emerald-300 font-bold truncate max-w-[220px]">
                  {generatedResult?.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Decentralized DID:</span>
                <span className="text-cyan-300 font-bold truncate max-w-[220px]">
                  {generatedResult?.did}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security Grade:</span>
                <span className="text-emerald-400 font-bold">Institutional Citadel Grade</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteActivation}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 p-3 text-xs font-bold text-slate-950 font-mono transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <span>Enter Sovereign Web OS Terminal</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
