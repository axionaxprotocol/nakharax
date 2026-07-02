import os
import toml
import time
from pathlib import Path
from typing import List, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from rpc_client import NakharaxRpcClient


def _get_bootnodes_from_env() -> Optional[List[str]]:
    """Override bootnodes from env: NAKHARAX_RPC_URL (single) or NAKHARAX_BOOTNODES (comma-separated)."""
    single = os.environ.get("NAKHARAX_RPC_URL", "").strip()
    if single:
        return [single]
    nodes = os.environ.get("NAKHARAX_BOOTNODES", "").strip()
    if nodes:
        return [u.strip() for u in nodes.split(",") if u.strip()]
    return None


class NetworkManager:
    """
    Manages network connections, node discovery, and health checks.
    Selects the best node based on Block Height (Longest Chain Rule).
    Supports env overrides: NAKHARAX_RPC_URL or NAKHARAX_BOOTNODES.
    Dynamically discovers new peers via P2P (P2P Discovery).
    """
    def __init__(self, config_path: str = "worker_config.toml"):
        self.config = self._load_config(config_path)
        self.bootnodes = _get_bootnodes_from_env()
        if self.bootnodes is None:
            self.bootnodes = self.config.get("network", {}).get("bootnodes", [])
        
        self.discovered_nodes = set()
        self.active_node_url = None
        self.active_client = None

        if not self.bootnodes:
            raise ValueError(
                "No bootnodes. Set [network] bootnodes in config, or "
                "NAKHARAX_RPC_URL / NAKHARAX_BOOTNODES in .env"
            )

        print(f"NetworkManager initialized with {len(self.bootnodes)} bootnode(s).")

    def _load_config(self, path: str) -> dict:
        try:
            p = Path(path)
            if not p.is_absolute():
                p = Path.cwd() / p
            if not p.exists():
                return {}
            with open(p, encoding="utf-8") as f:
                return toml.load(f)
        except Exception as e:
            print(f"Error loading config: {e}")
            return {}

    def discover_peers(self):
        """
        [P2P Discovery] Asks the current active node for its peers to expand the available node list.
        """
        if not self.active_client:
            return

        print("🔍 Discovering new peers via P2P...")
        
        # Check peer count first
        try:
            peer_count_hex = self.active_client._call("net_peerCount", [])
            if peer_count_hex:
                peer_count = int(peer_count_hex, 16)
                print(f"   🔢 Node reports {peer_count} peers.")
                if peer_count == 0:
                    print("   ℹ️ No peers to discover.")
                    return
        except Exception as e:
            print(f"   ⚠️ Could not get peer count: {e}")

        methods_to_try = ["admin_peers", "net_peers", "parity_netPeers"]
        found_any = False

        for method in methods_to_try:
            try:
                print(f"   📡 Trying {method}...")
                peers = self.active_client._call(method, [])
                if peers and isinstance(peers, list):
                    print(f"   ✅ Found {len(peers)} potential peers via {method}.")
                    for peer in peers:
                        # Extract RPC endpoint if available in peer info
                        if isinstance(peer, dict):
                            # Attempt to find an IP and try standard RPC port 8545
                            # Peer structure for Geth/EVM nodes often has 'network' or 'protocols'
                            remote_addr = peer.get("network", {}).get("remoteAddress", "")
                            if not remote_addr and "enode" in peer:
                                # Heuristic: parse enode://ID@IP:PORT
                                enode = peer["enode"]
                                if "@" in enode:
                                    ip_port = enode.split("@")[1].split("?")[0]
                                    ip = ip_port.split(":")[0]
                                    remote_addr = f"{ip}:30303"

                            if remote_addr:
                                ip = remote_addr.split(":")[0]
                                new_node = f"http://{ip}:8545"
                                if new_node not in self.bootnodes and new_node not in self.discovered_nodes:
                                    print(f"   ✨ Discovered new peer: {new_node}")
                                    self.discovered_nodes.add(new_node)
                                    found_any = True
                else:
                    print(f"   ℹ️ {method} returned no peers or is not supported.")
                
                if found_any:
                    break
            except Exception as e:
                print(f"   ❌ {method} failed: {e}")
                continue

    def find_best_node(self) -> Optional[str]:
        """
        Scans all bootnodes and discovered nodes, returning the URL of the one with the highest block height.
        """
        print("🔍 Scanning available nodes for the best connection...")
        best_node = None
        max_height = -1
        
        # Combine bootnodes and discovered nodes
        all_candidates = list(self.bootnodes) + list(self.discovered_nodes)
        
        for url in all_candidates:
            try:
                # Create a temporary client to check this node
                client = NakharaxRpcClient(rpc_url=url)
                block_height = client.get_block_number()
                
                if block_height is not None and block_height > 0:
                    print(f"   ✅ {url} -> Height: {block_height}")
                    if block_height > max_height:
                        max_height = block_height
                        best_node = url
                else:
                    print(f"   ⚠️ {url} -> Unreachable or empty chain")
            except Exception as e:
                print(f"   ❌ {url} -> Error")

        if best_node:
            print(f"🏆 Selected Best Node: {best_node} (Height: {max_height})")
            self.active_node_url = best_node
            self.active_client = NakharaxRpcClient(rpc_url=best_node)
            
            # After finding a good node, try to discover more peers from it
            self.discover_peers()
            
            return best_node
        else:
            print("🔥 CRITICAL: No healthy nodes found!")
            return None

    def get_client(self) -> NakharaxRpcClient:
        """
        Returns the active RPC client. If none exists, attempts to find one.
        """
        if not self.active_client:
            if not self.find_best_node():
                raise ConnectionError("Could not connect to any Nakharax node.")
        return self.active_client

    def check_health(self):
        """
        Periodically checks if the current node is still healthy.
        If not, triggers a re-scan.
        """
        if not self.active_client:
            return
            
        try:
            current_height = self.active_client.get_block_number()
            if current_height is None:
                print("⚠️ Current node lost connection. Re-scanning...")
                self.find_best_node()
        except Exception:
            print("⚠️ Current node error. Re-scanning...")
            self.find_best_node()

if __name__ == "__main__":
    # Test Logic
    nm = NetworkManager()
    nm.find_best_node()
