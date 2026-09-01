#!/usr/bin/env bash
# =============================================================================
# 🛡️ NakharaX Protocol — Enterprise Local CI/CD Pipeline
# Standard: Fast-Fail, Hermetic, Multi-Layer Monorepo Verification
# Stages: Quality Gate -> Smart Contracts -> Rust Core -> Genesis Gate -> Web Build
# =============================================================================

set -euo pipefail

# ANSI Color Codes
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOTAL_STAGES=5
FAILED_STAGES=0
START_TIME=$(date +%s)

print_header() {
    echo -e "${BOLD}${BLUE}======================================================================${NC}"
    echo -e "${BOLD}${CYAN}   🚀 NAKHARAX PROTOCOL: ENTERPRISE LOCAL CI/CD PIPELINE   ${NC}"
    echo -e "${BOLD}${BLUE}======================================================================${NC}"
    echo -e "  • Monorepo Root : ${ROOT_DIR}"
    echo -e "  • Target Branch : $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'master')"
    echo -e "  • Commit SHA    : $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
    echo -e "  • Timestamp     : $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo -e "${BOLD}${BLUE}======================================================================${NC}\n"
}

run_stage() {
    local stage_num="$1"
    local stage_name="$2"
    local cmd="$3"

    echo -e "${BOLD}${YELLOW}[Stage ${stage_num}/${TOTAL_STAGES}] ⏳ ${stage_name}...${NC}"
    local stage_start=$(date +%s)

    if eval "$cmd"; then
        local stage_end=$(date +%s)
        local stage_elapsed=$((stage_end - stage_start))
        echo -e "${GREEN}  ✓ [PASS] ${stage_name} (${stage_elapsed}s)${NC}\n"
    else
        local stage_end=$(date +%s)
        local stage_elapsed=$((stage_end - stage_start))
        echo -e "${RED}  ✗ [FAIL] ${stage_name} (${stage_elapsed}s)${NC}\n"
        FAILED_STAGES=$((FAILED_STAGES + 1))
        if [ "${FAST_FAIL:-true}" = "true" ]; then
            print_summary
            exit 1
        fi
    fi
}

print_summary() {
    local end_time=$(date +%s)
    local total_elapsed=$((end_time - START_TIME))
    echo -e "${BOLD}${BLUE}======================================================================${NC}"
    if [ $FAILED_STAGES -eq 0 ]; then
        echo -e "${BOLD}${GREEN}  🏆 ALL ${TOTAL_STAGES} CI/CD STAGES PASSED SUCCESSFULLY! (${total_elapsed}s)${NC}"
        echo -e "${GREEN}  Codebase is 100% compliant with enterprise release standards.${NC}"
    else
        echo -e "${BOLD}${RED}  💥 CI/CD PIPELINE FAILED: ${FAILED_STAGES} Stage(s) with errors. (${total_elapsed}s)${NC}"
        echo -e "${RED}  Please remediate the failed checks before pushing or deploying.${NC}"
    fi
    echo -e "${BOLD}${BLUE}======================================================================${NC}"
}

# --- Execution ---
print_header

# Stage 1: Static Analysis & Lint Gate
run_stage 1 "Static Lint, Typecheck & Formatting" \
    "pnpm --filter @nakharax/sdk typecheck && \
     (cd \"${ROOT_DIR}/services/core/core\" && cargo fmt --all -- --check && cargo clippy --workspace --all-targets -- -D warnings)"

# Stage 2: Hardhat Smart Contracts Test Suite
run_stage 2 "Smart Contracts Unit & Fuzz Verification" \
    "pnpm --filter @nakharax/contracts compile && pnpm --filter @nakharax/contracts test"

# Stage 3: Layer-1 Rust Core Workspace Tests
run_stage 3 "Layer-1 Consensus & P2P Rust Test Suite (320+ Tests)" \
    "(cd \"${ROOT_DIR}/services/core/core\" && cargo test --workspace --all-features --quiet)"

# Stage 4: Genesis Invariants & Protocol Integrity Gate
run_stage 4 "Genesis Manifest & Tokenomics Reality Gate" \
    "python \"${ROOT_DIR}/services/core/core/tools/create_genesis.py\" --verify && \
     (cd \"${ROOT_DIR}/services/core/core\" && cargo run -p genesis --bin genesis-export -- tools/genesis_canonical.json)"

# Stage 5: Web OS Dashboard Production Build
run_stage 5 "Next.js Web OS Dashboard Production Build" \
    "pnpm --filter nakharax-os-dashboard build"

print_summary
exit 0
