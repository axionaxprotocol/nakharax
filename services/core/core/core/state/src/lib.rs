//! nakharax State Module
//!
//! Persistent storage layer using redb (pure Rust) for:
//! - Blocks and transactions
//! - Chain state and metadata
//! - Account balances and nonces

pub mod contract_engine;
pub mod merkle;

pub use contract_engine::{
    compute_contract_address, ContractEngine, ExecutionReceipt, TransactionLog,
};

use redb::{Database, ReadableTable, TableDefinition};
use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Arc;
use thiserror::Error;
use tracing::{debug, info};

use blockchain::{Block, Transaction};

/// State database errors
#[derive(Error, Debug)]
pub enum StateError {
    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Block not found: {0}")]
    BlockNotFound(String),

    #[error("Transaction not found: {0}")]
    TransactionNotFound(String),

    #[error("Invalid block number: {0}")]
    InvalidBlockNumber(u64),

    #[error("Key not found: {0}")]
    KeyNotFound(String),

    #[error("Duplicate block: {0}")]
    DuplicateBlock(String),

    #[error("Invalid parent hash for block #{0}")]
    InvalidParentHash(u64),

    #[error("Insufficient balance in {address}: have {available}, need {required}")]
    InsufficientBalance {
        address: String,
        available: u128,
        required: u128,
    },

    #[error("Arithmetic overflow while updating account balance")]
    ArithmeticOverflow,

    #[error("State root mismatch for block #{0}")]
    StateRootMismatch(u64),

    #[error("Total supply {actual} is below configured hard cap {hard_cap}")]
    SupplyBelowHardCap { actual: u128, hard_cap: u128 },
}

pub type Result<T> = std::result::Result<T, StateError>;

impl From<redb::Error> for StateError {
    fn from(e: redb::Error) -> Self {
        StateError::DatabaseError(e.to_string())
    }
}
impl From<redb::DatabaseError> for StateError {
    fn from(e: redb::DatabaseError) -> Self {
        StateError::DatabaseError(e.to_string())
    }
}
impl From<redb::TableError> for StateError {
    fn from(e: redb::TableError) -> Self {
        StateError::DatabaseError(e.to_string())
    }
}
impl From<redb::TransactionError> for StateError {
    fn from(e: redb::TransactionError) -> Self {
        StateError::DatabaseError(e.to_string())
    }
}
impl From<redb::StorageError> for StateError {
    fn from(e: redb::StorageError) -> Self {
        StateError::DatabaseError(e.to_string())
    }
}
impl From<redb::CommitError> for StateError {
    fn from(e: redb::CommitError) -> Self {
        StateError::DatabaseError(e.to_string())
    }
}

const BLOCKS: TableDefinition<&str, &[u8]> = TableDefinition::new("blocks");
const BLOCK_HASH_TO_NUMBER: TableDefinition<&[u8], u64> =
    TableDefinition::new("block_hash_to_number");
const TRANSACTIONS: TableDefinition<&[u8], &[u8]> = TableDefinition::new("transactions");
const TX_TO_BLOCK: TableDefinition<&[u8], &[u8]> = TableDefinition::new("tx_to_block");
const CHAIN_STATE: TableDefinition<&str, &[u8]> = TableDefinition::new("chain_state");

/// State database wrapper for redb
pub struct StateDB {
    db: Arc<Database>,
}

/// Result of the one-time fixed-supply migration.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SupplyMigrationResult {
    pub already_applied: bool,
    pub total_before: u128,
    pub total_after: u128,
    pub excess_removed: u128,
}

