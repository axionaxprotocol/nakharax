//! Staking RPC Endpoints
//!
//! JSON-RPC methods for staking operations

use crate::auth::SignedRequest;
use jsonrpsee::{
    core::{async_trait, RpcResult},
    proc_macros::rpc,
    types::ErrorObjectOwned,
};
use serde::{Deserialize, Serialize};
use staking::{Staking, StakingConfig, ValidatorInfo};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

/// Staking RPC Error
#[derive(Debug, thiserror::Error)]
pub enum StakingRpcError {
    #[error("Staking error: {0}")]
    StakingError(String),

    #[error("Invalid parameters: {0}")]
    InvalidParams(String),

    #[error("Authentication failed: {0}")]
    AuthError(String),
}

impl From<StakingRpcError> for ErrorObjectOwned {
    fn from(error: StakingRpcError) -> Self {
        match error {
            StakingRpcError::StakingError(msg) => ErrorObjectOwned::owned(-32000, msg, None::<()>),
            StakingRpcError::InvalidParams(msg) => ErrorObjectOwned::owned(-32602, msg, None::<()>),
            StakingRpcError::AuthError(msg) => ErrorObjectOwned::owned(-32003, msg, None::<()>),
        }
    }
}

/// Validator response format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorResponse {
    pub address: String,
    pub stake: String,
    pub delegated: String,
    pub voting_power: String,
    pub is_active: bool,
    pub commission_bps: u16,
    pub total_rewards: String,
    pub unclaimed_rewards: String,
}

impl From<ValidatorInfo> for ValidatorResponse {
    fn from(v: ValidatorInfo) -> Self {
        let voting_power = format!("0x{:x}", v.voting_power());
        Self {
            address: v.address,
            stake: format!("0x{:x}", v.stake),
            delegated: format!("0x{:x}", v.delegated),
            voting_power,
            is_active: v.is_active,
            commission_bps: v.commission_bps,
            total_rewards: format!("0x{:x}", v.total_rewards),
            unclaimed_rewards: format!("0x{:x}", v.unclaimed_rewards),
        }
    }
}

/// Staking stats response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingStatsResponse {
    pub total_staked: String,
    pub total_validators: u64,
    pub active_validators: u64,
    pub min_stake: String,
}

/// Staking JSON-RPC API
#[rpc(server)]
pub trait StakingRpc {
    /// Get validator info by address
    #[method(name = "staking_getValidator")]
    async fn get_validator(&self, address: String) -> RpcResult<Option<ValidatorResponse>>;

    /// Get all active validators
    #[method(name = "staking_getActiveValidators")]
    async fn get_active_validators(&self) -> RpcResult<Vec<ValidatorResponse>>;

    /// Get total staked amount
    #[method(name = "staking_getTotalStaked")]
    async fn get_total_staked(&self) -> RpcResult<String>;

    /// Get staking statistics
    #[method(name = "staking_getStats")]
    async fn get_stats(&self) -> RpcResult<StakingStatsResponse>;

    /// Stake tokens. Requires `signature` and `public_key` for authentication.
    /// The server derives the caller address from the public key and verifies the signature.
    #[method(name = "staking_stake")]
    async fn stake(&self, signed_tx: String) -> RpcResult<bool>;

    /// Initiate unstaking. Requires signature authentication.
    #[method(name = "staking_unstake")]
    async fn unstake(&self, signed_tx: String) -> RpcResult<bool>;

    /// Delegate to validator. Requires signature authentication.
    #[method(name = "staking_delegate")]
    async fn delegate(&self, signed_tx: String) -> RpcResult<bool>;

    /// Claim staking rewards. Requires signature authentication.
    #[method(name = "staking_claimRewards")]
    async fn claim_rewards(&self, signed_tx: String) -> RpcResult<String>;
}

#[derive(Deserialize)]
struct StakeParams {
    amount: String,
}

#[derive(Deserialize)]
struct UnstakeParams {
    amount: String,
}

#[derive(Deserialize)]
struct DelegateParams {
    validator: String,
    amount: String,
}

#[derive(Deserialize)]
struct ClaimRewardsParams {
}
pub struct StakingRpcServerImpl {
    staking: Arc<RwLock<Staking>>,
    config: StakingConfig,
}

impl StakingRpcServerImpl {
    pub fn new(staking: Arc<RwLock<Staking>>, config: StakingConfig) -> Self {
        Self { staking, config }
    }
}

#[async_trait]
impl StakingRpcServer for StakingRpcServerImpl {
    async fn get_validator(&self, address: String) -> RpcResult<Option<ValidatorResponse>> {
        let staking = self.staking.read().await;
        let validator = staking.get_validator(&address).await;
        Ok(validator.map(ValidatorResponse::from))
    }

    async fn get_active_validators(&self) -> RpcResult<Vec<ValidatorResponse>> {
        let staking = self.staking.read().await;
        let validators = staking.get_active_validators().await;
        Ok(validators
            .into_iter()
            .map(ValidatorResponse::from)
            .collect())
    }

