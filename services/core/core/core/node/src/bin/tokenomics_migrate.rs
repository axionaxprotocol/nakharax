use std::path::PathBuf;

use anyhow::{bail, Context, Result};
use clap::Parser;
use genesis::{ADDR_ECOSYSTEM, TOTAL_SUPPLY};
use state::StateDB;

const MIGRATION_ID: &str = "fixed_supply_v2";
const ONE_NAK: u128 = 1_000_000_000_000_000_000;

#[derive(Debug, Parser)]
#[command(
    name = "tokenomics-migrate",
    about = "Audit or remove legacy block-reward inflation from a stopped node StateDB"
)]
struct Args {
    /// Node StateDB file or directory. The node must be stopped before use.
    #[arg(long)]
    state_path: PathBuf,

    /// Apply the one-time migration. Without this flag the command is read-only.
    #[arg(long)]
    apply: bool,

    /// Print every non-zero account balance for state-parity diagnosis.
    #[arg(long)]
    show_accounts: bool,
}

fn format_nak(value: u128) -> String {
    let whole = value / ONE_NAK;
    let fraction = value % ONE_NAK;
    if fraction == 0 {
        whole.to_string()
    } else {
        format!("{}.{:018}", whole, fraction)
            .trim_end_matches('0')
            .to_string()
    }
}

fn main() -> Result<()> {
    let args = Args::parse();
    let state = StateDB::open(&args.state_path)
        .with_context(|| format!("open StateDB at {}", args.state_path.display()))?;

    let total = state.get_total_supply().context("sum native balances")?;
    let pool = state
        .get_balance(ADDR_ECOSYSTEM)
        .context("read Ecosystem & Rewards Pool")?;
    let height = state.get_chain_height().unwrap_or(0);
    let latest_block = state.get_latest_block().ok();
    let accounts = state.get_all_accounts().context("list native accounts")?;
    let computed_state_root = state
        .compute_state_root()
        .context("compute current account state root")?;
    let excess = total.saturating_sub(TOTAL_SUPPLY);

    println!("Tokenomics fixed-supply audit");
    println!("  state path : {}", args.state_path.display());
    println!("  height     : {}", height);
    println!("  accounts   : {}", accounts.len());
    if let Some(block) = latest_block {
        println!("  block hash : 0x{}", hex::encode(block.hash));
        println!("  state root : 0x{}", hex::encode(block.state_root));
    }
    println!("  computed root: 0x{}", hex::encode(computed_state_root));
    println!("  hard cap   : {} NAK", format_nak(TOTAL_SUPPLY));
    println!("  supply     : {} NAK", format_nak(total));
    println!("  excess     : {} NAK", format_nak(excess));
    println!("  reward pool: {} NAK", format_nak(pool));
    if args.show_accounts {
        println!("  non-zero accounts:");
        for (address, balance, nonce) in &accounts {
            if *balance != 0 {
                println!(
                    "    {} balance={} NAK nonce={}",
                    address,
                    format_nak(*balance),
                    nonce
                );
            }
        }
    }

    if !args.apply {
        println!("  mode       : DRY RUN (pass --apply only after stopping and backing up every validator)");
        return Ok(());
    }
    if total < TOTAL_SUPPLY {
        bail!(
            "refusing migration: supply is {} NAK below the fixed cap",
            format_nak(TOTAL_SUPPLY - total)
        );
    }

    let result = state
        .migrate_supply_to_hard_cap(ADDR_ECOSYSTEM, TOTAL_SUPPLY, MIGRATION_ID)
        .context("apply fixed-supply migration")?;
    let verified_total = state
        .get_total_supply()
        .context("verify post-migration supply")?;
    if verified_total != TOTAL_SUPPLY {
        bail!(
            "post-migration invariant failed: expected {}, got {}",
            TOTAL_SUPPLY,
            verified_total
        );
    }

    println!(
        "  migration  : {}",
        if result.already_applied {
            "ALREADY APPLIED"
        } else {
            "APPLIED"
        }
    );
    println!("  removed    : {} NAK", format_nak(result.excess_removed));
    println!("  verified   : {} NAK", format_nak(verified_total));
    Ok(())
}
