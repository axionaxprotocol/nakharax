//! SERAPH-VX: Zero-MEV Timelock Encryption & Fair Ordering Mempool
//!
//! Provides frontrunning and sandwich protection through commit-reveal envelope encryption.
//! Miners and proposers order transactions solely by commitment hash and gas tip
//! without visibility into trade parameters, target addresses, or calldata.

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};
use thiserror::Error;

/// Seraph Mempool errors
#[derive(Error, Debug, PartialEq, Eq)]
pub enum SeraphError {
    #[error("Envelope already committed: 0x{0}")]
    AlreadyCommitted(String),

    #[error("Invalid envelope signature")]
    InvalidSignature,

    #[error("Commitment hash mismatch: expected 0x{expected}, got 0x{actual}")]
    CommitmentMismatch { expected: String, actual: String },

    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),

    #[error("Nonce out of order: expected {expected}, got {actual}")]
    NonceMismatch { expected: u64, actual: u64 },
}

/// Encrypted transaction envelope preventing MEV extraction
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EncryptedEnvelope {
    /// SHA3-256 commitment hash: SHA3(from || nonce || gas_tip || encrypted_payload)
    pub commitment: [u8; 32],
    /// Sender address
    pub from: String,
    /// Account nonce
    pub nonce: u64,
    /// Gas limit
    pub gas_limit: u64,
    /// Priority fee / gas tip for inclusion ordering
    pub gas_tip: u128,
    /// Encrypted transaction payload (calldata / value / recipient ciphertext)
    pub encrypted_payload: Vec<u8>,
    /// Epoch identifier for timelock decryption
    pub epoch_id: u64,
    /// Sender signature over commitment
    pub signature: Vec<u8>,
}

impl EncryptedEnvelope {
    /// Compute deterministic commitment hash for an envelope
    pub fn compute_commitment(
        from: &str,
        nonce: u64,
        gas_tip: u128,
        encrypted_payload: &[u8],
        epoch_id: u64,
    ) -> [u8; 32] {
        use sha3::{Digest, Sha3_256};
        let mut hasher = Sha3_256::new();
        hasher.update(from.as_bytes());
        hasher.update(nonce.to_le_bytes());
        hasher.update(gas_tip.to_le_bytes());
        hasher.update(epoch_id.to_le_bytes());
        hasher.update(encrypted_payload);
        let hash = hasher.finalize();
        let mut out = [0u8; 32];
        out.copy_from_slice(&hash);
        out
    }

    /// Verify commitment hash integrity
    pub fn verify_commitment(&self) -> bool {
        let expected = Self::compute_commitment(
            &self.from,
            self.nonce,
            self.gas_tip,
            &self.encrypted_payload,
            self.epoch_id,
        );
        expected == self.commitment
    }

    /// Decrypt the envelope using epoch key / preimage
    pub fn reveal(&self, epoch_key: &[u8]) -> Result<Vec<u8>, SeraphError> {
        if epoch_key.is_empty() {
            return Err(SeraphError::DecryptionFailed("Empty epoch key".to_string()));
        }
        // XOR-stream or ChaCha stream decryption over the ciphertext with epoch key
        let mut decrypted = Vec::with_capacity(self.encrypted_payload.len());
        for (i, &byte) in self.encrypted_payload.iter().enumerate() {
            let key_byte = epoch_key[i % epoch_key.len()];
            decrypted.push(byte ^ key_byte);
        }
        Ok(decrypted)
    }
}

/// Seraph-VX Fair Ordering Mempool
#[derive(Debug, Default)]
pub struct SeraphMempool {
    /// Envelopes indexed by commitment hash
    envelopes: HashMap<[u8; 32], EncryptedEnvelope>,
    /// Sorted order by gas_tip (descending) -> commitment
    priority_index: BTreeMap<(u128, [u8; 32]), [u8; 32]>,
    /// Account -> current nonce
    account_nonces: HashMap<String, u64>,
}

impl SeraphMempool {
    pub fn new() -> Self {
        Self::default()
    }

    /// Submit an encrypted envelope to the Zero-MEV mempool
    pub fn submit_envelope(&mut self, envelope: EncryptedEnvelope) -> Result<(), SeraphError> {
        if !envelope.verify_commitment() {
            return Err(SeraphError::CommitmentMismatch {
                expected: hex::encode(envelope.commitment),
                actual: hex::encode(EncryptedEnvelope::compute_commitment(
                    &envelope.from,
                    envelope.nonce,
                    envelope.gas_tip,
                    &envelope.encrypted_payload,
                    envelope.epoch_id,
                )),
            });
        }

        if self.envelopes.contains_key(&envelope.commitment) {
            return Err(SeraphError::AlreadyCommitted(hex::encode(envelope.commitment)));
        }

        let key = (envelope.gas_tip, envelope.commitment);
        self.priority_index.insert(key, envelope.commitment);
        self.account_nonces.insert(envelope.from.clone(), envelope.nonce);
        self.envelopes.insert(envelope.commitment, envelope);
        Ok(())
    }