impl StateDB {
    /// Open or create a new state database.
    /// Accepts either a file path (e.g. `data/state.redb`) or a directory
    /// (e.g. `data/`) — if a directory, appends `state.redb` automatically.
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path = path.as_ref();
        let file_path = if path.extension().is_none() {
            std::fs::create_dir_all(path).ok();
            path.join("state.redb")
        } else {
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent).ok();
            }
            path.to_path_buf()
        };
        info!("Opening state database at {:?}", file_path);

        let db =
            Database::create(&file_path).map_err(|e| StateError::DatabaseError(e.to_string()))?;

        {
            let write_txn = db.begin_write()?;
            let _ = write_txn.open_table(BLOCKS)?;
            let _ = write_txn.open_table(BLOCK_HASH_TO_NUMBER)?;
            let _ = write_txn.open_table(TRANSACTIONS)?;
            let _ = write_txn.open_table(TX_TO_BLOCK)?;
            let _ = write_txn.open_table(CHAIN_STATE)?;
            write_txn.commit()?;
        }

        Ok(Self { db: Arc::new(db) })
    }

    /// Store a block in the database
    pub fn store_block(&self, block: &Block) -> Result<()> {
        debug!("Storing block #{} with hash {:?}", block.number, block.hash);

        let block_data =
            serde_json::to_vec(block).map_err(|e| StateError::SerializationError(e.to_string()))?;

        let number_key = format!("block_{}", block.number);

        let write_txn = self.db.begin_write()?;
        {
            let mut t = write_txn.open_table(BLOCKS)?;
            t.insert(number_key.as_str(), block_data.as_slice())?;
        }
        {
            let mut t = write_txn.open_table(BLOCK_HASH_TO_NUMBER)?;
            t.insert(block.hash.as_slice(), block.number)?;
        }

        let current_height = {
            let t = write_txn.open_table(CHAIN_STATE)?;
            let h = match t.get("chain_height")? {
                Some(v) => {
                    let bytes: &[u8] = v.value();
                    u64::from_be_bytes(bytes.try_into().unwrap_or([0; 8]))
                }
                None => 0,
            };
            h
        };
        if block.number > current_height {
            let mut t = write_txn.open_table(CHAIN_STATE)?;
            t.insert("chain_height", block.number.to_be_bytes().as_slice())?;
        }

        write_txn.commit()?;

        info!("Successfully stored block #{}", block.number);
        Ok(())
    }

    /// Get block by hash
    pub fn get_block_by_hash(&self, hash: &[u8; 32]) -> Result<Block> {
        debug!("Retrieving block with hash: {:?}", hash);

        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(BLOCK_HASH_TO_NUMBER)?;
        let block_number = t
            .get(hash.as_slice())?
            .ok_or_else(|| StateError::BlockNotFound(hex::encode(hash)))?
            .value();

        drop(t);
        drop(read_txn);

        self.get_block_by_number(block_number)
    }

    /// Get block by number
    pub fn get_block_by_number(&self, number: u64) -> Result<Block> {
        debug!("Retrieving block #{}", number);

        let number_key = format!("block_{}", number);
        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(BLOCKS)?;

        let block_data = t
            .get(number_key.as_str())?
            .ok_or_else(|| StateError::BlockNotFound(number.to_string()))?;

        let block: Block = serde_json::from_slice(block_data.value())
            .map_err(|e| StateError::SerializationError(e.to_string()))?;

        Ok(block)
    }

    /// Get the latest block
    pub fn get_latest_block(&self) -> Result<Block> {
        let height = self.get_chain_height()?;
        self.get_block_by_number(height)
    }

    /// Store a transaction
    pub fn store_transaction(&self, tx: &Transaction, block_hash: &[u8; 32]) -> Result<()> {
        debug!("Storing transaction {:?}", tx.hash);

        let tx_data =
            serde_json::to_vec(tx).map_err(|e| StateError::SerializationError(e.to_string()))?;

        let write_txn = self.db.begin_write()?;
        {
            let mut t = write_txn.open_table(TRANSACTIONS)?;
            t.insert(tx.hash.as_slice(), tx_data.as_slice())?;
        }
        {
            let mut t = write_txn.open_table(TX_TO_BLOCK)?;
            t.insert(tx.hash.as_slice(), block_hash.as_slice())?;
        }
        write_txn.commit()?;

        Ok(())
    }

    /// Get transaction by hash
    pub fn get_transaction(&self, tx_hash: &[u8; 32]) -> Result<Transaction> {
        debug!("Retrieving transaction {:?}", tx_hash);

        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(TRANSACTIONS)?;

        let tx_data = t
            .get(tx_hash.as_slice())?
            .ok_or_else(|| StateError::TransactionNotFound(hex::encode(tx_hash)))?;

        let tx: Transaction = serde_json::from_slice(tx_data.value())
            .map_err(|e| StateError::SerializationError(e.to_string()))?;

        Ok(tx)
    }

    /// Get block hash containing a transaction
    pub fn get_transaction_block(&self, tx_hash: &[u8; 32]) -> Result<[u8; 32]> {
        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(TX_TO_BLOCK)?;

        let block_hash_val = t
            .get(tx_hash.as_slice())?
            .ok_or_else(|| StateError::TransactionNotFound(hex::encode(tx_hash)))?;

        let bytes: &[u8] = block_hash_val.value();
        bytes
            .try_into()
            .map_err(|_| StateError::DatabaseError("Invalid block hash format".to_string()))
    }

    /// Get current chain height
    pub fn get_chain_height(&self) -> Result<u64> {
        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(CHAIN_STATE)?;

        match t.get("chain_height")? {
            Some(v) => {
                let bytes: &[u8] = v.value();
                let height =
                    u64::from_be_bytes(bytes.try_into().map_err(|_| {
                        StateError::DatabaseError("Invalid height format".to_string())
                    })?);
                Ok(height)
            }
            None => Ok(0),
        }
    }

    /// Store state root hash
    pub fn store_state_root(&self, block_number: u64, state_root: &str) -> Result<()> {
        let key = format!("state_root_{}", block_number);
        let write_txn = self.db.begin_write()?;
        {
            let mut t = write_txn.open_table(CHAIN_STATE)?;
            t.insert(key.as_str(), state_root.as_bytes())?;
        }
        write_txn.commit()?;
        Ok(())
    }

    /// Get state root hash
    pub fn get_state_root(&self, block_number: u64) -> Result<String> {
        let key = format!("state_root_{}", block_number);
        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(CHAIN_STATE)?;

        let root_val = t.get(key.as_str())?.ok_or(StateError::KeyNotFound(key))?;

        String::from_utf8(root_val.value().to_vec())
            .map_err(|e| StateError::DatabaseError(e.to_string()))
    }

    /// Get all blocks in range
    pub fn get_blocks_range(&self, start: u64, end: u64) -> Result<Vec<Block>> {
        let mut blocks = Vec::new();
        for number in start..=end {
            match self.get_block_by_number(number) {
                Ok(block) => blocks.push(block),
                Err(StateError::BlockNotFound(_)) => break,
                Err(e) => return Err(e),
            }
        }
        Ok(blocks)
    }

    /// Normalize EVM address for storage key (lowercase 0x + 40 hex).
    fn balance_key(address: &str) -> String {
        let a = address.strip_prefix("0x").unwrap_or(address);
        format!("bal_0x{}", a.to_lowercase())
    }
    fn nonce_key(address: &str) -> String {
        let a = address.strip_prefix("0x").unwrap_or(address);
        format!("nonce_0x{}", a.to_lowercase())
    }

    /// Get account balance (0 if never set).
    pub fn get_balance(&self, address: &str) -> Result<u128> {
        let key = Self::balance_key(address);
        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(CHAIN_STATE)?;
        Ok(match t.get(key.as_str())? {
            Some(v) => {
                let bytes: &[u8] = v.value();
                if bytes.len() >= 16 {
                    let mut arr = [0u8; 16];
                    arr.copy_from_slice(&bytes[..16]);
                    u128::from_be_bytes(arr)
                } else {
                    0
                }
            }
            None => 0,
        })
    }

    /// Set account balance.
    pub fn set_balance(&self, address: &str, balance: u128) -> Result<()> {
        let key = Self::balance_key(address);
        let write_txn = self.db.begin_write()?;
        {
            let mut t = write_txn.open_table(CHAIN_STATE)?;
            t.insert(key.as_str(), balance.to_be_bytes().as_slice())?;
        }
        write_txn.commit()?;
        Ok(())
    }

    /// Credit balance to an account (adds to existing balance).
    pub fn credit_balance(&self, address: &str, amount: u128) -> Result<u128> {
        let current = self.get_balance(address)?;
        let new_bal = current
            .checked_add(amount)
            .ok_or(StateError::ArithmeticOverflow)?;
        self.set_balance(address, new_bal)?;
        Ok(new_bal)
    }

    /// Sum every native account balance using checked arithmetic.
    pub fn get_total_supply(&self) -> Result<u128> {
        self.get_all_accounts()?
            .into_iter()
            .try_fold(0u128, |total, (_, balance, _)| {
                total
                    .checked_add(balance)
                    .ok_or(StateError::ArithmeticOverflow)
            })
    }

    /// Get account nonce (0 if never set).
    pub fn get_nonce(&self, address: &str) -> Result<u64> {
        let key = Self::nonce_key(address);
        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(CHAIN_STATE)?;
        Ok(match t.get(key.as_str())? {
            Some(v) => {
                let bytes: &[u8] = v.value();
                if bytes.len() >= 8 {
                    let mut arr = [0u8; 8];
                    arr.copy_from_slice(&bytes[..8]);
                    u64::from_be_bytes(arr)
                } else {
                    0
                }
            }
            None => 0,
        })
    }

    /// Set account nonce.
    pub fn set_nonce(&self, address: &str, nonce: u64) -> Result<()> {
        let key = Self::nonce_key(address);
        let write_txn = self.db.begin_write()?;
        {
            let mut t = write_txn.open_table(CHAIN_STATE)?;
            t.insert(key.as_str(), nonce.to_be_bytes().as_slice())?;
        }
        write_txn.commit()?;
        Ok(())
    }

    fn code_key(address: &str) -> String {
        let a = address.strip_prefix("0x").unwrap_or(address);
        format!("code_0x{}", a.to_lowercase())
    }

    fn storage_key(address: &str, slot: &[u8; 32]) -> String {
        let a = address.strip_prefix("0x").unwrap_or(address);
        format!("slot_0x{}_{}", a.to_lowercase(), hex::encode(slot))
    }

    /// Get contract bytecode
    pub fn get_code(&self, address: &str) -> Result<Vec<u8>> {
        let key = Self::code_key(address);
        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(CHAIN_STATE)?;
        Ok(match t.get(key.as_str())? {
            Some(v) => v.value().to_vec(),
            None => Vec::new(),
        })
    }

    /// Set contract bytecode
    pub fn set_code(&self, address: &str, code: &[u8]) -> Result<()> {
        let key = Self::code_key(address);
        let write_txn = self.db.begin_write()?;
        {
            let mut t = write_txn.open_table(CHAIN_STATE)?;
            t.insert(key.as_str(), code)?;
        }
        write_txn.commit()?;
        Ok(())
    }

    /// Get contract storage slot (32-byte value)
    pub fn get_storage_at(&self, address: &str, slot: &[u8; 32]) -> Result<[u8; 32]> {
        let key = Self::storage_key(address, slot);
        let read_txn = self.db.begin_read()?;
        let t = read_txn.open_table(CHAIN_STATE)?;
        Ok(match t.get(key.as_str())? {
            Some(v) => {
                let bytes: &[u8] = v.value();
                if bytes.len() >= 32 {
                    let mut arr = [0u8; 32];
                    arr.copy_from_slice(&bytes[..32]);
                    arr
                } else {
                    [0u8; 32]
                }
            }
            None => [0u8; 32],
        })
    }

    /// Set contract storage slot (32-byte value)
    pub fn set_storage_at(&self, address: &str, slot: &[u8; 32], value: &[u8; 32]) -> Result<()> {
        let key = Self::storage_key(address, slot);
        let write_txn = self.db.begin_write()?;
        {
            let mut t = write_txn.open_table(CHAIN_STATE)?;
            t.insert(key.as_str(), value.as_slice())?;
        }
        write_txn.commit()?;
        Ok(())
    }

    /// Seed genesis balances (call once when chain height is 0).
    pub fn seed_genesis_balances(&self, balances: &BTreeMap<String, u128>) -> Result<()> {
        let write_txn = self.db.begin_write()?;
        {
            let mut t = write_txn.open_table(CHAIN_STATE)?;
            for (addr, balance) in balances {
                let key = Self::balance_key(addr);
                t.insert(key.as_str(), balance.to_be_bytes().as_slice())?;
            }
        }
        write_txn.commit()?;
        info!("Seeded {} genesis balances", balances.len());
        Ok(())
    }

    /// Apply a transfer transaction: deduct from sender, add to recipient, increment sender nonce.
    /// Returns error if insufficient balance or nonce mismatch.
    pub fn apply_transaction(&self, tx: &Transaction) -> Result<()> {
        let from_key = Self::balance_key(&tx.from);
        let to_key = Self::balance_key(&tx.to);
        let nonce_key = Self::nonce_key(&tx.from);
        let write_txn = self.db.begin_write()?;
        let mut state = write_txn.open_table(CHAIN_STATE)?;

        let read_u128 = |bytes: &[u8]| -> u128 {
            if bytes.len() < 16 {
                return 0;
            }
            let mut arr = [0u8; 16];
            arr.copy_from_slice(&bytes[..16]);
            u128::from_be_bytes(arr)
        };
        let read_u64 = |bytes: &[u8]| -> u64 {
            if bytes.len() < 8 {
                return 0;
            }
            let mut arr = [0u8; 8];
            arr.copy_from_slice(&bytes[..8]);
            u64::from_be_bytes(arr)
        };

        let from_bal = state
            .get(from_key.as_str())?
            .map(|v| read_u128(v.value()))
            .unwrap_or(0);
        let to_bal = state
            .get(to_key.as_str())?
            .map(|v| read_u128(v.value()))
            .unwrap_or(0);
        let from_nonce = state
            .get(nonce_key.as_str())?
            .map(|v| read_u64(v.value()))
            .unwrap_or(0);

        if from_nonce != tx.nonce {
            return Err(StateError::DatabaseError(format!(
                "Invalid nonce: expected {}, got {}",
                from_nonce, tx.nonce
            )));
        }
        let cost = tx.value; // simplified: no gas deduction for now
        if from_bal < cost {
            return Err(StateError::DatabaseError(format!(
                "Insufficient balance: have {}, need {}",
                from_bal, cost
            )));
        }

        let next_nonce = tx
            .nonce
            .checked_add(1)
            .ok_or(StateError::ArithmeticOverflow)?;

        if from_key != to_key {
            let recipient_balance = to_bal
                .checked_add(cost)
                .ok_or(StateError::ArithmeticOverflow)?;
            state.insert(
                from_key.as_str(),
                from_bal.checked_sub(cost).unwrap().to_be_bytes().as_slice(),
            )?;
            state.insert(to_key.as_str(), recipient_balance.to_be_bytes().as_slice())?;
        }
        state.insert(nonce_key.as_str(), next_nonce.to_be_bytes().as_slice())?;
        drop(state);
        write_txn.commit()?;
        Ok(())
    }

    /// Atomically commit the next canonical block and transfer its protocol reward.
    ///
    /// The reward is paid from `reward_pool` and therefore never changes total
    /// supply. Passing `verify_state_root=true` validates a peer-provided root;
    /// local producers pass false and receive the computed root in the returned block.
    pub fn commit_block_with_reward(
        &self,
        mut block: Block,
        reward_pool: &str,
        requested_reward: u128,
        verify_state_root: bool,
    ) -> Result<(Block, u128)> {
        if block.number == 0 {
            return Err(StateError::InvalidBlockNumber(0));
        }
        if block.proposer.is_empty() || block.proposer == "unknown" {
            return Err(StateError::DatabaseError(
                "block proposer is required for reward transfer".to_string(),
            ));
        }

        let block_key = format!("block_{}", block.number);
        let reward_key = format!("reward_{}", hex::encode(block.hash));
        let pool_key = Self::balance_key(reward_pool);
        let proposer_key = Self::balance_key(&block.proposer);
        let write_txn = self.db.begin_write()?;

        {
            let hashes = write_txn.open_table(BLOCK_HASH_TO_NUMBER)?;
            if hashes.get(block.hash.as_slice())?.is_some() {
                return Err(StateError::DuplicateBlock(hex::encode(block.hash)));
            }
        }

        let current_height = {
            let state = write_txn.open_table(CHAIN_STATE)?;
            let height = state
                .get("chain_height")?
                .map(|v| {
                    let bytes: &[u8] = v.value();
                    u64::from_be_bytes(bytes.try_into().unwrap_or([0; 8]))
                })
                .unwrap_or(0);
            height
        };
        let expected_number = current_height
            .checked_add(1)
            .ok_or(StateError::ArithmeticOverflow)?;
        if block.number != expected_number {
            return Err(StateError::InvalidBlockNumber(block.number));
        }

        let expected_parent = {
            let blocks = write_txn.open_table(BLOCKS)?;
            let parent_key = format!("block_{}", current_height);
            let encoded = blocks
                .get(parent_key.as_str())?
                .ok_or_else(|| StateError::BlockNotFound(current_height.to_string()))?;
            let parent: Block = serde_json::from_slice(encoded.value())
                .map_err(|e| StateError::SerializationError(e.to_string()))?;
            parent.hash
        };
        if block.parent_hash != expected_parent {
            return Err(StateError::InvalidParentHash(block.number));
        }

        let reward_paid;
        let computed_root;
        {
            let mut state = write_txn.open_table(CHAIN_STATE)?;
            if state.get(reward_key.as_str())?.is_some() {
                return Err(StateError::DuplicateBlock(hex::encode(block.hash)));
            }

            let decode_u128 = |bytes: &[u8]| -> u128 {
                if bytes.len() < 16 {
                    return 0;
                }
                let mut arr = [0u8; 16];
                arr.copy_from_slice(&bytes[..16]);
                u128::from_be_bytes(arr)
            };
            let pool_balance = state
                .get(pool_key.as_str())?
                .map(|v| decode_u128(v.value()))
                .unwrap_or(0);
            let proposer_balance = state
                .get(proposer_key.as_str())?
                .map(|v| decode_u128(v.value()))
                .unwrap_or(0);

            reward_paid = requested_reward.min(pool_balance);
            if pool_key == proposer_key {
                return Err(StateError::DatabaseError(
                    "reward pool cannot also be the block proposer".to_string(),
                ));
            }
            let next_pool = pool_balance
                .checked_sub(reward_paid)
                .ok_or(StateError::ArithmeticOverflow)?;
            let next_proposer = proposer_balance
                .checked_add(reward_paid)
                .ok_or(StateError::ArithmeticOverflow)?;
            state.insert(pool_key.as_str(), next_pool.to_be_bytes().as_slice())?;
            state.insert(
                proposer_key.as_str(),
                next_proposer.to_be_bytes().as_slice(),
            )?;

            let mut balances = BTreeMap::<String, u128>::new();
            let mut nonces = BTreeMap::<String, u64>::new();
            for entry in state.iter()? {
                let (key_guard, value_guard) = entry?;
                let key = key_guard.value();
                let value = value_guard.value();
                if let Some(address) = key.strip_prefix("bal_0x") {
                    balances.insert(format!("0x{}", address), decode_u128(value));
                } else if let Some(address) = key.strip_prefix("nonce_0x") {
                    let nonce = if value.len() >= 8 {
                        let mut arr = [0u8; 8];
                        arr.copy_from_slice(&value[..8]);
                        u64::from_be_bytes(arr)
                    } else {
                        0
                    };
                    nonces.insert(format!("0x{}", address), nonce);
                }
            }
            let leaves = balances
                .into_iter()
                .map(|(address, balance)| {
                    let nonce = nonces.get(&address).copied().unwrap_or(0);
                    merkle::account_leaf(&address, balance, nonce)
                })
                .collect();
            computed_root = merkle::merkle_root(leaves);

            if verify_state_root && block.state_root != computed_root {
                return Err(StateError::StateRootMismatch(block.number));
            }
            block.state_root = computed_root;
            state.insert(reward_key.as_str(), reward_paid.to_be_bytes().as_slice())?;
            state.insert("chain_height", block.number.to_be_bytes().as_slice())?;
        }

        let block_data = serde_json::to_vec(&block)
            .map_err(|e| StateError::SerializationError(e.to_string()))?;
        {
            let mut blocks = write_txn.open_table(BLOCKS)?;
            blocks.insert(block_key.as_str(), block_data.as_slice())?;
        }
        {
            let mut hashes = write_txn.open_table(BLOCK_HASH_TO_NUMBER)?;
            hashes.insert(block.hash.as_slice(), block.number)?;
        }
        write_txn.commit()?;

        info!(
            "Committed block #{} with zero-sum reward {} from {} to {}",
            block.number, reward_paid, reward_pool, block.proposer
        );
        Ok((block, reward_paid))
    }

    /// Remove legacy inflation from the reward pool exactly once.
    pub fn migrate_supply_to_hard_cap(
        &self,
        reward_pool: &str,
        hard_cap: u128,
        migration_id: &str,
    ) -> Result<SupplyMigrationResult> {
        let marker_key = format!("migration_{}", migration_id);
        let pool_key = Self::balance_key(reward_pool);
        let write_txn = self.db.begin_write()?;
        let mut state = write_txn.open_table(CHAIN_STATE)?;

        let decode_u128 = |bytes: &[u8]| -> u128 {
            if bytes.len() < 16 {
                return 0;
            }
            let mut arr = [0u8; 16];
            arr.copy_from_slice(&bytes[..16]);
            u128::from_be_bytes(arr)
        };
        let mut total_before = 0u128;
        for entry in state.iter()? {
            let (key, value) = entry?;
            if key.value().starts_with("bal_0x") {
                total_before = total_before
                    .checked_add(decode_u128(value.value()))
                    .ok_or(StateError::ArithmeticOverflow)?;
            }
        }

        if state.get(marker_key.as_str())?.is_some() {
            return Ok(SupplyMigrationResult {
                already_applied: true,
                total_before,
                total_after: total_before,
                excess_removed: 0,
            });
        }
        if total_before < hard_cap {
            return Err(StateError::SupplyBelowHardCap {
                actual: total_before,
                hard_cap,
            });
        }

        let excess = total_before - hard_cap;
        let pool_balance = state
            .get(pool_key.as_str())?
            .map(|v| decode_u128(v.value()))
            .unwrap_or(0);
        if pool_balance < excess {
            return Err(StateError::InsufficientBalance {
                address: reward_pool.to_string(),
                available: pool_balance,
                required: excess,
            });
        }
        let next_pool = pool_balance - excess;
        state.insert(pool_key.as_str(), next_pool.to_be_bytes().as_slice())?;
        let marker = format!(
            "total_before={};hard_cap={};excess_removed={}",
            total_before, hard_cap, excess
        );
        state.insert(marker_key.as_str(), marker.as_bytes())?;
        drop(state);
        write_txn.commit()?;

        Ok(SupplyMigrationResult {
            already_applied: false,
            total_before,
            total_after: hard_cap,
            excess_removed: excess,
        })
    }

    /// Iterate all accounts stored in the state database.
    ///
    /// Returns a **sorted** (by address, ascending) list of `(address, balance, nonce)` tuples.
    /// Only entries with a `bal_0x` prefix are considered — system keys are skipped.
    pub fn get_all_accounts(&self) -> Result<Vec<(String, u128, u64)>> {
        // Phase 1: collect all balance entries inside one read transaction.
        let address_balances: Vec<(String, u128)> = {
            let read_txn = self.db.begin_read()?;
            let t = read_txn.open_table(CHAIN_STATE)?;
            let mut result = Vec::new();
            for entry in t.iter()? {
                let (key_guard, val_guard) = entry?;
                let key: &str = key_guard.value();
                if let Some(addr_lower) = key.strip_prefix("bal_0x") {
                    let address = format!("0x{}", addr_lower);
                    let bytes: &[u8] = val_guard.value();
                    let balance = if bytes.len() >= 16 {
                        let mut arr = [0u8; 16];
                        arr.copy_from_slice(&bytes[..16]);
                        u128::from_be_bytes(arr)
                    } else {
                        0
                    };
                    result.push((address, balance));
                }
            }
            result
        };

        // Phase 2: fetch nonces in separate transactions (read txn above already dropped).
        let mut accounts = Vec::with_capacity(address_balances.len());
        for (address, balance) in address_balances {
            let nonce = self.get_nonce(&address)?;
            accounts.push((address, balance, nonce));
        }

        accounts.sort_by(|a, b| a.0.cmp(&b.0));
        Ok(accounts)
    }

    /// Compute the Merkle state root over all account balances and nonces.
    ///
    /// Each account produces one leaf: `blake2s_256(address || balance_be || nonce_be)`.
    /// Leaves are sorted by address before building the binary Merkle tree.
    ///
    /// Returns `[0u8; 32]` when the state is empty (genesis or no accounts yet).
    pub fn compute_state_root(&self) -> Result<[u8; 32]> {
        let accounts = self.get_all_accounts()?;
        let leaves: Vec<[u8; 32]> = accounts
            .iter()
            .map(|(addr, balance, nonce)| merkle::account_leaf(addr, *balance, *nonce))
            .collect();
        Ok(merkle::merkle_root(leaves))
    }

    /// Close the database
    pub fn close(self) {
        info!("Closing state database");
        drop(self.db);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_block(number: u64) -> Block {
        let hash_val = number as u8;
        let mut hash = [0u8; 32];
        hash[31] = hash_val;

        let mut parent_hash = [0u8; 32];
        if number > 0 {
            parent_hash[31] = (number - 1) as u8;
        }

        let mut state_root = [0u8; 32];
        state_root[31] = hash_val;

        Block {
            number,
            hash,
            parent_hash,
            timestamp: 1234567890 + number,
            proposer: "0xvalidator".to_string(),
            transactions: vec![],
            state_root,
            gas_used: 0,
            gas_limit: 10_000_000,
        }
    }

    fn create_test_tx(id: u8) -> Transaction {
        let mut hash = [0u8; 32];
        hash[31] = id;

        Transaction {
            hash,
            from: "0xfrom000000000000000000000000000000000000".to_string(),
            to: "0xto00000000000000000000000000000000000000".to_string(),
            value: 1000,
            gas_price: 20,
            gas_limit: 21000,
            nonce: 1,
            data: vec![],
            signature: vec![],
            signer_public_key: vec![],
        }
    }

    #[test]
    fn test_state_db_open() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();
        assert_eq!(db.get_chain_height().unwrap(), 0);
    }

    #[test]
    fn test_store_and_get_block() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        let block = create_test_block(1);
        let block_hash = block.hash;

        db.store_block(&block).unwrap();

        let retrieved = db.get_block_by_number(1).unwrap();
        assert_eq!(retrieved.hash, block_hash);
        assert_eq!(retrieved.number, block.number);

        let retrieved = db.get_block_by_hash(&block_hash).unwrap();
        assert_eq!(retrieved.number, block.number);

        assert_eq!(db.get_chain_height().unwrap(), 1);
    }

    #[test]
    fn test_store_multiple_blocks() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        for i in 1..=5 {
            let block = create_test_block(i);
            db.store_block(&block).unwrap();
        }

        assert_eq!(db.get_chain_height().unwrap(), 5);

        let latest = db.get_latest_block().unwrap();
        assert_eq!(latest.number, 5);

        let blocks = db.get_blocks_range(2, 4).unwrap();
        assert_eq!(blocks.len(), 3);
        assert_eq!(blocks[0].number, 2);
        assert_eq!(blocks[2].number, 4);
    }

    #[test]
    fn test_store_and_get_transaction() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        let tx = create_test_tx(1);
        let tx_hash = tx.hash;

        let mut block_hash = [0u8; 32];
        block_hash[31] = 10;

        db.store_transaction(&tx, &block_hash).unwrap();

        let retrieved = db.get_transaction(&tx_hash).unwrap();
        assert_eq!(retrieved.hash, tx_hash);
        assert_eq!(retrieved.from, tx.from);

        let retrieved_block_hash = db.get_transaction_block(&tx_hash).unwrap();
        assert_eq!(retrieved_block_hash, block_hash);
    }

    #[test]
    fn test_state_root() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        let block_number = 10;
        let state_root = "0xabcdef1234567890";

        db.store_state_root(block_number, state_root).unwrap();

        let retrieved = db.get_state_root(block_number).unwrap();
        assert_eq!(retrieved, state_root);
    }

    #[test]
    fn test_block_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        let result = db.get_block_by_number(999);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), StateError::BlockNotFound(_)));
    }

    #[test]
    fn test_transaction_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        let mut nonexistent_hash = [0u8; 32];
        nonexistent_hash[0] = 0xff;

        let result = db.get_transaction(&nonexistent_hash);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            StateError::TransactionNotFound(_)
        ));
    }

    #[test]
    fn test_get_all_accounts_empty() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();
        let accounts = db.get_all_accounts().unwrap();
        assert!(accounts.is_empty());
    }

    #[test]
    fn test_get_all_accounts_returns_sorted() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        db.set_balance("0xcccccccccccccccccccccccccccccccccccccccc", 300)
            .unwrap();
        db.set_balance("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 100)
            .unwrap();
        db.set_balance("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", 200)
            .unwrap();

        let accounts = db.get_all_accounts().unwrap();
        assert_eq!(accounts.len(), 3);
        assert!(accounts[0].0 <= accounts[1].0);
        assert!(accounts[1].0 <= accounts[2].0);
    }

    #[test]
    fn test_get_all_accounts_balance_and_nonce() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        let addr = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        db.set_balance(addr, 999_000_000_000_000_000_000).unwrap();
        db.set_nonce(addr, 42).unwrap();

        let accounts = db.get_all_accounts().unwrap();
        assert_eq!(accounts.len(), 1);
        assert_eq!(accounts[0].0, addr);
        assert_eq!(accounts[0].1, 999_000_000_000_000_000_000);
        assert_eq!(accounts[0].2, 42);
    }

    #[test]
    fn test_compute_state_root_empty_is_zero() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();
        let root = db.compute_state_root().unwrap();
        assert_eq!(root, [0u8; 32]);
    }

    #[test]
    fn test_compute_state_root_deterministic() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        db.set_balance("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 1_000_000)
            .unwrap();
        db.set_balance("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", 2_000_000)
            .unwrap();

        let root1 = db.compute_state_root().unwrap();
        let root2 = db.compute_state_root().unwrap();
        assert_eq!(root1, root2);
        assert_ne!(root1, [0u8; 32]);
    }

    #[test]
    fn test_compute_state_root_changes_on_balance_update() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        db.set_balance("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 1_000_000)
            .unwrap();
        let root_before = db.compute_state_root().unwrap();

        db.set_balance("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 2_000_000)
            .unwrap();
        let root_after = db.compute_state_root().unwrap();

        assert_ne!(root_before, root_after);
    }

    #[test]
    fn test_compute_state_root_order_independent_via_sort() {
        let temp_dir1 = TempDir::new().unwrap();
        let db1 = StateDB::open(temp_dir1.path().join("state.redb")).unwrap();
        db1.set_balance("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 100)
            .unwrap();
        db1.set_balance("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", 200)
            .unwrap();

        let temp_dir2 = TempDir::new().unwrap();
        let db2 = StateDB::open(temp_dir2.path().join("state.redb")).unwrap();
        db2.set_balance("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", 200)
            .unwrap();
        db2.set_balance("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 100)
            .unwrap();

        assert_eq!(
            db1.compute_state_root().unwrap(),
            db2.compute_state_root().unwrap()
        );
    }

    #[test]
    fn test_credit_balance() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();

        let addr = "0x1234567890123456789012345678901234567890";
        assert_eq!(db.get_balance(addr).unwrap(), 0);

        let bal1 = db.credit_balance(addr, 2_000_000_000_000_000_000).unwrap();
        assert_eq!(bal1, 2_000_000_000_000_000_000);
        assert_eq!(db.get_balance(addr).unwrap(), 2_000_000_000_000_000_000);

        let bal2 = db.credit_balance(addr, 1_000_000_000_000_000_000).unwrap();
        assert_eq!(bal2, 3_000_000_000_000_000_000);
        assert_eq!(db.get_balance(addr).unwrap(), 3_000_000_000_000_000_000);
    }

    #[test]
    fn test_block_reward_is_atomic_zero_sum_and_idempotent() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();
        let pool = "0x0000000000000000000000000000000000000001";
        let proposer = "0x0000000000000000000000000000000000000002";
        db.store_block(&create_test_block(0)).unwrap();
        db.set_balance(pool, 100).unwrap();
        db.set_balance(proposer, 10).unwrap();

        let mut block = create_test_block(1);
        block.proposer = proposer.to_string();
        let (stored, paid) = db
            .commit_block_with_reward(block.clone(), pool, 2, false)
            .unwrap();

        assert_eq!(paid, 2);
        assert_eq!(db.get_balance(pool).unwrap(), 98);
        assert_eq!(db.get_balance(proposer).unwrap(), 12);
        assert_eq!(db.get_total_supply().unwrap(), 110);
        assert_eq!(db.get_latest_block().unwrap().state_root, stored.state_root);
        assert_ne!(stored.state_root, [0u8; 32]);

        let duplicate = db.commit_block_with_reward(block, pool, 2, false);
        assert!(matches!(duplicate, Err(StateError::DuplicateBlock(_))));
        assert_eq!(db.get_balance(pool).unwrap(), 98);
        assert_eq!(db.get_balance(proposer).unwrap(), 12);
    }

    #[test]
    fn test_block_reward_drains_pool_without_minting() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();
        let pool = "0x0000000000000000000000000000000000000001";
        let proposer = "0x0000000000000000000000000000000000000002";
        db.store_block(&create_test_block(0)).unwrap();
        db.set_balance(pool, 1).unwrap();
        db.set_balance(proposer, 10).unwrap();
        let mut block = create_test_block(1);
        block.proposer = proposer.to_string();

        let (_, paid) = db.commit_block_with_reward(block, pool, 2, false).unwrap();
        assert_eq!(paid, 1);
        assert_eq!(db.get_balance(pool).unwrap(), 0);
        assert_eq!(db.get_balance(proposer).unwrap(), 11);
        assert_eq!(db.get_total_supply().unwrap(), 11);
    }

    #[test]
    fn test_peer_state_root_mismatch_rolls_back_reward_and_block() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();
        let pool = "0x0000000000000000000000000000000000000001";
        let proposer = "0x0000000000000000000000000000000000000002";
        db.store_block(&create_test_block(0)).unwrap();
        db.set_balance(pool, 100).unwrap();
        db.set_balance(proposer, 10).unwrap();
        let mut block = create_test_block(1);
        block.proposer = proposer.to_string();
        block.state_root = [0xff; 32];

        let result = db.commit_block_with_reward(block, pool, 2, true);
        assert!(matches!(result, Err(StateError::StateRootMismatch(1))));
        assert_eq!(db.get_chain_height().unwrap(), 0);
        assert_eq!(db.get_balance(pool).unwrap(), 100);
        assert_eq!(db.get_balance(proposer).unwrap(), 10);
    }

    #[test]
    fn test_self_transfer_preserves_supply_and_balance() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();
        let address = "0x0000000000000000000000000000000000000001";
        db.set_balance(address, 1_000).unwrap();
        let tx = Transaction {
            hash: [9u8; 32],
            from: address.to_string(),
            to: address.to_string(),
            value: 100,
            gas_price: 0,
            gas_limit: 21_000,
            nonce: 0,
            data: vec![],
            signature: vec![],
            signer_public_key: vec![],
        };

        db.apply_transaction(&tx).unwrap();
        assert_eq!(db.get_balance(address).unwrap(), 1_000);
        assert_eq!(db.get_nonce(address).unwrap(), 1);
        assert_eq!(db.get_total_supply().unwrap(), 1_000);
    }

    #[test]
    fn test_supply_migration_removes_excess_once() {
        let temp_dir = TempDir::new().unwrap();
        let db = StateDB::open(temp_dir.path().join("state.redb")).unwrap();
        let pool = "0x0000000000000000000000000000000000000001";
        let holder = "0x0000000000000000000000000000000000000002";
        db.set_balance(pool, 100).unwrap();
        db.set_balance(holder, 1_000).unwrap();

        let first = db
            .migrate_supply_to_hard_cap(pool, 1_000, "fixed_supply_v2")
            .unwrap();
        assert!(!first.already_applied);
        assert_eq!(first.excess_removed, 100);
        assert_eq!(db.get_balance(pool).unwrap(), 0);
        assert_eq!(db.get_total_supply().unwrap(), 1_000);

        let second = db
            .migrate_supply_to_hard_cap(pool, 1_000, "fixed_supply_v2")
            .unwrap();
        assert!(second.already_applied);
        assert_eq!(second.excess_removed, 0);
        assert_eq!(db.get_total_supply().unwrap(), 1_000);
    }
}
