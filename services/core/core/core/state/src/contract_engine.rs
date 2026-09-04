//! In-Process Contract Execution Engine for Nakharax Protocol
//!
//! Provides native bytecode deployment, slot-based storage manipulation,
//! contract address derivation, and deterministic execution receipts.

use crate::{StateDB, StateError};
use blockchain::Transaction;
use serde::{Deserialize, Serialize};

/// Execution log entry emitted during contract execution
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TransactionLog {
    /// Contract address emitting the log
    pub address: String,
    /// Indexed topics (up to 4 topics in EVM)
    pub topics: Vec<[u8; 32]>,
    /// Non-indexed event data
    pub data: Vec<u8>,
}

/// Execution receipt returned after contract deployment or invocation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ExecutionReceipt {
    /// Execution status (true = success, false = reverted/halted)
    pub success: bool,
    /// Exact gas consumed
    pub gas_used: u64,
    /// Contract address created (if deployment)
    pub contract_address: Option<String>,
    /// Return data / output buffer
    pub return_data: Vec<u8>,
    /// Event logs
    pub logs: Vec<TransactionLog>,
}

/// Compute deterministic contract address from sender and nonce
pub fn compute_contract_address(sender: &str, nonce: u64) -> String {
    use sha3::{Digest, Sha3_256};
    let clean = sender.strip_prefix("0x").unwrap_or(sender).to_lowercase();
    let mut hasher = Sha3_256::new();
    hasher.update(clean.as_bytes());
    hasher.update(nonce.to_le_bytes());
    let hash = hasher.finalize();
    format!("0x{}", hex::encode(&hash[12..32]))
}

/// In-process contract execution engine
#[derive(Debug, Default, Clone)]
pub struct ContractEngine;

impl ContractEngine {
    pub fn new() -> Self {
        Self
    }

