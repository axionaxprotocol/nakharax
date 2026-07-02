# Nakharax Example Smart Contracts

Example Solidity contracts for testing and learning on Nakharax Testnet.

## 📋 Contracts

### 1. SimpleToken.sol
Basic ERC-20 token implementation with mint and burn functions.

**Features:**
- ✅ Standard ERC-20 methods (transfer, approve, transferFrom)
- ✅ Mint new tokens (for testing)
- ✅ Burn tokens
- ✅ 18 decimals
- ✅ Events for all operations

**Deployment Example:**
```solidity
// Deploy with name, symbol, and initial supply
SimpleToken token = new SimpleToken("Test Token", "TEST", 1000000);
// This mints 1,000,000 TEST tokens (with 18 decimals)
```

**Usage:**
```solidity
// Transfer tokens
token.transfer(recipientAddress, 100 * 10**18); // Transfer 100 tokens

// Approve spending
token.approve(spenderAddress, 50 * 10**18); // Approve 50 tokens

// Transfer from (requires approval)
token.transferFrom(ownerAddress, recipientAddress, 50 * 10**18);

// Mint new tokens (testing only)
token.mint(recipientAddress, 1000 * 10**18); // Mint 1000 tokens

// Burn tokens
token.burn(100 * 10**18); // Burn 100 tokens from sender
```

---

### 2. SimpleNFT.sol
Basic ERC-721 NFT implementation with metadata support.

**Features:**
- ✅ Standard ERC-721 methods
- ✅ Metadata URI support (IPFS, HTTP)
- ✅ Mint with custom metadata
- ✅ Transfer and approval system
- ✅ Burn functionality
- ✅ Operator approvals

**Deployment Example:**
```solidity
SimpleNFT nft = new SimpleNFT("My NFT Collection", "MNFT");
```

**Usage:**
```solidity
// Mint NFT with metadata
uint256 tokenId = nft.mint(
    recipientAddress,
    "ipfs://QmXxxx..." // Or any URI
);

// Transfer NFT
nft.transferFrom(ownerAddress, recipientAddress, tokenId);

// Approve transfer
nft.approve(approvedAddress, tokenId);

// Set operator approval for all tokens
nft.setApprovalForAll(operatorAddress, true);

// Burn NFT
nft.burn(tokenId);

// Query
uint256 balance = nft.balanceOf(ownerAddress);
address owner = nft.ownerOf(tokenId);
string memory uri = nft.tokenURI(tokenId);
```

---

### 3. SimpleStaking.sol
Basic staking contract for earning rewards over time.

**Features:**
- ✅ Stake native NAK tokens
- ✅ Automatic reward calculation
- ✅ Claim rewards anytime
- ✅ Unstake with automatic reward claim
- ✅ Configurable reward rate
- ✅ View pending rewards

**Deployment Example:**
```solidity
// address(0) means staking native NAK
SimpleStaking staking = new SimpleStaking(address(0));
```

**Usage:**
```solidity
// Stake NAK tokens
staking.stake{value: 10 ether}(); // Stake 10 NAK

// Check pending rewards
uint256 pending = staking.pendingRewards(userAddress);

// Claim rewards
staking.claimRewards();

// Unstake (claims rewards automatically)
staking.unstake();

// Get stake info
(uint256 amount, uint256 startTime, uint256 lastClaim, uint256 pending) = 
    staking.getStakeInfo(userAddress);

// Get contract stats
(uint256 totalStaked, uint256 rewardRate, uint256 balance) = 
    staking.getStats();

// Update reward rate (for testing)
staking.setRewardRate(2e15); // 0.002 tokens per second
```

**Reward Calculation:**
- Default: 0.001 tokens per second per staked token
- Rewards = (stakedAmount × rewardRate × stakingDuration) / 1e18
- Example: Stake 100 NAK for 1 day = ~8.64 NAK rewards

---

## 🚀 Deployment on Nakharax Testnet

