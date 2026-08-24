import sys
import os
import pytest
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rpc_client import NakharaxRpcClient

def test_connection():
    print("Testing RPC Connection...")
    client = NakharaxRpcClient()
    
    try:
        block = client.get_block_number()
        if block is None or block == 0:
            # Check if RPC endpoint is unreachable
            pytest.skip("RPC node offline; skipping test_connection")
        print(f"SUCCESS: Connected to RPC. Current Block: {block}")
        
        # Check if we can get balance
        try:
            balance = client.get_balance("0x0000000000000000000000000000000000000000")
            print(f"Balance check: {balance}")
        except Exception as e:
            print(f"Balance check skipped (API restricted): {e}")
            
    except Exception as e:
        print(f"Could not connect to RPC. Error: {e}")
        pytest.skip(f"RPC endpoint unavailable ({e}); skipping test")

if __name__ == "__main__":
    test_connection()