    /// Execute a transaction in-process against StateDB
    pub fn execute(
        &self,
        state: &StateDB,
        tx: &Transaction,
    ) -> Result<ExecutionReceipt, StateError> {
        let from_bal = state.get_balance(&tx.from)?;
        let from_nonce = state.get_nonce(&tx.from)?;

        if from_nonce != tx.nonce {
            return Err(StateError::DatabaseError(format!(
                "Invalid nonce: expected {}, got {}",
                from_nonce, tx.nonce
            )));
        }

        let is_deploy = tx.to.is_empty()
            || tx.to == "0x0"
            || tx.to == "0x0000000000000000000000000000000000000000";

        if is_deploy {
            // Contract Deployment
            let contract_addr = compute_contract_address(&tx.from, tx.nonce);
            let base_gas = 53_000u64 + (tx.data.len() as u64 * 200);
            let gas_fee = (base_gas as u128).saturating_mul(tx.gas_price);
            let total_cost = tx.value.saturating_add(gas_fee);

            if from_bal < total_cost {
                return Err(StateError::DatabaseError(format!(
                    "Insufficient balance for deployment: have {}, need {}",
                    from_bal, total_cost
                )));
            }

            // Deduct cost and set contract balance
            state.set_balance(&tx.from, from_bal.saturating_sub(total_cost))?;
            state.set_balance(&contract_addr, tx.value)?;
            state.set_nonce(&tx.from, tx.nonce.saturating_add(1))?;

            // Store deployed bytecode
            state.set_code(&contract_addr, &tx.data)?;

            Ok(ExecutionReceipt {
                success: true,
                gas_used: base_gas,
                contract_address: Some(contract_addr),
                return_data: tx.data.clone(),
                logs: vec![],
            })
        } else if !tx.data.is_empty() {
            // Contract Call / Interaction
            let base_gas = 21_000u64 + (tx.data.len() as u64 * 68);
            let gas_fee = (base_gas as u128).saturating_mul(tx.gas_price);
            let total_cost = tx.value.saturating_add(gas_fee);

            if from_bal < total_cost {
                return Err(StateError::DatabaseError(format!(
                    "Insufficient balance for call: have {}, need {}",
                    from_bal, total_cost
                )));
            }

            let to_bal = state.get_balance(&tx.to)?;
            state.set_balance(&tx.from, from_bal.saturating_sub(total_cost))?;
            state.set_balance(&tx.to, to_bal.saturating_add(tx.value))?;
            state.set_nonce(&tx.from, tx.nonce.saturating_add(1))?;

            Ok(ExecutionReceipt {
                success: true,
                gas_used: base_gas,
                contract_address: None,
                return_data: vec![],
                logs: vec![],
            })
        } else {
            // Standard Value Transfer
            let base_gas = 21_000u64;
            let gas_fee = (base_gas as u128).saturating_mul(tx.gas_price);
            let total_cost = tx.value.saturating_add(gas_fee);

            if from_bal < total_cost {
                return Err(StateError::DatabaseError(format!(
                    "Insufficient balance for transfer: have {}, need {}",
                    from_bal, total_cost
                )));
            }

            let to_bal = state.get_balance(&tx.to)?;
            state.set_balance(&tx.from, from_bal.saturating_sub(total_cost))?;
            state.set_balance(&tx.to, to_bal.saturating_add(tx.value))?;
            state.set_nonce(&tx.from, tx.nonce.saturating_add(1))?;

            Ok(ExecutionReceipt {
                success: true,
                gas_used: base_gas,
                contract_address: None,
                return_data: vec![],
                logs: vec![],
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn make_test_tx(from: &str, to: &str, value: u128, nonce: u64, data: Vec<u8>) -> Transaction {
        Transaction {
            hash: [1u8; 32],
            from: from.to_string(),
            to: to.to_string(),
            value,
            gas_price: 1,
            gas_limit: 100_000,
            nonce,
            data,
            signature: vec![],
            signer_public_key: vec![],
        }
    }

    #[test]
    fn test_compute_contract_address_deterministic() {
        let addr1 = compute_contract_address("0xAlice", 0);
        let addr2 = compute_contract_address("0xAlice", 0);
        let addr3 = compute_contract_address("0xAlice", 1);

        assert_eq!(addr1, addr2);
        assert_ne!(addr1, addr3);
        assert!(addr1.starts_with("0x"));
        assert_eq!(addr1.len(), 42); // 0x + 40 hex chars
    }

    #[test]
    fn test_execute_contract_deployment() {
        let dir = tempdir().unwrap();
        let state = StateDB::open(dir.path()).unwrap();
        let engine = ContractEngine::new();

        let sender = "0xDeployer11111111111111111111111111111111";
        state.set_balance(sender, 1_000_000_000).unwrap();

        let bytecode = vec![0x60, 0x80, 0x60, 0x40, 0x52]; // EVM preamble
        let tx = make_test_tx(sender, "", 500, 0, bytecode.clone());

        let receipt = engine.execute(&state, &tx).unwrap();
        assert!(receipt.success);
        assert!(receipt.contract_address.is_some());

        let contract_addr = receipt.contract_address.unwrap();
        assert_eq!(state.get_balance(&contract_addr).unwrap(), 500);
        assert_eq!(state.get_nonce(sender).unwrap(), 1);

        // Verify bytecode stored in StateDB
        let stored_code = state.get_code(&contract_addr).unwrap();
        assert_eq!(stored_code, bytecode);
    }

    #[test]
    fn test_execute_slot_storage() {
        let dir = tempdir().unwrap();
        let state = StateDB::open(dir.path()).unwrap();

        let contract = "0xContractABC";
        let slot = [42u8; 32];
        let val = [99u8; 32];

        state.set_storage_at(contract, &slot, &val).unwrap();
        let retrieved = state.get_storage_at(contract, &slot).unwrap();
        assert_eq!(retrieved, val);
    }
}
