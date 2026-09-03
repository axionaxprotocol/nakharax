#!/usr/bin/env python3
"""Generate or retrieve the Ed25519 key material used by the faucet.

The Rust faucet derives its funded address from an Ed25519 public key. New
keys are generated from CSPRNG entropy; testnet no longer has a deterministic
faucet seed. For a genesis created from the sovereign master wallet, use the
faucet key stored in its offline ``master_wallet_secrets.json`` file.

Examples:
    python services/core/scripts/generate-faucet-key.py --env-file /secure/faucet.env
    python services/core/scripts/generate-faucet-key.py \
        --from-master-wallet /secure/master_wallet_secrets.json --env-file /secure/faucet.env
"""

import argparse
import json
import os
import secrets
import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from eth_hash.auto import keccak
except ImportError:
    print("Install dependencies: pip install cryptography eth-hash", file=sys.stderr)
    sys.exit(1)


def parse_private_key(value: str) -> bytes:
    """Return a validated 32-byte Ed25519 seed from a hex string."""
    normalized = value.strip()
    if normalized.startswith("0x"):
        normalized = normalized[2:]
    try:
        private_key = bytes.fromhex(normalized)
    except ValueError as exc:
        raise ValueError("faucet private key must be hexadecimal") from exc
    if len(private_key) != 32:
        raise ValueError(f"faucet private key must be 32 bytes, got {len(private_key)}")
    return private_key


def load_master_wallet_key(path: Path) -> bytes:
    """Load the faucet seed from an offline master-wallet secrets file."""
    try:
        wallet = json.loads(path.read_text(encoding="utf-8"))
        value = wallet["faucet"]["private_key_hex"]
    except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
        raise ValueError(f"could not load faucet.private_key_hex from {path}") from exc
    if not isinstance(value, str):
        raise ValueError("faucet.private_key_hex must be a string")
    return parse_private_key(value)


def faucet_address(private_key: bytes) -> str:
    """Mirror the Rust faucet address derivation: keccak(Ed25519 pubkey)[12:]."""
    signing_key = Ed25519PrivateKey.from_private_bytes(private_key)
    public_key = signing_key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return "0x" + keccak(public_key)[12:].hex()


def write_env_file(path: Path, private_key: bytes, address: str) -> None:
    """Create a new owner-only faucet environment file without overwriting one."""
    resolved = path.expanduser().resolve()
    if resolved.exists():
        raise ValueError(f"refusing to overwrite existing secret file: {resolved}")

    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    try:
        file_descriptor = os.open(resolved, flags, 0o600)
    except OSError as exc:
        raise ValueError(f"could not create secret file {resolved}") from exc

    with os.fdopen(file_descriptor, "w", encoding="utf-8") as env_file:
        env_file.write("# Faucet key — do not commit this file\n")
        env_file.write(f"FAUCET_PRIVATE_KEY=0x{private_key.hex()}\n")
        env_file.write(f"# FAUCET_ADDRESS={address}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or retrieve an Ed25519 faucet keypair")
    parser.add_argument(
        "--from-master-wallet",
        type=Path,
        metavar="PATH",
        help="read faucet.private_key_hex from an offline master_wallet_secrets.json file",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        metavar="PATH",
        help="create a new owner-only file containing FAUCET_PRIVATE_KEY",
    )
    parser.add_argument(
        "--env",
        action="store_true",
        help="print the complete FAUCET_PRIVATE_KEY assignment to stdout",
    )
    parser.add_argument(
        "--testnet",
        action="store_true",
        help="deprecated; deterministic testnet faucet keys are no longer supported",
    )
    args = parser.parse_args()

    if args.testnet:
        parser.error("--testnet is retired; use a CSPRNG key or --from-master-wallet")

    try:
        private_key = (
            load_master_wallet_key(args.from_master_wallet)
            if args.from_master_wallet
            else secrets.token_bytes(32)
        )
        address = faucet_address(private_key)
        if args.env_file:
            write_env_file(args.env_file, private_key, address)
    except ValueError as exc:
        parser.error(str(exc))

    source = "master wallet" if args.from_master_wallet else "fresh CSPRNG entropy"
    print(f"Faucet address: {address}")
    print(f"Key source: {source}")
    print("Use this address as --faucet-address when creating a new genesis.")

    if args.env_file:
        print(f"Wrote owner-only faucet environment file: {args.env_file.expanduser().resolve()}")
    elif args.env:
        print(f"FAUCET_PRIVATE_KEY=0x{private_key.hex()}")
    else:
        print("Private key not printed. Use --env-file /secure/faucet.env or --env explicitly.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