    async fn get_total_staked(&self) -> RpcResult<String> {
        let staking = self.staking.read().await;
        let total = staking.get_total_staked().await;
        Ok(format!("0x{:x}", total))
    }

    async fn get_stats(&self) -> RpcResult<StakingStatsResponse> {
        let staking = self.staking.read().await;
        let total_staked = staking.get_total_staked().await;
        let validators = staking.get_active_validators().await;

        Ok(StakingStatsResponse {
            total_staked: format!("0x{:x}", total_staked),
            total_validators: validators.len() as u64,
            active_validators: validators.iter().filter(|v| v.is_active).count() as u64,
            min_stake: format!("0x{:x}", self.config.min_validator_stake),
        })
    }

    async fn stake(&self, signed_tx: String) -> RpcResult<bool> {
        let req: SignedRequest = serde_json::from_str(&signed_tx)
            .map_err(|e| StakingRpcError::InvalidParams(format!("Invalid signed tx: {}", e)))?;
            
        let verified_addr = req.verify_and_recover_address()
            .map_err(|e| StakingRpcError::AuthError(e.to_string()))?;
            
        let params: StakeParams = serde_json::from_slice(&req.message)
            .map_err(|e| StakingRpcError::InvalidParams(format!("Invalid payload: {}", e)))?;

        let amount = parse_hex_u128(&params.amount).map_err(StakingRpcError::InvalidParams)?;

        let staking = self.staking.read().await;
        staking
            .stake(verified_addr.clone(), amount)
            .await
            .map_err(|e| StakingRpcError::StakingError(e.to_string()))?;

        info!("RPC: Staked {} for {}", amount, verified_addr);
        Ok(true)
    }

    async fn unstake(&self, signed_tx: String) -> RpcResult<bool> {
        let req: SignedRequest = serde_json::from_str(&signed_tx)
            .map_err(|e| StakingRpcError::InvalidParams(format!("Invalid signed tx: {}", e)))?;
            
        let verified_addr = req.verify_and_recover_address()
            .map_err(|e| StakingRpcError::AuthError(e.to_string()))?;
            
        let params: UnstakeParams = serde_json::from_slice(&req.message)
            .map_err(|e| StakingRpcError::InvalidParams(format!("Invalid payload: {}", e)))?;

        let amount = parse_hex_u128(&params.amount).map_err(StakingRpcError::InvalidParams)?;

        let staking = self.staking.read().await;
        staking
            .unstake(verified_addr.clone(), amount)
            .await
            .map_err(|e| StakingRpcError::StakingError(e.to_string()))?;

        info!("RPC: Unstaked {} for {}", amount, verified_addr);
        Ok(true)
    }

    async fn delegate(&self, signed_tx: String) -> RpcResult<bool> {
        let req: SignedRequest = serde_json::from_str(&signed_tx)
            .map_err(|e| StakingRpcError::InvalidParams(format!("Invalid signed tx: {}", e)))?;
            
        let verified_addr = req.verify_and_recover_address()
            .map_err(|e| StakingRpcError::AuthError(e.to_string()))?;
            
        let params: DelegateParams = serde_json::from_slice(&req.message)
            .map_err(|e| StakingRpcError::InvalidParams(format!("Invalid payload: {}", e)))?;

        let amount = parse_hex_u128(&params.amount).map_err(StakingRpcError::InvalidParams)?;

        let staking = self.staking.read().await;
        staking
            .delegate(verified_addr.clone(), params.validator.clone(), amount)
            .await
            .map_err(|e| StakingRpcError::StakingError(e.to_string()))?;

        info!(
            "RPC: Delegated {} from {} to {}",
            amount, verified_addr, params.validator
        );
        Ok(true)
    }

    async fn claim_rewards(&self, signed_tx: String) -> RpcResult<String> {
        let req: SignedRequest = serde_json::from_str(&signed_tx)
            .map_err(|e| StakingRpcError::InvalidParams(format!("Invalid signed tx: {}", e)))?;
            
        let verified_addr = req.verify_and_recover_address()
            .map_err(|e| StakingRpcError::AuthError(e.to_string()))?;

        let staking = self.staking.read().await;
        let rewards = staking
            .claim_rewards(verified_addr.clone())
            .await
            .map_err(|e| StakingRpcError::StakingError(e.to_string()))?;

        info!("RPC: Claimed {} rewards for {}", rewards, verified_addr);
        Ok(format!("0x{:x}", rewards))
    }
}

fn parse_hex_u128(hex: &str) -> Result<u128, String> {
    let hex = hex.strip_prefix("0x").unwrap_or(hex);
    u128::from_str_radix(hex, 16).map_err(|e| format!("Invalid hex: {}", e))
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hex_u128() {
        assert_eq!(parse_hex_u128("0x64").unwrap(), 100);
        assert_eq!(parse_hex_u128("64").unwrap(), 100);
        assert_eq!(parse_hex_u128("0x3e8").unwrap(), 1000);
    }
}
