# nakharax DevTools

Development tools and scripts for nakharax Protocol.

## 📁 Directory Structure

```
nakharax-devtools/
├── scripts/
│   ├── testing/          # Testing scripts
│   ├── refactoring/      # Code refactoring tools
│   ├── fixing/           # Fix scripts
│   ├── analysis/         # Code analysis tools
│   └── *.bat, *.sh, *.ps1  # Shell scripts
├── docs/                 # Documentation
├── tools/                # Additional tools
└── README.md
```

## 🔧 Scripts

### Testing
- `test_repo_integration.py` - Integration testing
- `test_repo_links.py` - Repository link testing
- `check_repo_health.py` - Health check

### Refactoring
- `refactor_and_clean.py` - Code refactoring
- `analyze_code_quality.py` - Quality analysis
- `master_refactor.py` - Master refactor script

### Fixing
- `quick_fix.py` - Quick fixes
- `fix_critical_issues.py` - Critical issues
- `fix_warnings.py` - Warning fixes
- `fix_npm_workspaces.py` - NPM workspace fixes

### Analysis
- `check_repo_connections.py` - Connection analysis

---

## 📖 About

Developer tools and automation scripts for building, testing, and maintaining
the **nakharax protocol** ecosystem.

🔥 **Current Phase:**
- Running comprehensive test suites
- Performance optimization ongoing
- Benchmark comparisons (Rust vs Go)
- Quality metrics tracking

📦 **Tools Ready:** All testing utilities validated and production-ready

### Part of nakharax Ecosystem

These tools support the entire nakharax protocol development workflow:

- **Protocol Core**: [`nakharax-core`](https://github.com/axionaxprotocol/nakharax) - Main development target
- **Web Interface**: [`nakharax-web`](https://github.com/axionaxprotocol/nakharax-web) - Frontend development & testing
- **SDK**: [`nakharax-sdk-ts`](https://github.com/axionaxprotocol/nakharax-sdk-ts) - SDK testing & validation
- **Marketplace**: [`nakharax-marketplace`](https://github.com/axionaxprotocol/nakharax-marketplace) - dApp testing
- **Documentation**: [`nakharax-docs`](https://github.com/axionaxprotocol/nakharax-docs) - Doc link validation
- **Deployment**: [`nakharax-deploy`](https://github.com/axionaxprotocol/nakharax-deploy) - Infrastructure testing
- **Issue Manager**: [`issue-manager`](https://github.com/axionaxprotocol/issue-manager) - Task automation

**GitHub Organization**: https://github.com/axionaxprotocol

**Pre-Testnet Status:** All testing tools operational, active test execution phase

---

## 📦 Contents

### Dependency Installation Scripts

Automated installers for all major platforms:

- **`install_dependencies_linux.sh`** - Ubuntu/Debian/CentOS/RHEL/Arch/Alpine
- **`install_dependencies_macos.sh`** - macOS 10.15+
- **`install_dependencies_windows.ps1`** - Windows 10/11 (PowerShell)

**Installs**:

- Rust 1.75+ & Cargo
- Python 3.10+
- Node.js 20 LTS
- Docker & Docker Compose
- PostgreSQL, Nginx, Redis
- Build tools and dependencies

### Testing & Benchmarking

Located in `tools/`:

- **`benchmark.py`** - Performance benchmarks for nakharax protocol
  - VRF operations (22,817 ops/sec target)
  - Block validation (3,500 blocks/sec target)
  - Transaction verification (45,000 tx/sec target)
  - Memory usage analysis (45MB idle target)
  - **Rust vs Go comparison** (3x improvement target)
- **`run_tests.sh`** - Unified test runner (all tests)
- **`test-quick.ps1`** / **`quick-test.ps1`** - Quick sanity checks
- **`test.ps1`** - Full test suite (unit + integration + E2E)

### Development Utilities

- **`create_genesis.py`** - Genesis block generator for nakharax protocol
- **`migrate_go_to_rust.py`** - Migration utilities (legacy)
- **`check-links.sh`** - Documentation link validator

---

## 🚀 Usage

### From workspace root:
```bash
python nakharax-devtools/scripts/testing/test_repo_integration.py
python nakharax-devtools/scripts/refactoring/master_refactor.py
```

### From devtools directory:
```bash
cd nakharax-devtools
python scripts/testing/test_repo_integration.py
```

## 📚 Documentation

See `docs/` directory for detailed guides:
- `REFACTORING_GUIDE.md` - Complete refactoring guide
- `REFACTORING_SUMMARY.md` - Summary and use cases
- `INTEGRATION_SUMMARY.md` - Integration test summary

## 🔗 Links

- Main Protocol: [../nakharax-core](../nakharax-core)
- SDK: [../nakharax-sdk-ts](../nakharax-sdk-ts)
- Web: [../nakharax-web](../nakharax-web)
