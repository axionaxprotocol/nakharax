//! Equivocation Detection and Byzantine Slashing for Nakharax Protocol
//!
//! Tracks block proposals and confirmation votes from validators.
//! If any validator produces two conflicting blocks or two conflicting confirmation
//! votes at the same height, an EquivocationProof is generated for immediate on-chain slashing.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Type of Byzantine equivocation
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EquivocationType {
    /// Validator proposed two distinct blocks at the same height
    DoubleProposal,
    /// Validator cast confirmation votes for two distinct block hashes at the same height
    DoubleVote,
}

impl std::fmt::Display for EquivocationType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EquivocationType::DoubleProposal => write!(f, "DOUBLE_PROPOSAL"),
            EquivocationType::DoubleVote => write!(f, "DOUBLE_VOTE"),
        }
    }
}

/// Cryptographic or algorithmic evidence of validator equivocation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EquivocationProof {
    /// Offending validator address (0x-prefixed hex string)
    pub violator: String,
    /// Block height at which equivocation occurred
    pub block_number: u64,
    /// Type of equivocation
    pub equivocation_type: EquivocationType,
    /// First conflicting hash
    pub hash_a: String,
    /// Second conflicting hash
    pub hash_b: String,
    /// Unix timestamp when evidence was captured
    pub detected_at: u64,
}

impl EquivocationProof {
    /// Validate structural integrity of the equivocation proof
    pub fn is_valid(&self) -> bool {
        if self.hash_a == self.hash_b {
            return false;
        }
        if self.violator.trim().is_empty() {
            return false;
        }
        true
    }
}

/// In-memory tracker for detecting validator double-proposals and double-voting
#[derive(Debug, Default)]
pub struct EquivocationDetector {
    /// (block_number, proposer_address) -> observed block_hash
    proposals: HashMap<(u64, String), String>,
    /// (block_number, validator_address) -> observed block_hash
    votes: HashMap<(u64, String), String>,
    /// Slashed validators set to prevent duplicate slashing alerts
    slashed_validators: HashMap<String, u64>,
}

impl EquivocationDetector {
    pub fn new() -> Self {
        Self::default()
    }

    /// Record a proposed block and return an EquivocationProof if double-proposed
    pub fn record_proposal(
        &mut self,
        block_number: u64,
        proposer: &str,
        block_hash: &str,
    ) -> Option<EquivocationProof> {
        let key = (block_number, proposer.to_lowercase());

        if let Some(existing_hash) = self.proposals.get(&key) {
            if existing_hash != block_hash {
                let proof = EquivocationProof {
                    violator: proposer.to_string(),
                    block_number,
                    equivocation_type: EquivocationType::DoubleProposal,
                    hash_a: existing_hash.clone(),
                    hash_b: block_hash.to_string(),
                    detected_at: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs(),
                };
                self.slashed_validators.insert(proposer.to_lowercase(), block_number);
                return Some(proof);
            }
        } else {
            self.proposals.insert(key, block_hash.to_string());
        }

        None
    }

    /// Record a confirmation vote and return an EquivocationProof if double-voted
    pub fn record_vote(
        &mut self,
        block_number: u64,
        validator: &str,
        block_hash: &str,
    ) -> Option<EquivocationProof> {
        let key = (block_number, validator.to_lowercase());

        if let Some(existing_hash) = self.votes.get(&key) {
            if existing_hash != block_hash {
                let proof = EquivocationProof {
                    violator: validator.to_string(),
                    block_number,
                    equivocation_type: EquivocationType::DoubleVote,
                    hash_a: existing_hash.clone(),
                    hash_b: block_hash.to_string(),
                    detected_at: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs(),
                };
                self.slashed_validators.insert(validator.to_lowercase(), block_number);
                return Some(proof);
            }
        } else {
            self.votes.insert(key, block_hash.to_string());
        }

        None
    }

    /// Check if validator has already been identified as an equivocation violator
    pub fn is_slashed(&self, validator: &str) -> bool {
        self.slashed_validators.contains_key(&validator.to_lowercase())
    }

    /// Prune entries older than retention height to keep memory bounded
    pub fn prune_older_than(&mut self, keep_height: u64) {
        self.proposals.retain(|(num, _), _| *num >= keep_height);
        self.votes.retain(|(num, _), _| *num >= keep_height);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_single_proposal_does_not_trigger_slash() {
        let mut detector = EquivocationDetector::new();
        let res = detector.record_proposal(100, "0xValidator1", "0xHashA");
        assert!(res.is_none());
        assert!(!detector.is_slashed("0xValidator1"));
    }

    #[test]
    fn test_duplicate_same_hash_does_not_trigger_slash() {
        let mut detector = EquivocationDetector::new();
        detector.record_proposal(100, "0xValidator1", "0xHashA");
        let res = detector.record_proposal(100, "0xValidator1", "0xHashA");
        assert!(res.is_none());
    }

    #[test]
    fn test_double_proposal_triggers_slash() {
        let mut detector = EquivocationDetector::new();
        detector.record_proposal(100, "0xValidator1", "0xHashA");
        let proof = detector
            .record_proposal(100, "0xValidator1", "0xHashB")
            .expect("Should produce EquivocationProof");

        assert_eq!(proof.violator, "0xValidator1");
        assert_eq!(proof.block_number, 100);
        assert_eq!(proof.equivocation_type, EquivocationType::DoubleProposal);
        assert_eq!(proof.hash_a, "0xHashA");
        assert_eq!(proof.hash_b, "0xHashB");
        assert!(proof.is_valid());
        assert!(detector.is_slashed("0xValidator1"));
    }

    #[test]
    fn test_double_vote_triggers_slash() {
        let mut detector = EquivocationDetector::new();
        detector.record_vote(500, "0xValidator2", "0xHashA");
        let proof = detector
            .record_vote(500, "0xValidator2", "0xHashC")
            .expect("Should produce EquivocationProof");

        assert_eq!(proof.violator, "0xValidator2");
        assert_eq!(proof.block_number, 500);
        assert_eq!(proof.equivocation_type, EquivocationType::DoubleVote);
        assert_eq!(proof.hash_a, "0xHashA");
        assert_eq!(proof.hash_b, "0xHashC");
        assert!(proof.is_valid());
    }

    #[test]
    fn test_prune_older_than() {
        let mut detector = EquivocationDetector::new();
        detector.record_proposal(50, "0xVal1", "0xHash50");
        detector.record_proposal(150, "0xVal1", "0xHash150");

        detector.prune_older_than(100);

        // Block 50 should be pruned, re-proposing 50 with different hash won't flag (pruned)
        let res = detector.record_proposal(50, "0xVal1", "0xHash50New");
        assert!(res.is_none());

        // Block 150 still retained, conflicting hash will trigger slash
        let res2 = detector.record_proposal(150, "0xVal1", "0xHash150Alt");
        assert!(res2.is_some());
    }
}
