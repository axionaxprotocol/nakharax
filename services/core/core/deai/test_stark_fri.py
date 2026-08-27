"""
NakharaX Protocol — Unit & Invariant Tests for STARK FRI Verifier
"""

import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import math
import numpy as np
from stark_fri_verifier import MerkleTree, StarkFRIVerifier


def test_merkle_tree_integrity():
    print("[*] Testing Merkle Tree integrity and proof paths...", flush=True)
    leaves = [b"leaf_0", b"leaf_1", b"leaf_2", b"leaf_3", b"leaf_4", b"leaf_5", b"leaf_6", b"leaf_7"]
    tree = MerkleTree(leaves)
    assert len(tree.root) == 32

    for i, leaf in enumerate(leaves):
        proof = tree.get_proof(i)
        assert MerkleTree.verify_proof(leaf, proof, tree.root) is True

    proof_0 = tree.get_proof(0)
    assert MerkleTree.verify_proof(b"tampered_leaf", proof_0, tree.root) is False
    print("  [+] Merkle Tree Integrity PASS", flush=True)


def test_stark_fri_prover_and_verifier_valid_trace():
    print("[*] Testing STARK FRI Prover & Verifier on quadratic polynomial...", flush=True)
    verifier = StarkFRIVerifier(blowup_factor=4)

    xs = np.linspace(-1, 1, 64)
    evaluations = 3 * xs**2 - 2 * xs + 5

    proof = verifier.prove_low_degree(evaluations, num_queries=8)
    assert len(proof["roots"]) > 1
    assert len(proof["alphas"]) == len(proof["roots"]) - 1
    assert len(proof["queries"]) == 8

    is_valid = verifier.verify_proof(proof)
    assert is_valid is True
    print("  [+] STARK FRI Valid Trace Verification PASS", flush=True)


def test_stark_fri_tampered_proof_rejection():
    print("[*] Testing Byzantine Tampered Proof Rejection...", flush=True)
    verifier = StarkFRIVerifier(blowup_factor=4)
    xs = np.linspace(-1, 1, 64)
    evaluations = 3 * xs**2 - 2 * xs + 5

    proof = verifier.prove_low_degree(evaluations, num_queries=8)

    # Tamper with query value
    proof["queries"][0]["trace"][0]["val_x"] += 999.0
    assert verifier.verify_proof(proof) is False
    print("  [+] Byzantine Tampered Proof Rejection PASS", flush=True)


if __name__ == "__main__":
    print("=" * 60, flush=True)
    print("[NakharaX] Cryptographic STARK FRI Verification Suite", flush=True)
    print("=" * 60, flush=True)
    test_merkle_tree_integrity()
    test_stark_fri_prover_and_verifier_valid_trace()
    test_stark_fri_tampered_proof_rejection()
    print("=" * 60, flush=True)
    print("[SUCCESS] 3/3 STARK FRI INVARIANT TESTS PASS (100%)", flush=True)
    print("=" * 60, flush=True)