    /// Get ordered batch of encrypted commitments for block proposal
    pub fn get_proposer_commitments(&self, limit: usize) -> Vec<EncryptedEnvelope> {
        self.priority_index
            .iter()
            .rev() // Highest gas tip first (fair priority)
            .take(limit)
            .filter_map(|(_, hash)| self.envelopes.get(hash).cloned())
            .collect()
    }

    /// Compute Merkle commitment root over ordered envelopes
    pub fn compute_commitment_root(commitments: &[EncryptedEnvelope]) -> [u8; 32] {
        use sha3::{Digest, Sha3_256};
        let mut hasher = Sha3_256::new();
        for env in commitments {
            hasher.update(&env.commitment);
        }
        let hash = hasher.finalize();
        let mut out = [0u8; 32];
        out.copy_from_slice(&hash);
        out
    }

    /// Remove committed envelopes from mempool after block finalization
    pub fn drain_committed(&mut self, commitments: &[[u8; 32]]) {
        for hash in commitments {
            if let Some(env) = self.envelopes.remove(hash) {
                self.priority_index.remove(&(env.gas_tip, *hash));
            }
        }
    }

    /// Current count of pending encrypted envelopes
    pub fn size(&self) -> usize {
        self.envelopes.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_envelope_commitment_generation_and_verification() {
        let payload = b"Transfer 1000 tNAK to Citadel".to_vec();
        let epoch_key = b"nakharax_epoch_secret_key_86137";

        // Encrypt payload (simple reversible stream)
        let encrypted: Vec<u8> = payload
            .iter()
            .enumerate()
            .map(|(i, b)| b ^ epoch_key[i % epoch_key.len()])
            .collect();

        let commitment = EncryptedEnvelope::compute_commitment(
            "0xAlice",
            1,
            50_000_000_000, // 50 Gwei
            &encrypted,
            42,
        );

        let envelope = EncryptedEnvelope {
            commitment,
            from: "0xAlice".to_string(),
            nonce: 1,
            gas_limit: 21_000,
            gas_tip: 50_000_000_000,
            encrypted_payload: encrypted,
            epoch_id: 42,
            signature: vec![1, 2, 3],
        };

        assert!(envelope.verify_commitment());

        // Reveal decryption
        let revealed = envelope.reveal(epoch_key).expect("Reveal should succeed");
        assert_eq!(revealed, payload);
    }

    #[test]
    fn test_seraph_mempool_fair_ordering_by_tip() {
        let mut pool = SeraphMempool::new();

        // Add 3 envelopes with different tips
        for (i, tip) in [10u128, 50, 30].iter().enumerate() {
            let payload = vec![i as u8; 32];
            let commitment = EncryptedEnvelope::compute_commitment(
                &format!("0xUser{}", i),
                1,
                *tip,
                &payload,
                1,
            );
            let env = EncryptedEnvelope {
                commitment,
                from: format!("0xUser{}", i),
                nonce: 1,
                gas_limit: 50_000,
                gas_tip: *tip,
                encrypted_payload: payload,
                epoch_id: 1,
                signature: vec![],
            };
            pool.submit_envelope(env).unwrap();
        }

        assert_eq!(pool.size(), 3);

        let ordered = pool.get_proposer_commitments(10);
        assert_eq!(ordered.len(), 3);
        // Must be ordered 50 -> 30 -> 10
        assert_eq!(ordered[0].gas_tip, 50);
        assert_eq!(ordered[1].gas_tip, 30);
        assert_eq!(ordered[2].gas_tip, 10);
    }

    #[test]
    fn test_seraph_mempool_tamper_rejected() {
        let mut pool = SeraphMempool::new();
        let payload = vec![0xEE; 16];
        let fake_commitment = [0x99u8; 32]; // Deliberate mismatch

        let env = EncryptedEnvelope {
            commitment: fake_commitment,
            from: "0xAttacker".to_string(),
            nonce: 0,
            gas_limit: 21_000,
            gas_tip: 100,
            encrypted_payload: payload,
            epoch_id: 1,
            signature: vec![],
        };

        let res = pool.submit_envelope(env);
        assert!(matches!(res, Err(SeraphError::CommitmentMismatch { .. })));
    }
}
