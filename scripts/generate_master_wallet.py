#!/usr/bin/env python3
"""
NakharaX Master HD Wallet & Sovereign Key Generator (BIP-39 / BIP-44)

Generates:
1. 24-word Master Seed Phrase (BIP-39 mnemonic)
2. 9 Standard EVM Public Addresses (BIP-44: m/44'/60'/0'/0/i) for 1:1 Parity Genesis
3. Sovereign CSPRNG Ed25519 Faucet Keypair for VPS-01

Run offline on your secure machine:
    python scripts/generate_master_wallet.py
"""

import os
import sys
import hashlib
import json
from pathlib import Path

try:
    from mnemonic import Mnemonic
    from eth_account import Account
    import eth_account
    Account.enable_unaudited_hdwallet_features()
except ImportError:
    print("Installing required cryptography libraries (mnemonic, eth-account, pynacl)...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "mnemonic", "eth-account", "pynacl", "cryptography"])
    from mnemonic import Mnemonic
    from eth_account import Account
    Account.enable_unaudited_hdwallet_features()

from nacl.signing import SigningKey
from eth_utils import keccak


def generate():
    print("=" * 72)
    print("  NAKHARAX SOVEREIGN MASTER HD WALLET & KEY GENERATOR (1:1 PARITY)")
    print("=" * 72)

    # 1. Generate 24-word BIP-39 mnemonic
    mnemo = Mnemonic("english")
    mnemonic_phrase = mnemo.generate(strength=256)

    # 2. Derive 9 Accounts via BIP-44 path: m/44'/60'/0'/0/index
    roles = [
        ("Account #0 (m/44'/60'/0'/0/0)", "Creator / Founder", "10% (100B NAK)", "--creator-address"),
        ("Account #1 (m/44'/60'/0'/0/1)", "Ecosystem & Rewards", "30% (300B NAK)", "--ecosystem-address"),
        ("Account #2 (m/44'/60'/0'/0/2)", "Foundation / Treasury", "20% (200B NAK)", "--foundation-address"),
        ("Account #3 (m/44'/60'/0'/0/3)", "Community & DAO", "15% (150B NAK)", "--community-address"),
        ("Account #4 (m/44'/60'/0'/0/4)", "Team & Advisors", "10% (100B NAK)", "--team-address"),
        ("Account #5 (m/44'/60'/0'/0/5)", "Public Sale Pool", "5% (50B NAK)", "--public-sale-address"),
        ("Account #6 (m/44'/60'/0'/0/6)", "Strategic Reserve", "2% (20B NAK)", "--reserve-address"),
        ("Account #7 (m/44'/60'/0'/0/7)", "Validator-01 (VPS-02)", "2.5% (25B NAK)", "--validator-01-address"),
        ("Account #8 (m/44'/60'/0'/0/8)", "Validator-02 (VPS-03)", "2.5% (25B NAK)", "--validator-02-address"),
    ]

    accounts = []
    print("\n[1] MASTER SEED PHRASE (SAVE THIS OFFLINE - DO NOT SHARE):")
    print("-" * 72)
    print(f"  {mnemonic_phrase}")
    print("-" * 72)

    print("\n[2] DERIVED ALLOCATION ADDRESSES (1:1 PARITY):")
    print("-" * 72)

    cli_flags = []
    for idx, (path_label, role, share, cli_flag) in enumerate(roles):
        path = f"m/44'/60'/0'/0/{idx}"
        acct = Account.from_mnemonic(mnemonic_phrase, account_path=path)
        addr = acct.address.lower()
        accounts.append({
            "index": idx,
            "path": path,
            "role": role,
            "share": share,
            "address": addr,
            "cli_flag": cli_flag
        })
        print(f"  {role:<24} [{share:<14}] -> {addr}  ({path})")
        cli_flags.append(f"{cli_flag} {addr}")

    # 3. Generate fresh random CSPRNG Ed25519 Faucet Key
    faucet_seed = os.urandom(32)
    faucet_sk = SigningKey(faucet_seed)
    faucet_pub = bytes(faucet_sk.verify_key.encode())
    faucet_address = "0x" + keccak(faucet_pub)[12:].hex()

    print("\n[3] FRESH CSPRNG FAUCET KEYPAIR (FOR VPS-01):")
    print("-" * 72)
    print(f"  Faucet Address     : {faucet_address} (Allocated 3% = 30B NAK)")
    print(f"  Faucet Private Key : 0x{faucet_seed.hex()}")
    print("-" * 72)
    cli_flags.append(f"--faucet-address {faucet_address}")

    # Save to secure local file if requested
    out_file = Path("master_wallet_secrets.json")
    secrets = {
        "mnemonic_phrase": mnemonic_phrase,
        "accounts": accounts,
        "faucet": {
            "address": faucet_address,
            "private_key_hex": f"0x{faucet_seed.hex()}"
        }
    }
    with open(out_file, "w") as f:
        json.dump(secrets, f, indent=2)
    print(f"\n[!] Secrets saved to '{out_file.absolute()}'. (Keep this file confidential!)")

    print("\n[4] COPY & PASTE COMMAND FOR CREATE_GENESIS:")
    print("-" * 72)
    cmd = "python services/core/core/tools/create_genesis.py --verify " + " \\\n    ".join(cli_flags)
    print(cmd)
    print("=" * 72)


if __name__ == "__main__":
    generate()
