use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct SignedRequest {
    pub message: Vec<u8>,
    pub signature: Vec<u8>,
    pub public_key: Vec<u8>,
}

impl SignedRequest {
    pub fn verify_and_recover_address(&self) -> Result<String, AuthError> {
        let vk = crypto::signature::public_key_from_bytes(&self.public_key)
            .ok_or(AuthError::InvalidPublicKey)?;
            
        if !crypto::signature::verify(&vk, &self.message, &self.signature) {
            return Err(AuthError::InvalidSignature);
        }
        
        Ok(crypto::signature::address_from_public_key(&vk))
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Invalid public key")]
    InvalidPublicKey,
    #[error("Address mismatch: expected {expected}, got {actual}")]
    AddressMismatch { expected: String, actual: String },
}
