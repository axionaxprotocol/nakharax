import requests
import json
import time
from typing import Any, Dict, List, Optional

class NakharaxRpcClient:
    """
    Simple JSON-RPC client for Nakharax Chain
    """
    def __init__(self, rpc_url: str = "https://rpc.nakharax.com"):
        self.rpc_url = rpc_url
        self.headers = {'content-type': 'application/json'}
        self.id_counter = 0

        if rpc_url.startswith("http://") and not rpc_url.startswith("http://127.0.0.1") and not rpc_url.startswith("http://localhost"):
            import warnings
            warnings.warn(
                f"RPC URL '{rpc_url}' uses plaintext HTTP for a non-localhost address. "
                "Use HTTPS to protect traffic in transit.",
                stacklevel=2,
            )

    def _call(self, method: str, params: Optional[List[Any]] = None) -> Any:
        if params is None:
            params = []
        self.id_counter += 1
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": self.id_counter
        }
        
        try:
            response = requests.post(
                self.rpc_url, 
                data=json.dumps(payload), 
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            if "error" in result:
                raise Exception(f"RPC Error: {result['error']}")
                
            return result["result"]
            
        except requests.exceptions.RequestException as e:
            print(f"Connection Error: {e}")
            return None

    def get_chain_id(self) -> int:
        result = self._call("eth_chainId")
        return int(result, 16) if result else 0

    def get_peer_count(self) -> int:
        result = self._call("net_peerCount")
        return int(result, 16) if result else 0

    def get_node_telemetry(self) -> Dict[str, Any]:
        """Fetch real-time node telemetry"""
        result = self._call("nak_getNodeTelemetry")
        if result:
            return result
        # Fallback to system_status or metrics_json
        status = self._call("system_status") or {}
        return {
            "chain_id": hex(self.get_chain_id()),
            "block_height": self.get_block_number(),
            "peer_count": self.get_peer_count(),
            "tps": 0.0,
            "status": "online" if status else "offline",
            "uptime_seconds": status.get("uptime_seconds", 0),
        }

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Query DeAI job verification and settlement status"""
        result = self._call("nak_getJobStatus", [job_id])
        return result or {"job_id": job_id, "status": "unknown"}

    def send_raw_transaction(self, signed_hex: str) -> Optional[str]:
        """Broadcast raw signed transaction"""
        return self._call("eth_sendRawTransaction", [signed_hex])