### Prerequisites
1. MetaMask with Nakharax Testnet configured
2. Testnet NAK tokens from faucet
3. Remix IDE or Hardhat/Foundry

### Using Remix IDE

1. **Add Nakharax Testnet to MetaMask:**
   - Network Name: Nakharax Testnet
   - RPC URL: https://rpc.nakharax.io
   - Chain ID: 86137
   - Currency Symbol: NAK
   - Block Explorer: http://rpc.nakharax.io:3000/explorer

2. **Get Testnet Tokens:**
   - Visit: http://rpc.nakharax.io:3000/faucet
   - Request 1 NAK (60 minute cooldown)

3. **Deploy with Remix:**
   - Open [Remix IDE](https://remix.ethereum.org)
   - Create new file and paste contract code
   - Compile with Solidity 0.8.20+
   - Select "Injected Provider - MetaMask"
   - Ensure MetaMask is on Nakharax Testnet
   - Fill constructor parameters
   - Click "Deploy"

### Using Hardhat

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    nakharax: {
      url: "https://rpc.nakharax.io",
      chainId: 86137,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: "0.8.20"
};
```

```bash
# Deploy
npx hardhat run scripts/deploy.js --network nakharax
```

### Using Foundry

```bash
# Deploy SimpleToken
forge create SimpleToken \
  --rpc-url https://rpc.nakharax.io \
  --constructor-args "Test Token" "TEST" 1000000 \
  --private-key $PRIVATE_KEY

# Deploy SimpleNFT
forge create SimpleNFT \
  --rpc-url https://rpc.nakharax.io \
  --constructor-args "My NFT" "MNFT" \
  --private-key $PRIVATE_KEY

# Deploy SimpleStaking
forge create SimpleStaking \
  --rpc-url https://rpc.nakharax.io \
  --constructor-args 0x0000000000000000000000000000000000000000 \
  --private-key $PRIVATE_KEY
```

---

## 🧪 Testing

### Test SimpleToken
```javascript
// Transfer tokens
await token.transfer(recipient, ethers.parseEther("100"));

// Check balance
const balance = await token.balanceOf(recipient);
console.log("Balance:", ethers.formatEther(balance));
```

### Test SimpleNFT
```javascript
// Mint NFT
const tx = await nft.mint(
  recipient, 
  "ipfs://QmExample123"
);
await tx.wait();

// Get token ID from event
const tokenId = 1; // First minted token

// Check owner
const owner = await nft.ownerOf(tokenId);
console.log("Owner:", owner);
```

### Test SimpleStaking
```javascript
// Stake 10 NAK
await staking.stake({ value: ethers.parseEther("10") });

// Wait some time...
await new Promise(r => setTimeout(r, 10000));

// Check pending rewards
const pending = await staking.pendingRewards(userAddress);
console.log("Pending:", ethers.formatEther(pending));

// Claim
await staking.claimRewards();
```

---

## 📚 Resources

- **Testnet Website**: http://rpc.nakharax.io:3000
- **Faucet**: http://rpc.nakharax.io:3000/faucet
- **Explorer**: http://rpc.nakharax.io:3000/explorer
- **RPC Endpoint**: https://rpc.nakharax.io
- **Chain ID**: 86137
- **Documentation**: https://github.com/nakharax-io/nakharax-docs

---

## ⚠️ Important Notes

1. **Testnet Only**: These contracts are for testing purposes only
2. **Security**: Not audited - do NOT use in production
3. **Simplified**: Missing advanced features for clarity
4. **Mint Functions**: Only for testing - remove in production
5. **Rate Limits**: Faucet has 60-minute cooldown per address

---

## 🛠️ Next Steps

1. Deploy these contracts to testnet
2. Build a dApp frontend to interact with them
3. Create your own custom contracts
4. Test different scenarios
5. Join our Discord for support

---

## 📝 License

MIT License - Free to use and modify

---

Made with 💜 by the Nakharax Team
